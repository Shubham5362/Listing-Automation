from __future__ import annotations

import json
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.catalog import Product
from app.models.core import SellerAccount, User
from app.models.product_knowledge import ProductKnowledge
from app.services.audit import record_audit
from app.services.auth import get_user_by_token
from app.services.product_knowledge import (
    build_product_knowledge,
    canonical_attribute,
    detect_contradictions,
    knowledge_history,
    merge_knowledge_candidates,
    read_knowledge,
)

router = APIRouter(prefix="/product-knowledge", tags=["product-knowledge"])
bearer = HTTPBearer(auto_error=False)


class ProductKnowledgeAnalyzeRequest(BaseModel):
    reason: str = Field(default="AI knowledge refresh", max_length=300)
    source: str = Field(default="product_record", max_length=50)


class AttributeMapRequest(BaseModel):
    attributes: dict[str, Any]


class ConflictCheckRequest(BaseModel):
    candidates: dict[str, Any]


class KnowledgeMergeRequest(BaseModel):
    candidates: dict[str, Any]
    source: str = Field(default="ai_inference", max_length=50)
    reason: str = Field(default="AI product understanding", max_length=300)
    confidence: float = Field(default=0.75, ge=0.0, le=1.0)


def current_user(credentials: HTTPAuthorizationCredentials | None = Depends(bearer), db: Session = Depends(get_db)) -> User:
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    user = get_user_by_token(db, credentials.credentials)
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired session")
    return user


def owned_product(db: Session, product_id: int, user: User) -> Product:
    product = db.scalar(
        select(Product).join(SellerAccount, SellerAccount.id == Product.seller_account_id).where(
            Product.id == product_id, SellerAccount.user_id == user.id
        )
    )
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


def _row(db: Session, product: Product) -> ProductKnowledge:
    row = db.scalar(
        select(ProductKnowledge).where(
            ProductKnowledge.product_id == product.id,
            ProductKnowledge.seller_account_id == product.seller_account_id,
        )
    )
    if row is None:
        row = build_product_knowledge(db, product)
        db.commit()
        db.refresh(row)
    return row


@router.post("/products/{product_id}/analyze")
def analyze(product_id: int, payload: ProductKnowledgeAnalyzeRequest, db: Session = Depends(get_db), user: User = Depends(current_user)) -> dict[str, Any]:
    product = owned_product(db, product_id, user)
    row = build_product_knowledge(db, product, reason=payload.reason, source=payload.source)
    db.commit()
    db.refresh(row)
    record_audit(db, action="product_knowledge.analyze", resource_type="product", resource_id=str(product.id), user_id=user.id, details={"schema_version": row.schema_version, "score": row.completeness_score, "source": payload.source})
    return read_knowledge(row)


@router.get("/products/{product_id}")
def get_knowledge(product_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)) -> dict[str, Any]:
    product = owned_product(db, product_id, user)
    return read_knowledge(_row(db, product))


@router.get("/products/{product_id}/history")
def history(product_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)) -> dict[str, Any]:
    owned_product(db, product_id, user)
    return {"product_id": product_id, "versions": knowledge_history(db, product_id)}


@router.post("/products/{product_id}/check-conflicts")
def check_conflicts(product_id: int, payload: ConflictCheckRequest, db: Session = Depends(get_db), user: User = Depends(current_user)) -> dict[str, Any]:
    product = owned_product(db, product_id, user)
    row = _row(db, product)
    facts = json.loads(row.facts_json or "{}")
    conflicts = detect_contradictions(facts, payload.candidates)
    return {"product_id": product_id, "conflict_count": len(conflicts), "conflicts": conflicts, "safe_to_merge": not any(item["requires_review"] for item in conflicts)}


@router.post("/products/{product_id}/merge-suggestions")
def merge_suggestions(product_id: int, payload: KnowledgeMergeRequest, db: Session = Depends(get_db), user: User = Depends(current_user)) -> dict[str, Any]:
    product = owned_product(db, product_id, user)
    row, conflicts = merge_knowledge_candidates(
        db, product, payload.candidates, source=payload.source, reason=payload.reason, confidence=payload.confidence
    )
    db.commit()
    db.refresh(row)
    record_audit(db, action="product_knowledge.merge_suggestions", resource_type="product", resource_id=str(product.id), user_id=user.id, details={"schema_version": row.schema_version, "conflict_count": len(conflicts), "source": payload.source})
    return {"knowledge": read_knowledge(row), "conflicts": conflicts, "merged": not bool(conflicts)}


@router.post("/normalize-attributes")
def normalize_attributes(payload: AttributeMapRequest, user: User = Depends(current_user)) -> dict[str, Any]:
    return {"mappings": {name: {"canonical": canonical_attribute(name), "value": value} for name, value in payload.attributes.items()}}
