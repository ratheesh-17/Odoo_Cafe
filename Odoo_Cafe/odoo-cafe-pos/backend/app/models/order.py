import enum
from datetime import datetime
from sqlalchemy import String, Text, Enum, DateTime, Numeric, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base


class OrderStatus(str, enum.Enum):
    draft = "draft"
    sent_to_kitchen = "sent_to_kitchen"
    paid = "paid"
    cancelled = "cancelled"


class OrderSource(str, enum.Enum):
    pos = "pos"
    self_order = "self_order"


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    order_number: Mapped[str] = mapped_column(String(30), unique=True, nullable=False)

    session_id: Mapped[int] = mapped_column(ForeignKey("pos_sessions.id", ondelete="RESTRICT"), nullable=False, index=True)
    table_id: Mapped[int | None] = mapped_column(ForeignKey("tables.id", ondelete="SET NULL"), nullable=True, index=True)
    customer_id: Mapped[int | None] = mapped_column(ForeignKey("customers.id", ondelete="SET NULL"), nullable=True, index=True)
    employee_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)

    status: Mapped[OrderStatus] = mapped_column(Enum(OrderStatus), nullable=False, default=OrderStatus.draft, index=True)
    order_source: Mapped[OrderSource] = mapped_column(Enum(OrderSource), nullable=False, default=OrderSource.pos, index=True)

    # financial snapshots — stored so reports never need to recalculate historical data
    subtotal: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0.00)
    tax_amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0.00)
    discount_amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0.00)
    total_amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0.00)

    # discount traceability for reports
    coupon_id: Mapped[int | None] = mapped_column(ForeignKey("coupons.id", ondelete="SET NULL"), nullable=True)
    promotion_id: Mapped[int | None] = mapped_column(ForeignKey("promotions.id", ondelete="SET NULL"), nullable=True)

    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now(), index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    # relationships
    session: Mapped["PosSession"] = relationship("PosSession", back_populates="orders")
    table: Mapped["Table | None"] = relationship("Table", back_populates="orders")
    customer: Mapped["Customer | None"] = relationship("Customer", back_populates="orders")
    employee: Mapped["User"] = relationship("User", back_populates="orders")
    coupon: Mapped["Coupon | None"] = relationship("Coupon", back_populates="orders")
    promotion: Mapped["Promotion | None"] = relationship("Promotion", back_populates="orders")
    items: Mapped[list["OrderItem"]] = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    payment: Mapped["Payment | None"] = relationship("Payment", back_populates="order", uselist=False)
    kitchen_ticket: Mapped["KitchenTicket | None"] = relationship("KitchenTicket", back_populates="order", uselist=False)
    receipts: Mapped[list["Receipt"]] = relationship("Receipt", back_populates="order", cascade="all, delete-orphan")
