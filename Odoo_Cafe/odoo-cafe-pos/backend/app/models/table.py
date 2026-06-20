from datetime import datetime
from sqlalchemy import String, Boolean, SmallInteger, DateTime, ForeignKey, func, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base


class Table(Base):
    __tablename__ = "tables"
    __table_args__ = (
        UniqueConstraint("floor_id", "table_number", name="uq_table_per_floor"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    floor_id: Mapped[int] = mapped_column(ForeignKey("floors.id", ondelete="CASCADE"), nullable=False, index=True)
    table_number: Mapped[str] = mapped_column(String(20), nullable=False)
    seats: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=2)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, index=True)
    self_order_token: Mapped[str | None] = mapped_column(String(64), unique=True, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    # relationships
    floor:    Mapped["Floor"]          = relationship("Floor",    back_populates="tables")
    orders:   Mapped[list["Order"]]    = relationship("Order",    back_populates="table")
    bookings: Mapped[list["Booking"]]  = relationship("Booking",  back_populates="table")
