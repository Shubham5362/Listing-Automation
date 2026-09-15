from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.core import User
from app.services.advanced_business_intelligence import AdvancedBusinessIntelligenceService

router = APIRouter(prefix="/bi", tags=["advanced-business-intelligence"])


class ScenarioRequest(BaseModel):
    scenario_type: str = Field(pattern="^(price|ad_spend|discount|units)$")
    change_percent: float = Field(ge=-50, le=50)
    start: datetime | None = None
    end: datetime | None = None
    marketplace_account_id: int | None = None


@router.get("/overview")
def overview(start: datetime | None = None, end: datetime | None = None, marketplace_account_id: int | None = None, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    try:
        return AdvancedBusinessIntelligenceService(db, user).report(start, end, marketplace_account_id)
    except (ValueError, LookupError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/scenario")
def scenario(payload: ScenarioRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    try:
        return AdvancedBusinessIntelligenceService(db, user).simulate(payload.scenario_type, payload.change_percent, payload.start, payload.end, payload.marketplace_account_id)
    except (ValueError, LookupError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
