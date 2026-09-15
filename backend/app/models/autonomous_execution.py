from __future__ import annotations
from datetime import datetime
from sqlalchemy import Boolean, DateTime, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base

class AutonomousPlan(Base):
    __tablename__ = "autonomous_plans"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    seller_account_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    intent: Mapped[str] = mapped_column(String(120), nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="proposed", nullable=False)
    risk: Mapped[str] = mapped_column(String(20), default="medium", nullable=False)
    confidence: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    approval_required: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    summary_json: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime)

class AutonomousPlanItem(Base):
    __tablename__ = "autonomous_plan_items"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    plan_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    seller_account_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    marketplace_account_id: Mapped[int | None] = mapped_column(Integer, index=True)
    sku: Mapped[str] = mapped_column(String(200), nullable=False)
    operation: Mapped[str] = mapped_column(String(80), nullable=False)
    payload_json: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(30), default="planned", nullable=False)
    job_id: Mapped[int | None] = mapped_column(Integer, index=True)

class BusinessOpportunity(Base):
    __tablename__ = "business_opportunities"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    seller_account_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    area: Mapped[str] = mapped_column(String(60), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    priority: Mapped[str] = mapped_column(String(20), default="medium", nullable=False)
    score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    reason: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(30), default="open", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
