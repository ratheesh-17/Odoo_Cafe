from datetime import datetime
from pydantic import BaseModel, field_validator


class TableCreate(BaseModel):
    floor_id: int
    table_number: str
    seats: int = 2

    @field_validator("table_number")
    @classmethod
    def table_number_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Table number must not be empty")
        return v.strip()

    @field_validator("seats")
    @classmethod
    def seats_positive(cls, v: int) -> int:
        if v < 1:
            raise ValueError("Seats must be at least 1")
        return v


class TableUpdate(BaseModel):
    table_number: str | None = None
    seats: int | None = None
    is_active: bool | None = None

    @field_validator("table_number")
    @classmethod
    def table_number_not_empty(cls, v: str | None) -> str | None:
        if v is not None and not v.strip():
            raise ValueError("Table number must not be empty")
        return v.strip() if v else v

    @field_validator("seats")
    @classmethod
    def seats_positive(cls, v: int | None) -> int | None:
        if v is not None and v < 1:
            raise ValueError("Seats must be at least 1")
        return v


class FloorBrief(BaseModel):
    id: int
    name: str

    model_config = {"from_attributes": True}


class TableResponse(BaseModel):
    id: int
    floor: FloorBrief
    table_number: str
    seats: int
    is_active: bool
    self_order_token: str | None
    has_active_order: bool        # computed — True if table has a draft or sent_to_kitchen order
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
