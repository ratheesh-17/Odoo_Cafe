import enum
from datetime import datetime
from sqlalchemy import String, Boolean, Enum, DateTime, Numeric, Integer, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base
from app.models.enums import DiscountType


class PromotionAppliesTo(str, enum.Enum):
    product = "product"
    order = "order"


class Promotion(Base):
    __tablename__ = "promotions"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    applies_to: Mapped[PromotionAppliesTo] = mapped_column(Enum(PromotionAppliesTo), nullable=False, index=True)

    # product-level: fires when product reaches min_quantity in cart
    product_id: Mapped[int | None] = mapped_column(ForeignKey("products.id", ondelete="SET NULL"), nullable=True, index=True)
    min_quantity: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # order-level: fires when cart subtotal >= min_order_amount
    min_order_amount: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)

    discount_type: Mapped[DiscountType] = mapped_column(Enum(DiscountType), nullable=False)
    discount_value: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, index=True)
    starts_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    ends_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    # relationships
    product: Mapped["Product | None"] = relationship("Product", back_populates="promotions")
    orders: Mapped[list["Order"]] = relationship("Order", back_populates="promotion")
