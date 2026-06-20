from datetime import datetime
from pydantic import BaseModel, EmailStr
from app.models.receipt import DeliveryMethod, ReceiptStatus


class SendEmailRequest(BaseModel):
    email: EmailStr


class ReceiptResponse(BaseModel):
    id: int
    order_id: int
    delivery: DeliveryMethod
    sent_to: str | None
    status: ReceiptStatus
    sent_at: datetime

    model_config = {"from_attributes": True}
