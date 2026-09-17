from __future__ import annotations
from datetime import datetime
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models.production import SystemHealthSnapshot
from app.models.reliability import AutonomousKillSwitch, DeadLetterJob, DependencyHealth

DEPENDENCIES = ("database", "redis", "worker", "ai", "marketplaces")

def dependency_status(db: Session) -> dict:
    rows = {r.dependency: r for r in db.scalars(select(DependencyHealth)).all()}
    return {name: {"status": rows[name].status, "latency_ms": rows[name].latency_ms, "last_error": rows[name].last_error} if name in rows else {"status": "unknown", "latency_ms": 0, "last_error": "not checked"} for name in DEPENDENCIES}

def kill_switch(db: Session, seller_id: int) -> AutonomousKillSwitch:
    row = db.scalar(select(AutonomousKillSwitch).where(AutonomousKillSwitch.seller_account_id == seller_id))
    if row is None:
        row = AutonomousKillSwitch(seller_account_id=seller_id, enabled=False)
        db.add(row); db.flush()
    return row

def set_kill_switch(db: Session, seller_id: int, enabled: bool, reason: str = "") -> AutonomousKillSwitch:
    row = kill_switch(db, seller_id)
    row.enabled = enabled
    row.reason = reason[:1000]
    row.updated_at = datetime.utcnow()
    db.commit()
    return row

def system_health(db: Session, seller_id: int) -> dict:
    latest = db.scalar(select(SystemHealthSnapshot).where(SystemHealthSnapshot.seller_account_id == seller_id).order_by(SystemHealthSnapshot.created_at.desc()))
    switch = kill_switch(db, seller_id)
    dependencies = dependency_status(db)
    unknown = sum(1 for item in dependencies.values() if item["status"] == "unknown")
    failed_dlq = db.query(DeadLetterJob).filter(DeadLetterJob.seller_account_id == seller_id).count()
    status = "critical" if switch.enabled else ("warning" if unknown or failed_dlq else (latest.status if latest else "healthy"))
    return {"status": status, "autonomous_execution_paused": switch.enabled, "pause_reason": switch.reason, "dependencies": dependencies, "dead_letter_jobs": failed_dlq, "active_workflows": latest.active_workflows if latest else 0, "failed_jobs": latest.failed_jobs if latest else 0, "autonomous_success_rate": latest.autonomous_success_rate if latest else 0.0}

def safe_retry_delay(attempt: int) -> int:
    return min(300, 5 * (2 ** max(0, min(attempt - 1, 6))))
