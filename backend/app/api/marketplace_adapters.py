from __future__ import annotations

import json
from datetime import datetime
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
from app.models.marketplace_adapter import MarketplaceAdapterSnapshot

router = APIRouter(prefix="/marketplace-adapters", tags=["marketplace-adapters"])

class MappingRequest(BaseModel):
    facts: dict[str, Any] = Field(default_factory=dict)
    category: str | None = None

def _adapter_or_404(marketplace: str):
    try:
        return get_adapter(marketplace)
    except ValueError as exc:
        raise HTTPException(404, str(exc)) from exc

def _schema_json(schema) -> dict[str, Any]:
    return {"version": schema.version, "category": schema.category, "fields": [f.__dict__ for f in schema.fields]}

@router.get("")
def adapters() -> list[dict[str, object]]:
    return list_marketplaces()

@router.get("/{marketplace}")
def adapter_detail(marketplace: str) -> dict[str, object]:
    adapter = _adapter_or_404(marketplace)
    return {"marketplace": adapter.marketplace, "adapter_version": adapter.version, "capabilities": [c.__dict__ for c in adapter.capabilities()], "schemas": [_schema_json(s) for s in adapter.schemas()]}

@router.post("/{marketplace}/snapshot")
def save_snapshot(marketplace: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> dict[str, object]:
    adapter = _adapter_or_404(marketplace)
    saved = []
    for schema in adapter.schemas():
        existing = db.scalar(select(MarketplaceAdapterSnapshot).where(MarketplaceAdapterSnapshot.marketplace == marketplace, MarketplaceAdapterSnapshot.schema_version == schema.version, MarketplaceAdapterSnapshot.category == schema.category))
        if existing:
            saved.append(existing.id)
            continue
        row = MarketplaceAdapterSnapshot(marketplace=marketplace, adapter_version=adapter.version, schema_version=schema.version, category=schema.category, schema_json=json.dumps(_schema_json(schema), ensure_ascii=False, separators=(",", ":")), status="active", created_at=datetime.utcnow())
        db.add(row); db.flush(); saved.append(row.id)
    db.commit()
    return {"marketplace": marketplace, "snapshot_ids": saved, "status": "stored"}

@router.get("/{marketplace}/history")
def snapshot_history(marketplace: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> list[dict[str, object]]:
    _adapter_or_404(marketplace)
    rows = db.scalars(select(MarketplaceAdapterSnapshot).where(MarketplaceAdapterSnapshot.marketplace == marketplace).order_by(MarketplaceAdapterSnapshot.id.desc())).all()
    return [{"id": r.id, "adapter_version": r.adapter_version, "schema_version": r.schema_version, "category": r.category, "status": r.status, "created_at": r.created_at} for r in rows]

@router.post("/{marketplace}/map")
def map_attributes(marketplace: str, payload: MappingRequest) -> dict[str, object]:
    adapter = _adapter_or_404(marketplace)
    return {"marketplace": marketplace, "adapter_version": adapter.version, "mapping": adapter.map_attributes(payload.facts, payload.category)}

@router.post("/{marketplace}/validate/{product_id}")
def validate_product(marketplace: str, product_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> dict[str, object]:
    product = db.scalar(select(Product).join(SellerAccount, SellerAccount.id == Product.seller_account_id).where(Product.id == product_id, SellerAccount.user_id == current_user.id))
    if not product:
        raise HTTPException(404, "Product not found")
    adapter = _adapter_or_404(marketplace)
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
    adapter = _adapter_or_404(marketplace)
    return {"marketplace": marketplace, "status": "ready", "adapter_version": adapter.version, "schema_count": len(adapter.schemas())}
