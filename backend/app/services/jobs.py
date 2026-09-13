import json
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.core import Job


def enqueue_job(db: Session, name: str, payload: dict | None = None) -> Job:
    job = Job(name=name, status="queued", payload=json.dumps(payload or {}, separators=(",", ":")))
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


def mark_job_started(db: Session, job_id: int) -> Job | None:
    job = db.get(Job, job_id)
    if not job:
        return None
    job.status = "running"
    job.started_at = datetime.utcnow()
    db.commit()
    db.refresh(job)
    return job


def mark_job_finished(db: Session, job_id: int, *, error: str | None = None) -> Job | None:
    job = db.get(Job, job_id)
    if not job:
        return None
    job.status = "failed" if error else "completed"
    job.error = error
    job.finished_at = datetime.utcnow()
    db.commit()
    db.refresh(job)
    return job


def list_jobs(db: Session, limit: int = 50) -> list[Job]:
    limit = max(1, min(limit, 100))
    return list(db.scalars(select(Job).order_by(Job.created_at.desc()).limit(limit)))
