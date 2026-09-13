from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.core.security import CredentialEncryptionError, decrypt_credentials
from app.db.session import get_db
from app.integrations.base import MarketplaceAccountContext, MarketplaceIntegrationError
from app.integrations.factory import build_marketplace_client
from app.models.core import Marketplace, MarketplaceAccount, SellerAccount, User
from app.services.marketplace_sync import MarketplaceSyncError, sync_marketplace_account

router = APIRouter(prefix="/marketplaces", tags=["marketplaces"])


class ConnectionTestRequest(BaseModel):
    marketplace_account_id: int


@router.get("", response_model=list[str])
def supported_marketplaces() -> list[str]:
    return [marketplace.value for marketplace in Marketplace]


def _owned_account(db: Session, account_id: int, user_id: int) -> MarketplaceAccount:
    account = db.scalar(select(MarketplaceAccount).join(SellerAccount, SellerAccount.id == MarketplaceAccount.seller_account_id).where(MarketplaceAccount.id == account_id, SellerAccount.user_id == user_id))
    if not account:
        raise HTTPException(status_code=404, detail="Marketplace account not found")
    return account


def _credentials(account: MarketplaceAccount) -> dict[str, object] | None:
    if not account.credentials_ref:
        return None
    try:
        return decrypt_credentials(account.credentials_ref)
    except CredentialEncryptionError as exc:
        raise HTTPException(status_code=503, detail="Stored marketplace credentials are unavailable") from exc


@router.post("/connection-test")
def connection_test(payload: ConnectionTestRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> dict[str, object]:
    account = _owned_account(db, payload.marketplace_account_id, current_user.id)
    try:
        marketplace = Marketplace(account.marketplace)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail="Unsupported marketplace") from exc
    client = build_marketplace_client(marketplace, credentials=_credentials(account))
    context = MarketplaceAccountContext(account_id=account.id, marketplace=marketplace, external_account_id=account.external_account_id)
    try:
        connected = client.test_connection(context)
    except MarketplaceIntegrationError as exc:
        account.is_connected = False
        account.connection_error = str(exc)[:2000]
        db.commit()
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    account.is_connected = bool(connected)
    account.connection_error = None if connected else "Marketplace connection test failed"
    if connected:
        from datetime import datetime
        account.last_connected_at = datetime.utcnow()
    db.commit()
    return {"connected": bool(connected), "marketplace": marketplace.value, "account_id": account.id, "last_connected_at": account.last_connected_at}


@router.post("/{marketplace_account_id}/sync")
def sync_account(marketplace_account_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> dict[str, object]:
    account = _owned_account(db, marketplace_account_id, current_user.id)
    try:
        return sync_marketplace_account(db, account)
    except MarketplaceIntegrationError as exc:
        account.is_connected = False
        account.connection_error = str(exc)[:2000]
        db.commit()
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except MarketplaceSyncError as exc:
        account.connection_error = str(exc)[:2000]
        db.commit()
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.get("/{marketplace_account_id}/status")
def account_status(marketplace_account_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> dict[str, object]:
    account = _owned_account(db, marketplace_account_id, current_user.id)
    return {"id": account.id, "marketplace": account.marketplace, "display_name": account.display_name, "connected": account.is_connected, "credentials_configured": account.credentials_ref is not None, "connection_error": account.connection_error, "last_connected_at": account.last_connected_at, "last_sync_at": account.last_sync_at}
