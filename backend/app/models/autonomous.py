from __future__ import annotations
from datetime import datetime
from sqlalchemy import Boolean, DateTime, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base

class AutonomousIncident(Base):
    __tablename__ = "autonomous_incidents"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    seller_account_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    severity: Mapped[str] = mapped_column(String(20), default="info", nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="detected", nullable=False)
    source: Mapped[str] = mapped_column(String(80), nullable=False)
    root_cause: Mapped[str | None] = mapped_column(Text)
    impact_json: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

class AutonomousAction(Base):
    __tablename__ = "autonomous_actions"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    seller_account_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    incident_id: Mapped[int | None] = mapped_column(Integer, index=True)
    action: Mapped[str] = mapped_column(String(120), nullable=False)
    risk: Mapped[str] = mapped_column(String(20), default="low", nullable=False)
    confidence: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    approval_required: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="proposed", nullable=False)
    verification_status: Mapped[str] = mapped_column(String(30), default="pending", nullable=False)
    reason: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime)

class AutonomousAudit(Base):
    __tablename__ = "autonomous_audits"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    seller_account_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    action_id: Mapped[int | None] = mapped_column(Integer, index=True)
    event: Mapped[str] = mapped_column(String(80), nullable=False)
    details_json: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
