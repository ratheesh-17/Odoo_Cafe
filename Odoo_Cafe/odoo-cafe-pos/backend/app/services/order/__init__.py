from datetime import datetime, timezone
from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.models.order import Order, OrderStatus, OrderSource
from app.models.order_item import OrderItem
from app.models.product import Product
from app.models.kitchen_ticket import KitchenTicket, KitchenStage
from app.models.kitchen_ticket_item import KitchenTicketItem
from app.models.payment import Payment
from app.models.payment_method import PaymentMethod, PaymentType
from app.models.session import PosSession, SessionStatus
from app.models.coupon import Coupon
from app.models.promotion import Promotion
from app.models.user import User
from app.schemas.order import (
    OrderCreate, OrderUpdate, CartItemAdd, CartItemUpdate,
    CouponApply, PaymentCreate, OrderResponse, PaymentResponse,
    OrderItemResponse, ProductBrief, CategoryBrief, CustomerBrief, TableBrief,
    EmployeeBrief, CouponBrief, PromotionBrief,
)
import app.services.promotion as promotion_service
import app.services.coupon as coupon_service


# ── Helpers ───────────────────────────────────────────────────────────────────

def _require_open_session(db: Session) -> PosSession:
    session = db.query(PosSession).filter(PosSession.status == SessionStatus.open).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No open POS session. Please open a session first.",
        )
    return session


