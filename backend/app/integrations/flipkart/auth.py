from __future__ import annotations

import time
from typing import Any

import httpx

from app.core.config import Settings, get_settings
from app.integrations.base import MarketplaceAuthenticationError, MarketplaceIntegrationError


class FlipkartAccessTokenProvider:
    """Caches Flipkart self-access OAuth tokens and refreshes before expiry."""

    def __init__(self, settings: Settings | None = None, http_client: httpx.Client | None = None) -> None:
        self.settings = settings or get_settings()
        self.http = http_client or httpx.Client(timeout=self.settings.flipkart_request_timeout_seconds)
        self._access_token: str | None = None
        self._expires_at = 0.0

    def get_access_token(self) -> str:
        if self._access_token and time.time() < self._expires_at - 300:
            return self._access_token
        if not self.settings.flipkart_app_id or not self.settings.flipkart_app_secret:
            raise MarketplaceAuthenticationError("Flipkart app ID and app secret are required")
        try:
            response = self.http.get(
                f"{self.settings.flipkart_api_base_url.rstrip('/')}/oauth-service/oauth/token",
                params={"grant_type": "client_credentials", "scope": "Seller_Api,Default"},
                auth=(self.settings.flipkart_app_id, self.settings.flipkart_app_secret),
            )
        except httpx.HTTPError as exc:
            raise MarketplaceIntegrationError(f"Flipkart token request failed: {exc}") from exc
        if response.status_code in (401, 403):
            raise MarketplaceAuthenticationError("Flipkart OAuth credentials were rejected")
        if response.is_error:
            raise MarketplaceIntegrationError(f"Flipkart token endpoint returned HTTP {response.status_code}")
        data: dict[str, Any] = response.json()
        token = data.get("access_token")
        if not token:
            raise MarketplaceAuthenticationError("Flipkart token response did not contain access_token")
        self._access_token = str(token)
        self._expires_at = time.time() + max(int(data.get("expires_in", 3600)), 60)
        return self._access_token
