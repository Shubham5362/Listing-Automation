from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware

from app.api.router import api_router
from app.core.config import get_settings
from app.core.middleware import SecurityMiddleware
from app.db.init_db import init_db

settings = get_settings()

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
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], allow_headers=["Authorization", "Content-Type", "Accept"])
if hosts:
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=hosts)


@app.on_event("startup")
def startup() -> None:
    init_db()


app.include_router(api_router)


@app.get("/health", tags=["system"])
def health() -> dict[str, str]:
    return {"status": "ok"}
