from __future__ import annotations

import json
import re
from decimal import Decimal
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.catalog import Product
from app.models.product_knowledge import ProductKnowledge, ProductKnowledgeVersion

CANONICAL_ALIASES = {
    "sku": "SKU", "product code": "SKU", "item code": "SKU", "seller sku": "SKU",
    "title": "TITLE", "product title": "TITLE", "name": "TITLE",
    "description": "DESCRIPTION", "product description": "DESCRIPTION",
    "brand": "BRAND", "brand name": "BRAND", "manufacturer": "BRAND",
    "category": "CATEGORY", "product category": "CATEGORY", "product type": "CATEGORY",
    "color": "COLOR", "colour": "COLOR", "primary color": "COLOR", "primary colour": "COLOR",
    "material": "MATERIAL", "fabric": "MATERIAL", "fabric type": "MATERIAL", "material type": "MATERIAL",
    "size": "SIZE", "size name": "SIZE", "dimensions": "DIMENSIONS", "dimension": "DIMENSIONS",
    "pattern": "PATTERN", "pattern type": "PATTERN", "weight": "WEIGHT", "item weight": "WEIGHT",
    "hsn": "HSN", "hsn code": "HSN", "gst": "GST_RATE", "gst rate": "GST_RATE",
    "mrp": "MRP", "maximum retail price": "MRP", "cost price": "COST_PRICE",
    "image": "IMAGE_URLS", "images": "IMAGE_URLS", "image urls": "IMAGE_URLS",
}
FACT_STATUSES = {"verified", "inferred", "suggested", "unknown"}


def _norm(value: str) -> str:
    return re.sub(r"\s+", " ", value.strip().casefold())


def canonical_attribute(name: str) -> str:
    key = _norm(name)
    return CANONICAL_ALIASES.get(key, re.sub(r"[^A-Z0-9]+", "_", name.strip().upper()).strip("_"))


def _json_value(value: Any) -> Any:
    if isinstance(value, Decimal): return float(value)
    if isinstance(value, dict): return {str(k): _json_value(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)): return [_json_value(v) for v in value]
    return value


def _fact(value: Any, source: str, *, status: str = "verified", confidence: float = 1.0) -> dict[str, Any]:
    if status not in FACT_STATUSES: raise ValueError(f"Unsupported fact status: {status}")
    return {"value": _json_value(value), "source": source, "confidence": round(max(0.0, min(1.0, confidence)), 4), "status": status}


def _safe_json(value: str | None, default: Any) -> Any:
    if not value: return default
    try: return json.loads(value)
    except (json.JSONDecodeError, TypeError): return default


def _product_facts(product: Product) -> dict[str, dict[str, Any]]:
    facts: dict[str, dict[str, Any]] = {}
    fields = {
        "SKU": (product.sku, "product.sku"), "TITLE": (product.title, "product.title"),
        "DESCRIPTION": (product.description, "product.description"), "BRAND": (product.brand, "product.brand"),
        "CATEGORY": (product.category, "product.category"), "HSN": (product.hsn_code, "product.hsn_code"),
        "GST_RATE": (product.gst_rate, "product.gst_rate"), "MRP": (product.mrp, "product.mrp"),
        "COST_PRICE": (product.cost_price, "product.cost_price"),
        "IMAGE_URLS": (_safe_json(product.image_urls_json, []), "product.image_urls_json"),
    }
    for key, (value, source) in fields.items():
        if value is not None and value != "" and value != []: facts[key] = _fact(value, source)
    attrs = _safe_json(product.attributes_json, {})
    if isinstance(attrs, dict):
        for raw_name, value in attrs.items():
            if value in (None, "", []): continue
            key = canonical_attribute(str(raw_name))
            if key not in facts: facts[key] = _fact(value, f"product.attributes_json:{raw_name}")
    return facts


def detect_contradictions(facts: dict[str, dict[str, Any]], candidates: dict[str, Any]) -> list[dict[str, Any]]:
    conflicts: list[dict[str, Any]] = []
    for raw_name, candidate in candidates.items():
        key = canonical_attribute(raw_name); current = facts.get(key)
        if not current or candidate in (None, "", []): continue
        old = current.get("value")
        same = _norm(old) == _norm(candidate) if isinstance(old, str) and isinstance(candidate, str) else old == candidate
        if not same:
            conflicts.append({"attribute": key, "current": old, "candidate": _json_value(candidate), "current_source": current.get("source"), "current_confidence": current.get("confidence", 0.0), "status": "conflict", "requires_review": current.get("status") == "verified"})
    return conflicts


