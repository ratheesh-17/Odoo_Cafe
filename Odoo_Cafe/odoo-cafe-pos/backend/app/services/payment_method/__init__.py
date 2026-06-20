from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.payment_method import PaymentMethod, PaymentType
from app.schemas.payment_method import PaymentMethodUpdate


def get_all(db: Session) -> list[PaymentMethod]:
    return db.query(PaymentMethod).order_by(PaymentMethod.id).all()


def get_by_type(payment_type: PaymentType, db: Session) -> PaymentMethod:
    method = db.query(PaymentMethod).filter(PaymentMethod.type == payment_type).first()
    if not method:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment method not found")
    return method


def update(payment_type: PaymentType, payload: PaymentMethodUpdate, db: Session) -> PaymentMethod:
    method = get_by_type(payment_type, db)

    if payload.is_enabled is not None:
        method.is_enabled = payload.is_enabled

    if payload.upi_id is not None:
        if method.type != PaymentType.upi:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="UPI ID can only be set on the UPI payment method",
            )
        method.upi_id = payload.upi_id

    db.commit()
    db.refresh(method)
    return method
