#!/usr/bin/env python3
"""Fail-closed production launch configuration gate.

This validates configuration shape only; it never prints secret values.
"""
from __future__ import annotations

import os
import sys

REQUIRED = {
    "DATABASE_URL": "PostgreSQL connection string",
    "SELLER_HUB_SECRET_KEY": "application encryption/session secret",
}

PROVIDER_PAIRS = {
    "Amazon": ("AMAZON_CLIENT_ID", "AMAZON_CLIENT_SECRET"),
    "Flipkart": ("FLIPKART_CLIENT_ID", "FLIPKART_CLIENT_SECRET"),
}


def main() -> int:
    failures: list[str] = []
    for name, description in REQUIRED.items():
        if not os.getenv(name):
            failures.append(f"missing {name} ({description})")

    if os.getenv("ENVIRONMENT", "production").lower() == "production":
        if os.getenv("DEBUG", "false").lower() in {"1", "true", "yes", "on"}:
            failures.append("DEBUG must be disabled in production")
        if os.getenv("SELLER_HUB_SECRET_KEY", "").lower() in {"change-me", "changeme", "secret"}:
            failures.append("SELLER_HUB_SECRET_KEY uses a known placeholder")

    for provider, (client_id, client_secret) in PROVIDER_PAIRS.items():
        configured = bool(os.getenv(client_id) or os.getenv(client_secret))
        if configured and not (os.getenv(client_id) and os.getenv(client_secret)):
            failures.append(f"{provider} credentials must provide both client id and secret")

    if failures:
        print("LAUNCH GATE: BLOCKED")
        for failure in failures:
            print(f"- {failure}")
        return 1

    print("LAUNCH GATE: PASS")
    print("- required application configuration present")
    print("- production debug policy satisfied")
    print("- configured marketplace credential pairs are complete")
    print("- secret values were not printed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
