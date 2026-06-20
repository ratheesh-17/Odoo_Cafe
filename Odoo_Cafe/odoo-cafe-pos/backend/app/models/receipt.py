import enum
from datetime import datetime
from sqlalchemy import String, Enum, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base


class DeliveryMethod(str, enum.Enum):
    email = "email"
    print = "print"


class ReceiptStatus(str, enum.Enum):
    sent = "sent"
    failed = "failed"


class Receipt(Base):
    __tablename__ = "receipts"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    delivery: Mapped[DeliveryMethod] = mapped_column(Enum(DeliveryMethod), nullable=False)
    sent_to: Mapped[str | None] = mapped_column(String(150), nullable=True)   # email address, null for print
    status: Mapped[ReceiptStatus] = mapped_column(Enum(ReceiptStatus), nullable=False, default=ReceiptStatus.sent)
    sent_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())

    # relationships
    order: Mapped["Order"] = relationship("Order", back_populates="receipts")
