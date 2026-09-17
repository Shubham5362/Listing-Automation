from __future__ import annotations
from datetime import datetime
from sqlalchemy import Boolean, DateTime, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base

class LearningEvent(Base):
    __tablename__ = "learning_events"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    seller_account_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    source: Mapped[str] = mapped_column(String(80), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(80), nullable=False)
    entity_id: Mapped[str | None] = mapped_column(String(120))
    action: Mapped[str] = mapped_column(String(80), nullable=False)
    feedback: Mapped[str] = mapped_column(String(40), nullable=False)
    confidence: Mapped[float] = mapped_column(Float, default=0.5, nullable=False)
    correction_json: Mapped[str | None] = mapped_column(Text)
    metadata_json: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

class SellerPreference(Base):
    __tablename__ = "seller_preferences"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    seller_account_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    key: Mapped[str] = mapped_column(String(120), nullable=False)
    value: Mapped[str] = mapped_column(Text, nullable=False)
    scope: Mapped[str] = mapped_column(String(80), default="seller", nullable=False)
    confidence: Mapped[float] = mapped_column(Float, default=0.5, nullable=False)
    evidence_count: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="candidate", nullable=False)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

class LearningRule(Base):
    __tablename__ = "learning_rules"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    seller_account_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    rule: Mapped[str] = mapped_column(Text, nullable=False)
    scope: Mapped[str] = mapped_column(String(80), default="seller", nullable=False)
    confidence: Mapped[float] = mapped_column(Float, default=0.5, nullable=False)
    success_rate: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    evidence_count: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="candidate", nullable=False)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

class LearningOutcome(Base):
    __tablename__ = "learning_outcomes"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    learning_event_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    seller_account_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    outcome: Mapped[str] = mapped_column(String(80), nullable=False)
    success: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    measured_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
