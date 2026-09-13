from __future__ import annotations

import json
import time
from collections.abc import Mapping
from typing import Any
from urllib.parse import urlencode

import httpx

from app.core.config import Settings, get_settings
from app.integrations.base import MarketplaceAuthenticationError, MarketplaceIntegrationError, MarketplaceRateLimitError
from app.integrations.amazon.auth import AmazonLwaTokenProvider
from app.integrations.amazon.signing import sign_request


class AmazonSpApiClient:
    """Low-level authenticated Amazon SP-API HTTP client with bounded retries."""

    def __init__(
        self,
        settings: Settings | None = None,
        *,
        http_client: httpx.Client | None = None,
        token_provider: AmazonLwaTokenProvider | None = None,
    ) -> None:
        self.settings = settings or get_settings()
        self.http = http_client or httpx.Client(timeout=self.settings.amazon_request_timeout_seconds)
        self.tokens = token_provider or AmazonLwaTokenProvider(self.settings, self.http)

    def request(
        self,
        method: str,
        path: str,
        *,
        query: Mapping[str, Any] | None = None,
        payload: Mapping[str, Any] | list[Any] | None = None,
    ) -> dict[str, Any]:
        body = json.dumps(payload, separators=(",", ":"), default=str).encode() if payload is not None else b""
        query_string = urlencode(query or {}, doseq=True)
        url = f"{self.settings.amazon_sp_api_base_url.rstrip('/')}/{path.lstrip('/')}"
        if query_string:
            url = f"{url}?{query_string}"
        last_error: Exception | None = None
        for attempt in range(self.settings.amazon_max_retries + 1):
            try:
                access_token = self.tokens.get_access_token()
                headers = {
                    "accept": "application/json",
                    "content-type": "application/json",
                    "x-amz-access-token": access_token,
                }
                signed = sign_request(self.settings, method=method, url=url, headers=headers, body=body)
                response = self.http.request(method, url, headers=signed, content=body)
                if response.status_code == 429 or 500 <= response.status_code < 600:
                    if attempt >= self.settings.amazon_max_retries:
                        if response.status_code == 429:
                            raise MarketplaceRateLimitError("Amazon SP-API rate limit exceeded")
                        raise MarketplaceIntegrationError(f"Amazon SP-API returned HTTP {response.status_code}")
                    time.sleep(min(2**attempt, 8))
                    continue
                if response.status_code in (401, 403):
                    raise MarketplaceAuthenticationError(
                        f"Amazon SP-API authentication/authorization failed with HTTP {response.status_code}"
                    )
                if response.is_error:
                    detail = response.text[:500]
                    raise MarketplaceIntegrationError(
                        f"Amazon SP-API returned HTTP {response.status_code}: {detail}"
                    )
                if not response.content:
                    return {}
                data = response.json()
                return data if isinstance(data, dict) else {"payload": data}
            except (httpx.TimeoutException, httpx.NetworkError) as exc:
                last_error = exc
                if attempt >= self.settings.amazon_max_retries:
                    break
                time.sleep(min(2**attempt, 8))
        raise MarketplaceIntegrationError(f"Amazon SP-API request failed after retries: {last_error}")
