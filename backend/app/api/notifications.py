from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.core import SellerAccount, User
from app.models.notifications import Notification, NotificationCategory, NotificationDelivery, NotificationPreference
from app.schemas.notifications import NotificationCreate, NotificationDeliveryRead, NotificationPreferenceRead, NotificationPreferenceUpsert, NotificationRead
from app.services.notifications import NotificationService

router = APIRouter(prefix="/notifications", tags=["notifications"])
service = NotificationService()


def _seller(db: Session, user: User, seller_account_id: int) -> SellerAccount:
    seller = db.execute(select(SellerAccount).where(SellerAccount.id == seller_account_id, SellerAccount.user_id == user.id)).scalar_one_or_none()
    if seller is None:
        raise HTTPException(status_code=404, detail="Seller account not found")
    return seller


def _notification(db: Session, user: User, seller_account_id: int, notification_id: int) -> Notification:
    _seller(db, user, seller_account_id)
    notification = db.execute(select(Notification).where(Notification.id == notification_id, Notification.seller_account_id == seller_account_id, Notification.user_id == user.id)).scalar_one_or_none()
    if notification is None:
        raise HTTPException(status_code=404, detail="Notification not found")
    return notification


@router.post("", response_model=NotificationRead, status_code=201)
def create_notification(payload: NotificationCreate, seller_account_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    _seller(db, user, seller_account_id)
    try:
        return service.create_and_dispatch(db, seller_account_id, user.id, **payload.model_dump())
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.get("", response_model=list[NotificationRead])
def list_notifications(seller_account_id: int, unread_only: bool = False, category: str | None = Query(default=None), limit: int = Query(default=50, ge=1, le=200), db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    _seller(db, user, seller_account_id)
    query = select(Notification).where(Notification.seller_account_id == seller_account_id, Notification.user_id == user.id)
    if unread_only:
        query = query.where(Notification.read_at.is_(None))
    if category:
        query = query.where(Notification.category == category)
    return list(db.execute(query.order_by(Notification.id.desc()).limit(limit)).scalars())


@router.get("/{notification_id}/deliveries", response_model=list[NotificationDeliveryRead])
def list_deliveries(notification_id: int, seller_account_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    notification = _notification(db, user, seller_account_id, notification_id)
    return list(db.execute(select(NotificationDelivery).where(NotificationDelivery.notification_id == notification.id).order_by(NotificationDelivery.id)).scalars())


@router.patch("/{notification_id}/read", response_model=NotificationRead)
def mark_read(notification_id: int, seller_account_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    notification = _notification(db, user, seller_account_id, notification_id)
    from datetime import datetime, timezone
    notification.read_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(notification)
    return notification


@router.post("/read-all", status_code=204)
def mark_all_read(seller_account_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    _seller(db, user, seller_account_id)
    from datetime import datetime, timezone
    db.execute(update(Notification).where(Notification.seller_account_id == seller_account_id, Notification.user_id == user.id, Notification.read_at.is_(None)).values(read_at=datetime.now(timezone.utc)))
    db.commit()


@router.get("/preferences", response_model=list[NotificationPreferenceRead])
def list_preferences(seller_account_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    _seller(db, user, seller_account_id)
    return list(db.execute(select(NotificationPreference).where(NotificationPreference.seller_account_id == seller_account_id, NotificationPreference.user_id == user.id).order_by(NotificationPreference.category)).scalars())


@router.put("/preferences", response_model=NotificationPreferenceRead)
def upsert_preference(payload: NotificationPreferenceUpsert, seller_account_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    _seller(db, user, seller_account_id)
    if payload.category not in service.VALID_CATEGORIES:
        raise HTTPException(status_code=422, detail="Unsupported notification category")
    preference = db.execute(select(NotificationPreference).where(NotificationPreference.seller_account_id == seller_account_id, NotificationPreference.user_id == user.id, NotificationPreference.category == payload.category)).scalar_one_or_none()
    if preference is None:
        preference = NotificationPreference(seller_account_id=seller_account_id, user_id=user.id, **payload.model_dump())
        db.add(preference)
    else:
        preference.in_app_enabled = payload.in_app_enabled
        preference.email_enabled = payload.email_enabled
        preference.whatsapp_enabled = payload.whatsapp_enabled
    db.commit()
    db.refresh(preference)
    return preference
