from fastapi import APIRouter

from app.api.auth import router as auth_router

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth_router)


@api_router.get("/status", tags=["system"])
def status() -> dict[str, str]:
    return {"service": "seller-hub", "status": "ready"}
