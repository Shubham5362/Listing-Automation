#!/usr/bin/env python3
"""Opt-in Amazon SP-API credential and read-only E2E smoke test.

No credentials are stored in the repository. By default this command performs
only local configuration validation and exits successfully when disabled.
Set AMAZON_E2E_ENABLED=true to make a real SP-API request.
"""
from __future__ import annotations

import os
import sys
from dataclasses import dataclass

import httpx

from app.core.config import Settings
from app.integrations.amazon.client import AmazonSpApiClient
from app.integrations.base import MarketplaceIntegrationError


REQUIRED = (
    "AMAZON_LWA_CLIENT_ID",
    "AMAZON_LWA_CLIENT_SECRET",
    "AMAZON_LWA_REFRESH_TOKEN",
    "AMAZON_AWS_ACCESS_KEY_ID",
    "AMAZON_AWS_SECRET_ACCESS_KEY",
)


@dataclass(frozen=True)
class Result:
    name: str
    passed: bool
    detail: str


def _enabled() -> bool:
    return os.getenv("AMAZON_E2E_ENABLED", "false").strip().lower() in {"1", "true", "yes"}


def _missing() -> list[str]:
    return [name for name in REQUIRED if not os.getenv(name)]


def _settings() -> Settings:
    return Settings(
        amazon_sp_api_base_url=os.getenv("AMAZON_SP_API_BASE_URL", "https://sellingpartnerapi-eu.amazon.com"),
        amazon_sp_api_region=os.getenv("AMAZON_SP_API_REGION", "eu-west-1"),
        amazon_sp_api_marketplace_id=os.getenv("AMAZON_SP_API_MARKETPLACE_ID", "A21TJRUUN4KGV"),
        amazon_lwa_token_url=os.getenv("AMAZON_LWA_TOKEN_URL", "https://api.amazon.com/auth/o2/token"),
        amazon_lwa_client_id=os.environ["AMAZON_LWA_CLIENT_ID"],
        amazon_lwa_client_secret=os.environ["AMAZON_LWA_CLIENT_SECRET"],
        amazon_lwa_refresh_token=os.environ["AMAZON_LWA_REFRESH_TOKEN"],
        amazon_aws_access_key_id=os.environ["AMAZON_AWS_ACCESS_KEY_ID"],
        amazon_aws_secret_access_key=os.environ["AMAZON_AWS_SECRET_ACCESS_KEY"],
        amazon_aws_session_token=os.getenv("AMAZON_AWS_SESSION_TOKEN"),
        amazon_request_timeout_seconds=float(os.getenv("AMAZON_E2E_TIMEOUT_SECONDS", "30")),
        amazon_max_retries=int(os.getenv("AMAZON_E2E_MAX_RETRIES", "1")),
    )


def main() -> int:
    if not _enabled():
        print("Amazon E2E SKIPPED: set AMAZON_E2E_ENABLED=true to run the live/sandbox smoke test")
        return 0

    missing = _missing()
    if missing:
        print("Amazon E2E FAIL: missing required environment variables:")
        print("\n".join(f"- {name}" for name in missing))
        return 2

    settings = _settings()
    results: list[Result] = []
    results.append(Result("configuration", True, f"endpoint={settings.amazon_sp_api_base_url}; region={settings.amazon_sp_api_region}; marketplace={settings.amazon_sp_api_marketplace_id}"))

    client = AmazonSpApiClient(settings=settings)
    try:
        payload = client.request("GET", "/sellers/v1/marketplaceParticipations")
        if not isinstance(payload, dict):
            raise MarketplaceIntegrationError("Amazon response was not a JSON object")
        results.append(Result("marketplace participations", True, "authenticated read-only SP-API request succeeded"))
    except Exception as exc:  # noqa: BLE001 - CLI must convert provider failures to a deterministic exit code.
        results.append(Result("marketplace participations", False, f"{type(exc).__name__}: {exc}"))

    for result in results:
        print(f"{'PASS' if result.passed else 'FAIL'} {result.name}: {result.detail}")

    return 0 if all(result.passed for result in results) else 1


if __name__ == "__main__":
    sys.exit(main())
