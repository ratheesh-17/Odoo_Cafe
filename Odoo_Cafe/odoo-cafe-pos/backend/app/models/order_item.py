from datetime import datetime
from sqlalchemy import String, Integer, DateTime, Numeric, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id", ondelete="RESTRICT"), nullable=False, index=True)

    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    # price snapshot at time of order — product price changes must not affect past orders
    unit_price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    tax_percent: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False, default=0.00)

    # line_discount = product-level promotion applied to this specific item line
    line_discount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0.00)

    # line_total = (unit_price * quantity) - line_discount
    line_total: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)

    note: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())

    # relationships
    order: Mapped["Order"] = relationship("Order", back_populates="items")
    product: Mapped["Product"] = relationship("Product", back_populates="order_items")
    kitchen_ticket_item: Mapped["KitchenTicketItem | None"] = relationship("KitchenTicketItem", back_populates="order_item", uselist=False)
