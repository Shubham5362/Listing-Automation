from __future__ import annotations

import json
from datetime import datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.marketplaces.registry import get_adapter
from app.models.master_listing import ListingTeachSession, MasterListingTemplate
from app.models.marketplace_form_knowledge import MarketplaceFormKnowledge
from app.services.form_discovery import discover_fields


def _field_payload(field: dict[str, Any]) -> dict[str, Any]:
    return {
        "name": str(field.get("name") or field.get("marketplace_field") or ""),
        "canonical": str(field.get("canonical") or "").upper().replace(" ", "_"),
        "label": field.get("label"),
        "field_type": field.get("field_type", "string"),
        "required": bool(field.get("required", False)),
        "enum": list(field.get("enum") or []),
        "unit": field.get("unit"),
        "source": field.get("source", "manual_teach"),
    }


def start_teach_session(
    db: Session, seller_account_id: int, product_id: int, marketplace: str, category: str
) -> ListingTeachSession:
    adapter = get_adapter(marketplace)
    schema = adapter.schema_for(category)
    discovered = discover_fields(adapter, None, category)
    unresolved = [
        str(item.get("name") or item.get("canonical"))
        for item in discovered
        if not item.get("canonical") or float(item.get("discovery_confidence", 0)) < 70
    ]
    session = ListingTeachSession(
        seller_account_id=seller_account_id, product_id=product_id, marketplace=marketplace,
        category=schema.category, state="collecting",
        observed_fields_json="[]", unresolved_fields_json=json.dumps(unresolved, ensure_ascii=False),
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def teach_fields(db: Session, session: ListingTeachSession, fields: list[dict[str, Any]]) -> dict[str, Any]:
    observed = [_field_payload(field) for field in fields]
    unresolved = [item["name"] for item in observed if not item["canonical"]]
    session.observed_fields_json = json.dumps(observed, ensure_ascii=False, separators=(",", ":"))
    session.unresolved_fields_json = json.dumps(unresolved, ensure_ascii=False, separators=(",", ":"))
    session.state = "needs_clarification" if unresolved else "ready"
    db.commit()
    db.refresh(session)
    return teach_session_view(db, session.id)


def complete_teach_session(db: Session, session: ListingTeachSession, *, name: str | None = None) -> dict[str, Any]:
    fields = json.loads(session.observed_fields_json or "[]")
    if not fields:
        raise ValueError("Teach session has no observed fields")
    unresolved = [field["name"] for field in fields if not field.get("canonical")]
    if unresolved:
        raise ValueError("Some marketplace fields still need a canonical mapping")

    template = db.scalar(select(MasterListingTemplate).where(
        MasterListingTemplate.seller_account_id == session.seller_account_id,
        MasterListingTemplate.marketplace == session.marketplace,
        MasterListingTemplate.category == session.category,
    ))
    if template is None:
        template = MasterListingTemplate(
            seller_account_id=session.seller_account_id, marketplace=session.marketplace,
            category=session.category, name=name or f"{session.marketplace.title()} {session.category} Master Listing",
            version=1, fields_json=json.dumps(fields, ensure_ascii=False, separators=(",", ":")),
            status="active", source="manual_teach",
        )
        db.add(template)
    else:
        template.version += 1
        template.fields_json = json.dumps(fields, ensure_ascii=False, separators=(",", ":"))
        template.status = "active"
        if name:
            template.name = name

    knowledge = db.scalar(select(MarketplaceFormKnowledge).where(
        MarketplaceFormKnowledge.seller_account_id == session.seller_account_id,
        MarketplaceFormKnowledge.marketplace == session.marketplace,
        MarketplaceFormKnowledge.category == session.category,
    ))
    if knowledge is not None:
        knowledge.fields_json = json.dumps(fields, ensure_ascii=False, separators=(",", ":"))
        knowledge.status = "learned"
        knowledge.source = "manual_teach"
        knowledge.updated_at = datetime.utcnow()

    session.state = "completed"
    db.commit()
    db.refresh(template)
    db.refresh(session)
    return template_view(db, template.id)


def teach_session_view(db: Session, session_id: int) -> dict[str, Any]:
    session = db.get(ListingTeachSession, session_id)
    if not session:
        raise ValueError("Teach session not found")
    return {
        "id": session.id, "product_id": session.product_id, "marketplace": session.marketplace,
        "category": session.category, "state": session.state,
        "observed_fields": json.loads(session.observed_fields_json or "[]"),
        "unresolved_fields": json.loads(session.unresolved_fields_json or "[]"),
        "created_at": session.created_at, "updated_at": session.updated_at,
    }


def template_view(db: Session, template_id: int) -> dict[str, Any]:
    template = db.get(MasterListingTemplate, template_id)
    if not template:
        raise ValueError("Master listing template not found")
    return {
        "id": template.id, "marketplace": template.marketplace, "category": template.category,
        "name": template.name, "version": template.version, "status": template.status,
        "source": template.source, "fields": json.loads(template.fields_json or "[]"),
        "created_at": template.created_at, "updated_at": template.updated_at,
    }


def list_templates(db: Session, seller_account_id: int) -> list[dict[str, Any]]:
    rows = db.scalars(select(MasterListingTemplate).where(
        MasterListingTemplate.seller_account_id == seller_account_id
    ).order_by(MasterListingTemplate.marketplace, MasterListingTemplate.category)).all()
    return [
        {"id": row.id, "marketplace": row.marketplace, "category": row.category, "name": row.name,
         "version": row.version, "status": row.status, "field_count": len(json.loads(row.fields_json or "[]")),
         "source": row.source, "updated_at": row.updated_at}
        for row in rows
    ]
