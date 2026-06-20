from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.middleware.role_guard import require_admin, require_employee
from app.models.payment_method import PaymentType
from app.models.user import User
from app.schemas.payment_method import PaymentMethodUpdate, PaymentMethodResponse
from app.utils.qr_generator import generate_upi_qr
import app.services.payment_method as payment_method_service

router = APIRouter(prefix="/payment-methods", tags=["Payment Methods"])


@router.get("", response_model=list[PaymentMethodResponse])
def list_payment_methods(db: Session = Depends(get_db), _: User = Depends(require_employee)):
    return payment_method_service.get_all(db)


@router.get("/upi/qr")
def get_upi_qr(
    amount: float = Query(..., gt=0, description="Order total amount"),
    db: Session = Depends(get_db),
    _: User = Depends(require_employee),
):
    """Generates a UPI QR code for the given amount. Used on the POS payment screen."""
    method = payment_method_service.get_by_type(PaymentType.upi, db)
    if not method.is_enabled:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=400, detail="UPI payment method is not enabled")
    if not method.upi_id:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=400, detail="UPI ID is not configured")
    qr_b64 = generate_upi_qr(method.upi_id, amount)
    return {"upi_id": method.upi_id, "amount": amount, "qr_base64": qr_b64}


@router.put("/{payment_type}", response_model=PaymentMethodResponse)
def update_payment_method(
    payment_type: PaymentType,
    payload: PaymentMethodUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return payment_method_service.update(payment_type, payload, db)
