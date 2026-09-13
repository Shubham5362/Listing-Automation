from __future__ import annotations

import importlib.util
from pathlib import Path


MODULE = Path(__file__).parents[1] / "ops" / "launch_gate.py"
SPEC = importlib.util.spec_from_file_location("launch_gate", MODULE)
launch_gate = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(launch_gate)


def _set_required(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "postgresql://example")
    monkeypatch.setenv("SELLER_HUB_SECRET_KEY", "a-real-random-value")
    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.setenv("DEBUG", "false")


def test_launch_gate_passes_minimum_configuration(monkeypatch, capsys):
    _set_required(monkeypatch)
    assert launch_gate.main() == 0
    assert "LAUNCH GATE: PASS" in capsys.readouterr().out


def test_launch_gate_blocks_missing_database(monkeypatch, capsys):
    _set_required(monkeypatch)
    monkeypatch.delenv("DATABASE_URL")
    assert launch_gate.main() == 1
    assert "missing DATABASE_URL" in capsys.readouterr().out


def test_launch_gate_blocks_production_debug(monkeypatch, capsys):
    _set_required(monkeypatch)
    monkeypatch.setenv("DEBUG", "true")
    assert launch_gate.main() == 1
    assert "DEBUG must be disabled" in capsys.readouterr().out


def test_launch_gate_requires_complete_marketplace_pair(monkeypatch, capsys):
    _set_required(monkeypatch)
    monkeypatch.setenv("AMAZON_CLIENT_ID", "id")
    monkeypatch.delenv("AMAZON_CLIENT_SECRET", raising=False)
    assert launch_gate.main() == 1
    assert "Amazon credentials" in capsys.readouterr().out


def test_launch_gate_does_not_print_secret(monkeypatch, capsys):
    _set_required(monkeypatch)
    secret = "super-secret-value"
    monkeypatch.setenv("AMAZON_CLIENT_ID", "id")
    monkeypatch.setenv("AMAZON_CLIENT_SECRET", secret)
    assert launch_gate.main() == 0
    assert secret not in capsys.readouterr().out
