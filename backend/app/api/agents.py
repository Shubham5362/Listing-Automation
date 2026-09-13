from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.agents.base import AgentTask
from app.agents.orchestrator import orchestrator
from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.core import SellerAccount, User
from app.schemas.agents import AgentListRead, AgentResultRead, AgentTaskCreate

router = APIRouter(prefix="/agents", tags=["agents"])


def _seller(db: Session, user: User, seller_account_id: int) -> SellerAccount:
    seller = db.scalar(select(SellerAccount).where(SellerAccount.id == seller_account_id, SellerAccount.user_id == user.id))
    if seller is None:
        raise HTTPException(status_code=404, detail="Seller account not found")
    return seller


@router.get("", response_model=AgentListRead)
def list_agents() -> AgentListRead:
    return AgentListRead(agents=orchestrator.available())


@router.post("/execute", response_model=AgentResultRead)
def execute_agent(payload: AgentTaskCreate, seller_account_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> AgentResultRead:
    _seller(db, user, seller_account_id)
    result = orchestrator.execute(seller_account_id, user.id, AgentTask(name=payload.agent, name=payload.task, input=payload.input, requires_approval=payload.requires_approval))
    return AgentResultRead(**result.__dict__)
