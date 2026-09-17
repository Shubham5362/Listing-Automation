from datetime import datetime, timezone
import json

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.automation import AutomationRule, AutomationTriggerType
from app.models.core import Job, SellerAccount
from app.services.automation import AutomationService
from app.services.jobs import enqueue_job


def _rule_job_pending(db: Session, rule_id: int, seller_account_id: int) -> bool:
    jobs = db.scalars(
        select(Job).where(
            Job.name == "automation_run",
            Job.seller_account_id == seller_account_id,
            Job.status.in_(["queued", "running"]),
        )
    ).all()
    for job in jobs:
        try:
            if int(json.loads(job.payload or "{}").get("automation_rule_id")) == rule_id:
                return True
        except (TypeError, ValueError, json.JSONDecodeError):
            continue
    return False


def enqueue_due_scheduled_automations(db: Session) -> int:
    """Queue due schedules; execution is performed by the background worker."""
    service = AutomationService()
    rules = db.scalars(
        select(AutomationRule).where(
            AutomationRule.enabled.is_(True),
            AutomationRule.trigger_type == AutomationTriggerType.schedule.value,
        )
    ).all()
    now = datetime.now(timezone.utc)
    queued = 0
    for rule in rules:
        if not service.trigger_matches(rule, {}, now) or _rule_job_pending(db, rule.id, rule.seller_account_id):
            continue
        seller = db.get(SellerAccount, rule.seller_account_id)
        if not seller or not seller.user_id:
            continue
        enqueue_job(
            db,
            "automation_run",
            {"automation_rule_id": rule.id, "user_id": seller.user_id, "context": {"trigger_type": "schedule"}},
            seller_account_id=rule.seller_account_id,
        )
        queued += 1
    return queued


def run_due_scheduled_automations(db: Session, seller_account_id: int, user_id: int, service: AutomationService | None = None) -> list:
    """Backward-compatible scheduler entry point that now queues instead of blocking on marketplace APIs."""
    service = service or AutomationService()
    rules = db.scalars(
        select(AutomationRule).where(
            AutomationRule.seller_account_id == seller_account_id,
            AutomationRule.enabled.is_(True),
            AutomationRule.trigger_type == AutomationTriggerType.schedule.value,
        )
    ).all()
    now = datetime.now(timezone.utc)
    jobs = []
    for rule in rules:
        if service.trigger_matches(rule, {}, now) and not _rule_job_pending(db, rule.id, seller_account_id):
            jobs.append(
                enqueue_job(
                    db,
                    "automation_run",
                    {"automation_rule_id": rule.id, "user_id": user_id, "context": {"trigger_type": "schedule"}},
                    seller_account_id=seller_account_id,
                )
            )
    return jobs
