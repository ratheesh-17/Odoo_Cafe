from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload
from datetime import datetime

from app.models.booking import Booking, BookingStatus
from app.models.table import Table
from app.models.customer import Customer
from app.schemas.booking import BookingCreate, BookingUpdate, BookingResponse


# valid forward transitions
_ALLOWED_TRANSITIONS: dict[BookingStatus, set[BookingStatus]] = {
    BookingStatus.pending:   {BookingStatus.confirmed, BookingStatus.cancelled},
    BookingStatus.confirmed: {BookingStatus.seated,    BookingStatus.cancelled},
    BookingStatus.seated:    {BookingStatus.completed, BookingStatus.cancelled},
    BookingStatus.completed: set(),
    BookingStatus.cancelled: set(),
}


def _load(booking_id: int, db: Session) -> Booking:
    booking = (
        db.query(Booking)
        .options(joinedload(Booking.customer), joinedload(Booking.table))
        .filter(Booking.id == booking_id)
        .first()
    )
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    return booking


def _validate_table(table_id: int, db: Session) -> None:
    table = db.query(Table).filter(Table.id == table_id, Table.is_active == True).first()
    if not table:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Table not found or inactive")


def _validate_customer(customer_id: int, db: Session) -> None:
    if not db.query(Customer).filter(Customer.id == customer_id).first():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")


def get_all(
    db: Session,
    status_filter: BookingStatus | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
) -> list[Booking]:
    query = (
        db.query(Booking)
        .options(joinedload(Booking.customer), joinedload(Booking.table))
    )
    if status_filter:
        query = query.filter(Booking.status == status_filter)
    if date_from:
        query = query.filter(Booking.scheduled_at >= date_from)
    if date_to:
        query = query.filter(Booking.scheduled_at <= date_to)
    return query.order_by(Booking.scheduled_at.asc()).all()


def get_by_id(booking_id: int, db: Session) -> Booking:
    return _load(booking_id, db)


def create(payload: BookingCreate, db: Session) -> Booking:
    if payload.customer_id:
        _validate_customer(payload.customer_id, db)
    if payload.table_id:
        _validate_table(payload.table_id, db)

    booking = Booking(**payload.model_dump())
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return _load(booking.id, db)


def update(booking_id: int, payload: BookingUpdate, db: Session) -> Booking:
    booking = _load(booking_id, db)

    if booking.status in (BookingStatus.completed, BookingStatus.cancelled):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot edit a {booking.status} booking",
        )

    data = payload.model_dump(exclude_unset=True)

    if "customer_id" in data and data["customer_id"]:
        _validate_customer(data["customer_id"], db)
    if "table_id" in data and data["table_id"]:
        _validate_table(data["table_id"], db)

    for field, value in data.items():
        setattr(booking, field, value)

    db.commit()
    return _load(booking_id, db)


def update_status(booking_id: int, new_status: BookingStatus, db: Session) -> Booking:
    booking = _load(booking_id, db)

    allowed = _ALLOWED_TRANSITIONS[booking.status]
    if new_status not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot move booking from '{booking.status}' to '{new_status}'",
        )

    booking.status = new_status
    db.commit()
    return _load(booking_id, db)


def delete(booking_id: int, db: Session) -> None:
    booking = _load(booking_id, db)
    if booking.status not in (BookingStatus.pending, BookingStatus.cancelled):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only pending or cancelled bookings can be deleted",
        )
    db.delete(booking)
    db.commit()
