from __future__ import annotations

from dataclasses import dataclass
from time import monotonic
from typing import Mapping

import httpx

from app.core.config import Settings
from app.integrations.base import MarketplaceAuthenticationError, MarketplaceIntegrationError


@dataclass
class LwaToken:
    access_token: str
    expires_at: float


class AmazonLwaTokenProvider:
    def __init__(self, settings: Settings, client: httpx.Client | None = None, credentials: Mapping[str, object] | None = None) -> None:
        self.settings = settings
        self.client = client or httpx.Client(timeout=settings.amazon_request_timeout_seconds)
        self.credentials = credentials or {}
        self._token: LwaToken | None = None

    def _credential(self, name: str, setting_value: str | None) -> str | None:
        value = self.credentials.get(name)
        return str(value) if value is not None and str(value) else setting_value

    def get_access_token(self) -> str:
        client_id = self._credential("client_id", self.settings.amazon_lwa_client_id)
        client_secret = self._credential("client_secret", self.settings.amazon_lwa_client_secret)
        refresh_token = self._credential("refresh_token", self.settings.amazon_lwa_refresh_token)
        missing = [name for name, value in (("client_id", client_id), ("client_secret", client_secret), ("refresh_token", refresh_token)) if not value]
        if self._token and monotonic() < self._token.expires_at - 60:
            return self._token.access_token
        if missing:
            raise MarketplaceAuthenticationError(f"Amazon LWA configuration is incomplete: {', '.join(missing)}")
        try:
            response = self.client.post(
                self.settings.amazon_lwa_token_url,
                data={"grant_type": "refresh_token", "refresh_token": refresh_token, "client_id": client_id, "client_secret": client_secret},
            )
        except httpx.HTTPError as exc:
            raise MarketplaceIntegrationError(f"Amazon LWA token request failed: {exc}") from exc
        if response.is_error:
            raise MarketplaceAuthenticationError(f"Amazon LWA token request failed with HTTP {response.status_code}")
        payload = response.json()
        token = payload.get("access_token")
        expires_in = int(payload.get("expires_in", 3600))
        if not token:
            raise MarketplaceAuthenticationError("Amazon LWA response did not contain access_token")
        self._token = LwaToken(str(token), monotonic() + max(60, expires_in))
        return self._token.access_token
