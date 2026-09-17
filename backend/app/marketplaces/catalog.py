from __future__ import annotations

from typing import Final


# This is a channel catalog, not a claim that every channel has a live API adapter.
# `integration_status` makes the distinction explicit for the UI and prevents
# unsupported controls from being presented as operational capabilities.
MARKETPLACE_CATALOG: Final[tuple[dict[str, object], ...]] = (
    {"id": "amazon", "name": "Amazon India", "kind": "marketplace", "country": "IN", "integration_status": "connected_adapter", "capabilities": ["orders", "inventory", "listings", "pricing", "finance"]},
    {"id": "flipkart", "name": "Flipkart", "kind": "marketplace", "country": "IN", "integration_status": "connected_adapter", "capabilities": ["orders", "inventory", "listings", "pricing", "finance"]},
    {"id": "meesho", "name": "Meesho", "kind": "marketplace", "country": "IN", "integration_status": "catalog_only", "capabilities": []},
    {"id": "myntra", "name": "Myntra", "kind": "marketplace", "country": "IN", "integration_status": "catalog_only", "capabilities": []},
    {"id": "ajio", "name": "AJIO", "kind": "marketplace", "country": "IN", "integration_status": "catalog_only", "capabilities": []},
    {"id": "tatacliq", "name": "Tata CLiQ", "kind": "marketplace", "country": "IN", "integration_status": "catalog_only", "capabilities": []},
    {"id": "nykaa", "name": "Nykaa", "kind": "marketplace", "country": "IN", "integration_status": "catalog_only", "capabilities": []},
    {"id": "nykaa_fashion", "name": "Nykaa Fashion", "kind": "marketplace", "country": "IN", "integration_status": "catalog_only", "capabilities": []},
    {"id": "jiomart", "name": "JioMart", "kind": "marketplace", "country": "IN", "integration_status": "catalog_only", "capabilities": []},
    {"id": "snapdeal", "name": "Snapdeal", "kind": "marketplace", "country": "IN", "integration_status": "catalog_only", "capabilities": []},
    {"id": "shopsy", "name": "Shopsy", "kind": "marketplace", "country": "IN", "integration_status": "catalog_only", "capabilities": []},
    {"id": "firstcry", "name": "FirstCry", "kind": "marketplace", "country": "IN", "integration_status": "catalog_only", "capabilities": []},
    {"id": "shopify", "name": "Shopify", "kind": "store", "country": "GLOBAL", "integration_status": "catalog_only", "capabilities": []},
    {"id": "woocommerce", "name": "WooCommerce", "kind": "store", "country": "GLOBAL", "integration_status": "catalog_only", "capabilities": []},
    {"id": "ondc", "name": "ONDC", "kind": "open_commerce", "country": "IN", "integration_status": "catalog_only", "capabilities": []},
)


def list_channel_catalog() -> list[dict[str, object]]:
    return [dict(item) for item in MARKETPLACE_CATALOG]
