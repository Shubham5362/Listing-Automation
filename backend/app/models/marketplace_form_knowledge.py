from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class MarketplaceFormKnowledge(Base):
    __tablename__ = "marketplace_form_knowledge"
    __table_args__ = (
        UniqueConstraint(
            "seller_account_id",
            "marketplace",
            "category",
            name="uq_marketplace_form_knowledge_seller_marketplace_category",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    seller_account_id: Mapped[int] = mapped_column(ForeignKey("seller_accounts.id"), index=True, nullable=False)
    marketplace: Mapped[str] = mapped_column(String(80), index=True, nullable=False)
    category: Mapped[str] = mapped_column(String(200), index=True, nullable=False)
    adapter_version: Mapped[str] = mapped_column(String(30), nullable=False)
    schema_version: Mapped[str] = mapped_column(String(50), nullable=False)
    schema_fingerprint: Mapped[str] = mapped_column(String(64), nullable=False)
    fields_json: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="ready", index=True, nullable=False)
    source: Mapped[str] = mapped_column(String(40), default="adapter", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
