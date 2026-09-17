from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.core import SellerAccount
from app.models.notifications import Notification, NotificationCategory, NotificationPreference
from app.services.notifications import NotificationService


def _period(now: datetime, weekly: bool) -> tuple[datetime, datetime, str]:
    end = now
    days = 7 if weekly else 1
    start = end - timedelta(days=days)
    label = "weekly" if weekly else "daily"
    return start, end, label


def _already_sent(db: Session, seller_account_id: int, user_id: int, report_type: str, period_start: datetime) -> bool:
    return db.execute(
        select(Notification.id).where(
            Notification.seller_account_id == seller_account_id,
            Notification.user_id == user_id,
            Notification.category == NotificationCategory.report.value,
            Notification.data["report_type"].as_string() == report_type,
            Notification.created_at >= period_start,
        ).limit(1)
    ).scalar_one_or_none() is not None


def _dispatch(db: Session, seller: SellerAccount, preference: NotificationPreference, report_type: str, now: datetime) -> bool:
    start, end, label = _period(now, report_type == "weekly")
    if _already_sent(db, seller.id, seller.user_id, report_type, start):
        return False
    channels = [str(channel) for channel in (preference.summary_channels or ["in_app"])]
    channels = list(dict.fromkeys(channels))
    service = NotificationService()
    service.create_and_dispatch(
        db,
        seller.id,
        seller.user_id,
        category=NotificationCategory.report.value,
        severity="info",
        title=f"{label.title()} Seller Hub Report",
        message=f"Your {label} seller operations report is ready. Open Seller Hub to review sales, profit, inventory, orders, returns and AI recommendations.",
        data={"report_type": report_type, "period_start": start.isoformat(), "period_end": end.isoformat()},
        channels=channels,
    )
    return True


def dispatch_scheduled_reports(db: Session, now: datetime | None = None) -> int:
    """Dispatch opted-in daily/weekly report notifications once per period.

    The worker may call this frequently; notification history provides an idempotency guard.
    Reports are advisory notifications only and never mutate marketplace state.
    """
    now = now or datetime.now(timezone.utc)
    preferences = db.scalars(
        select(NotificationPreference).where(
            NotificationPreference.category == NotificationCategory.report.value,
        )
    ).all()
    queued = 0
    weekday = now.weekday()
    for preference in preferences:
        seller = db.get(SellerAccount, preference.seller_account_id)
        if not seller or seller.user_id != preference.user_id:
            continue
        if preference.daily_summary_enabled and _dispatch(db, seller, preference, "daily", now):
            queued += 1
        if weekday == 0 and preference.weekly_report_enabled and _dispatch(db, seller, preference, "weekly", now):
            queued += 1
    return queued
