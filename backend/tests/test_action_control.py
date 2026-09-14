import json

from app.models.action_control import ActionRequestStatus, ActionRisk
from app.models.core import Job
from app.services.action_control import approve_personal_action, create_personal_action, reject_personal_action
from app.services.personal_marketplace import personal_seller_id


def test_personal_action_requires_approval_for_medium_risk(db_session):
    from app.models.core import SellerAccount
    seller = SellerAccount(name="Personal", user_id=None, is_active=True)
    db_session.add(seller)
    db_session.commit()

    request = create_personal_action(db_session, action="marketplace_operation", payload={"marketplace_account_id": 1, "operation": "price_push"}, reason="Test change")
    assert request.risk == ActionRisk.MEDIUM.value
    assert request.status == ActionRequestStatus.PENDING.value
    assert request.job_id is None
    assert db_session.query(Job).count() == 0


def test_personal_action_approval_queues_job(db_session):
    from app.models.core import SellerAccount
    seller = SellerAccount(name="Personal", user_id=None, is_active=True)
    db_session.add(seller)
    db_session.commit()

    request = create_personal_action(db_session, action="marketplace_sync", payload={"marketplace_account_id": 1})
    assert request.status == ActionRequestStatus.EXECUTING.value
    assert request.job_id is not None
    job = db_session.get(Job, request.job_id)
    assert job is not None
    assert json.loads(job.payload)["action_request_id"] == request.id


def test_personal_action_rejection_is_terminal(db_session):
    from app.models.core import SellerAccount
    seller = SellerAccount(name="Personal", user_id=None, is_active=True)
    db_session.add(seller)
    db_session.commit()

    request = create_personal_action(db_session, action="listing_update", payload={"listing_update_id": 10})
    rejected = reject_personal_action(db_session, request.id, "Not safe")
    assert rejected is not None
    assert rejected.status == ActionRequestStatus.REJECTED.value
    assert rejected.error == "Not safe"
    assert approve_personal_action(db_session, request.id) is None


def test_personal_seller_is_ownerless(db_session):
    from app.models.core import SellerAccount
    db_session.add(SellerAccount(name="Personal", user_id=None, is_active=True))
    db_session.commit()
    assert personal_seller_id(db_session) is not None
