import json
from datetime import datetime, timedelta, timezone
from uuid import uuid4

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.core import Job


def _now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def enqueue_job(
    db: Session,
    name: str,
    payload: dict | None = None,
    *,
    seller_account_id: int | None = None,
    max_attempts: int | None = None,
    run_after: datetime | None = None,
) -> Job:
    settings = get_settings()
    job = Job(
        name=name,
        seller_account_id=seller_account_id,
        status="queued",
        payload=json.dumps(payload or {}, separators=(",", ":")),
        attempts=0,
        max_attempts=max(1, max_attempts or settings.worker_max_attempts),
        run_after=run_after or _now(),
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


def claim_next_job(db: Session, worker_id: str | None = None) -> Job | None:
    """Atomically claim one due job; PostgreSQL workers use row locking for concurrency."""
    worker_id = worker_id or uuid4().hex
    now = _now()
    query = select(Job).where(
        Job.status == "queued",
        or_(Job.run_after.is_(None), Job.run_after <= now),
    ).order_by(Job.created_at.asc(), Job.id.asc())
    if db.get_bind().dialect.name == "postgresql":
        query = query.with_for_update(skip_locked=True)
    job = db.scalar(query.limit(1))
    if not job:
        return None
    job.status = "running"
    job.attempts += 1
    job.started_at = now
    job.locked_at = now
    job.worker_id = worker_id
    job.error = None
    db.commit()
    db.refresh(job)
    return job


def recover_stale_jobs(db: Session, *, stale_after_seconds: int | None = None) -> int:
    settings = get_settings()
    cutoff = _now() - timedelta(seconds=stale_after_seconds or settings.worker_stale_after_seconds)
    rows = db.scalars(select(Job).where(Job.status == "running", Job.locked_at.is_not(None), Job.locked_at < cutoff)).all()
    recovered = 0
    for job in rows:
        if job.attempts >= job.max_attempts:
            job.status = "failed"
            job.finished_at = _now()
            job.error = "Worker lease expired after maximum attempts"
        else:
            job.status = "queued"
            job.run_after = _now()
            job.error = "Worker lease expired; job re-queued"
        job.locked_at = None
        job.worker_id = None
        recovered += 1
    if recovered:
        db.commit()
    return recovered


def mark_job_finished(db: Session, job_id: int, *, result: dict | None = None, error: str | None = None) -> Job | None:
    job = db.get(Job, job_id)
    if not job:
        return None
    job.status = "failed" if error else "completed"
    job.result = json.dumps(result or {}, separators=(",", ":")) if result is not None else job.result
    job.error = error[:2000] if error else None
    job.finished_at = _now()
    job.locked_at = None
    job.worker_id = None
    db.commit()
    db.refresh(job)
    return job


def retry_job(db: Session, job_id: int, error: str) -> Job | None:
    job = db.get(Job, job_id)
    if not job:
        return None
    settings = get_settings()
    if job.attempts >= job.max_attempts:
        return mark_job_finished(db, job_id, error=error)
    delay = settings.worker_retry_backoff_seconds * (2 ** max(0, job.attempts - 1))
    job.status = "queued"
    job.run_after = _now() + timedelta(seconds=delay)
    job.error = error[:2000]
    job.locked_at = None
    job.worker_id = None
    db.commit()
    db.refresh(job)
    return job


def list_jobs(db: Session, limit: int = 50) -> list[Job]:
    limit = max(1, min(limit, 100))
    return list(db.scalars(select(Job).order_by(Job.created_at.desc()).limit(limit)))
