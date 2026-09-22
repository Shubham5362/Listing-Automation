from __future__ import annotations

from dataclasses import dataclass
from typing import Final

from app.integrations.factory import build_marketplace_client
from app.models.core import Marketplace


@dataclass(frozen=True)
class MarketplaceDefinition:
    key: str
    name: str
    category: str
    connection_modes: tuple[str, ...]
    capabilities: tuple[str, ...]
    live_adapter: bool


COMMON_READ: Final[tuple[str, ...]] = (
    "products",
    "listings",
    "inventory",
    "orders",
    "returns",
    "pricing",
    "reports",
)

COMMON_WRITE: Final[tuple[str, ...]] = (
    "listing_create",
    "listing_update",
    "inventory_push",
    "price_push",
)


MARKETPLACE_DEFINITIONS: Final[tuple[MarketplaceDefinition, ...]] = (
    MarketplaceDefinition("amazon", "Amazon", "marketplace", ("oauth", "api_credentials"), COMMON_READ + COMMON_WRITE, True),
    MarketplaceDefinition("flipkart", "Flipkart", "marketplace", ("api_credentials",), COMMON_READ + COMMON_WRITE, True),
    MarketplaceDefinition("meesho", "Meesho", "marketplace", ("api_credentials", "partner"), COMMON_READ + COMMON_WRITE, False),
    MarketplaceDefinition("myntra", "Myntra", "marketplace", ("partner", "api_credentials"), COMMON_READ + COMMON_WRITE, False),
    MarketplaceDefinition("ajio", "AJIO", "marketplace", ("partner", "api_credentials"), COMMON_READ + COMMON_WRITE, False),
    MarketplaceDefinition("tatacliq", "Tata CLiQ", "marketplace", ("partner", "api_credentials"), COMMON_READ + COMMON_WRITE, False),
    MarketplaceDefinition("nykaa", "Nykaa", "marketplace", ("partner", "api_credentials"), COMMON_READ + COMMON_WRITE, False),
    MarketplaceDefinition("snapdeal", "Snapdeal", "marketplace", ("api_credentials", "partner"), COMMON_READ + COMMON_WRITE, False),
    MarketplaceDefinition("jiomart", "JioMart", "marketplace", ("api_credentials", "partner"), COMMON_READ + COMMON_WRITE, False),
    MarketplaceDefinition("shopify", "Shopify", "commerce", ("oauth", "api_credentials"), COMMON_READ + COMMON_WRITE, False),
    MarketplaceDefinition("woocommerce", "WooCommerce", "commerce", ("api_credentials",), COMMON_READ + COMMON_WRITE, False),
    MarketplaceDefinition("ebay", "eBay", "marketplace", ("oauth", "api_credentials"), COMMON_READ + COMMON_WRITE, False),
    MarketplaceDefinition("etsy", "Etsy", "marketplace", ("oauth", "api_credentials"), COMMON_READ + COMMON_WRITE, False),
    MarketplaceDefinition("walmart", "Walmart Marketplace", "marketplace", ("oauth", "api_credentials"), COMMON_READ + COMMON_WRITE, False),
    MarketplaceDefinition("facebook_shop", "Facebook Shops", "social_commerce", ("oauth",), COMMON_READ + COMMON_WRITE, False),
    MarketplaceDefinition("instagram_shop", "Instagram Shops", "social_commerce", ("oauth",), COMMON_READ + COMMON_WRITE, False),
)


def list_marketplaces() -> tuple[MarketplaceDefinition, ...]:
    return MARKETPLACE_DEFINITIONS


def get_marketplace_definition(key: str) -> MarketplaceDefinition | None:
    normalized = key.strip().lower()
    return next((item for item in MARKETPLACE_DEFINITIONS if item.key == normalized), None)


def live_adapter_marketplaces() -> set[str]:
    result: set[str] = set()
    for marketplace in Marketplace:
        try:
            build_marketplace_client(marketplace, use_mock=False, credentials=None)
        except Exception:
            continue
        result.add(marketplace.value)
    return result
