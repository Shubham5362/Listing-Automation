from app.models.notifications import NotificationChannel
from app.services.notifications import NotificationService


def test_notification_center_supports_unified_channels():
    service = NotificationService(providers=[])
    assert NotificationChannel.telegram.value in service.VALID_CHANNELS
    assert NotificationChannel.whatsapp.value in service.VALID_CHANNELS
    assert "report" in service.VALID_CATEGORIES


def test_report_period_validation():
    from app.services.notification_reports import NotificationReportService

    try:
        NotificationReportService().build(None, 1, "monthly")  # type: ignore[arg-type]
    except ValueError as exc:
        assert "Unsupported report period" in str(exc)
    else:
        raise AssertionError("invalid report period was accepted")
