from datetime import datetime
from pydantic import BaseModel, field_validator, model_validator
from app.models.booking import BookingStatus


class BookingCreate(BaseModel):
    customer_id:  int | None = None
    table_id:     int | None = None
    guest_name:   str | None = None
    guest_phone:  str | None = None
    guest_email:  str | None = None
    scheduled_at: datetime
    party_size:   int = 1
    note:         str | None = None

    @model_validator(mode="after")
    def require_customer_or_guest(self) -> "BookingCreate":
        if not self.customer_id and not self.guest_name:
            raise ValueError("Either customer_id or guest_name is required")
        return self

    @field_validator("party_size")
    @classmethod
    def party_positive(cls, v: int) -> int:
        if v < 1:
            raise ValueError("Party size must be at least 1")
        return v

    @field_validator("scheduled_at")
    @classmethod
    def not_in_past(cls, v: datetime) -> datetime:
        if v < datetime.now():
            raise ValueError("Booking time cannot be in the past")
        return v


class BookingUpdate(BaseModel):
    customer_id:  int | None = None
    table_id:     int | None = None
    guest_name:   str | None = None
    guest_phone:  str | None = None
    guest_email:  str | None = None
    scheduled_at: datetime | None = None
    party_size:   int | None = None
    note:         str | None = None

    @field_validator("party_size")
    @classmethod
    def party_positive(cls, v: int | None) -> int | None:
        if v is not None and v < 1:
            raise ValueError("Party size must be at least 1")
        return v


class BookingStatusUpdate(BaseModel):
    status: BookingStatus


class CustomerBrief(BaseModel):
    id: int
    name: str
    phone: str | None
    email: str | None
    model_config = {"from_attributes": True}


class TableBrief(BaseModel):
    id: int
    table_number: str
    model_config = {"from_attributes": True}


class BookingResponse(BaseModel):
    id:           int
    customer:     CustomerBrief | None
    table:        TableBrief | None
    guest_name:   str | None
    guest_phone:  str | None
    guest_email:  str | None
    scheduled_at: datetime
    party_size:   int
    status:       BookingStatus
    note:         str | None
    created_at:   datetime
    updated_at:   datetime

    model_config = {"from_attributes": True}
