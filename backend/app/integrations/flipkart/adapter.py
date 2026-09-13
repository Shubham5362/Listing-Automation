from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal
from typing import Any
from urllib.parse import quote

from app.integrations.base import (
    InventoryItem,
    MarketplaceAccountContext,
    MarketplaceClient,
    MarketplaceIntegrationError,
    MarketplaceOperationUnsupported,
    MarketplaceOrder,
    MarketplaceProduct,
    PriceQuote,
)
from app.integrations.flipkart.client import FlipkartSellerApiClient
from app.models.core import Marketplace


class FlipkartSellerApiAdapter(MarketplaceClient):
    marketplace = Marketplace.FLIPKART

    def __init__(self, client: FlipkartSellerApiClient | None = None) -> None:
        self.client = client or FlipkartSellerApiClient()

    def _seller_id(self, account: MarketplaceAccountContext) -> str:
        if not account.external_account_id:
            raise MarketplaceIntegrationError("Flipkart seller ID is required")
        return account.external_account_id

    def test_connection(self, account: MarketplaceAccountContext) -> bool:
        if account.marketplace != Marketplace.FLIPKART:
            return False
        self.client.request("POST", "/listings/v3/product/search", payload={"batchNo": 0})
        return True

    def list_products(self, account: MarketplaceAccountContext, *, limit: int = 50) -> list[MarketplaceProduct]:
        target = max(1, min(limit, 100))
        products: list[MarketplaceProduct] = []
        batch = 0
        while len(products) < target:
            data = self.client.request("POST", "/listings/v3/product/search", payload={"batchNo": batch})
            rows = data.get("listingData", [])
            for item in rows:
                sku = str(item.get("sku", ""))
                if sku:
                    products.append(MarketplaceProduct(sku=sku, title=str(item.get("product_name", sku)), external_id=item.get("productId"), attributes=item))
            if not data.get("hasMore", False) or not rows:
                break
            batch += 1
        return products[:target]

    def list_orders(self, account: MarketplaceAccountContext, *, limit: int = 50) -> list[MarketplaceOrder]:
        data = self.client.request("POST", "/sellers/v3/shipments/filter", payload={"filter": {}, "pageSize": max(1, min(limit, 100))})
        rows = data.get("shipments", data.get("orderItems", []))
        result: list[MarketplaceOrder] = []
        for shipment in rows if isinstance(rows, list) else []:
            order_id = shipment.get("orderId") or shipment.get("order_id") or shipment.get("shipmentId")
            if not order_id:
                continue
            raw_date = shipment.get("orderDate") or shipment.get("order_date")
            ordered_at = datetime.fromisoformat(raw_date.replace("Z", "+00:00")) if raw_date else datetime.now(timezone.utc)
            total = shipment.get("totalPrice") or shipment.get("sellingPrice") or 0
            result.append(MarketplaceOrder(external_order_id=str(order_id), status=str(shipment.get("status", "UNKNOWN")), ordered_at=ordered_at, total=Decimal(str(total)), currency="INR", items=shipment.get("orderItems")))
        return result[:limit]

    def _listing_details(self, skus: list[str]) -> dict[str, Any]:
        if not skus:
            return {}
        data = self.client.request("POST", "/listings/v3/details", payload={"sku_ids": skus[:10]})
        return data.get("available", {}) if isinstance(data.get("available", {}), dict) else {}

    def get_inventory(self, account: MarketplaceAccountContext, *, skus: list[str] | None = None) -> list[InventoryItem]:
        selected = skus or [product.sku for product in self.list_products(account, limit=100)]
        result: list[InventoryItem] = []
        for start in range(0, len(selected), 10):
            details = self._listing_details(selected[start : start + 10])
            for sku, listing in details.items():
                attrs = listing.get("attributeValues", listing) if isinstance(listing, dict) else {}
                result.append(InventoryItem(sku=str(sku), quantity=int(attrs.get("stock_count", 0))))
        return result

    def get_prices(self, account: MarketplaceAccountContext, *, skus: list[str]) -> list[PriceQuote]:
        result: list[PriceQuote] = []
        for start in range(0, min(len(skus), 100), 10):
            details = self._listing_details(skus[start : start + 10])
            for sku, listing in details.items():
                attrs = listing.get("attributeValues", listing) if isinstance(listing, dict) else {}
                raw = attrs.get("selling_price")
                if raw is not None:
                    result.append(PriceQuote(sku=str(sku), price=Decimal(str(raw)), currency="INR"))
        return result

    def _product_id(self, sku: str) -> str:
        details = self._listing_details([sku])
        listing = details.get(sku, {})
        product_id = listing.get("productId") or listing.get("product_id")
        if not product_id:
            raise MarketplaceIntegrationError(f"Flipkart product ID not found for SKU '{sku}'")
        return str(product_id)

    def update_inventory(self, account: MarketplaceAccountContext, *, sku: str, quantity: int) -> None:
        if quantity < 0:
            raise ValueError("quantity must be non-negative")
        self.client.request("POST", "/listings/v3/update/inventory", payload={sku: {"product_id": self._product_id(sku), "locations": [{"id": "DEFAULT", "inventory": quantity}]}})

    def update_price(self, account: MarketplaceAccountContext, *, sku: str, price: Decimal) -> None:
        if price <= 0:
            raise ValueError("price must be greater than zero")
        details = self._listing_details([sku])
        listing = details.get(sku, {})
        attrs = listing.get("attributeValues", listing) if isinstance(listing, dict) else {}
        mrp = Decimal(str(attrs.get("mrp", price)))
        self.client.request("POST", "/listings/v3/update/price", payload={sku: {"product_id": self._product_id(sku), "price": {"mrp": int(mrp), "selling_price": int(price), "currency": "INR"}}})

    def publish_listing(self, account: MarketplaceAccountContext, *, sku: str, product_type: str, attributes: dict[str, Any]) -> dict[str, Any]:
        raise MarketplaceOperationUnsupported("Flipkart listing publish/update is not implemented by the current verified adapter; no marketplace write is attempted")

    def fetch_report(self, account: MarketplaceAccountContext, report_type: str) -> dict[str, Any]:
        if not report_type.strip():
            raise ValueError("report_type must not be empty")
        return self.client.request("POST", f"/reports/{quote(report_type, safe='')}", payload={})
