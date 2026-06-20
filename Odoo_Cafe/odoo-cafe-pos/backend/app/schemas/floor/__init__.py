from datetime import datetime
from pydantic import BaseModel, field_validator


class FloorCreate(BaseModel):
    name: str

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Floor name must not be empty")
        return v.strip()


class FloorUpdate(BaseModel):
    name: str

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Floor name must not be empty")
        return v.strip()


class TableSummary(BaseModel):
    id: int
    table_number: str
    seats: int
    is_active: bool
    self_order_token: str | None

    model_config = {"from_attributes": True}


class FloorResponse(BaseModel):
    id: int
    name: str
    tables: list[TableSummary]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
