from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.reliability import set_kill_switch, system_health

router = APIRouter(prefix="/reliability", tags=["reliability"])

def seller_id() -> int:
    return 1

class KillSwitchIn(BaseModel):
    enabled: bool
    reason: str = Field(default="", max_length=1000)

@router.get("/health")
def health(db: Session = Depends(get_db)):
    return system_health(db, seller_id())

@router.post("/autonomous/kill-switch")
def update_kill_switch(payload: KillSwitchIn, db: Session = Depends(get_db)):
    row = set_kill_switch(db, seller_id(), payload.enabled, payload.reason)
    return {"enabled": row.enabled, "reason": row.reason, "status": "autonomous_paused" if row.enabled else "autonomous_resumed"}
