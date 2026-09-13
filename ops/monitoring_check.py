from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from app.core.observability import metrics_snapshot
from app.db.session import SessionLocal
from app.models.core import SellerAccount, User
from app.models.notifications import Notification
from app.services.monitoring import MonitoringService


def main() -> int:
    if os.getenv("SELLER_HUB_MONITORING_ENABLED", "false").lower() not in {"1", "true", "yes", "on"}:
        return 0
    service = MonitoringService()
    alerts = service.evaluate(metrics_snapshot())
    if not alerts:
        return 0
    cutoff = datetime.now(timezone.utc) - timedelta(minutes=int(os.getenv("SELLER_HUB_ALERT_COOLDOWN_MINUTES", "15")))
    with SessionLocal() as db:
        sellers = db.execute(select(SellerAccount)).scalars().all()
        for seller in sellers:
            user = db.get(User, seller.user_id)
            if not user:
                continue
            for alert in alerts:
                recent = db.execute(select(Notification).where(Notification.seller_account_id == seller.id, Notification.user_id == user.id, Notification.created_at >= cutoff)).scalars().all()
                if any((item.data or {}).get("monitoring_rule") == alert["rule"] for item in recent):
                    continue
                service.dispatch(db, seller.id, user.id, [alert])
    return len(alerts)


if __name__ == "__main__":
    raise SystemExit(main())
