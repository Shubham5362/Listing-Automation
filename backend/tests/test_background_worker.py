from datetime import datetime, timedelta

from app.models.core import Job, MarketplaceAccount, SellerAccount
from app.services.jobs import claim_next_job, enqueue_job, recover_stale_jobs, retry_job
from app.worker import BackgroundWorker


def test_job_claim_retry_and_stale_recovery(db_session, monkeypatch):
    seller = SellerAccount(name="Seller")
    db_session.add(seller)
    db_session.commit()

    job = enqueue_job(db_session, "marketplace_sync", {"marketplace_account_id": 1}, seller_account_id=seller.id, max_attempts=3)
    claimed = claim_next_job(db_session, "worker-a")
    assert claimed is not None
    assert claimed.id == job.id
    assert claimed.status == "running"
    assert claimed.attempts == 1
    retried = retry_job(db_session, job.id, "temporary failure")
    assert retried is not None
    assert retried.status == "queued"
    assert retried.attempts == 1
    assert retried.run_after is not None

    stale = enqueue_job(db_session, "marketplace_sync", {"marketplace_account_id": 1}, seller_account_id=seller.id, max_attempts=2)
    claimed_stale = claim_next_job(db_session, "worker-b")
    assert claimed_stale is not None
    db_session.refresh(claimed_stale)
    claimed_stale.locked_at = datetime.utcnow() - timedelta(hours=1)
    db_session.commit()
    assert recover_stale_jobs(db_session, stale_after_seconds=60) == 1
    db_session.refresh(stale)
    assert stale.status == "queued"
    assert stale.worker_id is None


def test_worker_enforces_seller_scope_for_marketplace_job(db_session):
    seller = SellerAccount(name="Seller")
    other = SellerAccount(name="Other")
    db_session.add_all([seller, other])
    db_session.flush()
    account = MarketplaceAccount(seller_account_id=other.id, marketplace="amazon", display_name="Other")
    db_session.add(account)
    db_session.commit()
    job = Job(name="marketplace_sync", seller_account_id=seller.id, status="running", payload='{"marketplace_account_id": %d}' % account.id, attempts=1, max_attempts=3)
    db_session.add(job)
    db_session.commit()

    try:
        BackgroundWorker("test-worker").execute_job(db_session, job)
    except ValueError as exc:
        assert str(exc) == "Marketplace account not found for seller"
    else:
        raise AssertionError("cross-seller marketplace job must fail")
