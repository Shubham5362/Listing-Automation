from __future__ import annotations

import json
import re
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.catalog import Product
from app.models.product_knowledge import ProductKnowledge, ProductKnowledgeVersion


CANONICAL_ALIASES = {
    "sku": "SKU", "product code": "SKU", "item code": "SKU",
    "title": "TITLE", "product title": "TITLE", "name": "TITLE",
    "brand": "BRAND", "brand name": "BRAND",
    "category": "CATEGORY", "product category": "CATEGORY",
    "color": "COLOR", "colour": "COLOR", "primary color": "COLOR", "primary colour": "COLOR",
    "material": "MATERIAL", "fabric": "MATERIAL", "fabric type": "MATERIAL", "material type": "MATERIAL",
    "size": "SIZE", "size name": "SIZE",
    "pattern": "PATTERN", "pattern type": "PATTERN",
    "weight": "WEIGHT", "item weight": "WEIGHT",
    "hsn": "HSN", "hsn code": "HSN",
    "gst": "GST_RATE", "gst rate": "GST_RATE",
}


def _norm(value: str) -> str:
    return re.sub(r"\s+", " ", value.strip().casefold())


def canonical_attribute(name: str) -> str:
    key = _norm(name)
    return CANONICAL_ALIASES.get(key, re.sub(r"[^A-Z0-9]+", "_", name.strip().upper()).strip("_"))


def _product_facts(product: Product) -> dict[str, dict[str, Any]]:
    facts: dict[str, dict[str, Any]] = {}
    fields = {
        "SKU": (product.sku, "product.sku"), "TITLE": (product.title, "product.title"),
        "BRAND": (product.brand, "product.brand"), "CATEGORY": (product.category, "product.category"),
        "HSN": (product.hsn_code, "product.hsn_code"), "GST_RATE": (product.gst_rate, "product.gst_rate"),
    }
    for key, (value, source) in fields.items():
        if value is not None and str(value).strip():
            facts[key] = {"value": value, "source": source, "confidence": 1.0, "status": "verified"}
    try:
        attrs = json.loads(product.attributes_json or "{}")
    except json.JSONDecodeError:
        attrs = {}
    if isinstance(attrs, dict):
        for raw_name, value in attrs.items():
            if value is None or value == "":
                continue
            key = canonical_attribute(str(raw_name))
            if key not in facts:
                facts[key] = {"value": value, "source": "product.attributes_json", "confidence": 1.0, "status": "verified"}
    return facts


def _score(facts: dict[str, dict[str, Any]]) -> int:
    groups = ["SKU", "TITLE", "BRAND", "CATEGORY", "HSN", "GST_RATE", "COLOR", "MATERIAL", "SIZE", "PATTERN", "WEIGHT"]
    present = sum(1 for key in groups if facts.get(key, {}).get("value") not in (None, "", []))
    return round(present / len(groups) * 100)


def build_product_knowledge(db: Session, product: Product, *, reason: str = "initial sync", source: str = "product_record") -> ProductKnowledge:
    facts = _product_facts(product)
    row = db.scalar(select(ProductKnowledge).where(ProductKnowledge.product_id == product.id, ProductKnowledge.seller_account_id == product.seller_account_id))
    if row is None:
        row = ProductKnowledge(seller_account_id=product.seller_account_id, product_id=product.id)
        db.add(row)
        db.flush()
        version = 1
    else:
        version = row.schema_version + 1
    previous = json.loads(row.facts_json or "{}") if row.facts_json else {}
    if previous == facts and row.id:
        return row
    row.schema_version = version
    row.facts_json = json.dumps(facts, ensure_ascii=False, separators=(",", ":"))
    row.attribute_aliases_json = json.dumps({k: k for k in facts}, ensure_ascii=False, separators=(",", ":"))
    row.completeness_score = _score(facts)
    row.conflict_count = 0
    row.status = "ready" if row.completeness_score >= 70 else "incomplete"
    db.add(ProductKnowledgeVersion(product_knowledge_id=row.id, product_id=product.id, version=version, facts_json=row.facts_json, reason=reason, source=source))
    db.flush()
    return row


def read_knowledge(row: ProductKnowledge) -> dict[str, Any]:
    return {
        "id": row.id, "product_id": row.product_id, "seller_account_id": row.seller_account_id,
        "schema_version": row.schema_version, "facts": json.loads(row.facts_json or "{}"),
        "attribute_aliases": json.loads(row.attribute_aliases_json or "{}"),
        "completeness_score": row.completeness_score, "conflict_count": row.conflict_count, "status": row.status,
        "updated_at": row.updated_at.isoformat() if row.updated_at else None,
    }


def knowledge_history(db: Session, product_id: int) -> list[dict[str, Any]]:
    rows = db.scalars(select(ProductKnowledgeVersion).where(ProductKnowledgeVersion.product_id == product_id).order_by(ProductKnowledgeVersion.version.desc())).all()
    return [{"version": r.version, "facts": json.loads(r.facts_json), "reason": r.reason, "source": r.source, "created_at": r.created_at.isoformat()} for r in rows]
