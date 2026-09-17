from __future__ import annotations

from collections.abc import Mapping

from app.integrations.amazon.adapter import AmazonSpApiAdapter
from app.integrations.amazon.client import AmazonSpApiClient
from app.integrations.base import MarketplaceClient, MarketplaceIntegrationError
from app.integrations.flipkart.adapter import FlipkartSellerApiAdapter
from app.integrations.flipkart.client import FlipkartSellerApiClient
from app.integrations.mock import InMemoryMarketplaceClient
from app.models.core import Marketplace


def build_marketplace_client(
    marketplace: Marketplace,
    *,
    use_mock: bool = False,
    credentials: Mapping[str, object] | None = None,
) -> MarketplaceClient:
    """Return a provider client, optionally scoped to one stored marketplace account."""
    if use_mock:
        return InMemoryMarketplaceClient(marketplace)
    if marketplace == Marketplace.AMAZON:
        return AmazonSpApiAdapter(AmazonSpApiClient(credentials=credentials))
    if marketplace == Marketplace.FLIPKART:
        return FlipkartSellerApiAdapter(FlipkartSellerApiClient(credentials=credentials))
    raise MarketplaceIntegrationError(f"Marketplace '{marketplace.value}' has no live adapter yet")
