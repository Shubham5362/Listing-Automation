from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.redis_client import redis_health


@dataclass(frozen=True)
class Check:
    name: str
    status: str
    detail: str


def _check_database(db: Session) -> Check:
    try:
        db.execute(text("SELECT 1"))
        return Check("database", "pass", "database query succeeded")
    except Exception as exc:  # pragma: no cover - provider dependent
        return Check("database", "fail", type(exc).__name__)


def _check_redis() -> Check:
    try:
        result = redis_health()
        status = result.get("status") if isinstance(result, dict) else None
        if status in {"ok", "disabled"}:
            return Check("redis", "pass", str(status))
        return Check("redis", "fail", str(result))
    except Exception as exc:  # pragma: no cover - provider dependent
        return Check("redis", "fail", type(exc).__name__)


def release_readiness(db: Session) -> dict[str, Any]:
    checks = [_check_database(db), _check_redis()]
    passed = sum(check.status == "pass" for check in checks)
    failed = len(checks) - passed
    return {
        "release": "ready" if failed == 0 else "blocked",
        "checks": [check.__dict__ for check in checks],
        "summary": {"passed": passed, "failed": failed, "total": len(checks)},
        "policy": "Production release requires every infrastructure check to pass; Redis may be explicitly disabled.",
    }
