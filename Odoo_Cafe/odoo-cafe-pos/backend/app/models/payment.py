from datetime import datetime
from sqlalchemy import String, DateTime, Numeric, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id", ondelete="RESTRICT"), unique=True, nullable=False)
    payment_method_id: Mapped[int] = mapped_column(ForeignKey("payment_methods.id", ondelete="RESTRICT"), nullable=False, index=True)

    amount_paid: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    change_due: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0.00)  # cash only
    transaction_ref: Mapped[str | None] = mapped_column(String(100), nullable=True)          # card only

    paid_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now(), index=True)

    # relationships
    order: Mapped["Order"] = relationship("Order", back_populates="payment")
    payment_method: Mapped["PaymentMethod"] = relationship("PaymentMethod", back_populates="payments")
