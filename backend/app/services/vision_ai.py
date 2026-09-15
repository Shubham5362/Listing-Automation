from __future__ import annotations
import hashlib, io, json, urllib.request
from PIL import Image, ImageFilter, ImageStat


def _download(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "SellerHubVision/1.0"})
    with urllib.request.urlopen(req, timeout=8) as response:
        data = response.read(8 * 1024 * 1024 + 1)
    if len(data) > 8 * 1024 * 1024:
        raise ValueError("image exceeds 8MB safety limit")
    return data


def analyze_image(url: str) -> dict[str, object]:
    raw = _download(url)
    image_hash = hashlib.sha256(raw).hexdigest()
    image = Image.open(io.BytesIO(raw)).convert("RGB")
    width, height = image.size
    if width <= 0 or height <= 0:
        raise ValueError("invalid image dimensions")
    gray = image.convert("L")
    blur = float(ImageStat.Stat(gray.filter(ImageFilter.FIND_EDGES)).variance[0])
    resolution_score = min(100.0, (width * height) / 2_000_000 * 100)
    aspect = width / height
    framing = 100.0 if 0.5 <= aspect <= 2.0 else 70.0
    quality = round(max(0.0, min(100.0, resolution_score * 0.55 + min(100.0, blur * 2.0) * 0.25 + framing * 0.20)), 2)
    findings = []
    if min(width, height) < 1000:
        findings.append({"code":"LOW_RESOLUTION","severity":"medium","message":"Image is below the recommended 1000px minimum on one axis."})
    if blur < 12:
        findings.append({"code":"POSSIBLE_BLUR","severity":"medium","message":"Edge variance suggests a potentially blurry image; manual review is recommended."})
    if aspect < 0.5 or aspect > 2.0:
        findings.append({"code":"EXTREME_ASPECT_RATIO","severity":"low","message":"Image framing may be unsuitable for marketplace cards."})
    return {"image_hash": image_hash, "width": width, "height": height, "blur_score": round(blur,3), "quality_score": quality, "findings": findings, "attributes": {"orientation": "portrait" if height > width else "landscape" if width > height else "square"}, "confidence": 90 if not findings else 78, "provider": "deterministic-vision"}
