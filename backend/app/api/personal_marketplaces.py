from __future__ import annotations

from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import CredentialEncryptionError, decrypt_credentials
from app.db.session import get_db
from app.integrations.base import MarketplaceAccountContext, MarketplaceIntegrationError
from app.integrations.factory import build_marketplace_client
from app.models.core import Marketplace, MarketplaceAccount, SellerAccount
from app.models.marketplace_sync import MarketplaceSyncRun
from app.services.jobs import enqueue_job
from app.services.personal_marketplace import ensure_personal_marketplaces, personal_marketplace_account

router = APIRouter(prefix="/personal/marketplaces", tags=["personal-marketplaces"])


def _credentials(account: MarketplaceAccount) -> dict[str, object] | None:
    if not account.credentials_ref:
        return None
    try:
        return decrypt_credentials(account.credentials_ref)
    except CredentialEncryptionError as exc:
        raise HTTPException(status_code=503, detail="Stored marketplace credentials are unavailable") from exc


def _account_or_404(db: Session, account_id: int) -> MarketplaceAccount:
    account = personal_marketplace_account(db, account_id)
    if not account:
        raise HTTPException(status_code=404, detail="Personal marketplace account not found")
    return account


def _serialize(account: MarketplaceAccount) -> dict[str, Any]:
    return {
        "id": account.id,
        "marketplace": account.marketplace,
        "display_name": account.display_name,
        "external_account_id": account.external_account_id,
        "credentials_configured": bool(account.credentials_ref),
        "connected": account.is_connected,
        "connection_error": account.connection_error,
        "last_connected_at": account.last_connected_at,
        "last_sync_at": account.last_sync_at,
    }


@router.get("")
def list_personal_marketplaces(db: Session = Depends(get_db)) -> list[dict[str, Any]]:
    ensure_personal_marketplaces(db, get_settings())
    seller_id = db.scalar(select(SellerAccount.id).where(SellerAccount.user_id.is_(None)).order_by(SellerAccount.id.asc()))
    if seller_id is None:
        return []
    accounts = list(db.scalars(select(MarketplaceAccount).where(MarketplaceAccount.seller_account_id == seller_id).order_by(MarketplaceAccount.marketplace)).all())
    return [_serialize(account) for account in accounts]


@router.post("/bootstrap")
def bootstrap_personal_marketplaces(db: Session = Depends(get_db)) -> list[dict[str, Any]]:
    accounts = ensure_personal_marketplaces(db, get_settings())
    return [_serialize(account) for account in accounts]


@router.post("/{account_id}/test")
def test_personal_marketplace(account_id: int, db: Session = Depends(get_db)) -> dict[str, Any]:
    account = _account_or_404(db, account_id)
    try:
        marketplace = Marketplace(account.marketplace)
        client = build_marketplace_client(marketplace, credentials=_credentials(account))
        context = MarketplaceAccountContext(account_id=account.id, marketplace=marketplace, external_account_id=account.external_account_id)
        connected = bool(client.test_connection(context))
    except MarketplaceIntegrationError as exc:
        account.is_connected = False
        account.connection_error = str(exc)[:2000]
        db.commit()
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    account.is_connected = connected
    account.connection_error = None if connected else "Marketplace connection test failed"
    if connected:
        account.last_connected_at = datetime.utcnow()
    db.commit()
    return _serialize(account)


@router.post("/{account_id}/sync", status_code=202)
def queue_personal_sync(account_id: int, db: Session = Depends(get_db)) -> dict[str, Any]:
    account = _account_or_404(db, account_id)
    try:
        job = enqueue_job(db, "marketplace_sync", {"marketplace_account_id": account.id}, seller_account_id=account.seller_account_id)
    except Exception as exc:
        raise HTTPException(status_code=503, detail="Unable to queue marketplace sync") from exc
    return {"job_id": job.id, "status": job.status, "marketplace_account_id": account.id}


@router.get("/{account_id}/sync-runs")
def personal_sync_runs(account_id: int, limit: int = 20, db: Session = Depends(get_db)) -> list[dict[str, Any]]:
    account = _account_or_404(db, account_id)
    safe_limit = min(max(limit, 1), 100)
    runs = db.scalars(select(MarketplaceSyncRun).where(MarketplaceSyncRun.marketplace_account_id == account.id).order_by(MarketplaceSyncRun.id.desc()).limit(safe_limit)).all()
    return [{"id": run.id, "status": run.status, "result": run.result, "error": run.error, "started_at": run.started_at, "finished_at": run.finished_at, "created_at": run.created_at} for run in runs]
