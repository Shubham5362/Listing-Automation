from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.core.security import CredentialEncryptionError, decrypt_credentials
from app.db.session import get_db
from app.integrations.base import MarketplaceAccountContext, MarketplaceIntegrationError
from app.integrations.factory import build_marketplace_client
from app.models.core import Marketplace, MarketplaceAccount, SellerAccount, User

router = APIRouter(prefix="/marketplaces", tags=["marketplaces"])
bearer = HTTPBearer(auto_error=False)


class ConnectionTestRequest(__import__("pydantic").BaseModel):
    marketplace_account_id: int


def get_current_user_legacy(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    if not credentials:
        raise HTTPException(status_code=401, detail="Authentication required")
    user = __import__("app.services.auth", fromlist=["get_user_by_token"]).get_user_by_token(db, credentials.credentials)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    return user


@router.get("", response_model=list[str])
def supported_marketplaces() -> list[str]:
    return [marketplace.value for marketplace in Marketplace]


@router.post("/connection-test")
def connection_test(
    payload: ConnectionTestRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, object]:
    account = db.scalar(
        select(MarketplaceAccount)
        .join(SellerAccount, SellerAccount.id == MarketplaceAccount.seller_account_id)
        .where(MarketplaceAccount.id == payload.marketplace_account_id, SellerAccount.user_id == current_user.id)
    )
    if not account:
        raise HTTPException(status_code=404, detail="Marketplace account not found")
    try:
        marketplace = Marketplace(account.marketplace)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail="Unsupported marketplace") from exc
    credentials = None
    if account.credentials_ref:
        try:
            credentials = decrypt_credentials(account.credentials_ref)
        except CredentialEncryptionError as exc:
            raise HTTPException(status_code=503, detail="Stored marketplace credentials are unavailable") from exc
    client = build_marketplace_client(marketplace, credentials=credentials)
    context = MarketplaceAccountContext(
        account_id=account.id,
        marketplace=marketplace,
        external_account_id=account.external_account_id,
    )
    try:
        connected = client.test_connection(context)
    except MarketplaceIntegrationError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    return {"connected": connected, "marketplace": marketplace.value, "account_id": account.id}
