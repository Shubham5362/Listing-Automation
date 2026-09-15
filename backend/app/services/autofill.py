from __future__ import annotations

import json
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.marketplaces.registry import get_adapter
from app.models.autofill import AutofillAction, AutofillError, AutofillSession
from app.models.catalog import Product
from app.models.core import SellerAccount, User
from app.models.product_knowledge import ProductKnowledge

MODES = {"draft", "review", "auto", "strict"}
HIGH_RISK = {"publish", "submit", "delete", "change_price", "change_inventory"}


def _confidence_for(field: Any, fact: Any, *, strict: bool) -> int:
    if fact is None:
        return 0
    if isinstance(fact, dict):
        status = fact.get("status", "unknown")
        base = round(float(fact.get("confidence", 0.0)) * 100)
        if status == "verified":
            base = max(base, 95)
        elif status == "inferred":
            base = min(base, 84)
        elif status in {"suggested", "unknown"}:
            base = min(base, 69)
    else:
        base = 70
    return max(0, min(100, base if not strict else (100 if base >= 95 else 0)))


def _product_facts(product: Product, knowledge: ProductKnowledge | None) -> dict[str, Any]:
    if knowledge:
        try:
            return json.loads(knowledge.facts_json or "{}")
        except json.JSONDecodeError:
            pass
    facts = {"SKU": product.sku, "TITLE": product.title, "BRAND": product.brand, "CATEGORY": product.category, "HSN": product.hsn_code, "GST_RATE": product.gst_rate}
    try:
        attrs = json.loads(product.attributes_json or "{}")
    except json.JSONDecodeError:
        attrs = {}
    for key, value in attrs.items():
        facts.setdefault(key.upper().replace(" ", "_"), {"value": value, "confidence": 1.0, "status": "verified", "source": "product.attributes_json"})
    return {k: ({"value": v, "confidence": 1.0, "status": "verified", "source": "product_record"} if not isinstance(v, dict) else v) for k, v in facts.items() if v is not None}


def plan_autofill(db: Session, product: Product, marketplace: str, *, mode: str = "review", page_fields: list[dict[str, Any]] | None = None) -> dict[str, Any]:
    if mode not in MODES:
        raise ValueError(f"Unsupported autofill mode: {mode}")
    adapter = get_adapter(marketplace)
    knowledge = db.scalar(select(ProductKnowledge).where(ProductKnowledge.product_id == product.id, ProductKnowledge.seller_account_id == product.seller_account_id))
    facts = _product_facts(product, knowledge)
    schema = adapter.schema_for(product.category)
    discovered = page_fields or [{"name": f.name, "canonical": f.canonical, "field_type": f.field_type, "required": f.required, "enum": list(f.enum), "unit": f.unit} for f in schema.fields]
    strict = mode == "strict"
    decisions: list[dict[str, Any]] = []
    missing: list[str] = []
    for field in discovered:
        canonical = str(field.get("canonical") or field.get("name") or "").upper().replace(" ", "_")
        fact = facts.get(canonical)
        value = fact.get("value") if isinstance(fact, dict) else fact
        confidence = _confidence_for(field, fact, strict=strict)
        if value in (None, "", []):
            if field.get("required"):
                missing.append(str(field.get("name") or canonical))
            decisions.append({"field": field.get("name", canonical), "canonical": canonical, "action": "skip", "value": None, "confidence": 0, "status": "blocked", "reason": "No verified product value available"})
            continue
        if strict and confidence < 95:
            decisions.append({"field": field.get("name", canonical), "canonical": canonical, "action": "skip", "value": None, "confidence": confidence, "status": "review_required", "reason": "Strict mode requires a verified fact"})
            continue
        mapped = adapter.map_attributes({canonical: fact}, product.category).get(field.get("name"))
        if mapped is None:
            decisions.append({"field": field.get("name", canonical), "canonical": canonical, "action": "skip", "value": None, "confidence": confidence, "status": "review_required", "reason": "Marketplace value could not be safely normalized"})
            continue
        status = "planned" if mode in {"draft", "review"} else ("approved" if confidence >= 95 else "review_required")
        decisions.append({"field": field.get("name", canonical), "canonical": canonical, "action": "fill", "value": mapped, "confidence": confidence, "status": status, "reason": "Canonical Product Brain fact mapped to marketplace field"})
    ready = not missing and not any(d["status"] == "review_required" for d in decisions)
    return {"marketplace": marketplace, "adapter_version": adapter.version, "schema_version": schema.version, "mode": mode, "ready": ready, "missing_required": missing, "decisions": decisions, "high_risk_actions_blocked": sorted(HIGH_RISK)}


def create_session(db: Session, product: Product, marketplace: str, *, mode: str = "review") -> AutofillSession:
    result = plan_autofill(db, product, marketplace, mode=mode)
    session = AutofillSession(seller_account_id=product.seller_account_id, product_id=product.id, marketplace=marketplace, mode=mode, state="planned", summary_json=json.dumps(result, ensure_ascii=False, separators=(",", ":")))
    db.add(session)
    db.flush()
    for decision in result["decisions"]:
        db.add(AutofillAction(session_id=session.id, field_name=decision["field"], canonical=decision["canonical"], action=decision["action"], proposed_value=json.dumps(decision["value"], ensure_ascii=False) if decision["value"] is not None else None, confidence=decision["confidence"], status=decision["status"], reason=decision["reason"]))
    if result["missing_required"]:
        for field in result["missing_required"]:
            db.add(AutofillError(session_id=session.id, code="REQUIRED_FIELD_MISSING", field_name=field, severity="blocker", message="Required marketplace field has no verified product value.", recoverable=False))
    db.commit()
    db.refresh(session)
    return session


def session_view(db: Session, session_id: int) -> dict[str, Any]:
    session = db.get(AutofillSession, session_id)
    if not session:
        raise ValueError("Autofill session not found")
    actions = db.scalars(select(AutofillAction).where(AutofillAction.session_id == session_id).order_by(AutofillAction.id)).all()
    errors = db.scalars(select(AutofillError).where(AutofillError.session_id == session_id).order_by(AutofillError.id)).all()
    return {"id": session.id, "product_id": session.product_id, "marketplace": session.marketplace, "mode": session.mode, "state": session.state, "summary": json.loads(session.summary_json or "{}"), "actions": [{"id": a.id, "field": a.field_name, "canonical": a.canonical, "action": a.action, "value": json.loads(a.proposed_value) if a.proposed_value else None, "confidence": a.confidence, "status": a.status, "verification_status": a.verification_status, "reason": a.reason} for a in actions], "errors": [{"id": e.id, "code": e.code, "field": e.field_name, "severity": e.severity, "message": e.message, "recoverable": e.recoverable} for e in errors]}
