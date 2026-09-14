from datetime import datetime, timezone

from app.services.scheduled_reports import _period


def test_daily_report_period_is_one_day():
    now = datetime(2026, 9, 14, 5, 0, tzinfo=timezone.utc)
    start, end, label = _period(now, False)
    assert label == "daily"
    assert end == now
    assert (end - start).days == 1


def test_weekly_report_period_is_seven_days():
    now = datetime(2026, 9, 14, 5, 0, tzinfo=timezone.utc)
    start, end, label = _period(now, True)
    assert label == "weekly"
    assert end == now
    assert (end - start).days == 7
