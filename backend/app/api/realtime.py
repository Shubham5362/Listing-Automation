import asyncio
import json
from collections.abc import AsyncIterator
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import SessionLocal, get_db
from app.models.core import SellerAccount, User
from app.models.notifications import Notification

router = APIRouter(prefix="/realtime", tags=["realtime"])


def _seller(db: Session, user: User, seller_account_id: int) -> SellerAccount:
    seller = db.execute(
        select(SellerAccount).where(
            SellerAccount.id == seller_account_id,
            SellerAccount.user_id == user.id,
        )
    ).scalar_one_or_none()
    if seller is None:
        raise HTTPException(status_code=404, detail="Seller account not found")
    return seller


def _event(name: str, payload: dict[str, object]) -> str:
    return f"event: {name}\ndata: {json.dumps(payload, default=str, separators=(',', ':'))}\n\n"


async def _notification_stream(user_id: int, seller_account_id: int) -> AsyncIterator[str]:
    last_id: int | None = None
    heartbeat = 0
    yield _event("connected", {"seller_account_id": seller_account_id, "server_time": datetime.now(timezone.utc).isoformat()})
    try:
        while True:
            with SessionLocal() as db:
                latest = db.execute(
                    select(Notification)
                    .where(
                        Notification.seller_account_id == seller_account_id,
                        Notification.user_id == user_id,
                    )
                    .order_by(Notification.id.desc())
                    .limit(1)
                ).scalar_one_or_none()
                if latest is not None and latest.id != last_id:
                    last_id = latest.id
                    yield _event(
                        "notification",
                        {
                            "id": latest.id,
                            "category": latest.category,
                            "severity": latest.severity,
                            "title": latest.title,
                            "message": latest.message,
                            "read": latest.read_at is not None,
                            "created_at": latest.created_at,
                        },
                    )
                unread = db.execute(
                    select(func.count(Notification.id)).where(
                        Notification.seller_account_id == seller_account_id,
                        Notification.user_id == user_id,
                        Notification.read_at.is_(None),
                    )
                ).scalar_one()
            heartbeat += 1
            if heartbeat >= 8:
                heartbeat = 0
                yield _event("heartbeat", {"unread_count": int(unread), "server_time": datetime.now(timezone.utc).isoformat()})
            await asyncio.sleep(2)
    except asyncio.CancelledError:
        return


@router.get("/stream")
async def stream(seller_account_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    _seller(db, user, seller_account_id)
    return StreamingResponse(
        _notification_stream(user.id, seller_account_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
