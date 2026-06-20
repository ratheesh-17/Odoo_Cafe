from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.middleware.role_guard import require_employee
from app.models.order import OrderStatus
from app.models.user import User
from app.schemas.order import (
    OrderCreate, OrderUpdate, CartItemAdd, CartItemUpdate,
    CouponApply, PaymentCreate, OrderResponse,
)
import app.services.order as order_service

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.get("", response_model=list[OrderResponse])
def list_orders(
    session_id: int | None = Query(None),
    status: OrderStatus | None = Query(None),
    search: str | None = Query(None, description="Search by order number, customer name, or date (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    _: User = Depends(require_employee),
):
    return order_service.get_all(db, session_id=session_id, status_filter=status, search=search)


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(order_id: int, db: Session = Depends(get_db), _: User = Depends(require_employee)):
    return order_service.get_by_id(order_id, db)


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(
    payload: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_employee),
):
    return order_service.create(payload, current_user, db)


@router.put("/{order_id}", response_model=OrderResponse)
def update_order(
    order_id: int,
    payload: OrderUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_employee),
):
    return order_service.update(order_id, payload, db)


@router.post("/{order_id}/cancel", response_model=OrderResponse)
def cancel_order(order_id: int, db: Session = Depends(get_db), _: User = Depends(require_employee)):
    return order_service.cancel(order_id, db)


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(order_id: int, db: Session = Depends(get_db), _: User = Depends(require_employee)):
    order_service.delete(order_id, db)


# ── Cart ──────────────────────────────────────────────────────────────────────

@router.post("/{order_id}/items", response_model=OrderResponse)
def add_item(
    order_id: int,
    payload: CartItemAdd,
    db: Session = Depends(get_db),
    _: User = Depends(require_employee),
):
    return order_service.add_item(order_id, payload, db)


@router.put("/{order_id}/items/{item_id}", response_model=OrderResponse)
def update_item(
    order_id: int,
    item_id: int,
    payload: CartItemUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_employee),
):
    return order_service.update_item(order_id, item_id, payload, db)


@router.delete("/{order_id}/items/{item_id}", response_model=OrderResponse)
def remove_item(
    order_id: int,
    item_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_employee),
):
    return order_service.remove_item(order_id, item_id, db)


# ── Coupon ────────────────────────────────────────────────────────────────────

@router.post("/{order_id}/coupon", response_model=OrderResponse)
def apply_coupon(
    order_id: int,
    payload: CouponApply,
    db: Session = Depends(get_db),
    _: User = Depends(require_employee),
):
    return order_service.apply_coupon(order_id, payload, db)


@router.delete("/{order_id}/coupon", response_model=OrderResponse)
def remove_coupon(order_id: int, db: Session = Depends(get_db), _: User = Depends(require_employee)):
    return order_service.remove_coupon(order_id, db)


# ── Kitchen ───────────────────────────────────────────────────────────────────

@router.post("/{order_id}/send-to-kitchen", response_model=OrderResponse)
def send_to_kitchen(order_id: int, db: Session = Depends(get_db), _: User = Depends(require_employee)):
    return order_service.send_to_kitchen(order_id, db)


# ── Payment ───────────────────────────────────────────────────────────────────

@router.post("/{order_id}/payment", response_model=OrderResponse)
def process_payment(
    order_id: int,
    payload: PaymentCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_employee),
):
    return order_service.process_payment(order_id, payload, db)
