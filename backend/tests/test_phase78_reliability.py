import pytest
from app.models.production import AutonomousSafetyPolicy
from app.models.reliability import AutonomousKillSwitch
from app.services.production_autonomy import should_auto_execute
from app.services.reliability import safe_retry_delay, set_kill_switch


def test_kill_switch_blocks_auto_execution(db_session):
    policy = AutonomousSafetyPolicy(seller_account_id=1, enabled=True, mode="auto", max_financial_impact=5000, max_auto_actions_per_day=50)
    db_session.add(policy)
    db_session.add(AutonomousKillSwitch(seller_account_id=1, enabled=True, reason="incident"))
    db_session.commit()
    assert not should_auto_execute(mode="auto", risk="low", confidence=.99, financial_impact=1, policy=policy, daily_actions=0, execution_paused=True)


def test_kill_switch_update_is_scoped(db_session):
    row = set_kill_switch(db_session, 1, True, "maintenance")
    assert row.enabled is True
    assert row.seller_account_id == 1


def test_retry_backoff_is_bounded():
    assert [safe_retry_delay(i) for i in range(1, 4)] == [5, 10, 20]
    assert safe_retry_delay(99) == 300
