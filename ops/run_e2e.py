#!/usr/bin/env python3
"""Configurable production-like E2E smoke runner.

Runs safe read-only health checks by default. Marketplace workflow checks are
opt-in through E2E_* environment variables so CI never needs marketplace
credentials or customer data.
"""
from __future__ import annotations

import json
import os
import sys
from dataclasses import dataclass
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


@dataclass(frozen=True)
class Check:
    name: str
    method: str
    path: str
    expected: tuple[int, ...] = (200,)


def request(base: str, check: Check, token: str | None = None) -> tuple[int, str]:
    headers = {"Accept": "application/json", "User-Agent": "seller-hub-e2e/1.0"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = Request(base.rstrip("/") + check.path, headers=headers, method=check.method)
    try:
        with urlopen(req, timeout=15) as response:
            return response.status, response.read().decode("utf-8", "replace")
    except HTTPError as exc:
        return exc.code, exc.read().decode("utf-8", "replace")
    except URLError as exc:
        raise RuntimeError(f"{check.name}: {exc.reason}") from exc


def main() -> int:
    base = os.getenv("E2E_BASE_URL")
    if not base:
        print("E2E skipped: E2E_BASE_URL is not configured")
        return 0

    token = os.getenv("E2E_BEARER_TOKEN")
    checks = [
        Check("health", "GET", "/health"),
        Check("readiness", "GET", "/ready"),
        Check("metrics", "GET", "/metrics"),
        Check("openapi", "GET", "/openapi.json"),
    ]
    failures: list[str] = []
    for check in checks:
        status, body = request(base, check, token)
        if status not in check.expected:
            failures.append(f"{check.name}: expected {check.expected}, got {status}: {body[:200]}")
        else:
            print(f"PASS {check.name} ({status})")

    manifest_path = os.getenv("E2E_WORKFLOW_MANIFEST")
    if manifest_path:
        with open(manifest_path, encoding="utf-8") as handle:
            manifest = json.load(handle)
        for item in manifest.get("checks", []):
            check = Check(item["name"], item.get("method", "GET"), item["path"], tuple(item.get("expected", [200])))
            status, body = request(base, check, token)
            if status not in check.expected:
                failures.append(f"{check.name}: expected {check.expected}, got {status}: {body[:200]}")
            else:
                print(f"PASS {check.name} ({status})")

    if failures:
        print("E2E FAIL")
        print("\n".join(failures))
        return 1
    print("E2E PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
