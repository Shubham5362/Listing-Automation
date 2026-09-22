from decimal import Decimal

from app.integrations.base import InventoryItem, PriceQuote
from app.models.core import Job, MarketplaceAccount, SellerAccount
from app.services.marketplace_operations import execute_marketplace_operation
from app.worker import BackgroundWorker


class FakeClient:
    def __init__(self):
        self.calls = []
        self.inventory = {"SKU-1": 8}
        self.prices = {"SKU-1": Decimal("299.00")}

    def update_inventory(self, account, *, sku, quantity):
        self.calls.append(("inventory", account.account_id, sku, quantity))
        self.inventory[sku] = quantity

    def update_price(self, account, *, sku, price):
        self.calls.append(("price", account.account_id, sku, price))
        self.prices[sku] = price

    def get_inventory(self, account, *, skus=None):
        return [InventoryItem(sku=sku, quantity=self.inventory[sku]) for sku in (skus or list(self.inventory)) if sku in self.inventory]

    def get_prices(self, account, *, skus):
        return [PriceQuote(sku=sku, price=self.prices[sku], currency="INR") for sku in skus if sku in self.prices]


def test_marketplace_operation_executes_and_preserves_seller_isolation(db_session, monkeypatch):
    seller = SellerAccount(name="Seller")
    other = SellerAccount(name="Other")
    db_session.add_all([seller, other])
    db_session.flush()
    account = MarketplaceAccount(seller_account_id=seller.id, marketplace="amazon", display_name="Amazon", external_account_id="SELLER")
    other_account = MarketplaceAccount(seller_account_id=other.id, marketplace="amazon", display_name="Other", external_account_id="OTHER")
    db_session.add_all([account, other_account])
    db_session.commit()

    fake = FakeClient()
    monkeypatch.setattr("app.services.marketplace_operations._client", lambda _: fake)
    result = execute_marketplace_operation(db_session, seller_account_id=seller.id, marketplace_account_id=account.id, operation="inventory_push", payload={"sku": "SKU-1", "quantity": 8})
    assert result["quantity"] == 8
    assert result["verification"]["verified"] is True
    assert fake.calls == [("inventory", account.id, "SKU-1", 8)]

    try:
        execute_marketplace_operation(db_session, seller_account_id=seller.id, marketplace_account_id=other_account.id, operation="inventory_push", payload={"sku": "SKU-2", "quantity": 1})
        assert False, "cross-seller operation should fail"
    except ValueError as exc:
        assert str(exc) == "Marketplace account not found for seller"


def test_marketplace_operation_worker_completes_job(db_session, monkeypatch):
    seller = SellerAccount(name="Seller")
    db_session.add(seller)
    db_session.flush()
    account = MarketplaceAccount(seller_account_id=seller.id, marketplace="amazon", display_name="Amazon", external_account_id="SELLER")
    db_session.add(account)
    db_session.commit()
    fake = FakeClient()
    monkeypatch.setattr("app.services.marketplace_operations._client", lambda _: fake)
    job = Job(name="marketplace_operation", seller_account_id=seller.id, status="running", payload='{"marketplace_account_id": %d, "operation": "price_push", "payload": {"sku": "SKU-1", "price": "299.00"}}' % account.id, attempts=1, max_attempts=3)
    db_session.add(job)
    db_session.commit()
    result = BackgroundWorker(worker_id="test-worker").execute_job(db_session, job)
    assert result["price"] == "299.00"
    assert result["verification"]["verified"] is True
    assert fake.calls[0][0:3] == ("price", account.id, "SKU-1")
    assert fake.calls[0][3] == Decimal("299.00")


def test_marketplace_operation_rejects_catalog_only_account(db_session):
    seller = SellerAccount(name="Seller")
    db_session.add(seller)
    db_session.flush()
    account = MarketplaceAccount(seller_account_id=seller.id, marketplace="meesho", display_name="Meesho", external_account_id="SELLER")
    db_session.add(account)
    db_session.commit()
    try:
        execute_marketplace_operation(db_session, seller_account_id=seller.id, marketplace_account_id=account.id, operation="inventory_push", payload={"sku": "SKU-1", "quantity": 1})
        assert False, "catalog-only marketplace should not execute live operations"
    except ValueError as exc:
        assert str(exc) == "No live adapter is registered for this marketplace"
