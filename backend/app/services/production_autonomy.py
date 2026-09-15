from __future__ import annotations
from datetime import datetime
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from app.models.autonomous import AutonomousAction
from app.models.production import AutonomousSafetyPolicy, AutonomousWorkflowRun, SystemHealthSnapshot

ALLOWED_MODES = {"observe", "recommend", "approval", "auto", "strict"}
HIGH_RISK = {"high", "critical"}


def policy_for(db: Session, seller_id: int) -> AutonomousSafetyPolicy:
    policy = db.scalar(select(AutonomousSafetyPolicy).where(AutonomousSafetyPolicy.seller_account_id == seller_id))
    if policy:
        return policy
    policy = AutonomousSafetyPolicy(seller_account_id=seller_id)
    db.add(policy)
    db.flush()
    return policy


def should_auto_execute(*, mode: str, risk: str, confidence: float, financial_impact: float, policy: AutonomousSafetyPolicy, daily_actions: int) -> bool:
    if mode not in ALLOWED_MODES or not policy.enabled or mode != "auto":
        return False
    if risk in HIGH_RISK or confidence < 0.85:
        return False
    if financial_impact > policy.max_financial_impact:
        return False
    return daily_actions < policy.max_auto_actions_per_day


def start_workflow(db: Session, seller_id: int, workflow_key: str, idempotency_key: str) -> AutonomousWorkflowRun:
    existing = db.scalar(select(AutonomousWorkflowRun).where(AutonomousWorkflowRun.idempotency_key == idempotency_key))
    if existing:
        if existing.seller_account_id != seller_id:
            raise ValueError("idempotency key belongs to another seller")
        return existing
    run = AutonomousWorkflowRun(seller_account_id=seller_id, workflow_key=workflow_key, idempotency_key=idempotency_key, status="running", attempts=1, started_at=datetime.utcnow())
    db.add(run)
    db.flush()
    return run


def complete_workflow(db: Session, run: AutonomousWorkflowRun, *, success: bool, error: str | None = None) -> AutonomousWorkflowRun:
    run.status = "completed" if success else "failed"
    run.error = error
    run.completed_at = datetime.utcnow()
    db.flush()
    return run


def health(db: Session, seller_id: int) -> dict:
    actions = db.scalars(select(AutonomousAction).where(AutonomousAction.seller_account_id == seller_id)).all()
    completed = [a for a in actions if a.status == "completed"]
    failed = [a for a in actions if a.status == "failed"]
    success_rate = (len(completed) / (len(completed) + len(failed))) if completed or failed else 0.0
    active = db.scalar(select(func.count()).select_from(AutonomousWorkflowRun).where(AutonomousWorkflowRun.seller_account_id == seller_id, AutonomousWorkflowRun.status == "running")) or 0
    failed_jobs = db.scalar(select(func.count()).select_from(AutonomousWorkflowRun).where(AutonomousWorkflowRun.seller_account_id == seller_id, AutonomousWorkflowRun.status == "failed")) or 0
    status = "critical" if failed_jobs >= 5 else "warning" if failed_jobs else "healthy"
    snapshot = SystemHealthSnapshot(seller_account_id=seller_id, status=status, active_workflows=active, failed_jobs=failed_jobs, autonomous_success_rate=success_rate)
    db.add(snapshot)
    db.flush()
    return {"status": status, "active_workflows": active, "failed_jobs": failed_jobs, "autonomous_success_rate": round(success_rate, 4)}
