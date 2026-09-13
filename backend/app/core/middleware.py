import logging
import time
import uuid

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import get_settings
from app.core.observability import record_request
from app.core.rate_limit import SharedRateLimiter


logger = logging.getLogger("seller_hub.request")


class SecurityMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        settings = get_settings()
        # Keep middleware construction compatible with lightweight test settings
        # while using the configured Redis backend in production.
        redis_url = getattr(settings, "redis_url", None)
        self._limiter = SharedRateLimiter(redis_url, settings.rate_limit_per_minute)

    async def dispatch(self, request: Request, call_next):
        started = time.perf_counter()
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        client = request.client.host if request.client else "unknown"
        allowed, retry_after = await self._limiter.allow(client)
        if not allowed:
            return JSONResponse({"detail": "Rate limit exceeded", "request_id": request_id}, status_code=429, headers={"Retry-After": str(retry_after), "X-Request-ID": request_id})

        try:
            response = await call_next(request)
        except Exception:
            logger.exception("Unhandled request error", extra={"request_id": request_id})
            raise
        duration_ms = (time.perf_counter() - started) * 1000
        record_request(request.method, request.url.path, response.status_code, duration_ms)
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        response.headers["Cache-Control"] = "no-store" if request.url.path.startswith("/api/") else response.headers.get("Cache-Control", "")
        if request.url.scheme == "https":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        logger.info("request", extra={"request_id": request_id},)
        return response
