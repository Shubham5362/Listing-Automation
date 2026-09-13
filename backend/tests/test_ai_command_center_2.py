from app.services.ai_command import _intent, _periods, _workflow_actions


def test_today_sales_is_sales_intent_and_uses_day_period():
    assert _intent("What are today's sales?") == "sales_decline"
    start, end, previous_start, previous_end = _periods("today's sales")
    assert start.hour == 0 and start.minute == 0
    assert previous_end < start
    assert previous_start < previous_end


def test_fix_low_stock_is_explicit_workflow():
    assert _intent("Fix low stock") == "inventory"
    assert _workflow_actions("Fix low stock", "inventory") == [("inventory", "review_inventory", True)]


def test_optimize_prices_is_approval_gated():
    assert _intent("Optimize prices") == "pricing"
    assert _workflow_actions("Optimize prices", "pricing") == [("pricing", "review_pricing", True)]


def test_create_and_publish_listing_is_single_checkpoint():
    assert _intent("Create and publish listings") == "listing"
    actions = _workflow_actions("Create and publish listings", "listing")
    assert actions == [("listing", "review_listing", True)]


def test_declining_sales_builds_multi_step_chain():
    actions = _workflow_actions("Fix declining sales", "sales_decline")
    assert [task for _, task, _ in actions] == ["analyze_sales", "review_inventory", "review_pricing", "review_ads"]
    assert [requires_approval for _, _, requires_approval in actions] == [False, True, True, True]
