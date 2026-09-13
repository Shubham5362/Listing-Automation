from __future__ import annotations

import importlib.util
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
SPEC = importlib.util.spec_from_file_location("amazon_e2e", ROOT / "ops" / "amazon_e2e.py")
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


def test_amazon_e2e_is_disabled_by_default(monkeypatch, capsys):
    monkeypatch.delenv("AMAZON_E2E_ENABLED", raising=False)
    assert MODULE.main() == 0
    assert "SKIPPED" in capsys.readouterr().out


def test_amazon_e2e_fails_closed_when_enabled_without_credentials(monkeypatch, capsys):
    monkeypatch.setenv("AMAZON_E2E_ENABLED", "true")
    for name in MODULE.REQUIRED:
        monkeypatch.delenv(name, raising=False)
    assert MODULE.main() == 2
    output = capsys.readouterr().out
    assert "AMAZON_LWA_CLIENT_ID" in output
    assert "AMAZON_AWS_SECRET_ACCESS_KEY" in output


def test_amazon_e2e_requires_explicit_enable(monkeypatch):
    monkeypatch.setenv("AMAZON_E2E_ENABLED", "false")
    monkeypatch.setenv("AMAZON_LWA_CLIENT_ID", "should-not-be-used")
    assert MODULE.main() == 0
