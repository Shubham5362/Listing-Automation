from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.shipments import ShipmentStatus
from app.models.core import User
from app.schemas.shipments import ShipmentCreate, ShipmentLabelRequest, ShipmentRead, ShipmentStatusUpdate
from app.services.shipping_fulfillment import attach_label, create_shipment, get_shipment_view, list_shipments, provider_capabilities, sync_tracking, update_status

router = APIRouter(prefix="/shipments", tags=["shipping-fulfillment"])


def _response(db: Session, row) -> ShipmentRead:
    return ShipmentRead.model_validate(row)


def _raise(exc: ValueError) -> None:
    raise HTTPException(status_code=409 if "transition" in str(exc).lower() or "before" in str(exc).lower() else 404, detail=str(exc))


@router.get("", response_model=list[ShipmentRead])
def shipments(status: ShipmentStatus | None = None, limit: int = Query(default=100, ge=1, le=200), user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return list_shipments(db, user.id, status, limit)


@router.post("", response_model=ShipmentRead, status_code=201)
def create(payload: ShipmentCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try: return _response(db, create_shipment(db, user.id, payload.order_id, payload.mode, payload.provider))
    except ValueError as exc: _raise(exc)


@router.get("/provider-capabilities/{marketplace}")
def capabilities(marketplace: str, user: User = Depends(get_current_user)):
    if marketplace.lower() not in {"amazon", "flipkart"}: raise HTTPException(status_code=400, detail="Unsupported marketplace")
    return provider_capabilities(marketplace.lower())


@router.get("/{shipment_id}", response_model=ShipmentRead)
def get(shipment_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try: return get_shipment_view(db, user.id, shipment_id)
    except ValueError as exc: _raise(exc)


@router.post("/{shipment_id}/label", response_model=ShipmentRead)
def label(shipment_id: int, payload: ShipmentLabelRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try: return _response(db, attach_label(db, user.id, shipment_id, payload.provider, payload.awb, payload.label_url, payload.tracking_url))
    except ValueError as exc: _raise(exc)


@router.post("/{shipment_id}/status", response_model=ShipmentRead)
def status(shipment_id: int, payload: ShipmentStatusUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try: return _response(db, update_status(db, user.id, shipment_id, payload.status, payload.message, payload.awb, payload.tracking_url))
    except ValueError as exc: _raise(exc)


@router.post("/{shipment_id}/tracking-sync", response_model=ShipmentRead)
def tracking_sync(shipment_id: int, payload: ShipmentStatusUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try: return _response(db, sync_tracking(db, user.id, shipment_id, payload.status, payload.message))
    except ValueError as exc: _raise(exc)
