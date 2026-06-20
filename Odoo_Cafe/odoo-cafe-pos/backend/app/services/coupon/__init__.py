from datetime import datetime, timezone
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.coupon import Coupon
from app.schemas.coupon import CouponCreate, CouponUpdate


def get_all(db: Session) -> list[Coupon]:
    return db.query(Coupon).order_by(Coupon.created_at.desc()).all()


def get_by_id(coupon_id: int, db: Session) -> Coupon:
    coupon = db.query(Coupon).filter(Coupon.id == coupon_id).first()
    if not coupon:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Coupon not found")
    return coupon


def create(payload: CouponCreate, db: Session) -> Coupon:
    if db.query(Coupon).filter(Coupon.code == payload.code).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Coupon code already exists")
    coupon = Coupon(**payload.model_dump())
    db.add(coupon)
    db.commit()
    db.refresh(coupon)
    return coupon


def update(coupon_id: int, payload: CouponUpdate, db: Session) -> Coupon:
    coupon = get_by_id(coupon_id, db)
    data = payload.model_dump(exclude_unset=True)
    if "code" in data:
        duplicate = db.query(Coupon).filter(
            Coupon.code == data["code"], Coupon.id != coupon_id
        ).first()
        if duplicate:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Coupon code already exists")
    for field, value in data.items():
        setattr(coupon, field, value)
    db.commit()
    db.refresh(coupon)
    return coupon


def delete(coupon_id: int, db: Session) -> None:
    coupon = get_by_id(coupon_id, db)
    if coupon.orders:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete a coupon that has been used in orders",
        )
    db.delete(coupon)
    db.commit()


def redeem(code: str, db: Session) -> Coupon:
    """
    Validates coupon at POS when employee enters the code.
    Called by order service — does NOT increment used_count here.
    used_count is incremented when the order is marked paid.
    """
    coupon = db.query(Coupon).filter(Coupon.code == code.strip().upper()).first()
    if not coupon or not coupon.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid or inactive coupon code",
        )
    if coupon.expires_at and coupon.expires_at < datetime.now(timezone.utc).replace(tzinfo=None):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This coupon has expired",
        )
    if coupon.usage_limit is not None and coupon.used_count >= coupon.usage_limit:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This coupon has reached its usage limit",
        )
    return coupon
