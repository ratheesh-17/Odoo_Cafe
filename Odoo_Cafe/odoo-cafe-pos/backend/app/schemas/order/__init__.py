from datetime import datetime
from pydantic import BaseModel, field_validator
from app.models.order import OrderStatus, OrderSource
from app.models.payment_method import PaymentType


# ── Cart item payloads ────────────────────────────────────────────────────────

class CartItemAdd(BaseModel):
    product_id: int
    quantity: int = 1
    note: str | None = None

    @field_validator("quantity")
    @classmethod
    def qty_positive(cls, v: int) -> int:
        if v < 1:
            raise ValueError("Quantity must be at least 1")
        return v


class CartItemUpdate(BaseModel):
    quantity: int
    note: str | None = None

    @field_validator("quantity")
    @classmethod
    def qty_positive(cls, v: int) -> int:
        if v < 1:
            raise ValueError("Quantity must be at least 1")
        return v


# ── Order create / update ─────────────────────────────────────────────────────

class OrderCreate(BaseModel):
    table_id: int | None = None
    customer_id: int | None = None
    note: str | None = None


class OrderUpdate(BaseModel):
    table_id: int | None = None
    customer_id: int | None = None
    note: str | None = None


class CouponApply(BaseModel):
    code: str

    @field_validator("code")
    @classmethod
    def code_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Coupon code must not be empty")
        return v.strip().upper()


# ── Payment payload ───────────────────────────────────────────────────────────

class PaymentCreate(BaseModel):
    payment_type: PaymentType
    amount_paid: float
    transaction_ref: str | None = None     # card only

    @field_validator("amount_paid")
    @classmethod
    def amount_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Amount paid must be greater than 0")
        return v


# ── Nested response pieces ────────────────────────────────────────────────────

class CategoryBrief(BaseModel):
    id: int
    name: str
    color: str

    model_config = {"from_attributes": True}


class ProductBrief(BaseModel):
    id: int
    name: str
    category_id: int
    category: CategoryBrief | None = None

    model_config = {"from_attributes": True}


class OrderItemResponse(BaseModel):
    id: int
    product: ProductBrief
    quantity: int
    unit_price: float
    tax_percent: float
    line_discount: float
    line_total: float
    note: str | None

    model_config = {"from_attributes": True}


class CustomerBrief(BaseModel):
    id: int
    name: str
    email: str | None
    phone: str | None

    model_config = {"from_attributes": True}


class TableBrief(BaseModel):
    id: int
    table_number: str

    model_config = {"from_attributes": True}


class EmployeeBrief(BaseModel):
    id: int
    name: str

    model_config = {"from_attributes": True}


class PaymentResponse(BaseModel):
    id: int
    payment_type: str
    amount_paid: float
    change_due: float
    transaction_ref: str | None
    paid_at: datetime

    model_config = {"from_attributes": True}


class PromotionBrief(BaseModel):
    id: int
    name: str
    discount_type: str
    discount_value: float

    model_config = {"from_attributes": True}


class CouponBrief(BaseModel):
    id: int
    code: str
    discount_type: str
    discount_value: float

    model_config = {"from_attributes": True}


# ── Main order response ───────────────────────────────────────────────────────

class OrderResponse(BaseModel):
    id: int
    order_number: str
    status: OrderStatus
    order_source: OrderSource
    table: TableBrief | None
    customer: CustomerBrief | None
    employee: EmployeeBrief
    items: list[OrderItemResponse]
    subtotal: float
    tax_amount: float
    discount_amount: float
    total_amount: float
    coupon: CouponBrief | None
    promotion: PromotionBrief | None
    payment: PaymentResponse | None
    note: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