def _get_order(order_id: int, db: Session) -> Order:
    order = (
        db.query(Order)
        .options(
            joinedload(Order.items).joinedload(OrderItem.product).joinedload(Product.category),
            joinedload(Order.table),
            joinedload(Order.customer),
            joinedload(Order.employee),
            joinedload(Order.coupon),
            joinedload(Order.promotion),
            joinedload(Order.payment).joinedload(Payment.payment_method),
            joinedload(Order.kitchen_ticket).joinedload(KitchenTicket.ticket_items),
        )
        .filter(Order.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return order


def _require_draft(order: Order) -> None:
    if order.status != OrderStatus.draft:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Order is {order.status} and cannot be modified",
        )


def _next_order_number(db: Session) -> str:
    """Generates ORD-YYYYMMDD-NNNN, resets daily."""
    today = datetime.now().strftime("%Y%m%d")
    prefix = f"ORD-{today}-"
    last = (
        db.query(Order)
        .filter(Order.order_number.like(f"{prefix}%"))
        .order_by(Order.order_number.desc())
        .first()
    )
    seq = int(last.order_number.split("-")[-1]) + 1 if last else 1
    return f"{prefix}{seq:04d}"


def _calc_line_discount(product: Product, quantity: int, db: Session) -> float:
    """Returns total discount amount for a product line from product-level promotions."""
    promo = promotion_service.evaluate_product_promotion(product.id, quantity, db)
    if not promo:
        return 0.0
    gross = float(product.price) * quantity
    if promo.discount_type == "percent":
        return round(gross * float(promo.discount_value) / 100, 2)
    return round(min(float(promo.discount_value), gross), 2)


def _recalculate(order: Order, db: Session) -> None:
    """
    Recomputes all financial fields on the order from its items.
    Also re-evaluates order-level promotion.
    Coupon discount is preserved if already applied.
    """
    subtotal = round(sum(float(item.unit_price) * item.quantity for item in order.items), 2)
    tax_amount = round(
        sum(
            round(float(item.unit_price) * item.quantity * float(item.tax_percent) / 100, 2)
            for item in order.items
        ),
        2,
    )
    product_discounts = round(sum(float(item.line_discount) for item in order.items), 2)

    # re-evaluate order-level promotion
    order_promo = promotion_service.evaluate_order_promotion(subtotal, db)
    if order_promo:
        order.promotion_id = order_promo.id
        if order_promo.discount_type == "percent":
            promo_discount = round(subtotal * float(order_promo.discount_value) / 100, 2)
        else:
            promo_discount = round(min(float(order_promo.discount_value), subtotal), 2)
    else:
        order.promotion_id = None
        promo_discount = 0.0

    coupon_discount = 0.0
    if order.coupon_id:
        coupon = db.query(Coupon).filter(Coupon.id == order.coupon_id).first()
        if coupon and coupon.is_active:
            if coupon.discount_type == "percent":
                coupon_discount = round(subtotal * float(coupon.discount_value) / 100, 2)
            else:
                coupon_discount = round(min(float(coupon.discount_value), subtotal), 2)
        else:
            order.coupon_id = None  # coupon became invalid, detach

    total_discount = round(product_discounts + promo_discount + coupon_discount, 2)
    total = round(max(subtotal + tax_amount - total_discount, 0.0), 2)

    order.subtotal = subtotal
    order.tax_amount = tax_amount
    order.discount_amount = total_discount
    order.total_amount = total


def _to_response(order: Order) -> OrderResponse:
    payment_resp = None
    if order.payment:
        payment_resp = PaymentResponse(
            id=order.payment.id,
            payment_type=order.payment.payment_method.type,
            amount_paid=float(order.payment.amount_paid),
            change_due=float(order.payment.change_due),
            transaction_ref=order.payment.transaction_ref,
            paid_at=order.payment.paid_at,
        )
    return OrderResponse(
        id=order.id,
        order_number=order.order_number,
        status=order.status,
        order_source=order.order_source,
        table=TableBrief.model_validate(order.table) if order.table else None,
        customer=CustomerBrief.model_validate(order.customer) if order.customer else None,
        employee=EmployeeBrief.model_validate(order.employee),
        items=[
            OrderItemResponse(
                id=item.id,
                product=ProductBrief(
                    id=item.product.id,
                    name=item.product.name,
                    category_id=item.product.category_id,
                    category=CategoryBrief(
                        id=item.product.category.id,
                        name=item.product.category.name,
                        color=item.product.category.color,
                    ) if item.product.category else None,
                ),
                quantity=item.quantity,
                unit_price=float(item.unit_price),
                tax_percent=float(item.tax_percent),
                line_discount=float(item.line_discount),
                line_total=float(item.line_total),
                note=item.note,
            )
            for item in order.items
        ],
        subtotal=float(order.subtotal),
        tax_amount=float(order.tax_amount),
        discount_amount=float(order.discount_amount),
        total_amount=float(order.total_amount),
        coupon=CouponBrief.model_validate(order.coupon) if order.coupon else None,
        promotion=PromotionBrief.model_validate(order.promotion) if order.promotion else None,
        payment=payment_resp,
        note=order.note,
        created_at=order.created_at,
        updated_at=order.updated_at,
    )


# ── CRUD ──────────────────────────────────────────────────────────────────────

def get_all(db: Session, session_id: int | None = None, status_filter: OrderStatus | None = None, search: str | None = None) -> list[OrderResponse]:
    from sqlalchemy import cast, String as SAString, or_
    from app.models.customer import Customer

    query = (
        db.query(Order)
        .options(
            joinedload(Order.items).joinedload(OrderItem.product).joinedload(Product.category),
            joinedload(Order.table),
            joinedload(Order.customer),
            joinedload(Order.employee),
            joinedload(Order.coupon),
            joinedload(Order.promotion),
            joinedload(Order.payment).joinedload(Payment.payment_method),
        )
    )
    if session_id:
        query = query.filter(Order.session_id == session_id)
    if status_filter:
        query = query.filter(Order.status == status_filter)
    if search:
        term = f"%{search.strip()}%"
        query = query.outerjoin(Order.customer).filter(or_(
            Order.order_number.ilike(term),
            Customer.name.ilike(term),
            cast(Order.created_at, SAString).ilike(term),
        ))
    orders = query.order_by(Order.created_at.desc()).all()
    return [_to_response(o) for o in orders]


def get_by_id(order_id: int, db: Session) -> OrderResponse:
    return _to_response(_get_order(order_id, db))


def _get_next_available_employee(db: Session) -> User:
    """Find the employee with the fewest active orders (draft + sent_to_kitchen).
    
    Returns the least busy employee to balance workload across staff.
    Active orders are those not yet paid (draft or sent_to_kitchen).
    """
    # Get all active employees (is_active=True) excluding admin
    active_employees = db.query(User).filter(
        User.is_active == True,
        User.role != "admin",
    ).all()
    
    if not active_employees:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active employees available",
        )
    
    # Count active orders per employee (draft + sent_to_kitchen)
    employee_workload = {}
    for emp in active_employees:
        active_count = db.query(Order).filter(
            Order.employee_id == emp.id,
            Order.status.in_([OrderStatus.draft, OrderStatus.sent_to_kitchen])
        ).count()
        employee_workload[emp.id] = (active_count, emp)
    
    # Assign to employee with least active orders
    emp_id, (_, employee) = min(employee_workload.items(), key=lambda x: x[1][0])
    return employee


