from __future__ import annotations

import hashlib
import json
from datetime import datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.marketplaces.registry import get_adapter, list_marketplaces
from app.models.marketplace_form_knowledge import MarketplaceFormKnowledge


def _schema_payload(schema: Any) -> dict[str, Any]:
    return {
        "version": schema.version,
        "category": schema.category,
        "fields": [
            {
                "name": field.name,
                "canonical": field.canonical,
                "field_type": field.field_type,
                "required": field.required,
                "enum": list(field.enum),
                "unit": field.unit,
                "condition": field.condition,
            }
            for field in schema.fields
        ],
    }


def _fingerprint(payload: dict[str, Any]) -> str:
    raw = json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def sync_marketplace_knowledge(db: Session, seller_account_id: int, marketplace: str, category: str | None = None) -> dict[str, Any]:
    adapter = get_adapter(marketplace)
    schemas = [adapter.schema_for(category)] if category else list(adapter.schemas())
    saved = []
    for schema in schemas:
        payload = _schema_payload(schema)
        fingerprint = _fingerprint(payload)
        row = db.scalar(select(MarketplaceFormKnowledge).where(
            MarketplaceFormKnowledge.seller_account_id == seller_account_id,
            MarketplaceFormKnowledge.marketplace == marketplace,
            MarketplaceFormKnowledge.category == schema.category,
        ))
        changed = row is None or row.schema_fingerprint != fingerprint
        if row is None:
            row = MarketplaceFormKnowledge(
                seller_account_id=seller_account_id,
                marketplace=marketplace,
                category=schema.category,
                adapter_version=adapter.version,
                schema_version=schema.version,
                schema_fingerprint=fingerprint,
                fields_json=json.dumps(payload["fields"], ensure_ascii=False, separators=(",", ":")),
                status="ready",
                source="adapter",
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            db.add(row)
        elif changed:
            row.adapter_version = adapter.version
            row.schema_version = schema.version
            row.schema_fingerprint = fingerprint
            row.fields_json = json.dumps(payload["fields"], ensure_ascii=False, separators=(",", ":"))
            row.status = "ready"
            row.updated_at = datetime.utcnow()
        db.flush()
        saved.append({"id": row.id, "marketplace": row.marketplace, "category": row.category, "schema_version": row.schema_version, "field_count": len(payload["fields"]), "status": row.status, "changed": changed})
    db.commit()
    return {"seller_account_id": seller_account_id, "items": saved}


def list_marketplace_knowledge(db: Session, seller_account_id: int) -> list[dict[str, Any]]:
    rows = db.scalars(select(MarketplaceFormKnowledge).where(
        MarketplaceFormKnowledge.seller_account_id == seller_account_id
    ).order_by(MarketplaceFormKnowledge.marketplace, MarketplaceFormKnowledge.category)).all()
    return [
        {"id": row.id, "marketplace": row.marketplace, "category": row.category, "adapter_version": row.adapter_version,
         "schema_version": row.schema_version, "field_count": len(json.loads(row.fields_json or "[]")),
         "status": row.status, "source": row.source, "updated_at": row.updated_at}
        for row in rows
    ]


def get_marketplace_field_knowledge(db: Session, seller_account_id: int, marketplace: str, category: str | None = None) -> dict[str, Any]:
    stmt = select(MarketplaceFormKnowledge).where(
        MarketplaceFormKnowledge.seller_account_id == seller_account_id,
        MarketplaceFormKnowledge.marketplace == marketplace,
    )
    if category:
        stmt = stmt.where(MarketplaceFormKnowledge.category == category)
    row = db.scalar(stmt.order_by(MarketplaceFormKnowledge.id.desc()))
    if row is None:
        raise ValueError("Marketplace form knowledge not found")
    return {"id": row.id, "marketplace": row.marketplace, "category": row.category, "adapter_version": row.adapter_version,
            "schema_version": row.schema_version, "fields": json.loads(row.fields_json or "[]"),
            "status": row.status, "source": row.source, "updated_at": row.updated_at}


def marketplace_knowledge_catalog() -> list[dict[str, Any]]:
    return list_marketplaces()
