import enum
from datetime import datetime
from sqlalchemy import Text, Enum, DateTime, Numeric, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base


class SessionStatus(str, enum.Enum):
    open = "open"
    closed = "closed"


class PosSession(Base):
    __tablename__ = "pos_sessions"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    opened_by: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    status: Mapped[SessionStatus] = mapped_column(Enum(SessionStatus), nullable=False, default=SessionStatus.open, index=True)
    opening_cash: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0.00)
    closing_total_sales: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0.00)
    opened_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now(), index=True)
    closed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)

    # relationships
    opened_by_user: Mapped["User"] = relationship("User", back_populates="sessions")
    orders: Mapped[list["Order"]] = relationship("Order", back_populates="session")
