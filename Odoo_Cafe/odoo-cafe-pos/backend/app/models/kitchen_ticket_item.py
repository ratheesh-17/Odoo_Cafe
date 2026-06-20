from datetime import datetime
from sqlalchemy import Boolean, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base


class KitchenTicketItem(Base):
    __tablename__ = "kitchen_ticket_items"
    __table_args__ = (
        UniqueConstraint("kitchen_ticket_id", "order_item_id", name="uq_kti_ticket_item"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    kitchen_ticket_id: Mapped[int] = mapped_column(ForeignKey("kitchen_tickets.id", ondelete="CASCADE"), nullable=False, index=True)
    order_item_id: Mapped[int] = mapped_column(ForeignKey("order_items.id", ondelete="CASCADE"), unique=True, nullable=False)
    is_done: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    done_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    # relationships
    kitchen_ticket: Mapped["KitchenTicket"] = relationship("KitchenTicket", back_populates="ticket_items")
    order_item: Mapped["OrderItem"] = relationship("OrderItem", back_populates="kitchen_ticket_item")
