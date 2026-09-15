from __future__ import annotations

import hashlib
import json
import re
from datetime import datetime
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.marketplaces.registry import get_adapter
from app.models.catalog import Listing, Product
from app.models.marketplace_adapter import MarketplaceAdapterSnapshot
from app.models.marketplace_change import MarketplaceChangeImpact, MarketplaceMappingVersion, MarketplaceSchemaChange
from app.services.product_knowledge import canonical_attribute


def _norm(value: Any) -> str:
    return re.sub(r"[^a-z0-9]+", " ", str(value or "").casefold()).strip()


def _fingerprint(schema: dict[str, Any]) -> str:
    return hashlib.sha256(json.dumps(schema, sort_keys=True, ensure_ascii=False, separators=(",", ":")).encode()).hexdigest()


def _fields(schema_json: str) -> dict[str, dict[str, Any]]:
    try: payload = json.loads(schema_json or "{}")
    except json.JSONDecodeError: payload = {}
    return {str(f.get("name")): f for f in payload.get("fields", []) if isinstance(f, dict) and f.get("name")}


def _similar(a: str, b: str) -> float:
    if _norm(a) == _norm(b): return 1.0
    aw, bw = set(_norm(a).split()), set(_norm(b).split())
    return len(aw & bw) / len(aw | bw) if aw and bw else 0.0


def _classify(old: dict[str, Any], new: dict[str, Any]) -> list[dict[str, Any]]:
    old_fields, new_fields = _fields(json.dumps(old)), _fields(json.dumps(new))
    changes: list[dict[str, Any]] = []
    removed = {name: field for name, field in old_fields.items() if name not in new_fields}
    added = {name: field for name, field in new_fields.items() if name not in old_fields}
    paired_added: set[str] = set()
    for old_name, old_field in removed.items():
        candidates = sorted(((new_name, _similar(old_name, new_name)) for new_name in added), key=lambda x: x[1], reverse=True)
        if candidates and candidates[0][1] >= 0.55 and candidates[0][0] not in paired_added:
            new_name, score = candidates[0]; paired_added.add(new_name)
            changes.append({"change_type":"FIELD_RENAMED","field_name":new_name,"old":old_field,"new":new_fields[new_name],"canonical":old_field.get("canonical") or canonical_attribute(old_name),"confidence":round(score*100),"reason":f"Field label changed from {old_name} to {new_name}"})
        else:
            changes.append({"change_type":"FIELD_REMOVED","field_name":old_name,"old":old_field,"new":None,"canonical":old_field.get("canonical") or canonical_attribute(old_name),"confidence":99,"reason":"Field no longer exists in the current schema"})
    for name, field in added.items():
        if name not in paired_added:
            changes.append({"change_type":"FIELD_ADDED","field_name":name,"old":None,"new":field,"canonical":field.get("canonical") or canonical_attribute(name),"confidence":99,"reason":"Field was added to the current schema"})
    for name in set(old_fields) & set(new_fields):
        old_f, new_f = old_fields[name], new_fields[name]
        if old_f.get("field_type") != new_f.get("field_type"):
            changes.append({"change_type":"FIELD_TYPE_CHANGED","field_name":name,"old":old_f.get("field_type"),"new":new_f.get("field_type"),"canonical":new_f.get("canonical") or canonical_attribute(name),"confidence":99,"reason":"Field type changed"})
        if bool(old_f.get("required")) != bool(new_f.get("required")):
            changes.append({"change_type":"FIELD_REQUIRED_CHANGED","field_name":name,"old":old_f.get("required"),"new":new_f.get("required"),"canonical":new_f.get("canonical") or canonical_attribute(name),"confidence":99,"reason":"Required status changed"})
        if list(old_f.get("enum") or []) != list(new_f.get("enum") or []):
            changes.append({"change_type":"FIELD_OPTIONS_CHANGED","field_name":name,"old":old_f.get("enum") or [],"new":new_f.get("enum") or [],"canonical":new_f.get("canonical") or canonical_attribute(name),"confidence":99,"reason":"Allowed values changed"})
        if old_f.get("unit") != new_f.get("unit"):
            changes.append({"change_type":"UNIT_CHANGED","field_name":name,"old":old_f.get("unit"),"new":new_f.get("unit"),"canonical":new_f.get("canonical") or canonical_attribute(name),"confidence":99,"reason":"Field unit changed"})
    return changes


