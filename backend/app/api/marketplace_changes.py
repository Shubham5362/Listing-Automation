from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.core import User
from app.models.marketplace_change import MarketplaceSchemaChange
from app.services.marketplace_change import apply_change, list_changes, rollback_mapping, scan_marketplace, set_change_status

router = APIRouter(prefix="/marketplace-changes", tags=["marketplace-change-watcher"])

class ScanRequest(BaseModel):
    marketplace: str = Field(min_length=2, max_length=50)
    category: str | None = Field(default=None, max_length=200)

class RollbackRequest(BaseModel):
    marketplace: str = Field(min_length=2, max_length=50)
    category: str = Field(min_length=1, max_length=200)
    canonical: str = Field(min_length=1, max_length=100)

@router.get("")
def changes(marketplace: str | None = None, status: str | None = None, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> list[dict[str, Any]]:
    return list_changes(db, marketplace, status)

@router.post("/scan")
def scan(payload: ScanRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> dict[str, Any]:
    try: return scan_marketplace(db, payload.marketplace, payload.category)
    except ValueError as exc: raise HTTPException(404, str(exc)) from exc

@router.get("/{change_id}")
def change(change_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> dict[str, Any]:
    row = db.get(MarketplaceSchemaChange, change_id)
    if not row: raise HTTPException(404, "Marketplace change not found")
    return {"id":row.id,"marketplace":row.marketplace,"category":row.category,"change_type":row.change_type,"field_name":row.field_name,"canonical":row.canonical,"confidence":row.confidence,"severity":row.severity,"status":row.status,"auto_adaptable":row.auto_adaptable,"reason":row.reason,"old":row.old_value_json,"new":row.new_value_json,"created_at":row.created_at.isoformat()}

@router.post("/{change_id}/review")
def review(change_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> dict[str, Any]:
    try: return set_change_status(db, change_id, "review_required")
    except ValueError as exc: raise HTTPException(404, str(exc)) from exc

@router.post("/{change_id}/reject")
def reject(change_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> dict[str, Any]:
    try: return set_change_status(db, change_id, "rejected")
    except ValueError as exc: raise HTTPException(404, str(exc)) from exc

@router.post("/{change_id}/apply")
def apply(change_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> dict[str, Any]:
    try: return apply_change(db, change_id)
    except ValueError as exc: raise HTTPException(409, str(exc)) from exc

@router.post("/rollback")
def rollback(payload: RollbackRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> dict[str, Any]:
    try: return rollback_mapping(db, payload.marketplace, payload.category, payload.canonical)
    except ValueError as exc: raise HTTPException(409, str(exc)) from exc
