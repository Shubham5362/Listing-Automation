from __future__ import annotations

from difflib import SequenceMatcher
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.marketplace_expansion import MarketplaceCapability, MarketplaceConflict, MarketplaceExecution, MarketplaceFieldMapping

DEFAULT_CAPABILITIES = ("catalog", "listing", "inventory", "pricing", "orders", "returns", "media")


def confidence_for_mapping(source: str, target: str) -> float:
    a, b = source.lower().replace("_", " "), target.lower().replace("_", " ")
    if a == b:
        return 1.0
    if a in b or b in a:
        return 0.92
    return round(SequenceMatcher(None, a, b).ratio(), 2)


def register_capabilities(db: Session, marketplace: str, capabilities: dict[str, bool]) -> list[int]:
    ids: list[int] = []
    for name, supported in capabilities.items():
        row = db.scalar(select(MarketplaceCapability).where(MarketplaceCapability.marketplace == marketplace, MarketplaceCapability.capability == name))
        if row is None:
            row = MarketplaceCapability(marketplace=marketplace, capability=name, supported=supported, metadata={})
            db.add(row)
        else:
            row.supported = supported
        db.flush()
        ids.append(row.id)
    db.commit()
    return ids


def capability_map(db: Session, marketplace: str) -> dict[str, bool]:
    rows = db.scalars(select(MarketplaceCapability).where(MarketplaceCapability.marketplace == marketplace)).all()
    if not rows:
        return {name: True for name in DEFAULT_CAPABILITIES}
    return {row.capability: row.supported for row in rows}


def suggest_mapping(db: Session, marketplace: str, source_field: str, candidates: list[str]) -> dict[str, Any]:
    if not candidates:
        raise ValueError("At least one universal field candidate is required")
    scored = sorted(((candidate, confidence_for_mapping(source_field, candidate)) for candidate in candidates), key=lambda x: x[1], reverse=True)
    target, confidence = scored[0]
    status = "auto" if confidence >= 0.95 else "recommended" if confidence >= 0.80 else "review"
    row = db.scalar(select(MarketplaceFieldMapping).where(MarketplaceFieldMapping.marketplace == marketplace, MarketplaceFieldMapping.source_field == source_field))
    if row is None:
        row = MarketplaceFieldMapping(marketplace=marketplace, source_field=source_field, universal_field=target, confidence=confidence, status=status)
        db.add(row)
    else:
        row.universal_field, row.confidence, row.status = target, confidence, status
    db.commit()
    return {"marketplace": marketplace, "source_field": source_field, "universal_field": target, "confidence": confidence, "status": status}


def create_conflict(db: Session, seller_account_id: int, marketplace: str, entity_type: str, entity_id: str, field: str, source_value: dict, target_value: dict) -> MarketplaceConflict:
    row = MarketplaceConflict(seller_account_id=seller_account_id, marketplace=marketplace, entity_type=entity_type, entity_id=entity_id, field=field, source_value=source_value, target_value=target_value)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def execution_guard(capabilities: dict[str, bool], action: str, risk: str, confidence: float, autopilot_mode: str = "approval") -> tuple[bool, str]:
    capability = action.split(":", 1)[0]
    if not capabilities.get(capability, False):
        return False, "marketplace_capability_unsupported"
    if risk.lower() in {"high", "critical"}:
        return False, "high_risk_requires_approval"
    if confidence < 0.85:
        return False, "confidence_below_autonomous_threshold"
    if autopilot_mode != "auto":
        return False, "autopilot_mode_requires_approval"
    return True, "approved"


def record_execution(db: Session, seller_account_id: int, marketplace: str, action: str, external_id: str | None, status: str, confidence: float, risk: str, before_state: dict, after_state: dict, verified: bool = False, error: str | None = None) -> MarketplaceExecution:
    row = MarketplaceExecution(seller_account_id=seller_account_id, marketplace=marketplace, action=action, external_id=external_id, status=status, confidence=confidence, risk=risk, before_state=before_state, after_state=after_state, verified=verified, error=error)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row
