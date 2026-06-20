import enum
from datetime import datetime
from sqlalchemy import String, Text, SmallInteger, Enum, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base


class BookingStatus(str, enum.Enum):
    pending   = "pending"    # newly created, not yet confirmed
    confirmed = "confirmed"  # admin/employee confirmed the slot
    seated    = "seated"     # customer arrived and seated
    completed = "completed"  # visit done
    cancelled = "cancelled"  # cancelled by customer or staff


class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    customer_id: Mapped[int | None] = mapped_column(
        ForeignKey("customers.id", ondelete="SET NULL"), nullable=True, index=True
    )
    table_id: Mapped[int | None] = mapped_column(
        ForeignKey("tables.id", ondelete="SET NULL"), nullable=True, index=True
    )

    # guest details (used when customer is not registered)
    guest_name:  Mapped[str | None] = mapped_column(String(100), nullable=True)
    guest_phone: Mapped[str | None] = mapped_column(String(20),  nullable=True)
    guest_email: Mapped[str | None] = mapped_column(String(150), nullable=True)

    scheduled_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)
    party_size:   Mapped[int]      = mapped_column(SmallInteger, nullable=False, default=1)
    status: Mapped[BookingStatus]  = mapped_column(
        Enum(BookingStatus), nullable=False, default=BookingStatus.pending, index=True
    )
    note: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now(), onupdate=func.now()
    )

    # relationships
    customer: Mapped["Customer | None"] = relationship("Customer", back_populates="bookings")
    table:    Mapped["Table | None"]    = relationship("Table",    back_populates="bookings")
