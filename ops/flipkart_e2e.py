#!/usr/bin/env python3
"""Opt-in Flipkart Seller API credential and read-only E2E smoke test.

Credentials are supplied only through the environment. Disabled mode is safe
for normal CI; enabled mode fails closed when required credentials are absent.
"""
from __future__ import annotations

import os
import sys
from dataclasses import dataclass

from app.core.config import Settings
from app.integrations.base import MarketplaceIntegrationError
from app.integrations.flipkart.client import FlipkartSellerApiClient

REQUIRED = ("FLIPKART_APP_ID", "FLIPKART_APP_SECRET")

@dataclass(frozen=True)
class Result:
    name: str
    passed: bool
    detail: str

def _enabled() -> bool:
    return os.getenv("FLIPKART_E2E_ENABLED", "false").strip().lower() in {"1", "true", "yes"}

def _missing() -> list[str]:
    return [name for name in REQUIRED if not os.getenv(name)]

def _settings() -> Settings:
    return Settings(
        flipkart_api_base_url=os.getenv("FLIPKART_API_BASE_URL", "https://api.flipkart.net"),
        flipkart_app_id=os.environ["FLIPKART_APP_ID"],
        flipkart_app_secret=os.environ["FLIPKART_APP_SECRET"],
        flipkart_request_timeout_seconds=float(os.getenv("FLIPKART_E2E_TIMEOUT_SECONDS", "30")),
        flipkart_max_retries=int(os.getenv("FLIPKART_E2E_MAX_RETRIES", "1")),
    )

def main() -> int:
    if not _enabled():
        print("Flipkart E2E SKIPPED: set FLIPKART_E2E_ENABLED=true to run the live/sandbox smoke test")
        return 0
    missing = _missing()
    if missing:
        print("Flipkart E2E FAIL: missing required environment variables:")
        print("\n".join(f"- {name}" for name in missing))
        return 2
    settings = _settings()
    results = [Result("configuration", True, f"endpoint={settings.flipkart_api_base_url}")]
    client = FlipkartSellerApiClient(settings=settings)
    try:
        # Authentication-only/read-only smoke call. Endpoint is configurable because
        # Seller API availability varies by account and environment.
        path = os.getenv("FLIPKART_E2E_SMOKE_PATH", "/sellers/v3/orders/search")
        payload = client.request("GET", path)
        if not isinstance(payload, dict):
            raise MarketplaceIntegrationError("Flipkart response was not a JSON object")
        results.append(Result("seller API smoke request", True, "authenticated read-only Seller API request succeeded"))
    except Exception as exc:  # noqa: BLE001 - deterministic CLI exit handling
        results.append(Result("seller API smoke request", False, f"{type(exc).__name__}: {exc}"))
    for result in results:
        print(f"{'PASS' if result.passed else 'FAIL'} {result.name}: {result.detail}")
    return 0 if all(result.passed for result in results) else 1

if __name__ == "__main__":
    sys.exit(main())
