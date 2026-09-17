import json

from sqlalchemy.orm import Session

from app.models.core import AuditLog


def record_audit(
    db: Session,
    *,
    action: str,
    resource_type: str,
    resource_id: str | None = None,
    user_id: int | None = None,
    details: dict | None = None,
) -> AuditLog:
    entry = AuditLog(
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=json.dumps(details, separators=(",", ":")) if details else None,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry
