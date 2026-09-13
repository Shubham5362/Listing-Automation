from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.api.notifications import _seller
from app.core.observability import metrics_snapshot
from app.db.session import get_db
from app.models.core import User
from app.services.monitoring import MonitoringService

router = APIRouter(prefix="/monitoring", tags=["monitoring"])
service = MonitoringService()


@router.get("/snapshot")
def snapshot():
    return {"status": "ok", "metrics": metrics_snapshot(), "alerts": service.evaluate()}


@router.get("/alerts")
def alerts():
    return {"alerts": service.evaluate()}


@router.post("/alerts/dispatch")
def dispatch_alerts(seller_account_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    _seller(db, user, seller_account_id)
    current = service.evaluate()
    if not current:
        return {"status": "clear", "alerts": [], "dispatched": 0}
    service.dispatch(db, seller_account_id, user.id, current)
    return {"status": "alerting", "alerts": current, "dispatched": len(current)}
