from __future__ import annotations

import httpx
import pytest

from app.core.config import Settings
from app.integrations.amazon.adapter import AmazonSpApiAdapter
from app.integrations.amazon.auth import AmazonLwaTokenProvider
from app.integrations.amazon.signing import sign_request
from app.integrations.base import MarketplaceAccountContext, MarketplaceAuthenticationError
from app.integrations.factory import build_marketplace_client
from app.models.core import Marketplace


def amazon_settings() -> Settings:
    return Settings(
        amazon_lwa_client_id="client",
        amazon_lwa_client_secret="secret",
        amazon_lwa_refresh_token="refresh",
        amazon_aws_access_key_id="access",
        amazon_aws_secret_access_key="secret-key",
    )


def test_amazon_factory_returns_live_adapter() -> None:
    assert isinstance(build_marketplace_client(Marketplace.AMAZON), AmazonSpApiAdapter)


def test_sign_request_adds_sigv4_authorization() -> None:
    headers = sign_request(
        amazon_settings(),
        method="GET",
        url="https://sellingpartnerapi-eu.amazon.com/sellers/v1/marketplaceParticipations",
        headers={"accept": "application/json"},
    )
    assert "Authorization" in headers
    assert headers["Authorization"].startswith("AWS4-HMAC-SHA256")
    assert "x-amz-date" in {key.lower() for key in headers}


def test_lwa_provider_caches_token() -> None:
    calls = 0

    def handler(request: httpx.Request) -> httpx.Response:
        nonlocal calls
        calls += 1
        return httpx.Response(200, json={"access_token": "token", "expires_in": 3600})

    client = httpx.Client(transport=httpx.MockTransport(handler))
    provider = AmazonLwaTokenProvider(amazon_settings(), client)
    assert provider.get_access_token() == "token"
    assert provider.get_access_token() == "token"
    assert calls == 1


def test_lwa_provider_rejects_missing_credentials() -> None:
    settings = Settings()
    provider = AmazonLwaTokenProvider(settings, httpx.Client(transport=httpx.MockTransport(lambda _: httpx.Response(200))))
    with pytest.raises(MarketplaceAuthenticationError):
        provider.get_access_token()


def test_amazon_connection_rejects_non_amazon_account() -> None:
    adapter = AmazonSpApiAdapter()
    account = MarketplaceAccountContext(account_id=1, marketplace=Marketplace.FLIPKART, external_account_id="seller")
    assert adapter.test_connection(account) is False
