from __future__ import annotations
from datetime import datetime
from sqlalchemy import Boolean, DateTime, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base

class AutonomousWorkflowRun(Base):
    __tablename__ = "autonomous_workflow_runs"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    seller_account_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    workflow_key: Mapped[str] = mapped_column(String(120), index=True, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="queued", nullable=False)
    idempotency_key: Mapped[str] = mapped_column(String(180), unique=True, nullable=False)
    attempts: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    error: Mapped[str | None] = mapped_column(Text)
    started_at: Mapped[datetime | None] = mapped_column(DateTime)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

class AutonomousSafetyPolicy(Base):
    __tablename__ = "autonomous_safety_policies"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    seller_account_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    mode: Mapped[str] = mapped_column(String(20), default="approval", nullable=False)
    max_financial_impact: Mapped[float] = mapped_column(Float, default=5000.0, nullable=False)
    max_auto_actions_per_day: Mapped[int] = mapped_column(Integer, default=50, nullable=False)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

class SystemHealthSnapshot(Base):
    __tablename__ = "system_health_snapshots"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    seller_account_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="healthy", nullable=False)
    queue_depth: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    failed_jobs: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    active_workflows: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    autonomous_success_rate: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
