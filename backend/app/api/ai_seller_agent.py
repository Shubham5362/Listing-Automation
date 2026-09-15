from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.core import User
from app.services.ai_seller_agent import AISellerAgentService
from app.services.llm_gateway import LLMUnavailable

router = APIRouter(prefix="/ai/seller-agent", tags=["ai-seller-agent"])


class ConversationMessage(BaseModel):
    role: str = Field(pattern="^(user|assistant)$")
    content: str = Field(min_length=1, max_length=4000)


class SellerAgentChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    conversation: list[ConversationMessage] = Field(default_factory=list, max_length=12)


@router.post("/chat")
def seller_agent_chat(
    payload: SellerAgentChatRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    try:
        result = AISellerAgentService(db, user).chat(
            payload.message,
            [item.model_dump() for item in payload.conversation],
        )
        return {"answer": result.text, "provider": result.provider, "model": result.model}
    except LLMUnavailable as exc:
        raise HTTPException(status_code=503, detail="AI provider temporarily unavailable. Please try again shortly.") from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/assess")
def assess_seller(
    start: datetime | None = None,
    end: datetime | None = None,
    marketplace_account_id: int | None = None,
    horizon: str = Query("daily", pattern="^(daily|weekly)$"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    try:
        return AISellerAgentService(db, user).assess(
            start=start, end=end, marketplace_account_id=marketplace_account_id, horizon=horizon
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
