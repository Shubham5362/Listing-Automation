from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.core import SellerAccount, User
from app.schemas.ai_command import AICommandCreate, AICommandHistoryRead, AICommandRead
from app.services.ai_command import list_commands, run_command

router = APIRouter(prefix="/ai/commands", tags=["ai-command-center"])


def _seller(db: Session, user: User, seller_account_id: int) -> SellerAccount:
    seller = db.scalar(select(SellerAccount).where(SellerAccount.id == seller_account_id, SellerAccount.user_id == user.id))
    if seller is None:
        raise HTTPException(status_code=404, detail="Seller account not found")
    return seller


def _read(command) -> AICommandRead:
    response = command.response
    return AICommandRead(
        id=command.id,
        query=command.query,
        intent=command.intent,
        status=command.status,
        trace_id=command.trace_id,
        answer=response.get("answer", ""),
        evidence=response.get("evidence", []),
        recommendations=response.get("recommendations", []),
        actions=response.get("actions", []),
        created_at=command.created_at.isoformat(),
    )


@router.post("", response_model=AICommandRead)
def execute_command(payload: AICommandCreate, seller_account_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> AICommandRead:
    _seller(db, user, seller_account_id)
    command = run_command(db, user, seller_account_id, payload)
    return _read(command)


@router.get("/history", response_model=AICommandHistoryRead)
def command_history(seller_account_id: int, limit: int = 20, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> AICommandHistoryRead:
    _seller(db, user, seller_account_id)
    if not 1 <= limit <= 100:
        raise HTTPException(status_code=400, detail="limit must be between 1 and 100")
    return AICommandHistoryRead(commands=[_read(command) for command in list_commands(db, user, seller_account_id, limit)])
