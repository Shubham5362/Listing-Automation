from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.marketplaces.catalog import get_channel_catalog_item, list_channel_catalog

router = APIRouter(prefix="/marketplace-catalog", tags=["marketplace-catalog"])


@router.get("")
def marketplace_catalog() -> list[dict[str, object]]:
    return list_channel_catalog()


@router.get("/{marketplace_key}")
def marketplace_catalog_item(marketplace_key: str) -> dict[str, object]:
    item = get_channel_catalog_item(marketplace_key)
    if item is None:
        raise HTTPException(status_code=404, detail="Marketplace is not registered")
    return item
