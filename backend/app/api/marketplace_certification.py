from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.core import User
from app.schemas.marketplace_certification import CertificationMatrixItem, CertificationRequest, CertificationRunRead
from app.services.marketplace_certification import certify, matrix

router = APIRouter(prefix="/marketplace-certification", tags=["marketplace-certification"])

@router.get("/matrix", response_model=list[CertificationMatrixItem])
def certification_matrix():
    return matrix()

@router.post("/run", response_model=CertificationRunRead)
def run_certification(payload: CertificationRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        return certify(db, user, payload.seller_account_id, payload.marketplace_account_id)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
