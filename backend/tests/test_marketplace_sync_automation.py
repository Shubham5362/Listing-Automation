from app.models.automation import AutomationRule, AutomationStatus, AutomationTriggerType
from app.models.core import MarketplaceAccount, SellerAccount
from app.services.automation import AutomationService


def test_marketplace_sync_action_is_seller_scoped(db_session, monkeypatch):
    seller = SellerAccount(name="Seller")
    other_seller = SellerAccount(name="Other")
    db_session.add_all([seller, other_seller])
    db_session.flush()
    account = MarketplaceAccount(seller_account_id=seller.id, marketplace="amazon", display_name="Amazon")
    other_account = MarketplaceAccount(seller_account_id=other_seller.id, marketplace="amazon", display_name="Other Amazon")
    db_session.add_all([account, other_account])
    db_session.flush()
    rule = AutomationRule(
        seller_account_id=seller.id,
        name="sync marketplace",
        description="scheduled sync",
        trigger_type=AutomationTriggerType.manual.value,
        trigger_config={},
        conditions=[],
        actions=[{"type": "marketplace_sync", "marketplace_account_id": account.id}],
        status=AutomationStatus.active.value,
        enabled=True,
    )
    db_session.add(rule)
    db_session.commit()

    calls = []
    monkeypatch.setattr(
        "app.services.automation.sync_marketplace_account",
        lambda db, marketplace_account: calls.append(marketplace_account.id) or {"run_id": 1, "products": 1, "inventory": 1, "orders": 1},
    )
    run = AutomationService().execute(db_session, rule, {"user_id": 7})
    assert run.status == "succeeded"
    assert calls == [account.id]

    rule.actions = [{"type": "marketplace_sync", "marketplace_account_id": other_account.id}]
    db_session.commit()
    failed = AutomationService().execute(db_session, rule, {"user_id": 7})
    assert failed.status == "failed"
    assert calls == [account.id]
