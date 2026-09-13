from __future__ import annotations

import json
import os
import smtplib
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from email.message import EmailMessage
from typing import Any
from urllib.error import URLError
from urllib.request import Request, urlopen

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.core import User
from app.models.notifications import Notification, NotificationCategory, NotificationChannel, NotificationDelivery, NotificationDeliveryStatus, NotificationPreference


class NotificationProvider(ABC):
    channel: str
    name: str

    @abstractmethod
    def send(self, user: User, notification: Notification) -> None:
        raise NotImplementedError


class InAppProvider(NotificationProvider):
    channel = NotificationChannel.in_app.value
    name = "in_app"

    def send(self, user: User, notification: Notification) -> None:
        return None


class EmailProvider(NotificationProvider):
    channel = NotificationChannel.email.value
    name = "smtp"

    def send(self, user: User, notification: Notification) -> None:
        host = os.getenv("SELLER_HUB_SMTP_HOST")
        if not host or not user.email:
            raise RuntimeError("email_provider_not_configured")
        port = int(os.getenv("SELLER_HUB_SMTP_PORT", "587"))
        sender = os.getenv("SELLER_HUB_SMTP_FROM")
        if not sender:
            raise RuntimeError("email_sender_not_configured")
        msg = EmailMessage()
        msg["From"] = sender
        msg["To"] = user.email
        msg["Subject"] = notification.title
        msg.set_content(notification.message)
        username = os.getenv("SELLER_HUB_SMTP_USERNAME")
        password = os.getenv("SELLER_HUB_SMTP_PASSWORD")
        with smtplib.SMTP(host, port, timeout=10) as smtp:
            smtp.starttls()
            if username:
                smtp.login(username, password or "")
            smtp.send_message(msg)


class WhatsAppProvider(NotificationProvider):
    channel = NotificationChannel.whatsapp.value
    name = "webhook"

    def send(self, user: User, notification: Notification) -> None:
        endpoint = os.getenv("SELLER_HUB_WHATSAPP_WEBHOOK_URL")
        phone = notification.data.get("recipient_phone")
        if not endpoint or not phone:
            raise RuntimeError("whatsapp_provider_not_configured")
        payload = json.dumps({"to": phone, "title": notification.title, "message": notification.message}).encode()
        headers = {"Content-Type": "application/json"}
        token = os.getenv("SELLER_HUB_WHATSAPP_WEBHOOK_TOKEN")
        if token:
            headers["Authorization"] = f"Bearer {token}"
        req = Request(endpoint, data=payload, headers=headers, method="POST")
        try:
            with urlopen(req, timeout=10) as response:
                if response.status < 200 or response.status >= 300:
                    raise RuntimeError(f"whatsapp_provider_http_{response.status}")
        except (URLError, TimeoutError) as exc:
            raise RuntimeError("whatsapp_provider_unavailable") from exc


class NotificationService:
    VALID_CATEGORIES = {item.value for item in NotificationCategory}
    VALID_CHANNELS = {item.value for item in NotificationChannel}

    def __init__(self, providers: list[NotificationProvider] | None = None) -> None:
        self.providers = {provider.channel: provider for provider in (providers or [InAppProvider(), EmailProvider(), WhatsAppProvider()])}

    def _preference(self, db: Session, seller_account_id: int, user_id: int, category: str) -> NotificationPreference:
        preference = db.execute(select(NotificationPreference).where(NotificationPreference.seller_account_id == seller_account_id, NotificationPreference.user_id == user_id, NotificationPreference.category == category)).scalar_one_or_none()
        if preference is None:
            preference = NotificationPreference(seller_account_id=seller_account_id, user_id=user_id, category=category)
            db.add(preference)
            db.flush()
        return preference

    @staticmethod
    def _enabled(preference: NotificationPreference, channel: str) -> bool:
        return {"in_app": preference.in_app_enabled, "email": preference.email_enabled, "whatsapp": preference.whatsapp_enabled}.get(channel, False)

    def create_and_dispatch(self, db: Session, seller_account_id: int, user_id: int, *, category: str, severity: str, title: str, message: str, data: dict[str, Any] | None = None, channels: list[str] | None = None) -> Notification:
        if category not in self.VALID_CATEGORIES:
            raise ValueError("Unsupported notification category")
        requested = channels or [NotificationChannel.in_app.value]
        invalid = set(requested) - self.VALID_CHANNELS
        if invalid:
            raise ValueError(f"Unsupported notification channel: {sorted(invalid)[0]}")
        user = db.get(User, user_id)
        if user is None:
            raise ValueError("User not found")
        notification = Notification(seller_account_id=seller_account_id, user_id=user_id, category=category, severity=severity, title=title, message=message, data=data or {})
        db.add(notification)
        db.flush()
        preference = self._preference(db, seller_account_id, user_id, category)
        for channel in dict.fromkeys(requested):
            delivery = NotificationDelivery(notification_id=notification.id, channel=channel, status=NotificationDeliveryStatus.pending)
            db.add(delivery)
            if not self._enabled(preference, channel):
                delivery.status = NotificationDeliveryStatus.skipped
                delivery.provider = channel
                continue
            provider = self.providers[channel]
            delivery.provider = provider.name
            try:
                provider.send(user, notification)
                delivery.status = NotificationDeliveryStatus.sent
                delivery.sent_at = datetime.now(timezone.utc)
            except Exception as exc:
                delivery.status = NotificationDeliveryStatus.failed
                delivery.error = str(exc)
        db.commit()
        db.refresh(notification)
        return notification

    def deliveries(self, db: Session, notification_id: int) -> list[NotificationDelivery]:
        return list(db.execute(select(NotificationDelivery).where(NotificationDelivery.notification_id == notification_id).order_by(NotificationDelivery.id)).scalars())
