from app.models.production import AutonomousSafetyPolicy
from app.services.production_autonomy import should_auto_execute, start_workflow, complete_workflow


def test_high_risk_never_auto_executes(db_session):
    policy = AutonomousSafetyPolicy(seller_account_id=1, mode="auto")
    db_session.add(policy); db_session.flush()
    assert not should_auto_execute(mode="auto", risk="high", confidence=.99, financial_impact=1, policy=policy, daily_actions=0)


def test_low_confidence_requires_approval(db_session):
    policy = AutonomousSafetyPolicy(seller_account_id=1, mode="auto")
    db_session.add(policy); db_session.flush()
    assert not should_auto_execute(mode="auto", risk="low", confidence=.84, financial_impact=1, policy=policy, daily_actions=0)


def test_idempotency_prevents_duplicate_workflow(db_session):
    first = start_workflow(db_session, 1, "inventory_reconcile", "same-key")
    second = start_workflow(db_session, 1, "inventory_reconcile", "same-key")
    assert first.id == second.id


def test_workflow_completion_records_failure(db_session):
    run = start_workflow(db_session, 1, "listing_sync", "failure-key")
    complete_workflow(db_session, run, success=False, error="marketplace timeout")
    assert run.status == "failed"
    assert run.error == "marketplace timeout"
