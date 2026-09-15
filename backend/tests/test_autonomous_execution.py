from app.models.autonomous_execution import AutonomousPlan, AutonomousPlanItem
from app.services.autonomous_execution import AutonomousExecutionService


def test_low_confidence_plan_requires_approval(db_session):
    plan = AutonomousExecutionService(db_session, 1).create_plan(
        "sync inventory", [{"sku": "SKU-1", "operation": "inventory_push", "payload": {"quantity": 4}}], confidence=0.80, risk="low"
    )
    assert plan.approval_required is True
    assert plan.status == "pending_approval"


def test_high_confidence_low_risk_plan_can_be_auto_approved(db_session):
    plan = AutonomousExecutionService(db_session, 1).create_plan(
        "sync inventory", [{"sku": "SKU-1", "operation": "inventory_push", "payload": {"quantity": 4}}], confidence=0.95, risk="low"
    )
    assert plan.approval_required is False
    assert plan.status == "approved"


def test_marketplace_account_isolation(db_session):
    try:
        AutonomousExecutionService(db_session, 1).create_plan(
            "price sync", [{"sku": "SKU-1", "marketplace_account_id": 999, "operation": "price_push", "payload": {"price": 12.5}}], confidence=0.95, risk="low"
        )
    except ValueError as exc:
        assert "not owned" in str(exc)
    else:
        raise AssertionError("foreign marketplace account must be rejected")


def test_plan_items_are_seller_scoped(db_session):
    plan = AutonomousExecutionService(db_session, 7).create_plan(
        "sync", [{"sku": "SKU-7", "operation": "inventory_push", "payload": {"quantity": 1}}], confidence=0.9, risk="medium"
    )
    db_session.flush()
    item = db_session.query(AutonomousPlanItem).filter_by(plan_id=plan.id).one()
    assert item.seller_account_id == 7
    assert db_session.query(AutonomousPlan).filter_by(seller_account_id=8).count() == 0
