from datetime import datetime
from pydantic import BaseModel, field_validator


class SessionOpen(BaseModel):
    opening_cash: float = 0.00

    @field_validator("opening_cash")
    @classmethod
    def cash_non_negative(cls, v: float) -> float:
        if v < 0:
            raise ValueError("Opening cash must be zero or greater")
        return v


class SessionClose(BaseModel):
    note: str | None = None


class SessionUserBrief(BaseModel):
    id: int
    name: str
    email: str

    model_config = {"from_attributes": True}


class SessionSummary(BaseModel):
    """Closing summary breakdown returned when session is closed."""
    total_orders: int
    total_revenue: float
    cash_sales: float
    card_sales: float
    upi_sales: float
    total_discount: float
    total_tax: float


class SessionResponse(BaseModel):
    id: int
    opened_by: SessionUserBrief
    status: str
    opening_cash: float
    closing_total_sales: float
    opened_at: datetime
    closed_at: datetime | None
    note: str | None
    summary: SessionSummary | None = None   # populated only on close response

    model_config = {"from_attributes": True}
