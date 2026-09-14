from __future__ import annotations

from functools import lru_cache

from app.core.config import get_settings


@lru_cache
def get_redis():
    """Return an Upstash REST Redis client when configured, otherwise None."""
    settings = get_settings()
    if not settings.upstash_redis_rest_url or not settings.upstash_redis_rest_token:
        return None

    from upstash_redis import Redis

    return Redis(
        url=settings.upstash_redis_rest_url,
        token=settings.upstash_redis_rest_token,
    )


def redis_health() -> dict[str, object]:
    client = get_redis()
    if client is None:
        return {"configured": False, "status": "disabled"}
    try:
        client.ping()
        return {"configured": True, "status": "ok"}
    except Exception as exc:  # pragma: no cover - provider/network dependent
        return {"configured": True, "status": "error", "error": type(exc).__name__}
