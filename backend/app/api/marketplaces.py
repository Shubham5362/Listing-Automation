from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.integrations.base import MarketplaceAccountContext
from app.integrations.factory import build_marketplace_client
from app.models.core import Marketplace, MarketplaceAccount, User
from app.services.auth import get_user_by_token

router = APIRouter(prefix="/marketplaces", tags=["marketplaces"])
bearer = HTTPBearer(auto_error=False)


class ConnectionTestRequest(BaseModel):
    marketplace_account_id: int


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    if not credentials:
        raise HTTPException(status_code=401, detail="Authentication required")
    user = get_user_by_token(db, credentials.credentials)
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
    account = db.get(MarketplaceAccount, payload.marketplace_account_id)
    if not account:
        raise HTTPException(status_code=404, detail="Marketplace account not found")
    try:
        marketplace = Marketplace(account.marketplace)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail="Unsupported marketplace") from exc
    client = build_marketplace_client(marketplace, use_mock=True)
    context = MarketplaceAccountContext(
        account_id=account.id,
        marketplace=marketplace,
        external_account_id=account.external_account_id,
    )
    return {"connected": client.test_connection(context), "marketplace": marketplace.value}
