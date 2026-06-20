from datetime import datetime, timezone
from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.models.session import PosSession, SessionStatus
from app.models.order import Order, OrderStatus
from app.models.payment import Payment
from app.models.payment_method import PaymentType
from app.models.user import User
from app.schemas.session import SessionOpen, SessionClose, SessionResponse, SessionSummary, SessionUserBrief


def _build_response(session: PosSession, summary: SessionSummary | None = None) -> SessionResponse:
    return SessionResponse(
        id=session.id,
        opened_by=SessionUserBrief.model_validate(session.opened_by_user),
        status=session.status,
        opening_cash=float(session.opening_cash),
        closing_total_sales=float(session.closing_total_sales),
        opened_at=session.opened_at,
        closed_at=session.closed_at,
        note=session.note,
        summary=summary,
    )


def _load(session_id: int, db: Session) -> PosSession:
    session = (
        db.query(PosSession)
        .options(joinedload(PosSession.opened_by_user))
        .filter(PosSession.id == session_id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    return session


def get_current(db: Session) -> PosSession | None:
    return (
        db.query(PosSession)
        .options(joinedload(PosSession.opened_by_user))
        .filter(PosSession.status == SessionStatus.open)
        .order_by(PosSession.opened_at.desc())
        .first()
    )


def get_all(db: Session) -> list[PosSession]:
    return (
        db.query(PosSession)
        .options(joinedload(PosSession.opened_by_user))
        .order_by(PosSession.opened_at.desc())
        .all()
    )


def open_session(payload: SessionOpen, current_user: User, db: Session) -> SessionResponse:
    existing = get_current(db)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A session is already open. Close it before opening a new one.",
        )
    session = PosSession(
        opened_by=current_user.id,
        opening_cash=payload.opening_cash,
        status=SessionStatus.open,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return _build_response(_load(session.id, db))


def close_session(session_id: int, payload: SessionClose, db: Session) -> SessionResponse:
    session = _load(session_id, db)
    if session.status == SessionStatus.closed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session is already closed",
        )

    # compute closing summary from paid orders in this session
    paid_orders = (
        db.query(Order)
        .filter(Order.session_id == session_id, Order.status == OrderStatus.paid)
        .all()
    )

    total_revenue = sum(float(o.total_amount) for o in paid_orders)
    total_discount = sum(float(o.discount_amount) for o in paid_orders)
    total_tax = sum(float(o.tax_amount) for o in paid_orders)

    cash_sales = card_sales = upi_sales = 0.0
    for order in paid_orders:
        if order.payment:
            ptype = order.payment.payment_method.type
            amt = float(order.payment.amount_paid)
            if ptype == PaymentType.cash:
                cash_sales += amt
            elif ptype == PaymentType.card:
                card_sales += amt
            elif ptype == PaymentType.upi:
                upi_sales += amt

    summary = SessionSummary(
        total_orders=len(paid_orders),
        total_revenue=total_revenue,
        cash_sales=cash_sales,
        card_sales=card_sales,
        upi_sales=upi_sales,
        total_discount=total_discount,
        total_tax=total_tax,
    )

    session.status = SessionStatus.closed
    session.closing_total_sales = total_revenue
    session.closed_at = datetime.now(timezone.utc).replace(tzinfo=None)
    if payload.note:
        session.note = payload.note

    db.commit()
    db.refresh(session)
    return _build_response(_load(session_id, db), summary=summary)
