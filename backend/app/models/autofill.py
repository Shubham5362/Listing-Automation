from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class AutofillSession(Base):
    __tablename__ = "autofill_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    seller_account_id: Mapped[int] = mapped_column(ForeignKey("seller_accounts.id"), index=True, nullable=False)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), index=True, nullable=False)
    marketplace: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    mode: Mapped[str] = mapped_column(String(20), default="review", nullable=False)
    state: Mapped[str] = mapped_column(String(30), default="created", index=True, nullable=False)
    page_context_json: Mapped[str] = mapped_column(Text, default="{}", nullable=False)
    summary_json: Mapped[str] = mapped_column(Text, default="{}", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class AutofillAction(Base):
    __tablename__ = "autofill_actions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("autofill_sessions.id"), index=True, nullable=False)
    field_name: Mapped[str] = mapped_column(String(200), nullable=False)
    canonical: Mapped[str] = mapped_column(String(100), nullable=False)
    action: Mapped[str] = mapped_column(String(30), nullable=False)
    proposed_value: Mapped[str | None] = mapped_column(Text)
    confidence: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="planned", index=True, nullable=False)
    verification_status: Mapped[str] = mapped_column(String(30), default="not_verified", nullable=False)
    reason: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class AutofillError(Base):
    __tablename__ = "autofill_errors"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("autofill_sessions.id"), index=True, nullable=False)
    code: Mapped[str] = mapped_column(String(80), nullable=False)
    field_name: Mapped[str | None] = mapped_column(String(200))
    severity: Mapped[str] = mapped_column(String(20), default="error", nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    recoverable: Mapped[bool] = mapped_column(default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
