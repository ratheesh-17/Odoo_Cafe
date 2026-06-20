from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.models.self_order_config import SelfOrderConfig, SelfOrderMode
from app.models.table import Table
from app.models.product import Product
from app.models.category import Category
from app.models.order import Order, OrderStatus, OrderSource
from app.models.order_item import OrderItem
from app.models.kitchen_ticket import KitchenTicket
from app.models.kitchen_ticket_item import KitchenTicketItem
from app.models.session import PosSession, SessionStatus
from app.models.user import User, UserRole
from app.schemas.self_order import (
    SelfOrderConfigUpdate, SelfOrderConfigResponse,
    MenuResponse, MenuCategoryResponse, MenuProductResponse, TableInfoResponse,
    SelfCartItemAdd, SelfCartItemUpdate, SelfCouponApply,
    SelfOrderStatusResponse, SelfOrderItemStatus,
    CustomerDisplayResponse, DisplayOrderItem,
)
from app.schemas.order import (
    OrderCreate, CartItemAdd, CartItemUpdate, CouponApply, OrderResponse,
)
import app.services.order as order_service
import app.services.coupon as coupon_service


# ── Config ────────────────────────────────────────────────────────────────────

def _get_config(db: Session) -> SelfOrderConfig:
    return db.query(SelfOrderConfig).first()


def get_config(db: Session) -> SelfOrderConfigResponse:
    return SelfOrderConfigResponse.model_validate(_get_config(db))


def update_config(payload: SelfOrderConfigUpdate, db: Session) -> SelfOrderConfigResponse:
    config = _get_config(db)
    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(config, field, value)
    db.commit()
    db.refresh(config)
    return SelfOrderConfigResponse.model_validate(config)


# ── QR code helpers ───────────────────────────────────────────────────────────

def _get_table_by_token(token: str, db: Session) -> Table:
    table = (
        db.query(Table)
        .options(joinedload(Table.floor))
        .filter(Table.self_order_token == token, Table.is_active == True)
        .first()
    )
    if not table:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid or inactive QR code",
        )
    return table


def _require_self_order_enabled(config: SelfOrderConfig) -> None:
    if not config.is_enabled:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Self ordering is not enabled",
        )


def get_qr_url(table_id: int, domain: str, db: Session) -> str:
    table = db.query(Table).filter(Table.id == table_id).first()
    if not table:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Table not found")
    if not table.self_order_token:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Table has no QR token")
    return f"{domain}/s/{table.self_order_token}"


# ── Customer-facing menu ──────────────────────────────────────────────────────

def get_menu(token: str, db: Session) -> MenuResponse:
    config = _get_config(db)
    _require_self_order_enabled(config)

    table = _get_table_by_token(token, db)

    products = (
        db.query(Product)
        .options(joinedload(Product.category))
        .filter(Product.is_active == True)
        .order_by(Product.name)
        .all()
    )

    category_ids = {p.category_id for p in products}
    categories = (
        db.query(Category)
        .filter(Category.id.in_(category_ids))
        .order_by(Category.name)
        .all()
    )

    return MenuResponse(
        table=TableInfoResponse(
            id=table.id,
            table_number=table.table_number,
            seats=table.seats,
            floor_name=table.floor.name if table.floor else None,
        ),
        config=SelfOrderConfigResponse.model_validate(config),
        categories=[MenuCategoryResponse.model_validate(c) for c in categories],
        products=[MenuProductResponse.model_validate(p) for p in products],
    )


# ── System user for self orders ───────────────────────────────────────────────

def _get_system_user(db: Session) -> User:
    """Self orders are placed without a logged-in employee — use the default admin."""
    user = db.query(User).filter(User.role == UserRole.admin, User.is_active == True).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No active admin user found to assign self orders",
        )
    return user


def _require_open_session(db: Session) -> PosSession:
    session = db.query(PosSession).filter(PosSession.status == SessionStatus.open).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No open POS session. The cafe is currently not accepting orders.",
        )
    return session


# ── Customer places order ─────────────────────────────────────────────────────

