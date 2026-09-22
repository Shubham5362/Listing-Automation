from datetime import datetime, timedelta

from app.models.catalog import Product
from app.models.core import SellerAccount
from app.models.inventory import InventoryItem, InventoryMovement
from app.services.personal_ai_seller_agent import PersonalAISellerAgentService


def test_personal_agent_context_and_inventory_recommendation(db_session):
    seller = SellerAccount(name="My Business", user_id=None, is_active=True)
    db_session.add(seller)
    db_session.flush()
    product = Product(seller_account_id=seller.id, sku="SKU-1", title="Test Product", cost_price=100)
    db_session.add(product)
    db_session.flush()
    item = InventoryItem(seller_account_id=seller.id, product_id=product.id, quantity=6, reserved_quantity=0, reorder_level=10)
    db_session.add(item)
    db_session.flush()
    for _ in range(2):
        db_session.add(InventoryMovement(inventory_item_id=item.id, movement_type="sale", quantity_delta=-1, quantity_after=6, created_at=datetime.utcnow() - timedelta(days=1)))
    db_session.commit()

    agent = PersonalAISellerAgentService(db_session)
    context = agent.context()
    issues = agent.inventory_issues()
    brief = agent.brief()

    assert context["products"] == 1
    assert context["inventory_units"] == 6
    assert issues[0]["severity"] == "high"
    assert issues[0]["recommended_action"] == "replenish_inventory"
    assert brief["approval_required_for_writes"] is True
    assert brief["no_unapproved_actions_executed"] is True


def test_personal_agent_chat_uses_conservative_fallback_without_llm(db_session):
    seller = SellerAccount(name="My Business", user_id=None, is_active=True)
    db_session.add(seller)
    db_session.commit()

    result = PersonalAISellerAgentService(db_session).chat("Which inventory needs attention?")

    # Semantic routing belongs to the configured LLM/tool planner. Without an LLM,
    # the fallback must not pretend to infer intent from keywords.
    assert result["intent"] == "business_health"
    assert result["approval_required"] is True
    assert result["created_actions"] == []
