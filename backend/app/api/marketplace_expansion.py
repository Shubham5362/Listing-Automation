from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.core import SellerAccount, User
from app.models.marketplace_expansion import MarketplaceConflict, MarketplaceExecution
from app.marketplaces.catalog import list_channel_catalog
from app.services.marketplace_expansion import capability_map, create_conflict, execution_guard, register_capabilities, suggest_mapping

router = APIRouter(prefix="/marketplace-expansion", tags=["marketplace-expansion"])


class CapabilityRequest(BaseModel):
    capabilities: dict[str, bool] = Field(default_factory=dict)


class MappingRequest(BaseModel):
    source_field: str
    candidates: list[str] = Field(min_length=1)


class ConflictRequest(BaseModel):
    marketplace: str
    entity_type: str
    entity_id: str
    field: str
    source_value: dict[str, Any] = Field(default_factory=dict)
    target_value: dict[str, Any] = Field(default_factory=dict)


class GuardRequest(BaseModel):
    action: str
    risk: str = "low"
    confidence: float = Field(ge=0, le=1)
    autopilot_mode: str = "approval"


@router.get("/catalog")
def channel_catalog() -> list[dict[str, object]]:
    """Return the channels SellerHub can model without implying a live adapter exists."""
    return list_channel_catalog()


@router.post("/capabilities/{marketplace}")
def save_capabilities(marketplace: str, payload: CapabilityRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return {"marketplace": marketplace, "capability_ids": register_capabilities(db, marketplace, payload.capabilities)}


@router.get("/capabilities/{marketplace}")
def get_capabilities(marketplace: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return {"marketplace": marketplace, "capabilities": capability_map(db, marketplace)}


@router.post("/mapping/{marketplace}")
def mapping(marketplace: str, payload: MappingRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return suggest_mapping(db, marketplace, payload.source_field, payload.candidates)


@router.post("/conflicts")
def conflicts(payload: ConflictRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    seller = db.scalar(select(SellerAccount).where(SellerAccount.user_id == current_user.id))
    if seller is None:
        raise HTTPException(404, "Seller account not found")
    row = create_conflict(db, seller.id, **payload.model_dump())
    return {"id": row.id, "status": row.status, "marketplace": row.marketplace}


@router.get("/conflicts")
def list_conflicts(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    seller = db.scalar(select(SellerAccount).where(SellerAccount.user_id == current_user.id))
    if seller is None:
        return []
    rows = db.scalars(select(MarketplaceConflict).where(MarketplaceConflict.seller_account_id == seller.id).order_by(MarketplaceConflict.id.desc())).all()
    return [{"id": r.id, "marketplace": r.marketplace, "entity_type": r.entity_type, "entity_id": r.entity_id, "field": r.field, "status": r.status, "created_at": r.created_at} for r in rows]


@router.post("/execution/guard/{marketplace}")
def guard(marketplace: str, payload: GuardRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    allowed, reason = execution_guard(capability_map(db, marketplace), payload.action, payload.risk, payload.confidence, payload.autopilot_mode)
    return {"marketplace": marketplace, "allowed": allowed, "reason": reason}


@router.get("/execution")
def execution_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    seller = db.scalar(select(SellerAccount).where(SellerAccount.user_id == current_user.id))
    if seller is None:
        return []
    rows = db.scalars(select(MarketplaceExecution).where(MarketplaceExecution.seller_account_id == seller.id).order_by(MarketplaceExecution.id.desc())).all()
    return [{"id": r.id, "marketplace": r.marketplace, "action": r.action, "status": r.status, "risk": r.risk, "confidence": r.confidence, "verified": r.verified, "error": r.error} for r in rows]
