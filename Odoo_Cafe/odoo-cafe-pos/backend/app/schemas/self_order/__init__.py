import re
from datetime import datetime
from pydantic import BaseModel, field_validator
from app.models.self_order_config import SelfOrderMode


# ── Admin config ──────────────────────────────────────────────────────────────

class SelfOrderConfigUpdate(BaseModel):
    is_enabled: bool | None = None
    mode: SelfOrderMode | None = None
    background_color: str | None = None
    background_image: str | None = None

    @field_validator("background_color")
    @classmethod
    def valid_hex(cls, v: str | None) -> str | None:
        if v is not None and not re.match(r"^#[0-9A-Fa-f]{6}$", v):
            raise ValueError("background_color must be a valid hex code e.g. #FF5733")
        return v


class SelfOrderConfigResponse(BaseModel):
    id: int
    is_enabled: bool
    mode: SelfOrderMode
    background_color: str
    background_image: str | None
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Customer-facing menu ──────────────────────────────────────────────────────

class MenuCategoryResponse(BaseModel):
    id: int
    name: str
    color: str

    model_config = {"from_attributes": True}


class MenuProductResponse(BaseModel):
    id: int
    name: str
    price: float
    description: str | None
    unit_of_measure: str
    tax_percent: float
    category: MenuCategoryResponse

    model_config = {"from_attributes": True}


class TableInfoResponse(BaseModel):
    id: int
    table_number: str
    seats: int

    model_config = {"from_attributes": True}


class MenuResponse(BaseModel):
    table: TableInfoResponse
    config: SelfOrderConfigResponse
    categories: list[MenuCategoryResponse]
    products: list[MenuProductResponse]


# ── Customer cart / order ─────────────────────────────────────────────────────

class SelfCartItemAdd(BaseModel):
    product_id: int
    quantity: int = 1
    note: str | None = None

    @field_validator("quantity")
    @classmethod
    def qty_positive(cls, v: int) -> int:
        if v < 1:
            raise ValueError("Quantity must be at least 1")
        return v


class SelfCartItemUpdate(BaseModel):
    quantity: int

    @field_validator("quantity")
    @classmethod
    def qty_positive(cls, v: int) -> int:
        if v < 1:
            raise ValueError("Quantity must be at least 1")
        return v


class SelfCouponApply(BaseModel):
    code: str

    @field_validator("code")
    @classmethod
    def code_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Coupon code must not be empty")
        return v.strip().upper()


# ── Customer-facing display ───────────────────────────────────────────────────

class DisplayOrderItem(BaseModel):
    product_name: str
    quantity: int
    unit_price: float
    line_total: float


class CustomerDisplayResponse(BaseModel):
    order_id: int
    order_number: str
    status: str                  # draft | sent_to_kitchen | paid | cancelled
    items: list[DisplayOrderItem]
    subtotal: float
    tax_amount: float
    discount_amount: float
    total_amount: float
    payment_type: str | None     # cash | card | upi — set once paid
    upi_qr_base64: str | None    # populated only for upi payments
    is_paid: bool


class SelfOrderItemStatus(BaseModel):
    product_name: str
    quantity: int
    is_done: bool


class SelfOrderStatusResponse(BaseModel):
    order_id: int
    order_number: str
    kitchen_stage: str | None    # to_cook | preparing | completed | None (not yet sent)
    items: list[SelfOrderItemStatus]
    subtotal: float
    tax_amount: float
    discount_amount: float
    total_amount: float
