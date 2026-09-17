from __future__ import annotations

from functools import lru_cache

from redis import Redis

from app.core.config import get_settings


@lru_cache
def get_redis():
    """Return the Render Key Value Redis/Valkey client when configured."""
    settings = get_settings()
    if not settings.redis_url:
        return None
    return Redis.from_url(settings.redis_url, decode_responses=True)


def redis_health() -> dict[str, object]:
    client = get_redis()
    if client is None:
        return {"configured": False, "status": "disabled"}
    try:
        client.ping()
        return {"configured": True, "status": "ok"}
    except Exception as exc:  # pragma: no cover - provider/network dependent
        return {"configured": True, "status": "error", "error": type(exc).__name__}
