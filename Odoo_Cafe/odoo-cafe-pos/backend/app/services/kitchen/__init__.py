from datetime import datetime, timezone
from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.models.kitchen_ticket import KitchenTicket, KitchenStage
from app.models.kitchen_ticket_item import KitchenTicketItem
from app.models.order_item import OrderItem
from app.models.order import Order
from app.models.product import Product
from app.schemas.kitchen import KitchenTicketResponse, KitchenTicketItemResponse, KitchenOrderBrief


# ── Stage progression ─────────────────────────────────────────────────────────

_NEXT_STAGE = {
    KitchenStage.to_cook: KitchenStage.preparing,
    KitchenStage.preparing: KitchenStage.completed,
}


# ── Response builder ──────────────────────────────────────────────────────────

def _to_response(ticket: KitchenTicket) -> KitchenTicketResponse:
    order = ticket.order
    table_number = order.table.table_number if order.table else None
    return KitchenTicketResponse(
        id=ticket.id,
        order=KitchenOrderBrief(
            id=order.id,
            order_number=order.order_number,
            table_number=table_number,
        ),
        stage=ticket.stage,
        sent_at=ticket.sent_at,
        started_at=ticket.started_at,
        done_at=ticket.done_at,
        items=[
            KitchenTicketItemResponse(
                id=kti.id,
                order_item_id=kti.order_item_id,
                product_name=kti.order_item.product.name,
                quantity=kti.order_item.quantity,
                note=kti.order_item.note,
                is_done=kti.is_done,
                done_at=kti.done_at,
            )
            for kti in ticket.ticket_items
        ],
    )


def _load_ticket(ticket_id: int, db: Session) -> KitchenTicket:
    ticket = (
        db.query(KitchenTicket)
        .options(
            joinedload(KitchenTicket.order).joinedload(Order.table),
            joinedload(KitchenTicket.ticket_items)
            .joinedload(KitchenTicketItem.order_item)
            .joinedload(OrderItem.product),
        )
        .filter(KitchenTicket.id == ticket_id)
        .first()
    )
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kitchen ticket not found")
    return ticket


# ── Public API ────────────────────────────────────────────────────────────────

def get_all(
    db: Session,
    stage: KitchenStage | None = None,
    product_id: int | None = None,
    category_id: int | None = None,
) -> list[KitchenTicketResponse]:
    query = (
        db.query(KitchenTicket)
        .options(
            joinedload(KitchenTicket.order).joinedload(Order.table),
            joinedload(KitchenTicket.ticket_items)
            .joinedload(KitchenTicketItem.order_item)
            .joinedload(OrderItem.product),
        )
    )

    if stage:
        query = query.filter(KitchenTicket.stage == stage)

    tickets = query.order_by(KitchenTicket.sent_at.asc()).all()

    # apply product/category filter in Python after eager load (avoids complex joins)
    if product_id or category_id:
        def _matches(ticket: KitchenTicket) -> bool:
            for kti in ticket.ticket_items:
                p = kti.order_item.product
                if product_id and p.id == product_id:
                    return True
                if category_id and p.category_id == category_id:
                    return True
            return False
        tickets = [t for t in tickets if _matches(t)]

    return [_to_response(t) for t in tickets]


def advance_stage(ticket_id: int, db: Session) -> KitchenTicketResponse:
    """Clicking a ticket card moves the entire order to the next stage."""
    ticket = _load_ticket(ticket_id, db)

    if ticket.stage == KitchenStage.completed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ticket is already completed",
        )

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    next_stage = _NEXT_STAGE[ticket.stage]

    if next_stage == KitchenStage.preparing:
        ticket.started_at = now
    elif next_stage == KitchenStage.completed:
        ticket.done_at = now
        # mark all items done when whole ticket completes
        for kti in ticket.ticket_items:
            if not kti.is_done:
                kti.is_done = True
                kti.done_at = now

    ticket.stage = next_stage
    db.commit()
    return _to_response(_load_ticket(ticket_id, db))


def mark_item_done(ticket_id: int, ticket_item_id: int, db: Session) -> KitchenTicketResponse:
    """Clicking an individual item marks only that item as done."""
    ticket = _load_ticket(ticket_id, db)

    kti = next((i for i in ticket.ticket_items if i.id == ticket_item_id), None)
    if not kti:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket item not found in this ticket",
        )
    if kti.is_done:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Item is already marked as done",
        )

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    kti.is_done = True
    kti.done_at = now

    # auto-advance ticket to completed if all items are now done
    if all(i.is_done for i in ticket.ticket_items):
        ticket.stage = KitchenStage.completed
        ticket.done_at = now
        if not ticket.started_at:
            ticket.started_at = now

    db.commit()
    return _to_response(_load_ticket(ticket_id, db))
