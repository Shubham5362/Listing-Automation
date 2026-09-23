from __future__ import annotations
import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.catalog import Product
from app.models.core import MarketplaceAccount, SellerAccount, User
from app.models.diagnostic import Diagnostic, DiagnosticStatus
from app.schemas.diagnostic import DiagnosticRead, DiagnosticScanRequest
from app.services.diagnostics import execute_fix, persist_findings, scan_product

router = APIRouter(prefix="/diagnostics", tags=["diagnostics"])

def _read(row: Diagnostic) -> DiagnosticRead:
    return DiagnosticRead(id=row.id, product_id=row.product_id, listing_id=row.listing_id, marketplace_account_id=row.marketplace_account_id, code=row.code, category=row.category, severity=row.severity, status=row.status, title=row.title, message=row.message, root_cause=row.root_cause, impact=json.loads(row.impact_json), proposed_fix=json.loads(row.proposed_fix_json), confidence=row.confidence, fix_risk=row.fix_risk, auto_fixable=row.auto_fixable)

def _owned(db: Session, user: User, diagnostic_id: int) -> Diagnostic:
    row = db.scalar(select(Diagnostic).join(SellerAccount, SellerAccount.id == Diagnostic.seller_account_id).where(Diagnostic.id == diagnostic_id, SellerAccount.user_id == user.id))
    if not row: raise HTTPException(status_code=404, detail="Diagnostic not found")
    return row

@router.post("/scan", response_model=list[DiagnosticRead])
def scan(payload: DiagnosticScanRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    stmt = select(Product).join(SellerAccount, SellerAccount.id == Product.seller_account_id).where(SellerAccount.user_id == user.id, Product.is_active.is_(True))
    if payload.product_id: stmt = stmt.where(Product.id == payload.product_id)
    products = db.scalars(stmt).all()
    account = None
    if payload.marketplace_account_id:
        account = db.scalar(select(MarketplaceAccount).join(SellerAccount, SellerAccount.id == MarketplaceAccount.seller_account_id).where(MarketplaceAccount.id == payload.marketplace_account_id, SellerAccount.user_id == user.id))
        if not account: raise HTTPException(status_code=404, detail="Marketplace account not found")
    grouped = {}
    for product in products: grouped.setdefault(product.seller_account_id, []).extend(scan_product(db, product, account))
    rows = []
    for seller_id, findings in grouped.items(): rows.extend(persist_findings(db, seller_id, findings))
    return [_read(row) for row in rows]

@router.get("", response_model=list[DiagnosticRead])
def list_diagnostics(severity: str | None = None, status: str | None = None, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    stmt = select(Diagnostic).join(SellerAccount, SellerAccount.id == Diagnostic.seller_account_id).where(SellerAccount.user_id == user.id).order_by(Diagnostic.created_at.desc())
    if severity: stmt = stmt.where(Diagnostic.severity == severity)
    if status: stmt = stmt.where(Diagnostic.status == status)
    return [_read(row) for row in db.scalars(stmt).all()]

@router.get("/summary")
def summary(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    stmt = select(Diagnostic.severity, func.count(Diagnostic.id)).join(SellerAccount, SellerAccount.id == Diagnostic.seller_account_id).where(SellerAccount.user_id == user.id, Diagnostic.status.not_in([DiagnosticStatus.VERIFIED.value, DiagnosticStatus.IGNORED.value])).group_by(Diagnostic.severity)
    counts = {severity: count for severity, count in db.execute(stmt).all()}
    return {"critical": counts.get("critical", 0), "high": counts.get("high", 0), "medium": counts.get("medium", 0), "low": counts.get("low", 0), "info": counts.get("info", 0), "total": sum(counts.values())}

@router.get("/{diagnostic_id}", response_model=DiagnosticRead)
def get_diagnostic(diagnostic_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return _read(_owned(db, user, diagnostic_id))

@router.post("/{diagnostic_id}/fix", response_model=DiagnosticRead)
def fix(diagnostic_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    row = _owned(db, user, diagnostic_id)
    try:
        execute_fix(db, row, user.id)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    db.refresh(row)
    return _read(row)

@router.post("/{diagnostic_id}/ignore", response_model=DiagnosticRead)
def ignore(diagnostic_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    row = _owned(db, user, diagnostic_id)
    if row.status in {DiagnosticStatus.VERIFIED.value, DiagnosticStatus.FIXING.value}: raise HTTPException(status_code=409, detail="Diagnostic cannot be ignored in its current state")
    row.status = DiagnosticStatus.IGNORED.value
    db.commit(); db.refresh(row)
    return _read(row)
