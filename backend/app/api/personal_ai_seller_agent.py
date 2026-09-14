from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.core import AuditLog
from app.services.personal_ai_seller_agent import PersonalAISellerAgentService

router = APIRouter(prefix="/personal/ai/seller-agent", tags=["personal-ai-seller-agent"])


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    create_plan: bool = False


def _agent(db: Session) -> PersonalAISellerAgentService:
    try:
        return PersonalAISellerAgentService(db)
    except LookupError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@router.get("/context")
def context(db: Session = Depends(get_db)) -> dict:
    return _agent(db).context()


@router.get("/brief")
def brief(db: Session = Depends(get_db)) -> dict:
    return _agent(db).brief()


@router.get("/recommendations")
def recommendations(limit: int = 10, db: Session = Depends(get_db)) -> dict:
    if limit < 1 or limit > 50:
        raise HTTPException(status_code=400, detail="limit must be between 1 and 50")
    return {"recommendations": _agent(db).recommendations(limit)}


@router.post("/chat")
def chat(request: ChatRequest, db: Session = Depends(get_db)) -> dict:
    try:
        return _agent(db).chat(request.message, request.create_plan)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/history")
def history(limit: int = 50, db: Session = Depends(get_db)) -> list[dict]:
    if limit < 1 or limit > 100:
        raise HTTPException(status_code=400, detail="limit must be between 1 and 100")
    rows = db.scalars(select(AuditLog).where(AuditLog.resource_type == "ai_agent", AuditLog.action == "ai_agent.chat").order_by(AuditLog.created_at.desc()).limit(limit)).all()
    return [{"id": row.id, "action": row.action, "details": row.details, "created_at": row.created_at.isoformat()} for row in rows]
