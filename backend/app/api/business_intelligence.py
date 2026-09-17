from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.core import User
from app.services.business_intelligence import BusinessIntelligenceService

router = APIRouter(prefix="/analytics", tags=["business-intelligence"])


@router.get("/business-intelligence")
def business_intelligence(
    start: datetime | None = None,
    end: datetime | None = None,
    marketplace_account_id: int | None = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    try:
        return BusinessIntelligenceService(db, user).decision_report(
            start=start, end=end, marketplace_account_id=marketplace_account_id
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
