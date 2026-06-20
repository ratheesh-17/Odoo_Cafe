import enum
from datetime import datetime
from sqlalchemy import String, Text, Boolean, Enum, DateTime, Numeric, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base


class UnitOfMeasure(str, enum.Enum):
    piece = "piece"
    kg = "kg"
    litre = "litre"
    plate = "plate"
    cup = "cup"
    glass = "glass"
    serving = "serving"


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id", ondelete="RESTRICT"), nullable=False, index=True)
    price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    unit_of_measure: Mapped[UnitOfMeasure] = mapped_column(Enum(UnitOfMeasure), nullable=False, default=UnitOfMeasure.piece)
    tax_percent: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False, default=0.00)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    show_in_kds: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    # relationships
    category: Mapped["Category"] = relationship("Category", back_populates="products")
    order_items: Mapped[list["OrderItem"]] = relationship("OrderItem", back_populates="product")
    promotions: Mapped[list["Promotion"]] = relationship("Promotion", back_populates="product")
