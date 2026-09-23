from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class AutofillClarification(Base):
    __tablename__ = "autofill_clarifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("autofill_sessions.id"), index=True, nullable=False)
    action_id: Mapped[int | None] = mapped_column(ForeignKey("autofill_actions.id"), index=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), index=True, nullable=False)
    marketplace: Mapped[str] = mapped_column(String(50), nullable=False)
    category: Mapped[str | None] = mapped_column(String(200))
    reason_code: Mapped[str] = mapped_column(String(40), nullable=False)
    field_label: Mapped[str] = mapped_column(String(200), nullable=False)
    marketplace_field: Mapped[str] = mapped_column(String(200), nullable=False)
    canonical: Mapped[str | None] = mapped_column(String(100))
    prompt: Mapped[str] = mapped_column(Text, nullable=False)
    context_json: Mapped[str] = mapped_column(Text, default="{}", nullable=False)
    expected_input_type: Mapped[str] = mapped_column(String(40), default="string", nullable=False)
    unit: Mapped[str | None] = mapped_column(String(40))
    options_json: Mapped[str] = mapped_column(Text, default="[]", nullable=False)
    required: Mapped[bool] = mapped_column(default=False, nullable=False)
    confidence_before: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    answer: Mapped[str | None] = mapped_column(Text)
    normalized_answer: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(20), default="pending", index=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    answered_at: Mapped[datetime | None] = mapped_column(DateTime)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
