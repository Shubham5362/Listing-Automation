from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.dependencies import get_current_user
from app.models.core import SellerAccount, User
from sqlalchemy import select
from app.services.reliability import set_kill_switch, system_health

router = APIRouter(prefix="/reliability", tags=["reliability"])

def seller_id(db: Session, user: User) -> int:
    seller = db.scalar(select(SellerAccount.id).where(SellerAccount.user_id == user.id, SellerAccount.is_active.is_(True)).order_by(SellerAccount.id.asc()))
    if seller is None:
        raise HTTPException(status_code=404, detail="Seller account not found")
    return int(seller)

class KillSwitchIn(BaseModel):
    enabled: bool
    reason: str = Field(default="", max_length=1000)

@router.get("/health")
def health(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return system_health(db, seller_id(db, user))

@router.post("/autonomous/kill-switch")
def update_kill_switch(payload: KillSwitchIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    row = set_kill_switch(db, seller_id(db, user), payload.enabled, payload.reason)
    return {"enabled": row.enabled, "reason": row.reason, "status": "autonomous_paused" if row.enabled else "autonomous_resumed"}
