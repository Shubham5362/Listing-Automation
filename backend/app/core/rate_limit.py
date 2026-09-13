import time

from redis.asyncio import Redis


class SharedRateLimiter:
    def __init__(self, redis_url: str | None, limit: int):
        self.limit = max(1, limit)
        self.redis = Redis.from_url(redis_url, decode_responses=True) if redis_url else None
        self._local: dict[str, tuple[int, int]] = {}

    async def allow(self, key: str) -> tuple[bool, int]:
        now = int(time.time())
        if self.redis is None:
            count, window = self._local.get(key, (0, now))
            if window != now // 60:
                count, window = 0, now // 60
            count += 1
            self._local[key] = (count, window)
            return count <= self.limit, max(1, 60 - now % 60)
        bucket = now // 60
        redis_key = f"seller-hub:rate:{key}:{bucket}"
        try:
            count = await self.redis.incr(redis_key)
            if count == 1:
                await self.redis.expire(redis_key, 61)
            return count <= self.limit, max(1, 60 - now % 60)
        except Exception:
            return True, 1

    async def close(self) -> None:
        if self.redis is not None:
            await self.redis.aclose()
