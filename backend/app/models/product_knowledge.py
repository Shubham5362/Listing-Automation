from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class ProductKnowledge(Base):
    """Canonical, auditable product facts used by future marketplace adapters."""
    __tablename__ = "product_knowledge"
    __table_args__ = (UniqueConstraint("seller_account_id", "product_id", name="uq_product_knowledge_seller_product"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    seller_account_id: Mapped[int] = mapped_column(ForeignKey("seller_accounts.id"), index=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), index=True)
    schema_version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    facts_json: Mapped[str] = mapped_column(Text, default="{}", nullable=False)
    attribute_aliases_json: Mapped[str] = mapped_column(Text, default="{}", nullable=False)
    completeness_score: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    conflict_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="draft", nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class ProductKnowledgeVersion(Base):
    """Immutable snapshots so AI never loses the previous product truth."""
    __tablename__ = "product_knowledge_versions"
    __table_args__ = (UniqueConstraint("product_knowledge_id", "version", name="uq_product_knowledge_version"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    product_knowledge_id: Mapped[int] = mapped_column(ForeignKey("product_knowledge.id"), index=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), index=True)
    version: Mapped[int] = mapped_column(Integer, nullable=False)
    facts_json: Mapped[str] = mapped_column(Text, nullable=False)
    reason: Mapped[str | None] = mapped_column(Text)
    source: Mapped[str] = mapped_column(String(50), default="system", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
