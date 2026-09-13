from __future__ import annotations

import json
import re
from urllib.parse import urlparse

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.catalog import Product
from app.models.media import MediaRole, MediaStatus, ProductMedia

_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


def _json(value: str | None, default):
    try:
        return json.loads(value or "")
    except (TypeError, ValueError):
        return default


def validate_image(*, url: str, role: str, width: int | None, height: int | None, file_size_bytes: int | None, mime_type: str | None, marketplace_rules: dict[str, object]) -> tuple[str, int, list[str]]:
    errors: list[str] = []
    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        errors.append("invalid_image_url")
    path = parsed.path.lower()
    extension_ok = any(path.endswith(ext) for ext in _IMAGE_EXTENSIONS)
    mime_ok = not mime_type or mime_type.lower().startswith("image/")
    if not extension_ok and not mime_ok:
        errors.append("unsupported_image_format")
    if width is not None and height is not None:
        if width < 500 or height < 500:
            errors.append("image_resolution_below_500px")
        if width / max(height, 1) > 4 or height / max(width, 1) > 4:
            errors.append("extreme_aspect_ratio")
    max_bytes = marketplace_rules.get("max_file_size_bytes")
    if isinstance(max_bytes, int) and file_size_bytes and file_size_bytes > max_bytes:
        errors.append("file_size_exceeds_marketplace_limit")
    if role == MediaRole.MAIN.value and width and height and width < 1000:
        errors.append("main_image_below_recommended_1000px")
    score = 100
    if width and height:
        if min(width, height) >= 1500:
            score += 0
        elif min(width, height) >= 1000:
            score -= 5
        else:
            score -= 20
    else:
        score -= 15
    if not extension_ok and mime_ok:
        score -= 5
    score -= min(50, len(errors) * 15)
    score = max(0, min(100, score))
    status = MediaStatus.INVALID.value if errors else (MediaStatus.WARNING.value if score < 80 else MediaStatus.VALID.value)
    return status, score, errors


def create_media(db: Session, product: Product, *, url: str, role: str, alt_text: str | None, width: int | None, height: int | None, file_size_bytes: int | None, mime_type: str | None, marketplace_rules: dict[str, object]) -> ProductMedia:
    if role not in {item.value for item in MediaRole}:
        raise ValueError("Unsupported media role")
    existing = db.scalar(select(ProductMedia).where(ProductMedia.seller_account_id == product.seller_account_id, ProductMedia.product_id == product.id, ProductMedia.url == url))
    if existing:
        raise ValueError("Media URL already exists for product")
    if role == MediaRole.MAIN.value:
        db.query(ProductMedia).filter(ProductMedia.seller_account_id == product.seller_account_id, ProductMedia.product_id == product.id, ProductMedia.role == MediaRole.MAIN.value).update({"role": MediaRole.ADDITIONAL.value})
    status, score, errors = validate_image(url=url, role=role, width=width, height=height, file_size_bytes=file_size_bytes, mime_type=mime_type, marketplace_rules=marketplace_rules)
    row = ProductMedia(seller_account_id=product.seller_account_id, product_id=product.id, role=role, url=url, alt_text=alt_text, width=width, height=height, file_size_bytes=file_size_bytes, mime_type=mime_type, status=status, quality_score=score, validation_errors_json=json.dumps(errors), marketplace_rules_json=json.dumps(marketplace_rules))
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def media_health(db: Session, product: Product) -> dict[str, object]:
    rows = db.scalars(select(ProductMedia).where(ProductMedia.seller_account_id == product.seller_account_id, ProductMedia.product_id == product.id, ProductMedia.is_active.is_(True))).all()
    main_count = sum(row.role == MediaRole.MAIN.value for row in rows)
    valid = sum(row.status == MediaStatus.VALID.value for row in rows)
    warning = sum(row.status == MediaStatus.WARNING.value for row in rows)
    invalid = sum(row.status == MediaStatus.INVALID.value for row in rows)
    issues: list[str] = []
    recommendations: list[str] = []
    if not rows:
        issues.append("no_product_images")
        recommendations.append("add_a_main_product_image")
    if main_count == 0 and rows:
        issues.append("missing_main_image")
        recommendations.append("select_one_main_image")
    if main_count > 1:
        issues.append("multiple_main_images")
    if invalid:
        issues.append("invalid_images_present")
        recommendations.append("replace_invalid_images")
    if warning:
        recommendations.append("improve_low_quality_images")
    avg = round(sum(row.quality_score for row in rows) / len(rows)) if rows else 0
    if len(rows) >= 5:
        avg = min(100, avg + 5)
    score = max(0, min(100, avg - (20 if main_count == 0 else 0) - invalid * 10))
    return {"product_id": product.id, "seller_account_id": product.seller_account_id, "overall_score": score, "image_count": len(rows), "main_image_count": main_count, "valid_count": valid, "warning_count": warning, "invalid_count": invalid, "issues": issues, "recommendations": recommendations}


def generation_metadata(prompt: str, role: str, marketplace_rules: dict[str, object]) -> dict[str, object]:
    return {"provider": "pending", "generation_status": "ready_for_image_provider", "prompt": prompt, "role": role, "marketplace_rules": marketplace_rules}
