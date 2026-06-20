from datetime import datetime
from pydantic import BaseModel, field_validator
from app.models.payment_method import PaymentType


class PaymentMethodUpdate(BaseModel):
    is_enabled: bool | None = None
    upi_id: str | None = None

    @field_validator("upi_id")
    @classmethod
    def upi_id_not_empty(cls, v: str | None) -> str | None:
        if v is not None and not v.strip():
            raise ValueError("UPI ID must not be empty")
        return v.strip() if v else v


class PaymentMethodResponse(BaseModel):
    id: int
    type: PaymentType
    is_enabled: bool
    upi_id: str | None
    updated_at: datetime

    model_config = {"from_attributes": True}
