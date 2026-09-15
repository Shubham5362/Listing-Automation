from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.operations import BusinessHealthSnapshot, OperationAlert
from app.services.personal_marketplace import personal_seller_id
from app.services.operations_center import OperationsCenterService

router = APIRouter(prefix="/seller-operations", tags=["seller-operations"])


def _seller(db: Session) -> int:
    seller_id = personal_seller_id(db)
    if seller_id is None:
        raise HTTPException(status_code=503, detail="Personal seller workspace is not initialized")
    return seller_id


@router.get("/overview")
def operations_overview(refresh: bool = Query(default=True), db: Session = Depends(get_db)) -> dict:
    return OperationsCenterService(db, _seller(db)).overview(persist=refresh)


@router.post("/health/recalculate")
def recalculate_health(db: Session = Depends(get_db)) -> dict:
    data = OperationsCenterService(db, _seller(db)).overview(persist=True)
    return data["health"]


@router.get("/health/history")
def health_history(limit: int = Query(default=20, ge=1, le=100), db: Session = Depends(get_db)) -> list[dict]:
    seller_id = _seller(db)
    rows = db.scalars(select(BusinessHealthSnapshot).where(BusinessHealthSnapshot.seller_account_id == seller_id).order_by(BusinessHealthSnapshot.created_at.desc()).limit(limit)).all()
    return [{"id": r.id, "overall_score": r.overall_score, "components": {"listing": r.listing_score, "inventory": r.inventory_score, "orders": r.order_score, "pricing": r.pricing_score, "compliance": r.compliance_score, "diagnostics": r.diagnostics_score, "images": r.image_score}, "reasons": __import__("json").loads(r.reason_json), "created_at": r.created_at.isoformat()} for r in rows]


@router.get("/alerts")
def alerts(include_read: bool = Query(default=False), limit: int = Query(default=50, ge=1, le=100), db: Session = Depends(get_db)) -> list[dict]:
    seller_id = _seller(db)
    stmt = select(OperationAlert).where(OperationAlert.seller_account_id == seller_id)
    if not include_read:
        stmt = stmt.where(OperationAlert.is_read.is_(False))
    rows = db.scalars(stmt.order_by(OperationAlert.created_at.desc()).limit(limit)).all()
    return [{"id": r.id, "severity": r.severity, "title": r.title, "message": r.message, "source": r.source, "is_read": r.is_read, "created_at": r.created_at.isoformat()} for r in rows]


@router.post("/alerts/{alert_id}/read")
def mark_alert_read(alert_id: int, db: Session = Depends(get_db)) -> dict:
    seller_id = _seller(db)
    row = db.scalar(select(OperationAlert).where(OperationAlert.id == alert_id, OperationAlert.seller_account_id == seller_id))
    if not row:
        raise HTTPException(status_code=404, detail="Alert not found")
    row.is_read = True
    db.commit()
    return {"id": row.id, "is_read": True}