def create(payload: OrderCreate, current_user: User, db: Session) -> OrderResponse:
    session = _require_open_session(db)
    # Assign to the least busy available employee (not current_user)
    assigned_employee = _get_next_available_employee(db)
    
    order = Order(
        order_number=_next_order_number(db),
        session_id=session.id,
        table_id=payload.table_id,
        customer_id=payload.customer_id,
        employee_id=assigned_employee.id,
        note=payload.note,
        status=OrderStatus.draft,
        order_source=OrderSource.pos,
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return _to_response(_get_order(order.id, db))


def update(order_id: int, payload: OrderUpdate, db: Session) -> OrderResponse:
    order = _get_order(order_id, db)
    _require_draft(order)
    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(order, field, value)
    db.commit()
    return _to_response(_get_order(order_id, db))


def cancel(order_id: int, db: Session) -> OrderResponse:
    order = _get_order(order_id, db)
    if order.status == OrderStatus.paid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Paid orders cannot be cancelled",
        )
    if order.status == OrderStatus.sent_to_kitchen:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Orders sent to kitchen cannot be cancelled. Cancel from the kitchen display system.",
        )
    if order.status == OrderStatus.cancelled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order is already cancelled",
        )
    order.status = OrderStatus.cancelled
    db.commit()
    return _to_response(_get_order(order_id, db))


def delete(order_id: int, db: Session) -> None:
    order = _get_order(order_id, db)
    if order.status not in (OrderStatus.draft, OrderStatus.cancelled):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only draft or cancelled orders can be deleted",
        )
    db.delete(order)
    db.commit()


# ── Cart operations ───────────────────────────────────────────────────────────

def add_item(order_id: int, payload: CartItemAdd, db: Session) -> OrderResponse:
    order = _get_order(order_id, db)
    _require_draft(order)

    product = db.query(Product).filter(Product.id == payload.product_id, Product.is_active == True).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    # merge if same product already in cart
    existing = next((i for i in order.items if i.product_id == payload.product_id), None)
    if existing:
        existing.quantity += payload.quantity
        line_discount = _calc_line_discount(product, existing.quantity, db)
        existing.line_discount = line_discount
        existing.line_total = round(float(product.price) * existing.quantity - line_discount, 2)
        if payload.note is not None:
            existing.note = payload.note
    else:
        line_discount = _calc_line_discount(product, payload.quantity, db)
        line_total = round(float(product.price) * payload.quantity - line_discount, 2)
        item = OrderItem(
            order_id=order.id,
            product_id=product.id,
            quantity=payload.quantity,
            unit_price=product.price,
            tax_percent=product.tax_percent,
            line_discount=line_discount,
            line_total=line_total,
            note=payload.note,
        )
        db.add(item)

    db.flush()
    db.expire(order, ["items"])  # force SQLAlchemy to reload items from DB
    _recalculate(order, db)
    db.commit()
    return _to_response(_get_order(order_id, db))


def update_item(order_id: int, item_id: int, payload: CartItemUpdate, db: Session) -> OrderResponse:
    order = _get_order(order_id, db)
    _require_draft(order)

    item = next((i for i in order.items if i.id == item_id), None)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart item not found")

    item.quantity = payload.quantity
    if payload.note is not None:
        item.note = payload.note

    line_discount = _calc_line_discount(item.product, payload.quantity, db)
    item.line_discount = line_discount
    item.line_total = round(float(item.unit_price) * payload.quantity - line_discount, 2)

    db.flush()
    db.expire(order, ["items"])
    _recalculate(order, db)
    db.commit()
    return _to_response(_get_order(order_id, db))


def remove_item(order_id: int, item_id: int, db: Session) -> OrderResponse:
    order = _get_order(order_id, db)
    _require_draft(order)

    item = next((i for i in order.items if i.id == item_id), None)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart item not found")

    db.delete(item)
    db.flush()
    db.expire(order, ["items"])  # force reload after delete
    _recalculate(order, db)
    db.commit()
    return _to_response(_get_order(order_id, db))


# ── Coupon ────────────────────────────────────────────────────────────────────

