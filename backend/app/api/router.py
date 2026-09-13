from fastapi import APIRouter

api_router = APIRouter(prefix="/api/v1")


@api_router.get("/status", tags=["system"])
def status() -> dict[str, str]:
    return {"service": "seller-hub", "status": "ready"}
