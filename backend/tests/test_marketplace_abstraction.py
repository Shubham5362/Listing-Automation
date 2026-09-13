from decimal import Decimal

import pytest

from app.integrations.base import MarketplaceAccountContext, MarketplaceIntegrationError
from app.integrations.factory import build_marketplace_client
from app.integrations.mock import InMemoryMarketplaceClient
from app.integrations.registry import MarketplaceRegistry
from app.models.core import Marketplace


def test_mock_client_supports_common_operations() -> None:
    client = InMemoryMarketplaceClient(Marketplace.AMAZON)
    account = MarketplaceAccountContext(1, Marketplace.AMAZON, "acct-1")

    client.update_inventory(account, sku="SKU-1", quantity=7)
    client.update_price(account, sku="SKU-1", price=Decimal("499.00"))

    assert client.get_inventory(account)[0].quantity == 7
    assert client.get_prices(account, skus=["SKU-1"])[0].price == Decimal("499.00")
    assert client.test_connection(account) is True


def test_mock_client_rejects_invalid_values() -> None:
    client = InMemoryMarketplaceClient(Marketplace.FLIPKART)
    account = MarketplaceAccountContext(1, Marketplace.FLIPKART)

    with pytest.raises(ValueError):
        client.update_inventory(account, sku="SKU-1", quantity=-1)
    with pytest.raises(ValueError):
        client.update_price(account, sku="SKU-1", price=Decimal("0"))


def test_registry_returns_registered_client() -> None:
    registry = MarketplaceRegistry()
    client = InMemoryMarketplaceClient(Marketplace.AMAZON)
    registry.register(client)

    assert registry.get(Marketplace.AMAZON) is client
    assert registry.supported_marketplaces() == (Marketplace.AMAZON,)


def test_registry_rejects_unregistered_marketplace() -> None:
    registry = MarketplaceRegistry()
    with pytest.raises(MarketplaceIntegrationError):
        registry.get(Marketplace.FLIPKART)


def test_factory_requires_live_adapter_when_mock_disabled() -> None:
    with pytest.raises(MarketplaceIntegrationError):
        build_marketplace_client(Marketplace.AMAZON)