def _severity(change: dict[str, Any]) -> str:
    if change["change_type"] in {"FIELD_REQUIRED_CHANGED","FIELD_REMOVED","FIELD_TYPE_CHANGED"}: return "high"
    if change["change_type"] in {"FIELD_OPTIONS_CHANGED","UNIT_CHANGED","FIELD_RENAMED"}: return "medium"
    return "low"


def _auto_adaptable(change: dict[str, Any]) -> bool:
    return change["confidence"] >= 90 and change["change_type"] in {"FIELD_RENAMED","FIELD_OPTIONS_CHANGED","UNIT_CHANGED"}


def scan_marketplace(db: Session, marketplace: str, category: str | None = None) -> dict[str, Any]:
    adapter = get_adapter(marketplace)
    schemas = [adapter.schema_for(category)] if category else list(adapter.schemas())
    result = {"marketplace": marketplace, "categories": [], "changes": []}
    for schema in schemas:
        current = {"version":schema.version,"category":schema.category,"fields":[f.__dict__ for f in schema.fields]}
        current_fp = _fingerprint(current)
        latest = db.scalar(select(MarketplaceAdapterSnapshot).where(MarketplaceAdapterSnapshot.marketplace == marketplace, MarketplaceAdapterSnapshot.category == schema.category).order_by(MarketplaceAdapterSnapshot.id.desc()))
        if latest and _fingerprint(json.loads(latest.schema_json)) == current_fp:
            result["categories"].append({"category":schema.category,"status":"unchanged","snapshot_id":latest.id}); continue
        new_row = MarketplaceAdapterSnapshot(marketplace=marketplace,adapter_version=adapter.version,schema_version=schema.version,category=schema.category,schema_json=json.dumps(current,ensure_ascii=False,separators=(",",":")),status="active",created_at=datetime.utcnow())
        db.add(new_row); db.flush(); category_changes=[]
        if latest:
            category_changes = _classify(json.loads(latest.schema_json), current)
            for change in category_changes:
                row = MarketplaceSchemaChange(marketplace=marketplace,category=schema.category,old_snapshot_id=latest.id,new_snapshot_id=new_row.id,change_type=change["change_type"],field_name=change.get("field_name"),old_value_json=json.dumps(change.get("old"),ensure_ascii=False),new_value_json=json.dumps(change.get("new"),ensure_ascii=False),canonical=change.get("canonical"),confidence=change["confidence"],severity=_severity(change),status="detected",auto_adaptable=_auto_adaptable(change),reason=change["reason"])
                db.add(row); db.flush(); _record_impact(db,row,change)
                result["changes"].append(change | {"id":row.id,"category":schema.category,"severity":row.severity,"auto_adaptable":row.auto_adaptable})
        result["categories"].append({"category":schema.category,"status":"changed" if latest else "baseline_created","snapshot_id":new_row.id,"change_count":len(category_changes)})
    db.commit(); return result


def _record_impact(db: Session, change: MarketplaceSchemaChange, detail: dict[str, Any]) -> None:
    products = db.scalars(select(Product).where(Product.category == change.category)).all(); canonical=detail.get("canonical"); affected=0
    for product in products:
        if canonical in {"SKU","TITLE","BRAND","CATEGORY","HSN","GST_RATE"}:
            value=getattr(product,{"SKU":"sku","TITLE":"title","BRAND":"brand","CATEGORY":"category","HSN":"hsn_code","GST_RATE":"gst_rate"}[canonical],None); has_value=value not in (None,"")
        else:
            try: attrs=json.loads(product.attributes_json or "{}")
            except json.JSONDecodeError: attrs={}
            has_value=any(canonical_attribute(str(k))==canonical and v not in (None,"",[]) for k,v in attrs.items())
        if has_value or detail["change_type"] in {"FIELD_ADDED","FIELD_REQUIRED_CHANGED","FIELD_REMOVED"}: affected+=1
    listings=db.scalar(select(func.count(Listing.id)).join(Product,Listing.product_id==Product.id).where(Product.category==change.category)) or 0
    auto_fix=affected if change.auto_adaptable else 0; review=affected if not change.auto_adaptable else 0; blocked=affected if detail["change_type"] in {"FIELD_REMOVED","FIELD_TYPE_CHANGED"} else 0
    db.add(MarketplaceChangeImpact(change_id=change.id,affected_products=affected,affected_listings=int(listings),auto_fixable=auto_fix,review_required=review,blocked=blocked,details_json=json.dumps({"canonical":canonical,"change_type":detail["change_type"]})))


