from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal
from typing import Any

from app.integrations.base import InventoryItem, MarketplaceAccountContext, MarketplaceClient, MarketplaceProduct, MarketplaceOrder, PriceQuote
from app.models.core import Marketplace


class InMemoryMarketplaceClient(MarketplaceClient):
    """Deterministic adapter used for local development and integration tests."""

    def __init__(self, marketplace: Marketplace) -> None:
        self.marketplace = marketplace
        self.products: dict[str, MarketplaceProduct] = {}
        self.inventory: dict[str, int] = {}
        self.prices: dict[str, Decimal] = {}
        self.orders: list[MarketplaceOrder] = []

    def test_connection(self, account: MarketplaceAccountContext) -> bool:
        return account.marketplace == self.marketplace

    def list_products(self, account: MarketplaceAccountContext, *, limit: int = 50) -> list[MarketplaceProduct]:
        return list(self.products.values())[: max(1, min(limit, 100))]

    def list_orders(self, account: MarketplaceAccountContext, *, limit: int = 50) -> list[MarketplaceOrder]:
        return self.orders[: max(1, min(limit, 100))]

    def get_inventory(self, account: MarketplaceAccountContext, *, skus: list[str] | None = None) -> list[InventoryItem]:
        selected = skus if skus is not None else list(self.inventory)
        return [InventoryItem(sku=sku, quantity=self.inventory.get(sku, 0)) for sku in selected]

    def get_prices(self, account: MarketplaceAccountContext, *, skus: list[str]) -> list[PriceQuote]:
        return [PriceQuote(sku=sku, price=self.prices[sku]) for sku in skus if sku in self.prices]

    def update_inventory(self, account: MarketplaceAccountContext, *, sku: str, quantity: int) -> None:
        if quantity < 0:
            raise ValueError("quantity must be non-negative")
        self.inventory[sku] = quantity

    def update_price(self, account: MarketplaceAccountContext, *, sku: str, price: Decimal) -> None:
        if price <= 0:
            raise ValueError("price must be greater than zero")
        self.prices[sku] = price

    def publish_listing(self, account: MarketplaceAccountContext, *, sku: str, product_type: str, attributes: dict[str, Any]) -> dict[str, Any]:
        if not sku.strip() or not product_type.strip():
            raise ValueError("sku and product_type are required")
        self.products[sku] = MarketplaceProduct(sku=sku, title=str(attributes.get("title", sku)), attributes=attributes)
        return {"status": "ACCEPTED", "sku": sku, "product_type": product_type}

    def update_listing(self, account: MarketplaceAccountContext, *, sku: str, changes: dict[str, Any]) -> dict[str, Any]:
        if not sku.strip() or not changes:
            raise ValueError("sku and at least one change are required")
        current = self.products.get(sku, MarketplaceProduct(sku=sku, title=sku, attributes={}))
        attrs = dict(current.attributes or {})
        attrs.update(changes)
        self.products[sku] = MarketplaceProduct(sku=sku, title=str(attrs.get("title", current.title)), external_id=current.external_id, attributes=attrs)
        return {"status": "ACCEPTED", "sku": sku, "changes": changes}

    def fetch_report(self, account: MarketplaceAccountContext, report_type: str) -> dict[str, Any]:
        return {"marketplace": self.marketplace.value, "report_type": report_type, "generated_at": datetime.now(timezone.utc).isoformat()}
