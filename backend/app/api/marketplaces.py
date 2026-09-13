from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.api.auth import get_current_user
from app.integrations.base import MarketplaceAccountContext
from app.integrations.factory import build_marketplace_client
from app.models.core import Marketplace, MarketplaceAccount, User
from app.db.session import get_db
from sqlalchemy.orm import Session

router = APIRouter(prefix="/marketplaces", tags=["marketplaces"])


class ConnectionTestRequest(BaseModel):
    marketplace_account_id: int


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
    client = build_marketplace_client(Marketplace(account.marketplace), use_mock=True)
    context = MarketplaceAccountContext(
        account_id=account.id,
        marketplace=Marketplace(account.marketplace),
        external_account_id=account.external_account_id,
    )
    return {"connected": client.test_connection(context), "marketplace": account.marketplace}
