from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.db.session import get_db
from app.services.release_readiness import release_readiness

router = APIRouter(prefix="/release", tags=["release"])


@router.get("/readiness")
def readiness(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return release_readiness(db)
