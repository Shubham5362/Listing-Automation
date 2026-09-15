from fastapi import Depends
from sqlalchemy.orm import Session
from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.core import User
from app.models.diagnostic import Diagnostic
from app.schemas.diagnostic import DiagnosticVerifyRead
from app.services.diagnostics import verify
from app.api.diagnostics import router, _owned
import json

@router.post("/{diagnostic_id}/verify", response_model=DiagnosticVerifyRead)
def verify_diagnostic(diagnostic_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    row = _owned(db, user, diagnostic_id)
    result = verify(db, row)
    return DiagnosticVerifyRead(diagnostic_id=row.id, passed=result.passed, checks=json.loads(result.checks_json), message=result.message)
