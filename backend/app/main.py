from fastapi import FastAPI

from app.api.router import api_router
from app.core.config import get_settings
from app.db.init_db import init_db

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Private Amazon + Flipkart seller operations backend.",
)


@app.on_event("startup")
def startup() -> None:
    init_db()


app.include_router(api_router)


@app.get("/health", tags=["system"])
def health() -> dict[str, str]:
    return {"status": "ok"}
