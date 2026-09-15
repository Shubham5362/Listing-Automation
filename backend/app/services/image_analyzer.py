from __future__ import annotations
import json
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models.media import ProductMedia
from app.services.vision_ai import analyze_image


def analyze_product_images(db: Session, product_id: int, seller_account_id: int) -> list[dict[str, object]]:
    media = db.scalars(select(ProductMedia).where(ProductMedia.product_id == product_id, ProductMedia.seller_account_id == seller_account_id, ProductMedia.is_active.is_(True))).all()
    results=[]; hashes=set()
    for item in media:
        try:
            result=analyze_image(item.url)
            duplicate=result["image_hash"] in hashes
            hashes.add(result["image_hash"])
            if duplicate:
                result["findings"].append({"code":"DUPLICATE_IMAGE","severity":"medium","message":"This image is duplicated within the product gallery."})
            item.width=result["width"]; item.height=result["height"]; item.quality_score=int(result["quality_score"]); item.status="warning" if result["findings"] else "valid"; item.validation_errors_json=json.dumps(result["findings"]); item.ai_metadata_json=json.dumps(result["attributes"])
            results.append({"media_id":item.id, **result, "duplicate":duplicate})
        except Exception as exc:
            item.status="warning"; item.validation_errors_json=json.dumps([{"code":"VISION_UNAVAILABLE","severity":"medium","message":str(exc)}])
            results.append({"media_id":item.id,"image_url":item.url,"quality_score":0,"findings":[{"code":"VISION_UNAVAILABLE","severity":"medium","message":"Image could not be inspected safely."}],"confidence":0,"provider":"deterministic-vision"})
    db.commit(); return results
