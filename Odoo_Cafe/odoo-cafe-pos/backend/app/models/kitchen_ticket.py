import enum
from datetime import datetime
from sqlalchemy import Enum, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base


class KitchenStage(str, enum.Enum):
    to_cook = "to_cook"
    preparing = "preparing"
    completed = "completed"


class KitchenTicket(Base):
    __tablename__ = "kitchen_tickets"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), unique=True, nullable=False)
    stage: Mapped[KitchenStage] = mapped_column(Enum(KitchenStage), nullable=False, default=KitchenStage.to_cook, index=True)
    sent_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now(), index=True)
    started_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)   # moved to preparing
    done_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)      # moved to completed

    # relationships
    order: Mapped["Order"] = relationship("Order", back_populates="kitchen_ticket")
    ticket_items: Mapped[list["KitchenTicketItem"]] = relationship("KitchenTicketItem", back_populates="kitchen_ticket", cascade="all, delete-orphan")