def _score(facts: dict[str, dict[str, Any]]) -> int:
    required = ["SKU", "TITLE", "DESCRIPTION", "BRAND", "CATEGORY", "HSN", "GST_RATE"]
    optional = ["COLOR", "MATERIAL", "SIZE", "PATTERN", "WEIGHT", "MRP", "IMAGE_URLS"]
    required_score = sum(1 for key in required if facts.get(key, {}).get("value") not in (None, "", [])) / len(required) * 70
    optional_score = sum(1 for key in optional if facts.get(key, {}).get("value") not in (None, "", [])) / len(optional) * 30
    return round(required_score + optional_score)


def build_product_knowledge(db: Session, product: Product, *, reason: str = "initial sync", source: str = "product_record") -> ProductKnowledge:
    facts = _product_facts(product)
    row = db.scalar(select(ProductKnowledge).where(ProductKnowledge.product_id == product.id, ProductKnowledge.seller_account_id == product.seller_account_id))
    if row is None:
        row = ProductKnowledge(seller_account_id=product.seller_account_id, product_id=product.id); db.add(row); db.flush(); version = 1
    else: version = row.schema_version + 1
    previous = json.loads(row.facts_json or "{}") if row.facts_json else {}
    if previous == facts: return row
    row.schema_version = version; row.facts_json = json.dumps(facts, ensure_ascii=False, separators=(",", ":"))
    row.attribute_aliases_json = json.dumps({k: [k] for k in facts}, ensure_ascii=False, separators=(",", ":"))
    row.completeness_score = _score(facts); row.conflict_count = 0; row.status = "ready" if row.completeness_score >= 70 else "incomplete"
    db.add(ProductKnowledgeVersion(product_knowledge_id=row.id, product_id=product.id, version=version, facts_json=row.facts_json, reason=reason, source=source)); db.flush()
    return row


def merge_knowledge_candidates(db: Session, product: Product, candidates: dict[str, Any], *, source: str = "ai_inference", reason: str = "AI product understanding", confidence: float = 0.75) -> tuple[ProductKnowledge, list[dict[str, Any]]]:
    row = build_product_knowledge(db, product); facts = json.loads(row.facts_json or "{}"); conflicts = detect_contradictions(facts, candidates)
    conflict_keys = {item["attribute"] for item in conflicts}; changed = False
    for raw_name, value in candidates.items():
        if value in (None, "", []): continue
        key = canonical_attribute(raw_name)
        if key in conflict_keys and facts.get(key, {}).get("status") == "verified": continue
        facts[key] = _fact(value, source, status="inferred", confidence=confidence); changed = True
    if changed:
        version = row.schema_version + 1; row.schema_version = version; row.facts_json = json.dumps(facts, ensure_ascii=False, separators=(",", ":"))
        row.completeness_score = _score(facts); row.conflict_count = len(conflicts); row.status = "conflict" if conflicts else ("ready" if row.completeness_score >= 70 else "incomplete")
        row.attribute_aliases_json = json.dumps({k: [k] for k in facts}, ensure_ascii=False, separators=(",", ":"))
        db.add(ProductKnowledgeVersion(product_knowledge_id=row.id, product_id=product.id, version=version, facts_json=row.facts_json, reason=reason, source=source)); db.flush()
    return row, conflicts


def read_knowledge(row: ProductKnowledge) -> dict[str, Any]:
    return {"id": row.id, "product_id": row.product_id, "seller_account_id": row.seller_account_id, "schema_version": row.schema_version, "facts": json.loads(row.facts_json or "{}"), "attribute_aliases": json.loads(row.attribute_aliases_json or "{}"), "completeness_score": row.completeness_score, "conflict_count": row.conflict_count, "status": row.status, "updated_at": row.updated_at.isoformat() if row.updated_at else None, "fact_statuses": sorted(FACT_STATUSES)}


def knowledge_history(db: Session, product_id: int) -> list[dict[str, Any]]:
    rows = db.scalars(select(ProductKnowledgeVersion).where(ProductKnowledgeVersion.product_id == product_id).order_by(ProductKnowledgeVersion.version.desc())).all()
    return [{"version": r.version, "facts": json.loads(r.facts_json), "reason": r.reason, "source": r.source, "created_at": r.created_at.isoformat()} for r in rows]
