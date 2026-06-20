from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.middleware.role_guard import require_admin, require_employee
from app.models.user import User
from app.schemas.coupon import CouponCreate, CouponUpdate, CouponResponse
import app.services.coupon as coupon_service

router = APIRouter(prefix="/coupons", tags=["Coupons"])


@router.get("", response_model=list[CouponResponse])
def list_coupons(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return coupon_service.get_all(db)


@router.get("/{coupon_id}", response_model=CouponResponse)
def get_coupon(coupon_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return coupon_service.get_by_id(coupon_id, db)


@router.post("", response_model=CouponResponse, status_code=status.HTTP_201_CREATED)
def create_coupon(payload: CouponCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return coupon_service.create(payload, db)


@router.put("/{coupon_id}", response_model=CouponResponse)
def update_coupon(coupon_id: int, payload: CouponUpdate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return coupon_service.update(coupon_id, payload, db)


@router.delete("/{coupon_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_coupon(coupon_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    coupon_service.delete(coupon_id, db)


@router.get("/redeem/{code}", response_model=CouponResponse)
def redeem_coupon(code: str, db: Session = Depends(get_db), _: User = Depends(require_employee)):
    """Called from POS terminal when employee enters a coupon code."""
    return coupon_service.redeem(code, db)
