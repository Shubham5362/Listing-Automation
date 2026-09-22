from __future__ import annotations

from typing import Final


# Catalog metadata is deliberately separate from live adapters. A catalog entry
# means SellerHub knows the platform and its intended capability surface; it does
# not claim that an API integration is active.
MARKETPLACE_CATALOG: Final[tuple[dict[str, object], ...]] = (
    {"id": "amazon", "name": "Amazon India", "kind": "marketplace", "country": "IN", "integration_status": "connected_adapter", "connection_modes": ["oauth", "api_credentials"], "capabilities": ["orders", "inventory", "listings", "pricing", "finance", "reports", "webhooks"]},
    {"id": "flipkart", "name": "Flipkart", "kind": "marketplace", "country": "IN", "integration_status": "connected_adapter", "connection_modes": ["api_credentials"], "capabilities": ["orders", "inventory", "listings", "pricing", "finance", "reports"]},
    {"id": "meesho", "name": "Meesho", "kind": "marketplace", "country": "IN", "integration_status": "catalog_only", "connection_modes": ["partner", "api_credentials"], "capabilities": ["orders", "inventory", "listings", "pricing", "returns", "reports"]},
    {"id": "myntra", "name": "Myntra", "kind": "marketplace", "country": "IN", "integration_status": "catalog_only", "connection_modes": ["partner", "api_credentials"], "capabilities": ["orders", "inventory", "listings", "pricing", "returns", "reports"]},
    {"id": "ajio", "name": "AJIO", "kind": "marketplace", "country": "IN", "integration_status": "catalog_only", "connection_modes": ["partner", "api_credentials"], "capabilities": ["orders", "inventory", "listings", "pricing", "returns", "reports"]},
    {"id": "tatacliq", "name": "Tata CLiQ", "kind": "marketplace", "country": "IN", "integration_status": "catalog_only", "connection_modes": ["partner", "api_credentials"], "capabilities": ["orders", "inventory", "listings", "pricing", "returns", "reports"]},
    {"id": "nykaa", "name": "Nykaa", "kind": "marketplace", "country": "IN", "integration_status": "catalog_only", "connection_modes": ["partner", "api_credentials"], "capabilities": ["orders", "inventory", "listings", "pricing", "returns", "reports"]},
    {"id": "nykaa_fashion", "name": "Nykaa Fashion", "kind": "marketplace", "country": "IN", "integration_status": "catalog_only", "connection_modes": ["partner", "api_credentials"], "capabilities": ["orders", "inventory", "listings", "pricing", "returns", "reports"]},
    {"id": "jiomart", "name": "JioMart", "kind": "marketplace", "country": "IN", "integration_status": "catalog_only", "connection_modes": ["partner", "api_credentials"], "capabilities": ["orders", "inventory", "listings", "pricing", "returns", "reports"]},
    {"id": "snapdeal", "name": "Snapdeal", "kind": "marketplace", "country": "IN", "integration_status": "catalog_only", "connection_modes": ["partner", "api_credentials"], "capabilities": ["orders", "inventory", "listings", "pricing", "returns", "reports"]},
    {"id": "shopsy", "name": "Shopsy", "kind": "marketplace", "country": "IN", "integration_status": "catalog_only", "connection_modes": ["partner", "api_credentials"], "capabilities": ["orders", "inventory", "listings", "pricing", "returns", "reports"]},
    {"id": "firstcry", "name": "FirstCry", "kind": "marketplace", "country": "IN", "integration_status": "catalog_only", "connection_modes": ["partner", "api_credentials"], "capabilities": ["orders", "inventory", "listings", "pricing", "returns", "reports"]},
    {"id": "shopify", "name": "Shopify", "kind": "store", "country": "GLOBAL", "integration_status": "catalog_only", "connection_modes": ["oauth", "api_credentials"], "capabilities": ["orders", "inventory", "listings", "pricing", "reports", "webhooks"]},
    {"id": "woocommerce", "name": "WooCommerce", "kind": "store", "country": "GLOBAL", "integration_status": "catalog_only", "connection_modes": ["api_credentials"], "capabilities": ["orders", "inventory", "listings", "pricing", "reports", "webhooks"]},
    {"id": "ebay", "name": "eBay", "kind": "marketplace", "country": "GLOBAL", "integration_status": "catalog_only", "connection_modes": ["oauth", "api_credentials"], "capabilities": ["orders", "inventory", "listings", "pricing", "returns", "reports", "webhooks"]},
    {"id": "etsy", "name": "Etsy", "kind": "marketplace", "country": "GLOBAL", "integration_status": "catalog_only", "connection_modes": ["oauth", "api_credentials"], "capabilities": ["orders", "inventory", "listings", "pricing", "reports", "webhooks"]},
    {"id": "walmart", "name": "Walmart Marketplace", "kind": "marketplace", "country": "GLOBAL", "integration_status": "catalog_only", "connection_modes": ["oauth", "api_credentials"], "capabilities": ["orders", "inventory", "listings", "pricing", "returns", "reports", "webhooks"]},
    {"id": "facebook_shop", "name": "Facebook Shops", "kind": "social_commerce", "country": "GLOBAL", "integration_status": "catalog_only", "connection_modes": ["oauth"], "capabilities": ["listings", "inventory", "pricing", "orders"]},
    {"id": "instagram_shop", "name": "Instagram Shops", "kind": "social_commerce", "country": "GLOBAL", "integration_status": "catalog_only", "connection_modes": ["oauth"], "capabilities": ["listings", "inventory", "pricing", "orders"]},
    {"id": "ondc", "name": "ONDC", "kind": "open_commerce", "country": "IN", "integration_status": "catalog_only", "connection_modes": ["network_partner"], "capabilities": ["orders", "inventory", "listings", "pricing", "reports"]},
)


def list_channel_catalog() -> list[dict[str, object]]:
    return [dict(item) for item in MARKETPLACE_CATALOG]


def get_channel_catalog_item(channel_id: str) -> dict[str, object] | None:
    normalized = channel_id.strip().casefold()
    for item in MARKETPLACE_CATALOG:
        if item["id"] == normalized:
            return dict(item)
    return None
