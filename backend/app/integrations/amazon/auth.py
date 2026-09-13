from __future__ import annotations

from dataclasses import dataclass
from time import monotonic

import httpx

from app.core.config import Settings
from app.integrations.base import MarketplaceAuthenticationError, MarketplaceIntegrationError


@dataclass
class LwaToken:
    access_token: str
    expires_at: float


class AmazonLwaTokenProvider:
    def __init__(self, settings: Settings, client: httpx.Client | None = None) -> None:
        self.settings = settings
        self.client = client or httpx.Client(timeout=settings.amazon_request_timeout_seconds)
        self._token: LwaToken | None = None

    def get_access_token(self) -> str:
        if self._token and monotonic() < self._token.expires_at - 60:
            return self._token.access_token
        missing = [
            name
            for name, value in (
                ("amazon_lwa_client_id", self.settings.amazon_lwa_client_id),
                ("amazon_lwa_client_secret", self.settings.amazon_lwa_client_secret),
                ("amazon_lwa_refresh_token", self.settings.amazon_lwa_refresh_token),
            )
            if not value
        ]
        if missing:
            raise MarketplaceAuthenticationError(
                f"Amazon LWA configuration is incomplete: {', '.join(missing)}"
            )
        response = self.client.post(
            self.settings.amazon_lwa_token_url,
            data={
                "grant_type": "refresh_token",
                "refresh_token": self.settings.amazon_lwa_refresh_token,
                "client_id": self.settings.amazon_lwa_client_id,
                "client_secret": self.settings.amazon_lwa_client_secret,
            },
        )
        if response.is_error:
            raise MarketplaceAuthenticationError(
                f"Amazon LWA token request failed with HTTP {response.status_code}"
            )
        payload = response.json()
        token = payload.get("access_token")
        expires_in = int(payload.get("expires_in", 3600))
        if not token:
            raise MarketplaceAuthenticationError("Amazon LWA response did not contain access_token")
        self._token = LwaToken(token, monotonic() + max(60, expires_in))
        return token
