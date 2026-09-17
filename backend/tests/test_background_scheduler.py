from datetime import datetime, timedelta
import json

from app.models.automation import AutomationRule, AutomationStatus, AutomationTriggerType
from app.models.core import Job, SellerAccount
from app.services.automation_scheduler import enqueue_due_scheduled_automations


def test_due_schedule_is_queued_once(db_session):
    seller = SellerAccount(name="Seller", user_id=101)
    db_session.add(seller)
    db_session.flush()
    rule = AutomationRule(
        seller_account_id=seller.id,
        name="nightly sync",
        description="sync marketplace",
        trigger_type=AutomationTriggerType.schedule.value,
        trigger_config={"interval_minutes": 60},
        conditions=[],
        actions=[{"type": "marketplace_sync", "marketplace_account_id": 99}],
        status=AutomationStatus.active.value,
        enabled=True,
        last_run_at=datetime.utcnow() - timedelta(hours=2),
    )
    db_session.add(rule)
    db_session.commit()

    assert enqueue_due_scheduled_automations(db_session) == 1
    assert enqueue_due_scheduled_automations(db_session) == 0
    jobs = db_session.query(Job).filter_by(seller_account_id=seller.id, name="automation_run").all()
    assert len(jobs) == 1
    assert json.loads(jobs[0].payload)["automation_rule_id"] == rule.id
