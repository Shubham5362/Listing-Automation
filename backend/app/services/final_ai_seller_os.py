from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.catalog import Product
from app.models.production import AutonomousWorkflowRun, SystemHealthSnapshot
from app.models.reliability import AutonomousKillSwitch, DeadLetterJob, DependencyHealth


@dataclass(frozen=True)
class SellerContext:
    seller_account_id: int
    evidence: list[dict[str, Any]]
    priorities: list[dict[str, Any]]
    confidence: float


def build_seller_context(db: Session, seller_account_id: int) -> SellerContext:
    product_count = db.scalar(select(func.count(Product.id)).where(Product.seller_account_id == seller_account_id)) or 0
    failed_jobs = db.scalar(select(func.count(DeadLetterJob.id)).where(DeadLetterJob.seller_account_id == seller_account_id)) or 0
    workflows = db.scalar(select(func.count(AutonomousWorkflowRun.id)).where(AutonomousWorkflowRun.seller_account_id == seller_account_id)) or 0
    kill_switch = db.scalar(select(AutonomousKillSwitch.enabled).where(AutonomousKillSwitch.seller_account_id == seller_account_id)) or False
    evidence = [
        {"source": "catalog", "metric": "product_count", "value": int(product_count)},
        {"source": "reliability", "metric": "dead_letter_jobs", "value": int(failed_jobs)},
        {"source": "autonomy", "metric": "workflow_runs", "value": int(workflows)},
        {"source": "autonomy", "metric": "kill_switch", "value": bool(kill_switch)},
    ]
    priorities: list[dict[str, Any]] = []
    if failed_jobs:
        priorities.append({"priority": "critical", "reason": "failed jobs require recovery", "count": int(failed_jobs)})
    if kill_switch:
        priorities.append({"priority": "critical", "reason": "autonomous execution is paused"})
    if not priorities:
        priorities.append({"priority": "info", "reason": "no reliability blocker detected"})
    return SellerContext(seller_account_id, evidence, priorities, 0.98)


def action_intent(*, risk: str, confidence: float, requires_approval: bool = False) -> dict[str, Any]:
    normalized = risk.lower()
    allowed = not requires_approval and normalized not in {"high", "critical"} and confidence >= 0.85
    return {"decision": "recommend" if allowed else "approval_required", "risk": normalized, "confidence": confidence}


def final_overview(db: Session, seller_account_id: int) -> dict[str, Any]:
    context = build_seller_context(db, seller_account_id)
    health = db.scalars(select(SystemHealthSnapshot).where(SystemHealthSnapshot.seller_account_id == seller_account_id).order_by(SystemHealthSnapshot.created_at.desc()).limit(1)).first()
    dependencies = db.scalars(select(DependencyHealth).order_by(DependencyHealth.checked_at.desc())).all()
    return {"seller_account_id": seller_account_id, "context": {"evidence": context.evidence, "priorities": context.priorities, "confidence": context.confidence}, "reliability": {"status": health.status if health else "unknown", "dependencies": [{"dependency": d.dependency, "status": d.status, "latency_ms": d.latency_ms} for d in dependencies]}}
