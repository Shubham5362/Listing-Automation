from datetime import datetime, timezone
from decimal import Decimal

from app.integrations.base import InventoryItem, MarketplaceOrder, MarketplaceProduct, PriceQuote
from app.models.catalog import Listing, Product
from app.models.core import MarketplaceAccount, SellerAccount
from app.models.inventory import InventoryItem as CentralInventoryItem
from app.models.orders import Order
from app.services.marketplace_sync import sync_marketplace_account


class FakeClient:
    def test_connection(self, account):
        return True

    def list_products(self, account, *, limit=100):
        return [MarketplaceProduct(sku="SKU-1", title="Synced product", external_id="EXT-1", attributes={"brand": "Demo"})]

    def get_inventory(self, account, *, skus=None):
        return [InventoryItem(sku="SKU-1", quantity=7, reserved_quantity=2, fulfillment_center="FC-1")]

    def list_orders(self, account, *, limit=100):
        return [MarketplaceOrder(external_order_id="ORD-1", status="confirmed", ordered_at=datetime.now(timezone.utc).replace(tzinfo=None), total=Decimal("499.00"), items=[{"sku": "SKU-1", "quantity": 1, "unit_price": "499"}])]


def test_sync_is_idempotent_and_updates_central_records(db_session, monkeypatch):
    seller = SellerAccount(name="Seller")
    db_session.add(seller)
    db_session.flush()
    account = MarketplaceAccount(seller_account_id=seller.id, marketplace="amazon", display_name="Amazon", credentials_ref=None)
    db_session.add(account)
    db_session.commit()
    monkeypatch.setattr("app.services.marketplace_sync._client_context", lambda a: (FakeClient(), object()))

    first = sync_marketplace_account(db_session, account)
    second = sync_marketplace_account(db_session, account)
    assert first["products"] == second["products"] == 1
    assert db_session.query(Product).filter_by(seller_account_id=seller.id, sku="SKU-1").count() == 1
    assert db_session.query(Listing).filter_by(marketplace_account_id=account.id, sku="SKU-1").count() == 1
    assert db_session.query(CentralInventoryItem).filter_by(seller_account_id=seller.id).count() == 1
    assert db_session.query(Order).filter_by(marketplace_account_id=account.id, external_order_id="ORD-1").count() == 1
    assert account.is_connected is True