def apply_coupon(order_id: int, payload: CouponApply, db: Session) -> OrderResponse:
    order = _get_order(order_id, db)
    _require_draft(order)

    if not order.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot apply a coupon to an empty order",
        )

    coupon = coupon_service.redeem(payload.code, db)  # validates active, not expired, within limit
    order.coupon_id = coupon.id
    db.flush()
    db.expire(order, ["items", "coupon"])
    _recalculate(order, db)
    db.commit()
    return _to_response(_get_order(order_id, db))


def remove_coupon(order_id: int, db: Session) -> OrderResponse:
    order = _get_order(order_id, db)
    _require_draft(order)
    order.coupon_id = None
    db.flush()
    db.expire(order, ["items", "coupon"])
    _recalculate(order, db)
    db.commit()
    return _to_response(_get_order(order_id, db))


# ── Send to Kitchen ───────────────────────────────────────────────────────────

def send_to_kitchen(order_id: int, db: Session) -> OrderResponse:
    order = _get_order(order_id, db)

    if order.status not in (OrderStatus.draft, OrderStatus.sent_to_kitchen, OrderStatus.paid):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot send order with status '{order.status}' to kitchen",
        )
    if not order.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot send an empty order to the kitchen",
        )

    kds_items = [item for item in order.items if item.product.show_in_kds]
    if not kds_items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No items in this order are assigned to the Kitchen Display",
        )

    if order.kitchen_ticket:
        existing_item_ids = {kti.order_item_id for kti in order.kitchen_ticket.ticket_items}
        for item in kds_items:
            if item.id not in existing_item_ids:
                db.add(KitchenTicketItem(
                    kitchen_ticket_id=order.kitchen_ticket.id,
                    order_item_id=item.id,
                ))
    else:
        ticket = KitchenTicket(order_id=order.id, stage=KitchenStage.to_cook)
        db.add(ticket)
        db.flush()
        for item in kds_items:
            db.add(KitchenTicketItem(
                kitchen_ticket_id=ticket.id,
                order_item_id=item.id,
            ))

    if order.status == OrderStatus.draft:
        order.status = OrderStatus.sent_to_kitchen

    db.commit()
    return _to_response(_get_order(order_id, db))


# ── Payment ───────────────────────────────────────────────────────────────────

def process_payment(order_id: int, payload: PaymentCreate, db: Session) -> OrderResponse:
    order = _get_order(order_id, db)

    if order.status == OrderStatus.paid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Order is already paid")
    if order.status == OrderStatus.cancelled:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot pay a cancelled order")
    if not order.items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot pay an empty order")

    db.expire(order, ["items"])
    _recalculate(order, db)
    db.flush()

    # Auto-send to kitchen if employee forgot — fires only for draft orders with KDS items
    if order.status == OrderStatus.draft:
        db.expire(order, ["items", "kitchen_ticket"])
        kds_items = [item for item in order.items if item.product.show_in_kds]
        if kds_items:
            db.expire(order, ["kitchen_ticket"])
            if not order.kitchen_ticket:
                ticket = KitchenTicket(
                    order_id=order.id,
                    stage=KitchenStage.to_cook,
                )
                db.add(ticket)
                db.flush()
                for item in kds_items:
                    db.add(KitchenTicketItem(
                        kitchen_ticket_id=ticket.id,
                        order_item_id=item.id,
                    ))
            # Status will be overwritten to paid below — no need to set sent_to_kitchen

    method = db.query(PaymentMethod).filter(PaymentMethod.type == payload.payment_type).first()
    if not method or not method.is_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Payment method '{payload.payment_type}' is not enabled",
        )

    total = float(order.total_amount)

    if payload.payment_type == PaymentType.cash:
        if payload.amount_paid < total:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Amount paid ({payload.amount_paid}) is less than total ({total})",
            )
        change_due = round(payload.amount_paid - total, 2)
    else:
        change_due = 0.0

    if payload.payment_type == PaymentType.card and not payload.transaction_ref:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transaction reference is required for card payments",
        )

    payment = Payment(
        order_id=order.id,
        payment_method_id=method.id,
        amount_paid=payload.amount_paid,
        change_due=change_due,
        transaction_ref=payload.transaction_ref,
    )
    db.add(payment)

    # increment coupon used_count
    if order.coupon_id:
        coupon = db.query(Coupon).filter(Coupon.id == order.coupon_id).first()
        if coupon:
            coupon.used_count += 1

    order.status = OrderStatus.paid
    db.commit()
    return _to_response(_get_order(order_id, db))