def list_changes(db: Session, marketplace: str | None = None, status: str | None = None) -> list[dict[str, Any]]:
    stmt=select(MarketplaceSchemaChange).order_by(MarketplaceSchemaChange.id.desc())
    if marketplace: stmt=stmt.where(MarketplaceSchemaChange.marketplace==marketplace)
    if status: stmt=stmt.where(MarketplaceSchemaChange.status==status)
    rows=db.scalars(stmt.limit(100)).all(); output=[]
    for row in rows:
        impact=db.scalar(select(MarketplaceChangeImpact).where(MarketplaceChangeImpact.change_id==row.id))
        output.append({"id":row.id,"marketplace":row.marketplace,"category":row.category,"change_type":row.change_type,"field_name":row.field_name,"canonical":row.canonical,"confidence":row.confidence,"severity":row.severity,"status":row.status,"auto_adaptable":row.auto_adaptable,"reason":row.reason,"impact":{"affected_products":impact.affected_products,"affected_listings":impact.affected_listings,"auto_fixable":impact.auto_fixable,"review_required":impact.review_required,"blocked":impact.blocked} if impact else None,"created_at":row.created_at.isoformat()})
    return output


def set_change_status(db: Session, change_id: int, status: str) -> dict[str, Any]:
    row=db.get(MarketplaceSchemaChange,change_id)
    if not row: raise ValueError("Marketplace change not found")
    if status not in {"detected","review_required","rejected","validated","rolled_back"}: raise ValueError("Invalid marketplace change status")
    row.status=status; db.commit(); return {"change_id":row.id,"status":row.status}


def apply_change(db: Session, change_id: int) -> dict[str, Any]:
    row=db.get(MarketplaceSchemaChange,change_id)
    if not row: raise ValueError("Marketplace change not found")
    if not row.auto_adaptable or row.confidence < 90: raise ValueError("Change is not safe for automatic adaptation")
    current_version=db.scalar(select(func.max(MarketplaceMappingVersion.version)).where(MarketplaceMappingVersion.marketplace==row.marketplace,MarketplaceMappingVersion.category==row.category,MarketplaceMappingVersion.canonical==row.canonical)) or 0
    new_field=json.loads(row.new_value_json or "null"); marketplace_field=new_field.get("name") if isinstance(new_field,dict) else row.field_name
    mapping=MarketplaceMappingVersion(marketplace=row.marketplace,category=row.category,canonical=row.canonical or "UNKNOWN",marketplace_field=marketplace_field or row.field_name or "UNKNOWN",version=current_version+1,confidence=row.confidence,source_change_id=row.id,status="active")
    db.add(mapping); row.status="validated"; db.commit(); return {"change_id":row.id,"mapping_version":mapping.version,"marketplace_field":mapping.marketplace_field,"status":row.status}


def rollback_mapping(db: Session, marketplace: str, category: str, canonical: str) -> dict[str, Any]:
    rows=db.scalars(select(MarketplaceMappingVersion).where(MarketplaceMappingVersion.marketplace==marketplace,MarketplaceMappingVersion.category==category,MarketplaceMappingVersion.canonical==canonical).order_by(MarketplaceMappingVersion.version.desc())).all()
    if len(rows)<2: raise ValueError("No previous mapping version available")
    rows[0].status="rolled_back"; rows[1].status="active"; db.commit()
    return {"marketplace":marketplace,"category":category,"canonical":canonical,"active_version":rows[1].version,"rolled_back_version":rows[0].version}
