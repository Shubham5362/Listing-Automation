from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.core import User
from app.services.predictive_intelligence import PredictiveSellerIntelligence

router = APIRouter(prefix="/predictive", tags=["predictive-intelligence"])


class AutopilotRequest(BaseModel):
    mode: str = "recommend"


@router.get("/report")
def predictive_report(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    try:
        return PredictiveSellerIntelligence(db, user).report()
    except (ValueError, LookupError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/predictions")
def persist_predictions(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    rows = PredictiveSellerIntelligence(db, user).persist_predictions()
    return {"count": len(rows), "predictions": [{"id": row.id, "type": row.prediction_type, "score": row.score, "confidence": row.confidence, "title": row.title} for row in rows]}


@router.post("/autopilot/run")
def run_autopilot(payload: AutopilotRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    try:
        return PredictiveSellerIntelligence(db, user).run_autopilot(payload.mode)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
