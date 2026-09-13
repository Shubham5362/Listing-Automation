from __future__ import annotations

import json
import time
from collections.abc import Mapping
from typing import Any

import httpx

from app.core.config import Settings, get_settings
from app.integrations.base import MarketplaceAuthenticationError, MarketplaceIntegrationError, MarketplaceRateLimitError
from app.integrations.flipkart.auth import FlipkartAccessTokenProvider


class FlipkartSellerApiClient:
    """Authenticated Flipkart Seller API v3 client with bounded retries."""

    def __init__(
        self,
        settings: Settings | None = None,
        *,
        http_client: httpx.Client | None = None,
        token_provider: FlipkartAccessTokenProvider | None = None,
    ) -> None:
        self.settings = settings or get_settings()
        self.http = http_client or httpx.Client(timeout=self.settings.flipkart_request_timeout_seconds)
        self.tokens = token_provider or FlipkartAccessTokenProvider(self.settings, self.http)

    def request(
        self,
        method: str,
        path: str,
        *,
        query: Mapping[str, Any] | None = None,
        payload: Mapping[str, Any] | list[Any] | None = None,
    ) -> dict[str, Any]:
        body = json.dumps(payload, separators=(",", ":"), default=str) if payload is not None else None
        url = f"{self.settings.flipkart_api_base_url.rstrip('/')}/{path.lstrip('/')}"
        last_error: Exception | None = None
        for attempt in range(self.settings.flipkart_max_retries + 1):
            try:
                token = self.tokens.get_access_token()
                headers = {"accept": "application/json", "content-type": "application/json", "Authorization": f"Bearer {token}"}
                response = self.http.request(method, url, params=query, content=body, headers=headers)
                if response.status_code in (401, 403):
                    raise MarketplaceAuthenticationError(
                        f"Flipkart Seller API authentication/authorization failed with HTTP {response.status_code}"
                    )
                if response.status_code == 429 or 500 <= response.status_code < 600:
                    if attempt >= self.settings.flipkart_max_retries:
                        if response.status_code == 429:
                            raise MarketplaceRateLimitError("Flipkart Seller API rate limit exceeded")
                        raise MarketplaceIntegrationError(f"Flipkart Seller API returned HTTP {response.status_code}")
                    time.sleep(min(2**attempt, 8))
                    continue
                if response.is_error:
                    raise MarketplaceIntegrationError(
                        f"Flipkart Seller API returned HTTP {response.status_code}: {response.text[:500]}"
                    )
                if not response.content:
                    return {}
                data = response.json()
                return data if isinstance(data, dict) else {"payload": data}
            except (httpx.TimeoutException, httpx.NetworkError) as exc:
                last_error = exc
                if attempt >= self.settings.flipkart_max_retries:
                    break
                time.sleep(min(2**attempt, 8))
        raise MarketplaceIntegrationError(f"Flipkart Seller API request failed after retries: {last_error}")
