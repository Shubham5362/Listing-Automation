from __future__ import annotations

from app.integrations.base import MarketplaceClient, MarketplaceIntegrationError
from app.models.core import Marketplace


class MarketplaceRegistry:
    """Central registry that decouples API/services from provider implementations."""

    def __init__(self) -> None:
        self._clients: dict[Marketplace, MarketplaceClient] = {}

    def register(self, client: MarketplaceClient) -> None:
        self._clients[client.marketplace] = client

    def get(self, marketplace: Marketplace) -> MarketplaceClient:
        try:
            return self._clients[marketplace]
        except KeyError as exc:
            raise MarketplaceIntegrationError(
                f"No integration registered for marketplace '{marketplace.value}'"
            ) from exc

    def supported_marketplaces(self) -> tuple[Marketplace, ...]:
        return tuple(self._clients)


registry = MarketplaceRegistry()
