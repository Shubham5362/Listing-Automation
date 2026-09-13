from __future__ import annotations

from app.integrations.base import MarketplaceClient, MarketplaceIntegrationError
from app.integrations.mock import InMemoryMarketplaceClient
from app.integrations.amazon.adapter import AmazonSpApiAdapter
from app.models.core import Marketplace


def build_marketplace_client(marketplace: Marketplace, *, use_mock: bool = False) -> MarketplaceClient:
    """Return a provider client without leaking provider-specific construction to callers."""
    if use_mock:
        return InMemoryMarketplaceClient(marketplace)
    if marketplace == Marketplace.AMAZON:
        return AmazonSpApiAdapter()
    raise MarketplaceIntegrationError(f"Marketplace '{marketplace.value}' has no live adapter yet")
