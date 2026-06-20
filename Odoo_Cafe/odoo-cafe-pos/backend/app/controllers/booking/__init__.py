from datetime import datetime
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.middleware.role_guard import require_admin, require_employee
from app.models.booking import BookingStatus
from app.models.user import User
from app.schemas.booking import BookingCreate, BookingUpdate, BookingStatusUpdate, BookingResponse
import app.services.booking as booking_service

router = APIRouter(prefix="/bookings", tags=["Bookings"])


@router.get("", response_model=list[BookingResponse])
def list_bookings(
    status: BookingStatus | None = Query(None, description="Filter by status"),
    date_from: datetime | None = Query(None, description="Filter from date e.g. 2024-01-01T00:00:00"),
    date_to: datetime | None = Query(None, description="Filter to date e.g. 2024-01-31T23:59:59"),
    db: Session = Depends(get_db),
    _: User = Depends(require_employee),
):
    return booking_service.get_all(db, status_filter=status, date_from=date_from, date_to=date_to)


@router.get("/{booking_id}", response_model=BookingResponse)
def get_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_employee),
):
    return booking_service.get_by_id(booking_id, db)


@router.post("", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
def create_booking(
    payload: BookingCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_employee),
):
    return booking_service.create(payload, db)


@router.put("/{booking_id}", response_model=BookingResponse)
def update_booking(
    booking_id: int,
    payload: BookingUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_employee),
):
    return booking_service.update(booking_id, payload, db)


@router.patch("/{booking_id}/status", response_model=BookingResponse)
def update_booking_status(
    booking_id: int,
    payload: BookingStatusUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_employee),
):
    """Advance or cancel a booking: pending → confirmed → seated → completed / cancelled."""
    return booking_service.update_status(booking_id, payload.status, db)


@router.delete("/{booking_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    booking_service.delete(booking_id, db)
