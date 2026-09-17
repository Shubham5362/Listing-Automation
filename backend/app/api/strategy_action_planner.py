from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.core import User
from app.services.strategy_action_planner import StrategyActionPlannerService

router = APIRouter(prefix="/strategy", tags=["strategy"])


@router.get("/action-plan")
def action_plan(
    start: datetime | None = None,
    end: datetime | None = None,
    marketplace_account_id: int | None = None,
    horizon: str = Query("daily", pattern="^(daily|weekly)$"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    try:
        return StrategyActionPlannerService(db, user).plan(
            start=start, end=end, marketplace_account_id=marketplace_account_id, horizon=horizon
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
