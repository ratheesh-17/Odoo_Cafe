from datetime import datetime
from pydantic import BaseModel, field_validator
from app.models.product import UnitOfMeasure
from app.schemas.category import CategoryResponse


class ProductCreate(BaseModel):
    name: str
    category_id: int
    price: float
    unit_of_measure: UnitOfMeasure = UnitOfMeasure.piece
    tax_percent: float = 0.00
    description: str | None = None
    show_in_kds: bool = True

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Name must not be empty")
        return v.strip()

    @field_validator("price")
    @classmethod
    def price_positive(cls, v: float) -> float:
        if v < 0:
            raise ValueError("Price must be zero or greater")
        return v

    @field_validator("tax_percent")
    @classmethod
    def tax_in_range(cls, v: float) -> float:
        if not (0 <= v <= 100):
            raise ValueError("Tax percent must be between 0 and 100")
        return v


class ProductUpdate(BaseModel):
    name: str | None = None
    category_id: int | None = None
    price: float | None = None
    unit_of_measure: UnitOfMeasure | None = None
    tax_percent: float | None = None
    description: str | None = None
    show_in_kds: bool | None = None
    is_active: bool | None = None

    @field_validator("price")
    @classmethod
    def price_positive(cls, v: float | None) -> float | None:
        if v is not None and v < 0:
            raise ValueError("Price must be zero or greater")
        return v

    @field_validator("tax_percent")
    @classmethod
    def tax_in_range(cls, v: float | None) -> float | None:
        if v is not None and not (0 <= v <= 100):
            raise ValueError("Tax percent must be between 0 and 100")
        return v


class ProductResponse(BaseModel):
    id: int
    name: str
    category: CategoryResponse   # includes color — propagates automatically via JOIN
    price: float
    unit_of_measure: UnitOfMeasure
    tax_percent: float
    description: str | None
    show_in_kds: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
