from unittest.mock import patch

from app.services.release_readiness import release_readiness


def test_release_readiness_passes_database_and_disabled_redis(db_session):
    with patch("app.services.release_readiness.redis_health", return_value={"status": "disabled"}):
        result = release_readiness(db_session)

    assert result["release"] == "ready"
    assert result["summary"] == {"passed": 2, "failed": 0, "total": 2}
    assert {item["name"] for item in result["checks"]} == {"database", "redis"}


def test_release_readiness_blocks_on_redis_failure(db_session):
    with patch("app.services.release_readiness.redis_health", return_value={"status": "error", "error": "connection"}):
        result = release_readiness(db_session)

    assert result["release"] == "blocked"
    assert result["summary"]["failed"] == 1
