import asyncio

from app.core.observability import metrics_snapshot, record_request
from app.core.rate_limit import SharedRateLimiter


def test_metrics_record_request():
    before = metrics_snapshot().get("requests_total", 0)
    record_request("GET", "/health", 200, 3.0)
    after = metrics_snapshot()
    assert after["requests_total"] == before + 1
    assert after["requests_2xx"] >= 1


def test_local_rate_limiter_enforces_window():
    async def run():
        limiter = SharedRateLimiter(None, 2)
        assert (await limiter.allow("test")[0]) is True
        assert (await limiter.allow("test")[0]) is True
        assert (await limiter.allow("test")[0]) is False
        await limiter.close()

    asyncio.run(run())
