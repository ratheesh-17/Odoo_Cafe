from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.kitchen_ticket import KitchenStage
from app.schemas.kitchen import KitchenTicketResponse
import app.services.kitchen as kitchen_service

router = APIRouter(prefix="/kitchen", tags=["Kitchen Display"])


@router.get("/tickets", response_model=list[KitchenTicketResponse])
def list_tickets(
    stage: KitchenStage | None = Query(None),
    product_id: int | None = Query(None),
    category_id: int | None = Query(None),
    db: Session = Depends(get_db),
):
    return kitchen_service.get_all(db, stage=stage, product_id=product_id, category_id=category_id)


@router.post("/tickets/{ticket_id}/advance", response_model=KitchenTicketResponse)
def advance_stage(ticket_id: int, db: Session = Depends(get_db)):
    return kitchen_service.advance_stage(ticket_id, db)


@router.post("/tickets/{ticket_id}/items/{ticket_item_id}/done", response_model=KitchenTicketResponse)
def mark_item_done(ticket_id: int, ticket_item_id: int, db: Session = Depends(get_db)):
    return kitchen_service.mark_item_done(ticket_id, ticket_item_id, db)
