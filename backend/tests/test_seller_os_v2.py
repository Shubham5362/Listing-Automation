import pytest

from app.models.core import SellerAccount, User
from app.services.seller_os_v2 import action_proposal, owned_seller


def test_action_proposal_requires_approval_for_high_risk():
    result = action_proposal(risk="high", confidence=0.99, financial_impact=10, requires_approval=False)
    assert result["decision"] == "approval_required"
    assert result["requires_approval"] is True
    assert result["execution"] == "blocked_until_policy_check"


def test_action_proposal_allows_only_bounded_low_risk_candidate():
    result = action_proposal(risk="low", confidence=0.90, financial_impact=10, requires_approval=False)
    assert result["decision"] == "auto_eligible"


def test_owned_seller_is_user_scoped(db_session):
    owner = User(email="owner@example.com", password_hash="x")
    other = User(email="other@example.com", password_hash="x")
    db_session.add_all([owner, other])
    db_session.flush()
    seller = SellerAccount(user_id=owner.id, name="Owner Store", is_active=True)
    db_session.add(seller)
    db_session.flush()

    assert owned_seller(db_session, owner, seller.id).id == seller.id
    with pytest.raises(ValueError):
        owned_seller(db_session, other, seller.id)
