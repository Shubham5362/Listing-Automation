from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class MarketplaceAdapterSnapshot(Base):
    __tablename__ = "marketplace_adapter_snapshots"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    marketplace: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    adapter_version: Mapped[str] = mapped_column(String(30), nullable=False)
    schema_version: Mapped[str] = mapped_column(String(50), nullable=False)
    category: Mapped[str] = mapped_column(String(200), nullable=False)
    schema_json: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="active", index=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
