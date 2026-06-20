from datetime import datetime
from pydantic import BaseModel, field_validator
from app.models.enums import DiscountType


class CouponCreate(BaseModel):
    code: str
    discount_type: DiscountType
    discount_value: float
    usage_limit: int | None = None
    expires_at: datetime | None = None

    @field_validator("code")
    @classmethod
    def code_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Coupon code must not be empty")
        return v.strip().upper()

    @field_validator("discount_value")
    @classmethod
    def value_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Discount value must be greater than 0")
        return v

    @field_validator("usage_limit")
    @classmethod
    def limit_positive(cls, v: int | None) -> int | None:
        if v is not None and v < 1:
            raise ValueError("Usage limit must be at least 1")
        return v


class CouponUpdate(BaseModel):
    code: str | None = None
    discount_type: DiscountType | None = None
    discount_value: float | None = None
    is_active: bool | None = None
    usage_limit: int | None = None
    expires_at: datetime | None = None

    @field_validator("code")
    @classmethod
    def code_not_empty(cls, v: str | None) -> str | None:
        if v is not None and not v.strip():
            raise ValueError("Coupon code must not be empty")
        return v.strip().upper() if v else v

    @field_validator("discount_value")
    @classmethod
    def value_positive(cls, v: float | None) -> float | None:
        if v is not None and v <= 0:
            raise ValueError("Discount value must be greater than 0")
        return v


class CouponResponse(BaseModel):
    id: int
    code: str
    discount_type: DiscountType
    discount_value: float
    is_active: bool
    usage_limit: int | None
    used_count: int
    expires_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
