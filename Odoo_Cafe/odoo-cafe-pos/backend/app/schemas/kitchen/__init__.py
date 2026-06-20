from datetime import datetime
from pydantic import BaseModel
from app.models.kitchen_ticket import KitchenStage


class KitchenTicketItemResponse(BaseModel):
    id: int
    order_item_id: int
    product_name: str
    quantity: int
    note: str | None
    is_done: bool
    done_at: datetime | None

    model_config = {"from_attributes": True}


class KitchenOrderBrief(BaseModel):
    id: int
    order_number: str
    table_number: str | None   # None for takeaway / self-order without table

    model_config = {"from_attributes": True}


class KitchenTicketResponse(BaseModel):
    id: int
    order: KitchenOrderBrief
    stage: KitchenStage
    sent_at: datetime
    started_at: datetime | None
    done_at: datetime | None
    items: list[KitchenTicketItemResponse]

    model_config = {"from_attributes": True}
