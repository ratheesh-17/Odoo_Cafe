from datetime import datetime
from pydantic import BaseModel, field_validator, model_validator
from app.models.promotion import PromotionAppliesTo
from app.models.enums import DiscountType


class PromotionCreate(BaseModel):
    name: str
    applies_to: PromotionAppliesTo
    product_id: int | None = None
    min_quantity: int | None = None
    min_order_amount: float | None = None
    discount_type: DiscountType
    discount_value: float
    starts_at: datetime | None = None
    ends_at: datetime | None = None

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Name must not be empty")
        return v.strip()

    @field_validator("discount_value")
    @classmethod
    def value_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Discount value must be greater than 0")
        return v

    @model_validator(mode="after")
    def validate_rule_fields(self) -> "PromotionCreate":
        if self.applies_to == PromotionAppliesTo.product:
            if self.product_id is None or self.min_quantity is None:
                raise ValueError("product_id and min_quantity are required for product-level promotions")
            if self.min_quantity < 1:
                raise ValueError("min_quantity must be at least 1")
        if self.applies_to == PromotionAppliesTo.order:
            if self.min_order_amount is None:
                raise ValueError("min_order_amount is required for order-level promotions")
            if self.min_order_amount <= 0:
                raise ValueError("min_order_amount must be greater than 0")
        return self


class PromotionUpdate(BaseModel):
    name: str | None = None
    product_id: int | None = None
    min_quantity: int | None = None
    min_order_amount: float | None = None
    discount_type: DiscountType | None = None
    discount_value: float | None = None
    is_active: bool | None = None
    starts_at: datetime | None = None
    ends_at: datetime | None = None

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str | None) -> str | None:
        if v is not None and not v.strip():
            raise ValueError("Name must not be empty")
        return v.strip() if v else v

    @field_validator("discount_value")
    @classmethod
    def value_positive(cls, v: float | None) -> float | None:
        if v is not None and v <= 0:
            raise ValueError("Discount value must be greater than 0")
        return v


class ProductBrief(BaseModel):
    id: int
    name: str

    model_config = {"from_attributes": True}


class PromotionResponse(BaseModel):
    id: int
    name: str
    applies_to: PromotionAppliesTo
    product: ProductBrief | None
    min_quantity: int | None
    min_order_amount: float | None
    discount_type: DiscountType
    discount_value: float
    is_active: bool
    starts_at: datetime | None
    ends_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
