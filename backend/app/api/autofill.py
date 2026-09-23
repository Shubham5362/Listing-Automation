from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.catalog import Product
from app.models.core import SellerAccount, User
from app.models.autofill import AutofillSession
from app.models.autofill_clarification import AutofillClarification
from app.services.autofill import create_session, plan_autofill, session_view
from app.services.autofill_clarification import answer_clarification, list_clarifications, skip_clarification

router = APIRouter(prefix="/autofill", tags=["adaptive-autofill"])

class AutofillCreateRequest(BaseModel):
    product_id: int
    marketplace: str = Field(min_length=2, max_length=50)
    mode: str = Field(default="review", pattern="^(draft|review|auto|strict)$")
    page_fields: list[dict[str, Any]] | None = None

class ClarificationAnswerRequest(BaseModel):
    value: Any
    canonical: str | None = Field(default=None, max_length=100)

def owned_product(db: Session, product_id: int, user: User) -> Product:
    product = db.scalar(select(Product).join(SellerAccount, SellerAccount.id == Product.seller_account_id).where(Product.id == product_id, SellerAccount.user_id == user.id))
    if not product:
        raise HTTPException(404, "Product not found")
    return product

def owned_session(db: Session, session_id: int, user: User) -> AutofillSession:
    session = db.get(AutofillSession, session_id)
    if not session:
        raise HTTPException(404, "Autofill session not found")
    product = owned_product(db, session.product_id, user)
    if product.seller_account_id != session.seller_account_id:
        raise HTTPException(403, "Session access denied")
    return session

def question_view(q: AutofillClarification) -> dict[str, Any]:
    import json
    return {"id": q.id, "field": q.field_label, "marketplace_field": q.marketplace_field, "canonical": q.canonical, "reason": q.reason_code, "prompt": q.prompt, "expected_input_type": q.expected_input_type, "unit": q.unit, "options": json.loads(q.options_json or "[]"), "required": q.required, "confidence_before": q.confidence_before, "status": q.status, "answer": json.loads(q.normalized_answer) if q.normalized_answer else None}

@router.post("/plan")
def plan(payload: AutofillCreateRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> dict[str, Any]:
    product = owned_product(db, payload.product_id, user)
    return plan_autofill(db, product, payload.marketplace, mode=payload.mode, page_fields=payload.page_fields)

@router.post("/sessions")
def start(payload: AutofillCreateRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> dict[str, Any]:
    product = owned_product(db, payload.product_id, user)
    session = create_session(db, product, payload.marketplace, mode=payload.mode, page_fields=payload.page_fields)
    return session_view(db, session.id)

@router.get("/sessions/{session_id}")
def get_session(session_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> dict[str, Any]:
    owned_session(db, session_id, user)
    return session_view(db, session_id)

@router.get("/sessions/{session_id}/questions")
def questions(session_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> dict[str, Any]:
    owned_session(db, session_id, user)
    items = list_clarifications(db, session_id)
    return {"session_id": session_id, "questions": [question_view(q) for q in items]}

@router.get("/sessions/{session_id}/next-question")
def next_question(session_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> dict[str, Any]:
    owned_session(db, session_id, user)
    pending = list_clarifications(db, session_id, status="pending")
    pending.sort(key=lambda q: (not q.required, q.id))
    return {"session_id": session_id, "question": question_view(pending[0]) if pending else None}

@router.post("/sessions/{session_id}/questions/{question_id}/answer")
def answer(session_id: int, question_id: int, payload: ClarificationAnswerRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> dict[str, Any]:
    owned_session(db, session_id, user)
    question = db.scalar(select(AutofillClarification).where(AutofillClarification.id == question_id, AutofillClarification.session_id == session_id))
    if not question:
        raise HTTPException(404, "Clarification question not found")
    try:
        answer_clarification(db, question, payload.value, canonical=payload.canonical)
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc
    return {"question": question_view(question), "session": session_view(db, session_id)}

@router.post("/sessions/{session_id}/questions/{question_id}/skip")
def skip(session_id: int, question_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> dict[str, Any]:
    owned_session(db, session_id, user)
    question = db.scalar(select(AutofillClarification).where(AutofillClarification.id == question_id, AutofillClarification.session_id == session_id))
    if not question:
        raise HTTPException(404, "Clarification question not found")
    try:
        skip_clarification(db, question)
    except ValueError as exc:
        raise HTTPException(409, str(exc)) from exc
    return {"question": question_view(question), "session": session_view(db, session_id)}

@router.post("/sessions/{session_id}/stop")
def stop(session_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> dict[str, Any]:
    session = owned_session(db, session_id, user)
    session.state = "stopped"
    db.commit()
    return session_view(db, session_id)

@router.post("/sessions/{session_id}/resume")
def resume(session_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> dict[str, Any]:
    session = owned_session(db, session_id, user)
    if session.state == "stopped":
        raise HTTPException(409, "Stopped sessions cannot be resumed; create a new session")
    pending = list_clarifications(db, session_id, status="pending")
    session.state = "waiting_for_input" if pending else "planned"
    db.commit()
    return session_view(db, session_id)
