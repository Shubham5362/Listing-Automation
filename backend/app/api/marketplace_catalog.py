from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.services.marketplace_catalog import get_marketplace_definition, list_marketplaces, live_adapter_marketplaces

router = APIRouter(prefix="/marketplace-catalog", tags=["marketplace-catalog"])


@router.get("")
def marketplace_catalog() -> list[dict[str, object]]:
    live = live_adapter_marketplaces()
    return [
        {
            "key": item.key,
            "name": item.name,
            "category": item.category,
            "connection_modes": list(item.connection_modes),
            "capabilities": list(item.capabilities),
            "live_adapter": item.live_adapter and item.key in live,
        }
        for item in list_marketplaces()
    ]


@router.get("/{marketplace_key}")
def marketplace_catalog_item(marketplace_key: str) -> dict[str, object]:
    item = get_marketplace_definition(marketplace_key)
    if item is None:
        raise HTTPException(status_code=404, detail="Marketplace is not registered")
    live = live_adapter_marketplaces()
    return {
        "key": item.key,
        "name": item.name,
        "category": item.category,
        "connection_modes": list(item.connection_modes),
        "capabilities": list(item.capabilities),
        "live_adapter": item.live_adapter and item.key in live,
    }