def place_order(token: str, db: Session) -> OrderResponse:
    config = _get_config(db)
    _require_self_order_enabled(config)

    if config.mode != SelfOrderMode.online_ordering:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This table is in QR menu mode only. Orders cannot be placed.",
        )

    table = _get_table_by_token(token, db)
    session = _require_open_session(db)
    system_user = _get_system_user(db)

    # check if this table already has an active draft order from self-order
    existing = (
        db.query(Order)
        .filter(
            Order.table_id == table.id,
            Order.order_source == OrderSource.self_order,
            Order.status == OrderStatus.draft,
            Order.session_id == session.id,
        )
        .first()
    )
    if existing:
        return order_service._to_response(order_service._get_order(existing.id, db))

    order = Order(
        order_number=order_service._next_order_number(db),
        session_id=session.id,
        table_id=table.id,
        employee_id=system_user.id,
        status=OrderStatus.draft,
        order_source=OrderSource.self_order,
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return order_service._to_response(order_service._get_order(order.id, db))


# ── Customer cart operations — delegate to order service ─────────────────────

def _resolve_order(token: str, order_id: int, db: Session) -> Order:
    """Validates the order belongs to the table identified by the token."""
    config = _get_config(db)
    _require_self_order_enabled(config)
    table = _get_table_by_token(token, db)

    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    if order.table_id != table.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Order does not belong to this table")
    if order.order_source != OrderSource.self_order:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a self order")
    return order


def add_item(token: str, order_id: int, payload: SelfCartItemAdd, db: Session) -> OrderResponse:
    _resolve_order(token, order_id, db)
    return order_service.add_item(order_id, CartItemAdd(
        product_id=payload.product_id,
        quantity=payload.quantity,
        note=payload.note,
    ), db)


def update_item(token: str, order_id: int, item_id: int, payload: SelfCartItemUpdate, db: Session) -> OrderResponse:
    _resolve_order(token, order_id, db)
    return order_service.update_item(order_id, item_id, CartItemUpdate(
        quantity=payload.quantity,
    ), db)


def remove_item(token: str, order_id: int, item_id: int, db: Session) -> OrderResponse:
    _resolve_order(token, order_id, db)
    return order_service.remove_item(order_id, item_id, db)


def apply_coupon(token: str, order_id: int, payload: SelfCouponApply, db: Session) -> OrderResponse:
    _resolve_order(token, order_id, db)
    return order_service.apply_coupon(order_id, CouponApply(code=payload.code), db)


def submit_order(token: str, order_id: int, db: Session) -> OrderResponse:
    """Customer submits cart — stays as draft until staff confirms or sends to kitchen."""
    order = _resolve_order(token, order_id, db)
    if order.status != OrderStatus.draft:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only draft orders can be submitted by the customer",
        )
    return order_service._to_response(order_service._get_order(order_id, db))


# ── Customer order status tracking ───────────────────────────────────────────

def get_customer_display(order_id: int, db: Session) -> CustomerDisplayResponse:
    """Polled by the Customer Facing Display. No auth required."""
    from app.models.payment_method import PaymentType
    from app.utils.qr_generator import generate_upi_qr

    order = order_service._get_order(order_id, db)

    upi_qr = None
    payment_type = None

    if order.payment:
        payment_type = order.payment.payment_method.type.value
        if order.payment.payment_method.type == PaymentType.upi and order.status.value != "paid":
            upi_qr = generate_upi_qr(order.payment.payment_method.upi_id, float(order.total_amount))
    elif order.status.value != "paid":
        # check if UPI method is enabled and has a UPI ID — display QR proactively
        from app.models.payment_method import PaymentMethod
        upi_method = db.query(PaymentMethod).filter(
            PaymentMethod.type == PaymentType.upi,
            PaymentMethod.is_enabled == True,
        ).first()
        if upi_method and upi_method.upi_id:
            upi_qr = generate_upi_qr(upi_method.upi_id, float(order.total_amount))

    return CustomerDisplayResponse(
        order_id=order.id,
        order_number=order.order_number,
        status=order.status.value,
        table_number=order.table.table_number if order.table else None,
        items=[
            DisplayOrderItem(
                product_name=item.product.name,
                quantity=item.quantity,
                unit_price=float(item.unit_price),
                line_total=float(item.line_total),
            )
            for item in order.items
        ],
        subtotal=float(order.subtotal),
        tax_amount=float(order.tax_amount),
        discount_amount=float(order.discount_amount),
        total_amount=float(order.total_amount),
        payment_type=payment_type,
        upi_qr_base64=upi_qr,
        is_paid=order.status.value == "paid",
    )


def get_order_status(token: str, order_id: int, db: Session) -> SelfOrderStatusResponse:
    order_obj = _resolve_order(token, order_id, db)

    full_order = order_service._get_order(order_id, db)

    kitchen_stage = None
    item_statuses = []

    if full_order.kitchen_ticket:
        kitchen_stage = full_order.kitchen_ticket.stage

        kti_map = {kti.order_item_id: kti for kti in full_order.kitchen_ticket.ticket_items}
        for item in full_order.items:
            kti = kti_map.get(item.id)
            item_statuses.append(SelfOrderItemStatus(
                product_name=item.product.name,
                quantity=item.quantity,
                is_done=kti.is_done if kti else False,
            ))
    else:
        for item in full_order.items:
            item_statuses.append(SelfOrderItemStatus(
                product_name=item.product.name,
                quantity=item.quantity,
                is_done=False,
            ))

    return SelfOrderStatusResponse(
        order_id=full_order.id,
        order_number=full_order.order_number,
        kitchen_stage=kitchen_stage,
        items=item_statuses,
        subtotal=float(full_order.subtotal),
        tax_amount=float(full_order.tax_amount),
        discount_amount=float(full_order.discount_amount),
        total_amount=float(full_order.total_amount),
    )
