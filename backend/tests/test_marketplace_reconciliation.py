from app.integrations.base import InventoryItem
from app.models.catalog import Product
from app.models.core import MarketplaceAccount, SellerAccount
from app.models.inventory import InventoryItem as CentralInventoryItem
from app.services.marketplace_reconciliation import reconcile_inventory


class FakeClient:
    def get_inventory(self, account, *, skus=None):
        return [InventoryItem(sku=sku, quantity={"SKU-1": 8, "SKU-2": 2}[sku]) for sku in (skus or []) if sku in {"SKU-1", "SKU-2"}]


def test_inventory_reconciliation_reports_mismatch(db_session, monkeypatch):
    seller = SellerAccount(name="Seller")
    db_session.add(seller)
    db_session.flush()
    account = MarketplaceAccount(seller_account_id=seller.id, marketplace="amazon", display_name="Amazon", external_account_id="SELLER")
    p1 = Product(seller_account_id=seller.id, sku="SKU-1", title="One")
    p2 = Product(seller_account_id=seller.id, sku="SKU-2", title="Two")
    db_session.add_all([account, p1, p2])
    db_session.flush()
    db_session.add_all([
        CentralInventoryItem(seller_account_id=seller.id, product_id=p1.id, warehouse="default", quantity=8, reserved_quantity=0),
        CentralInventoryItem(seller_account_id=seller.id, product_id=p2.id, warehouse="default", quantity=5, reserved_quantity=0),
    ])
    db_session.commit()
    monkeypatch.setattr("app.services.marketplace_reconciliation.build_marketplace_client", lambda *args, **kwargs: FakeClient())
    result = reconcile_inventory(db_session, seller_account_id=seller.id, marketplace_account_id=account.id)
    assert result["checked"] == 2
    assert result["matched"] == 1
    assert result["mismatches"] == [{"sku": "SKU-2", "product_id": p2.id, "central_available": 5, "marketplace_quantity": 2, "delta": -3}]
