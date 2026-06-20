import re
from datetime import datetime
from pydantic import BaseModel, field_validator


class CategoryCreate(BaseModel):
    name: str
    color: str = "#6366f1"

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Name must not be empty")
        return v.strip()

    @field_validator("color")
    @classmethod
    def valid_hex_color(cls, v: str) -> str:
        if not re.match(r"^#[0-9A-Fa-f]{6}$", v):
            raise ValueError("Color must be a valid hex code e.g. #FF5733")
        return v


class CategoryUpdate(BaseModel):
    name: str | None = None
    color: str | None = None

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str | None) -> str | None:
        if v is not None and not v.strip():
            raise ValueError("Name must not be empty")
        return v.strip() if v else v

    @field_validator("color")
    @classmethod
    def valid_hex_color(cls, v: str | None) -> str | None:
        if v is not None and not re.match(r"^#[0-9A-Fa-f]{6}$", v):
            raise ValueError("Color must be a valid hex code e.g. #FF5733")
        return v


class CategoryResponse(BaseModel):
    id: int
    name: str
    color: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
