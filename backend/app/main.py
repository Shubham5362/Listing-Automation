import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from starlette.middleware.trustedhost import TrustedHostMiddleware
from sqlalchemy import text

from app.api.router import api_router
from app.core.config import get_settings
from app.core.middleware import SecurityMiddleware
from app.core.observability import configure_logging, metrics_snapshot, prometheus_snapshot
from app.core.redis_client import redis_health
from app.db.init_db import init_db
from app.db.session import SessionLocal
from app.services.personal_marketplace import ensure_personal_marketplaces

settings = get_settings()
configure_logging()
logger = logging.getLogger("seller_hub")

if settings.environment.lower() in {"production", "prod"}:
    if settings.secret_key == "change-me-in-env" or len(settings.secret_key) < 32:
        raise RuntimeError("A strong SECRET_KEY is required in production")
    if not settings.credentials_encryption_key:
        raise RuntimeError("CREDENTIALS_ENCRYPTION_KEY is required in production")

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Private Amazon + Flipkart seller operations backend.",
    docs_url=None if settings.environment.lower() in {"production", "prod"} else "/docs",
    redoc_url=None if settings.environment.lower() in {"production", "prod"} else "/redoc",
)

origins = [item.strip() for item in settings.allowed_origins.split(",") if item.strip()]
hosts = [item.strip() for item in settings.allowed_hosts.split(",") if item.strip()]

app.add_middleware(SecurityMiddleware)
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], allow_headers=["Authorization", "Content-Type", "Accept", "X-Request-ID"])
if hosts:
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=hosts)


@app.on_event("startup")
def startup() -> None:
    init_db()
    with SessionLocal() as session:
        ensure_personal_marketplaces(session, settings)
    logger.info("application_started")


app.include_router(api_router)


@app.get("/health", tags=["system"])
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/ready", tags=["system"])
def readiness() -> dict[str, str]:
    with SessionLocal() as session:
        session.execute(text("SELECT 1"))
    return {"status": "ready"}


@app.get("/health/dependencies", tags=["system"])
def dependency_health() -> dict[str, object]:
    db_status: dict[str, object]
    try:
        with SessionLocal() as session:
            session.execute(text("SELECT 1"))
        db_status = {"status": "ok"}
    except Exception as exc:  # pragma: no cover - provider/network dependent
        db_status = {"status": "error", "error": type(exc).__name__}

    redis_status = redis_health()
    overall = "ok" if db_status["status"] == "ok" and redis_status["status"] in {"ok", "disabled"} else "degraded"
    return {"status": overall, "database": db_status, "redis": redis_status}


@app.get("/metrics", tags=["system"])
def metrics() -> dict[str, object]:
    return {"status": "ok", "metrics": metrics_snapshot()}


@app.get("/metrics/prometheus", response_class=PlainTextResponse, tags=["system"])
def prometheus_metrics() -> str:
    return prometheus_snapshot()
