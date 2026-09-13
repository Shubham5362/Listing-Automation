from fastapi import APIRouter

from app.api.accounts import router as accounts_router
from app.api.ai_listing import router as ai_listing_router
from app.api.auth import router as auth_router
from app.api.catalog import router as catalog_router
from app.api.jobs import router as jobs_router
from app.api.marketplaces import router as marketplaces_router

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth_router)
api_router.include_router(accounts_router)
api_router.include_router(jobs_router)
api_router.include_router(marketplaces_router)
api_router.include_router(catalog_router)
api_router.include_router(ai_listing_router)


@api_router.get("/status", tags=["system"])
def status() -> dict[str, str]:
    return {"service": "seller-hub", "status": "ready"}
