from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal
from typing import Any
from urllib.parse import quote

from app.integrations.amazon.client import AmazonSpApiClient
from app.integrations.base import (
    InventoryItem,
    MarketplaceAccountContext,
    MarketplaceClient,
    MarketplaceIntegrationError,
    MarketplaceOrder,
    MarketplaceProduct,
    PriceQuote,
)
from app.models.core import Marketplace


class AmazonSpApiAdapter(MarketplaceClient):
    marketplace = Marketplace.AMAZON

    def __init__(self, client: AmazonSpApiClient | None = None) -> None:
        self.client = client or AmazonSpApiClient()

    def _seller_id(self, account: MarketplaceAccountContext) -> str:
        if not account.external_account_id:
            raise MarketplaceIntegrationError("Amazon seller account ID is required")
        return account.external_account_id

    def test_connection(self, account: MarketplaceAccountContext) -> bool:
        if account.marketplace != Marketplace.AMAZON:
            return False
        self.client.request("GET", "/sellers/v1/marketplaceParticipations")
        return True

    def list_products(self, account: MarketplaceAccountContext, *, limit: int = 50) -> list[MarketplaceProduct]:
        seller_id = quote(self._seller_id(account), safe="")
        target = max(1, min(limit, 1000))
        products: list[MarketplaceProduct] = []
        page_token: str | None = None
        while len(products) < target:
            query: dict[str, Any] = {
                "marketplaceIds": self.client.settings.amazon_sp_api_marketplace_id,
                "includedData": "summaries,attributes,issues,offers,fulfillmentAvailability",
                "pageSize": min(100, target - len(products)),
            }
            if page_token:
                query["pageToken"] = page_token
            data = self.client.request("GET", f"/listings/2021-08-01/items/{seller_id}", query=query)
            payload = data.get("payload", data)
            items = payload.get("items", []) if isinstance(payload, dict) else []
            for item in items:
                summaries = item.get("summaries") or []
                summary = summaries[0] if isinstance(summaries, list) and summaries else {}
                sku = str(item.get("sku", ""))
                if sku:
                    products.append(MarketplaceProduct(sku=sku, title=str(summary.get("itemName", sku)), external_id=item.get("asin") or summary.get("asin"), attributes=item))
            page_token = payload.get("pagination", {}).get("nextToken") if isinstance(payload, dict) else None
            if not page_token or not items:
                break
        return products[:target]

    def _order_items(self, order_id: str) -> list[dict[str, Any]]:
        data = self.client.request("GET", f"/orders/v0/orders/{quote(order_id, safe='')}/orderItems")
        payload = data.get("payload", data)
        rows = payload.get("OrderItems", []) if isinstance(payload, dict) else []
        result: list[dict[str, Any]] = []
        for item in rows:
            price = item.get("ItemPrice") or {}
            result.append({
                "sku": item.get("SellerSKU") or item.get("ASIN"),
                "title": item.get("Title"),
                "quantity": item.get("QuantityOrdered", 1),
                "unit_price": price.get("Amount", 0),
            })
        return result

    def list_orders(self, account: MarketplaceAccountContext, *, limit: int = 50) -> list[MarketplaceOrder]:
        target = max(1, min(limit, 100))
        result: list[MarketplaceOrder] = []
        next_token: str | None = None
        while len(result) < target:
            query: dict[str, Any] = {
                "MarketplaceIds": self.client.settings.amazon_sp_api_marketplace_id,
                "MaxResultsPerPage": min(100, target - len(result)),
            }
            if next_token:
                query = {"NextToken": next_token}
            data = self.client.request("GET", "/orders/v0/orders", query=query)
            payload = data.get("payload", data)
            orders = payload.get("Orders", []) if isinstance(payload, dict) else []
            for order in orders:
                raw_date = order.get("PurchaseDate") or order.get("LastUpdateDate")
                ordered_at = datetime.fromisoformat(raw_date.replace("Z", "+00:00")) if raw_date else datetime.now(timezone.utc)
                total = order.get("OrderTotal") or {}
                external_id = str(order.get("AmazonOrderId", ""))
                if external_id:
                    result.append(MarketplaceOrder(external_order_id=external_id, status=str(order.get("OrderStatus", "UNKNOWN")), ordered_at=ordered_at, total=Decimal(str(total.get("Amount", "0"))), currency=str(total.get("CurrencyCode", "INR")), items=self._order_items(external_id)))
            next_token = payload.get("NextToken") if isinstance(payload, dict) else None
            if not next_token or not orders:
                break
        return result[:target]

    def get_inventory(self, account: MarketplaceAccountContext, *, skus: list[str] | None = None) -> list[InventoryItem]:
        products = self.list_products(account, limit=100)
        if skus is not None:
            selected = set(skus)
            products = [product for product in products if product.sku in selected]
        result: list[InventoryItem] = []
        for product in products:
            data = self.client.request("GET", f"/listings/2021-08-01/items/{quote(self._seller_id(account), safe='')}/{quote(product.sku, safe='')}", query={"marketplaceIds": self.client.settings.amazon_sp_api_marketplace_id, "includedData": "fulfillmentAvailability"})
            payload = data.get("payload", data)
            availability = payload.get("fulfillmentAvailability", []) if isinstance(payload, dict) else []
            result.append(InventoryItem(sku=product.sku, quantity=sum(int(entry.get("quantity", 0)) for entry in availability if entry.get("quantity") is not None)))
        return result

    def get_prices(self, account: MarketplaceAccountContext, *, skus: list[str]) -> list[PriceQuote]:
        result: list[PriceQuote] = []
        for sku in skus[:100]:
            data = self.client.request("GET", f"/listings/2021-08-01/items/{quote(self._seller_id(account), safe='')}/{quote(sku, safe='')}", query={"marketplaceIds": self.client.settings.amazon_sp_api_marketplace_id, "includedData": "offers"})
            payload = data.get("payload", data)
            offers = payload.get("offers", []) if isinstance(payload, dict) else []
            if offers:
                price = offers[0].get("price", {})
                amount = price.get("amount") if isinstance(price, dict) else None
                if amount is not None:
                    result.append(PriceQuote(sku=sku, price=Decimal(str(amount)), currency=str(price.get("currencyCode", "INR"))))
        return result

    def update_inventory(self, account: MarketplaceAccountContext, *, sku: str, quantity: int) -> None:
        if quantity < 0:
            raise ValueError("quantity must be non-negative")
        self._patch_listing(account, sku, {"op": "replace", "path": "/attributes/fulfillment_availability", "value": [{"fulfillment_channel_code": "DEFAULT", "quantity": quantity}]})

    def update_price(self, account: MarketplaceAccountContext, *, sku: str, price: Decimal) -> None:
        if price <= 0:
            raise ValueError("price must be greater than zero")
        self._patch_listing(account, sku, {"op": "replace", "path": "/attributes/purchasable_offer", "value": [{"audience": "ALL", "marketplace_id": self.client.settings.amazon_sp_api_marketplace_id, "currency": "INR", "our_price": [{"schedule": [{"value_with_tax": str(price)}]}] }]})

    def publish_listing(self, account: MarketplaceAccountContext, *, sku: str, product_type: str, attributes: dict[str, Any]) -> dict[str, Any]:
        if not sku.strip() or not product_type.strip():
            raise ValueError("sku and product_type are required")
        return self.client.request("PUT", f"/listings/2021-08-01/items/{quote(self._seller_id(account), safe='')}/{quote(sku, safe='')}", query={"marketplaceIds": self.client.settings.amazon_sp_api_marketplace_id, "requirements": "LISTING"}, payload={"productType": product_type, "requirements": "LISTING", "attributes": attributes})

    def update_listing(self, account: MarketplaceAccountContext, *, sku: str, changes: dict[str, Any]) -> dict[str, Any]:
        if not sku.strip() or not changes:
            raise ValueError("sku and at least one change are required")
        patches = []
        marketplace_id = self.client.settings.amazon_sp_api_marketplace_id
        for field, value in changes.items():
            if field == "title":
                patches.append({"op": "replace", "path": "/attributes/item_name", "value": [{"value": str(value), "marketplace_id": marketplace_id, "language_tag": "en_IN"}]})
            elif field == "description":
                patches.append({"op": "replace", "path": "/attributes/product_description", "value": [{"value": str(value), "marketplace_id": marketplace_id, "language_tag": "en_IN"}]})
            elif field == "bullets":
                if not isinstance(value, list) or not all(isinstance(item, str) and item.strip() for item in value):
                    raise ValueError("bullets must be a non-empty list of strings")
                patches.append({"op": "replace", "path": "/attributes/bullet_point", "value": [{"value": item, "marketplace_id": marketplace_id, "language_tag": "en_IN"} for item in value]})
            elif field == "images":
                if not isinstance(value, list) or not all(isinstance(item, str) and item.strip() for item in value):
                    raise ValueError("images must be a list of non-empty URLs")
                patches.append({"op": "replace", "path": "/attributes/main_product_image_locator", "value": [{"media_location": item, "marketplace_id": marketplace_id} for item in value]})
            elif field.startswith("attribute:"):
                attribute_name = field.split(":", 1)[1].strip()
                if not attribute_name:
                    raise ValueError("attribute name is required")
                patches.append({"op": "replace", "path": f"/attributes/{attribute_name}", "value": value if isinstance(value, list) else [value]})
            else:
                raise ValueError(f"Unsupported listing field: {field}")
        return self.client.request("PATCH", f"/listings/2021-08-01/items/{quote(self._seller_id(account), safe='')}/{quote(sku, safe='')}", query={"marketplaceIds": marketplace_id}, payload={"productType": "PRODUCT", "patches": patches})

    def _patch_listing(self, account: MarketplaceAccountContext, sku: str, patch: dict[str, Any]) -> None:
        self.client.request("PATCH", f"/listings/2021-08-01/items/{quote(self._seller_id(account), safe='')}/{quote(sku, safe='')}", query={"marketplaceIds": self.client.settings.amazon_sp_api_marketplace_id}, payload={"productType": "PRODUCT", "patches": [patch]})

    def fetch_report(self, account: MarketplaceAccountContext, report_type: str) -> dict[str, Any]:
        if not report_type.strip():
            raise ValueError("report_type must not be empty")
        return self.client.request("POST", "/reports/2021-06-30/reports", payload={"reportType": report_type, "marketplaceIds": [self.client.settings.amazon_sp_api_marketplace_id]})
