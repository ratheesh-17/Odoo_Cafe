import enum
from datetime import datetime
from sqlalchemy import String, Boolean, Enum, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from app.database.base import Base


class SelfOrderMode(str, enum.Enum):
    online_ordering = "online_ordering"
    qr_menu = "qr_menu"


class SelfOrderConfig(Base):
    __tablename__ = "self_order_config"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    is_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    mode: Mapped[SelfOrderMode] = mapped_column(Enum(SelfOrderMode), nullable=False, default=SelfOrderMode.online_ordering)
    background_color: Mapped[str] = mapped_column(String(7), nullable=False, default="#ffffff")
    background_image: Mapped[str | None] = mapped_column(String(500), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())
