from datetime import datetime
from enum import Enum

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class AutomationTriggerType(str, Enum):
    schedule = "schedule"
    event = "event"
    manual = "manual"
    ai = "ai"


class AutomationStatus(str, Enum):
    active = "active"
    paused = "paused"
    failed = "failed"


class AutomationRunStatus(str, Enum):
    running = "running"
    succeeded = "succeeded"
    failed = "failed"
    skipped = "skipped"


class AutomationRule(Base):
    __tablename__ = "automation_rules"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    seller_account_id: Mapped[int] = mapped_column(ForeignKey("seller_accounts.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    trigger_type: Mapped[AutomationTriggerType] = mapped_column(String(32), nullable=False)
    trigger_config: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    conditions: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    actions: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    status: Mapped[AutomationStatus] = mapped_column(String(32), nullable=False, default=AutomationStatus.active)
    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    last_run_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)


class AutomationRun(Base):
    __tablename__ = "automation_runs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    automation_rule_id: Mapped[int] = mapped_column(ForeignKey("automation_rules.id"), nullable=False, index=True)
    seller_account_id: Mapped[int] = mapped_column(ForeignKey("seller_accounts.id"), nullable=False, index=True)
    status: Mapped[AutomationRunStatus] = mapped_column(String(32), nullable=False, default=AutomationRunStatus.running)
    trigger_context: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    result: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
