from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.core import User
from app.schemas.diagnostic import DiagnosticFixPreview
from app.services.diagnostics import execute_fix, preview_fix
from app.api.diagnostics import router, _owned, _read

@router.post("/{diagnostic_id}/fix-preview")
def fix_preview(diagnostic_id: int, payload: DiagnosticFixPreview, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    row = _owned(db, user, diagnostic_id)
    if payload.mode != "dry_run": raise HTTPException(status_code=400, detail="Only dry_run is supported here")
    try: fix = preview_fix(db, row, user.id)
    except ValueError as exc: raise HTTPException(status_code=409, detail=str(exc)) from exc
    return {"diagnostic_id": row.id, "fix_id": fix.id, "before": fix.before_json, "after": fix.after_json, "changes": fix.change_set_json, "status": row.status}

@router.post("/{diagnostic_id}/fix")
def fix(diagnostic_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    row = _owned(db, user, diagnostic_id)
    try: result = execute_fix(db, row, user.id)
    except ValueError as exc: raise HTTPException(status_code=409, detail=str(exc)) from exc
    return {"diagnostic_id": row.id, "fix_id": result.id, "executed": result.executed, "verification": result.verification_status, "status": row.status}
