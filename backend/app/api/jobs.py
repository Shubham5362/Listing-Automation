from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.core import User
from app.services.jobs import enqueue_job, list_jobs

router = APIRouter(prefix="/jobs", tags=["jobs"])


class JobCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    payload: dict = Field(default_factory=dict)


@router.post("", status_code=202)
def create_job(payload: JobCreate, _: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict[str, object]:
    job = enqueue_job(db, payload.name.strip(), payload.payload)
    return {"id": job.id, "name": job.name, "status": job.status}


@router.get("")
def get_jobs(_: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[dict[str, object]]:
    return [{"id": j.id, "name": j.name, "status": j.status, "created_at": j.created_at.isoformat()} for j in list_jobs(db)]
