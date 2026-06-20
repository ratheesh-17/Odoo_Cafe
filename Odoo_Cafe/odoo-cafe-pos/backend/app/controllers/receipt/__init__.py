from fastapi import APIRouter, Depends
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.middleware.role_guard import require_employee
from app.models.user import User
from app.schemas.receipt import SendEmailRequest, ReceiptResponse
import app.services.receipt as receipt_service

router = APIRouter(prefix="/orders", tags=["Receipts"])


@router.post("/{order_id}/receipt/email", response_model=ReceiptResponse)
def send_receipt_email(
    order_id: int,
    payload: SendEmailRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_employee),
):
    """Send the receipt for a paid order to the given email address."""
    return receipt_service.send_email(order_id, payload.email, db)


@router.get("/{order_id}/receipt/print")
def print_receipt(
    order_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_employee),
):
    """Returns the receipt as a PDF — frontend triggers browser print dialog."""
    pdf_bytes = receipt_service.log_print(order_id, db)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": "inline; filename=receipt.pdf"},
    )


@router.get("/{order_id}/receipts", response_model=list[ReceiptResponse])
def get_receipt_history(
    order_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_employee),
):
    """Returns all receipt delivery logs for an order."""
    return receipt_service.get_history(order_id, db)
