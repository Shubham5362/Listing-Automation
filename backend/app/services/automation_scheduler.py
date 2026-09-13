from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.automation import AutomationRule, AutomationTriggerType
from app.services.automation import AutomationService


def run_due_scheduled_automations(db: Session, seller_account_id: int, user_id: int, service: AutomationService | None = None) -> list:
    service = service or AutomationService()
    rules = db.execute(
        select(AutomationRule).where(
            AutomationRule.seller_account_id == seller_account_id,
            AutomationRule.enabled.is_(True),
            AutomationRule.trigger_type == AutomationTriggerType.schedule.value,
        )
    ).scalars().all()
    now = datetime.now(timezone.utc)
    results = []
    for rule in rules:
        if service.trigger_matches(rule, {}, now):
            results.append(service.execute(db, rule, {"trigger_type": "schedule", "user_id": user_id}))
    return results
