from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.core.security import CredentialEncryptionError, encrypt_credentials
from app.db.session import get_db
from app.models.core import MarketplaceAccount, SellerAccount, User
from app.marketplaces.catalog import get_channel_catalog_item

router = APIRouter(prefix="/accounts", tags=["accounts"])


class SellerAccountCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)


class MarketplaceAccountCreate(BaseModel):
    seller_account_id: int
    marketplace: str = Field(min_length=1, max_length=80)
    display_name: str = Field(min_length=1, max_length=200)
    external_account_id: str | None = None
    credentials: dict[str, object] | None = None


class MarketplaceCredentialsUpdate(BaseModel):
    credentials: dict[str, object] = Field(min_length=1)


@router.post("/sellers", status_code=201)
def create_seller_account(payload: SellerAccountCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict[str, object]:
    account = SellerAccount(user_id=user.id, name=payload.name.strip())
    db.add(account)
    db.commit()
    db.refresh(account)
    return {"id": account.id, "name": account.name, "is_active": account.is_active}


@router.get("/sellers")
def list_seller_accounts(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[dict[str, object]]:
    accounts = db.scalars(select(SellerAccount).where(SellerAccount.user_id == user.id).order_by(SellerAccount.id)).all()
    return [{"id": a.id, "name": a.name, "is_active": a.is_active} for a in accounts]


@router.post("/marketplaces", status_code=201)
def create_marketplace_account(payload: MarketplaceAccountCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict[str, object]:
    seller = db.scalar(select(SellerAccount).where(SellerAccount.id == payload.seller_account_id, SellerAccount.user_id == user.id))
    if not seller:
        raise HTTPException(status_code=404, detail="Seller account not found")
    marketplace_value = payload.marketplace.strip().lower()
    if marketplace_value not in {marketplace.value for marketplace in Marketplace}:
        raise HTTPException(status_code=422, detail="Unsupported marketplace")
    credentials_ref = None
    if payload.credentials is not None:
        try:
            credentials_ref = encrypt_credentials(payload.credentials)
        except CredentialEncryptionError as exc:
            raise HTTPException(status_code=503, detail=str(exc)) from exc
    account = MarketplaceAccount(seller_account_id=seller.id, marketplace=marketplace_value, display_name=payload.display_name.strip(), external_account_id=payload.external_account_id, credentials_ref=credentials_ref)
    db.add(account)
    db.commit()
    db.refresh(account)
    return {"id": account.id, "seller_account_id": account.seller_account_id, "marketplace": account.marketplace, "display_name": account.display_name, "credentials_configured": credentials_ref is not None, "connected": account.is_connected, "last_sync_at": account.last_sync_at}


@router.put("/marketplaces/{marketplace_account_id}/credentials")
def update_marketplace_credentials(marketplace_account_id: int, payload: MarketplaceCredentialsUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict[str, object]:
    account = db.scalar(select(MarketplaceAccount).join(SellerAccount, SellerAccount.id == MarketplaceAccount.seller_account_id).where(MarketplaceAccount.id == marketplace_account_id, SellerAccount.user_id == user.id))
    if not account:
        raise HTTPException(status_code=404, detail="Marketplace account not found")
    try:
        account.credentials_ref = encrypt_credentials(payload.credentials)
    except CredentialEncryptionError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    account.is_connected = False
    account.connection_error = None
    account.last_connected_at = None
    db.add(account)
    db.commit()
    return {"id": account.id, "credentials_configured": True, "connected": False, "last_sync_at": account.last_sync_at}
