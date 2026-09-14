from __future__ import annotations

import json
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.marketplaces.registry import get_adapter, list_marketplaces
from app.models.catalog import Product
from app.models.core import SellerAccount, User

router = APIRouter(prefix="/marketplace-adapters", tags=["marketplace-adapters"])


class MappingRequest(BaseModel):
    facts: dict[str, Any] = Field(default_factory=dict)
    category: str | None = None


@router.get("")
def adapters() -> list[dict[str, object]]:
    return list_marketplaces()


@router.get("/{marketplace}")
def adapter_detail(marketplace: str) -> dict[str, object]:
    try:
        adapter = get_adapter(marketplace)
    except ValueError as exc:
        raise HTTPException(404, str(exc)) from exc
    return {
        "marketplace": adapter.marketplace,
        "adapter_version": adapter.version,
        "capabilities": [c.__dict__ for c in adapter.capabilities()],
        "schemas": [
            {"version": s.version, "category": s.category, "fields": [f.__dict__ for f in s.fields]}
            for s in adapter.schemas()
        ],
    }


@router.post("/{marketplace}/map")
def map_attributes(marketplace: str, payload: MappingRequest) -> dict[str, object]:
    try:
        adapter = get_adapter(marketplace)
    except ValueError as exc:
        raise HTTPException(404, str(exc)) from exc
    return {"marketplace": marketplace, "adapter_version": adapter.version, "mapping": adapter.map_attributes(payload.facts, payload.category)}


@router.post("/{marketplace}/validate/{product_id}")
def validate_product(marketplace: str, product_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> dict[str, object]:
    product = db.scalar(select(Product).join(SellerAccount, SellerAccount.id == Product.seller_account_id).where(Product.id == product_id, SellerAccount.user_id == current_user.id))
    if not product:
        raise HTTPException(404, "Product not found")
    try:
        adapter = get_adapter(marketplace)
    except ValueError as exc:
        raise HTTPException(404, str(exc)) from exc
    try:
        attributes = json.loads(product.attributes_json or "{}")
    except json.JSONDecodeError:
        attributes = {}
    facts = {"SKU": product.sku, "TITLE": product.title, "BRAND": product.brand, "CATEGORY": product.category, "HSN": product.hsn_code, "GST_RATE": product.gst_rate}
    for key, value in attributes.items():
        facts.setdefault(key.upper().replace(" ", "_"), {"value": value})
    return adapter.validate(facts, product.category)


@router.get("/{marketplace}/health")
def adapter_health(marketplace: str) -> dict[str, object]:
    try:
        adapter = get_adapter(marketplace)
    except ValueError as exc:
        raise HTTPException(404, str(exc)) from exc
    return {"marketplace": marketplace, "status": "ready", "adapter_version": adapter.version, "schema_count": len(adapter.schemas())}
