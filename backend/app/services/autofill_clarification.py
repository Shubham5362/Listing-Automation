from __future__ import annotations

import json
from datetime import datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.marketplaces.registry import get_adapter
from app.models.autofill import AutofillAction, AutofillSession
from app.models.autofill_clarification import AutofillClarification
from app.models.catalog import Product


REASONS = {"VALUE_MISSING", "FIELD_UNCLEAR", "VALUE_AMBIGUOUS", "FORMAT_INVALID"}


def _dump(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"))


def _load(value: str | None, default: Any) -> Any:
    if not value:
        return default
    try:
        return json.loads(value)
    except json.JSONDecodeError:
        return default


def _field_meta(session: AutofillSession, action: AutofillAction, *, field: dict[str, Any] | None = None) -> dict[str, Any]:
    field = field or {}
    return {
        "label": field.get("label") or action.field_name,
        "name": field.get("adapter_field") or action.field_name,
        "canonical": action.canonical or None,
        "field_type": field.get("field_type") or "string",
        "required": bool(field.get("required")),
        "unit": field.get("unit"),
        "enum": list(field.get("enum") or []),
    }


def _question_text(reason: str, meta: dict[str, Any], marketplace: str) -> str:
    label, unit = meta["label"], meta.get("unit")
    suffix = f" ({unit})" if unit else ""
    if reason == "VALUE_MISSING":
        return f"{marketplace.title()} me “{label}” required hai, lekin Product Brain me verified value nahi mila. {label}{suffix} kya hai?"
    if reason == "FIELD_UNCLEAR":
        return f"{marketplace.title()} ka “{label}” field mila hai, lekin iska Product Brain mapping clear nahi hai. Ye kis product fact se map hona chahiye?"
    if reason == "VALUE_AMBIGUOUS":
        return f"“{label}” ke liye ek se zyada possible values mili hain. Is listing ke liye kaunsi value use karni hai?"
    return f"“{label}” ki value marketplace format me valid nahi ho rahi. Sahi value{suffix} kya honi chahiye?"


def create_clarifications(db: Session, session: AutofillSession, product: Product, result: dict[str, Any]) -> list[AutofillClarification]:
    adapter = get_adapter(session.marketplace)
    schema = adapter.schema_for(product.category)
    fields = {f.name: f for f in schema.fields}
    created: list[AutofillClarification] = []
    for decision in result.get("decisions", []):
        if decision.get("status") not in {"blocked", "review_required"}:
            continue
        field_name = str(decision.get("field") or "")
        marketplace_field = field_name
        schema_field = fields.get(field_name)
        decision_reason = str(decision.get("reason") or "")
        reason = "VALUE_MISSING" if "No verified product value" in decision_reason else (
            "FORMAT_INVALID" if "normalized" in decision_reason else (
                "VALUE_AMBIGUOUS" if int(decision.get("confidence") or 0) > 0 else "FIELD_UNCLEAR"
            )
        )
        canonical = decision.get("canonical") or None
        if canonical == field_name.upper().replace(" ", "_") and not result.get("discovery"):
            canonical = None
        if schema_field and schema_field.canonical and schema_field.canonical != field_name.upper().replace(" ", "_"):
            canonical = schema_field.canonical
        meta = {
            "label": field_name.replace("_", " ").title(),
            "field_type": getattr(schema_field, "field_type", "string") if schema_field else "string",
            "required": bool(getattr(schema_field, "required", False) if schema_field else field_name in result.get("missing_required", [])),
            "unit": getattr(schema_field, "unit", None) if schema_field else None,
            "enum": list(getattr(schema_field, "enum", ()) or ()) if schema_field else [],
        }
        # A low-confidence/unknown canonical identity is a field-interpretation question.
        if not canonical or canonical == field_name.upper().replace(" ", "_"):
            reason = "FIELD_UNCLEAR" if reason != "FORMAT_INVALID" else reason
            canonical = None
        options = meta["enum"]
        clarification = AutofillClarification(
            session_id=session.id,
            action_id=None,
            product_id=product.id,
            marketplace=session.marketplace,
            category=product.category,
            reason_code=reason,
            field_label=meta["label"],
            marketplace_field=marketplace_field,
            canonical=canonical,
            prompt=_question_text(reason, meta, session.marketplace),
            context_json=_dump({"product_id": product.id, "marketplace": session.marketplace, "category": product.category, "reason": reason}),
            expected_input_type=meta["field_type"],
            unit=meta["unit"],
            options_json=_dump(options),
            required=meta["required"],
            confidence_before=int(decision.get("confidence") or 0),
            status="pending",
        )
        db.add(clarification)
        created.append(clarification)
    db.flush()
    actions = {a.field_name: a for a in db.scalars(select(AutofillAction).where(AutofillAction.session_id == session.id)).all()}
    for clarification in created:
        action = actions.get(clarification.marketplace_field)
        if action:
            clarification.action_id = action.id
    if created:
        session.state = "waiting_for_input"
    return created


def list_clarifications(db: Session, session_id: int, status: str | None = None) -> list[AutofillClarification]:
    stmt = select(AutofillClarification).where(AutofillClarification.session_id == session_id).order_by(AutofillClarification.id)
    if status:
        stmt = stmt.where(AutofillClarification.status == status)
    return db.scalars(stmt).all()


def _validate_answer(clarification: AutofillClarification, value: Any, adapter: Any, category: str) -> Any:
    if value in (None, "", []):
        raise ValueError("Answer cannot be empty")
    options = _load(clarification.options_json, [])
    if options:
        normalized = adapter.map_attributes(
            {clarification.canonical or clarification.marketplace_field: {"value": value}},
            category,
        ).get(clarification.marketplace_field)
        if normalized is None:
            raise ValueError(f"Choose one of the available options: {', '.join(map(str, options))}")
        return normalized
    kind = clarification.expected_input_type
    if kind in {"number", "integer"}:
        try:
            number = float(value)
        except (TypeError, ValueError) as exc:
            raise ValueError("Enter a valid number") from exc
        return int(number) if kind == "integer" and number.is_integer() else number
    if kind == "boolean":
        if isinstance(value, bool):
            return value
        text = str(value).strip().casefold()
        if text in {"true", "yes", "y", "1"}:
            return True
        if text in {"false", "no", "n", "0"}:
            return False
        raise ValueError("Enter yes or no")
    return str(value).strip()


def answer_clarification(db: Session, clarification: AutofillClarification, value: Any, *, canonical: str | None = None) -> AutofillClarification:
    if clarification.status != "pending":
        raise ValueError("Clarification is no longer pending")
    session = db.get(AutofillSession, clarification.session_id)
    product = db.get(Product, clarification.product_id)
    if not session or not product:
        raise ValueError("Autofill context not found")
    if canonical:
        clarification.canonical = canonical.strip().upper().replace(" ", "_")
    adapter = get_adapter(session.marketplace)
    normalized = _validate_answer(clarification, value, adapter, product.category)
    action = db.get(AutofillAction, clarification.action_id) if clarification.action_id else None
    if action:
        action.canonical = clarification.canonical or action.canonical
        action.action = "fill"
        action.proposed_value = _dump(normalized)
        action.confidence = 100
        action.status = "approved" if session.mode == "auto" else "planned"
        action.reason = "Explicit human clarification supplied and validated"
        action.verification_status = "human_verified"
    clarification.answer = _dump(value)
    clarification.normalized_answer = _dump(normalized)
    clarification.status = "answered"
    clarification.answered_at = datetime.utcnow()
    db.flush()
    pending_required = db.scalar(select(AutofillClarification.id).where(
        AutofillClarification.session_id == session.id,
        AutofillClarification.status == "pending",
        AutofillClarification.required.is_(True),
    ))
    pending_any = db.scalar(select(AutofillClarification.id).where(
        AutofillClarification.session_id == session.id,
        AutofillClarification.status == "pending",
    ))
    session.state = "waiting_for_input" if pending_any else "planned"
    if not pending_required and not pending_any:
        session.summary_json = _dump({**_load(session.summary_json, {}), "ready": True, "clarifications_resolved": True})
    db.commit()
    db.refresh(clarification)
    return clarification


def skip_clarification(db: Session, clarification: AutofillClarification) -> AutofillClarification:
    if clarification.status != "pending":
        raise ValueError("Clarification is no longer pending")
    if clarification.required:
        raise ValueError("Required fields cannot be skipped")
    clarification.status = "skipped"
    clarification.answered_at = datetime.utcnow()
    session = db.get(AutofillSession, clarification.session_id)
    pending = db.scalar(select(AutofillClarification.id).where(
        AutofillClarification.session_id == clarification.session_id,
        AutofillClarification.status == "pending",
    ))
    if session:
        session.state = "waiting_for_input" if pending else "planned"
    db.commit()
    db.refresh(clarification)
    return clarification
