from __future__ import annotations

import json
from decimal import Decimal

import httpx
import pytest

from app.core.config import Settings
from app.integrations.base import MarketplaceAccountContext, MarketplaceIntegrationError
from app.integrations.flipkart.adapter import FlipkartSellerApiAdapter
from app.integrations.flipkart.auth import FlipkartAccessTokenProvider
from app.integrations.flipkart.client import FlipkartSellerApiClient
from app.models.core import Marketplace


def test_flipkart_token_provider_caches_access_token() -> None:
    calls = 0

    def handler(request: httpx.Request) -> httpx.Response:
        nonlocal calls
        calls += 1
        assert request.url.path.endswith("/oauth-service/oauth/token")
        assert request.headers["authorization"].startswith("Basic ")
        return httpx.Response(200, json={"access_token": "token-1", "expires_in": 3600})

    settings = Settings(flipkart_app_id="app", flipkart_app_secret="secret")
    http = httpx.Client(transport=httpx.MockTransport(handler))
    provider = FlipkartAccessTokenProvider(settings, http)

    assert provider.get_access_token() == "token-1"
    assert provider.get_access_token() == "token-1"
    assert calls == 1


def test_flipkart_client_sends_bearer_token_and_returns_json() -> None:
    seen: dict[str, str] = {}

    class TokenProvider:
        def get_access_token(self) -> str:
            return "token-xyz"

    def handler(request: httpx.Request) -> httpx.Response:
        seen["authorization"] = request.headers["authorization"]
        return httpx.Response(200, json={"listingData": []})

    settings = Settings(flipkart_max_retries=0)
    http = httpx.Client(transport=httpx.MockTransport(handler))
    client = FlipkartSellerApiClient(settings, http_client=http, token_provider=TokenProvider())

    assert client.request("POST", "/listings/v3/product/search", payload={"batchNo": 0}) == {"listingData": []}
    assert seen["authorization"] == "Bearer token-xyz"


def test_flipkart_adapter_reads_and_updates_listing_data() -> None:
    calls: list[tuple[str, str, dict]] = []

    class TokenProvider:
        def get_access_token(self) -> str:
            return "token"

    def handler(request: httpx.Request) -> httpx.Response:
        payload = json.loads(request.content.decode("utf-8")) if request.content else {}
        calls.append((request.method, request.url.path, payload))
        if request.url.path.endswith("/listings/v3/details"):
            return httpx.Response(
                200,
                json={
                    "available": {
                        "SKU-1": {
                            "productId": "FSN12345678901",
                            "attributeValues": {"stock_count": "7", "selling_price": "499", "mrp": "599"},
                        }
                    }
                },
            )
        return httpx.Response(200, json={"SKU-1": {"status": "success"}})

    settings = Settings(flipkart_max_retries=0)
    http = httpx.Client(transport=httpx.MockTransport(handler))
    adapter = FlipkartSellerApiAdapter(
        FlipkartSellerApiClient(settings, http_client=http, token_provider=TokenProvider())
    )
    account = MarketplaceAccountContext(1, Marketplace.FLIPKART, "SELLER-1")

    inventory = adapter.get_inventory(account, skus=["SKU-1"])
    prices = adapter.get_prices(account, skus=["SKU-1"])
    adapter.update_inventory(account, sku="SKU-1", quantity=12)
    adapter.update_price(account, sku="SKU-1", price=Decimal("549"))

    assert inventory[0].quantity == 7
    assert prices[0].price == Decimal("499")
    update_inventory = calls[-2][2]["SKU-1"]
    assert update_inventory["product_id"] == "FSN12345678901"
    assert update_inventory["inventory"][0]["quantity"] == 12
    assert calls[-1][2]["SKU-1"]["price"]["selling_price"] == 549


def test_flipkart_adapter_validates_updates() -> None:
    adapter = FlipkartSellerApiAdapter.__new__(FlipkartSellerApiAdapter)
    with pytest.raises(ValueError):
        adapter.update_inventory(MarketplaceAccountContext(1, Marketplace.FLIPKART), sku="SKU", quantity=-1)
    with pytest.raises(ValueError):
        adapter.update_price(MarketplaceAccountContext(1, Marketplace.FLIPKART), sku="SKU", price=Decimal("0"))


def test_flipkart_factory_is_live_adapter() -> None:
    from app.integrations.factory import build_marketplace_client

    client = build_marketplace_client(Marketplace.FLIPKART)
    assert isinstance(client, FlipkartSellerApiAdapter)
