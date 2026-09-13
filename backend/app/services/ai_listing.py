from __future__ import annotations

import re
from dataclasses import dataclass

from app.models.catalog import Product


@dataclass(frozen=True)
class GeneratedListing:
    title: str
    bullets: list[str]
    description: str
    keywords: list[str]
    attributes: dict[str, object]
    quality_score: float
    validation_errors: list[str]


class ListingGenerationService:
    """Provider-neutral listing generator with deterministic local behavior.

    A future LLM provider can implement the same output contract without changing
    API or persistence code. The local generator is intentionally deterministic,
    so development and tests never depend on an external model or secret.
    """

    MARKETPLACE_TITLE_LIMITS = {"amazon": 200, "flipkart": 150}

    def generate(self, product: Product, marketplace: str, language: str = "en") -> GeneratedListing:
        marketplace = marketplace.lower().strip()
        if marketplace not in self.MARKETPLACE_TITLE_LIMITS:
            raise ValueError("Unsupported marketplace")
        if language not in {"en", "hi"}:
            raise ValueError("Language must be 'en' or 'hi'")

        base_title = " ".join((product.title or "").split())
        brand = " ".join((product.brand or "").split())
        category = " ".join((product.category or "").split())
        title = self._build_title(base_title, brand, category, language)
        title = title[: self.MARKETPLACE_TITLE_LIMITS[marketplace]].strip()

        attributes = self._attributes(product)
        bullets = self._build_bullets(product, attributes, language)
        description = self._build_description(product, brand, category, language)
        keywords = self._keywords(product, attributes)
        errors = self.validate(title, bullets, description, keywords, marketplace)
        score = self._score(title, bullets, description, keywords, errors)
        return GeneratedListing(title, bullets, description, keywords, attributes, score, errors)

    @staticmethod
    def _build_title(title: str, brand: str, category: str, language: str) -> str:
        prefix = f"{brand} " if brand and not title.lower().startswith(brand.lower()) else ""
        suffix = f" | {category}" if category and category.lower() not in title.lower() else ""
        result = f"{prefix}{title}{suffix}".strip(" |")
        if language == "hi":
            result = f"{result} | गुणवत्तापूर्ण उत्पाद"
        return result

    @staticmethod
    def _attributes(product: Product) -> dict[str, object]:
        raw = getattr(product, "attributes_json", None)
        import json
        try:
            data = json.loads(raw) if raw else {}
        except (TypeError, ValueError):
            data = {}
        return data if isinstance(data, dict) else {}

    @staticmethod
    def _build_bullets(product: Product, attributes: dict[str, object], language: str) -> list[str]:
        bullets: list[str] = []
        if product.brand:
            bullets.append(f"Brand: {product.brand}")
        if product.category:
            bullets.append(f"Category: {product.category}")
        for key, value in list(attributes.items())[:3]:
            bullets.append(f"{key.replace('_', ' ').title()}: {value}")
        bullets.append("Designed for dependable everyday use with practical product-focused features.")
        if language == "hi":
            bullets = [f"{b} | आसान उपयोग" for b in bullets]
        return bullets[:5]

    @staticmethod
    def _build_description(product: Product, brand: str, category: str, language: str) -> str:
        source = (product.description or "").strip()
        if source:
            text = source
        else:
            text = f"{brand + ' ' if brand else ''}{product.title} is a practical {category or 'product'} designed for reliable everyday use."
        if language == "hi":
            text = f"{text} यह उत्पाद दैनिक उपयोग के लिए सुविधाजनक और भरोसेमंद विकल्प है।"
        return text[:4000]

    @staticmethod
    def _keywords(product: Product, attributes: dict[str, object]) -> list[str]:
        source = " ".join(filter(None, [product.title, product.brand, product.category, *[str(v) for v in attributes.values()]]))
        words = re.findall(r"[A-Za-z0-9][A-Za-z0-9+&-]{2,}", source.lower())
        seen: set[str] = set()
        result: list[str] = []
        for word in words:
            if word not in seen:
                seen.add(word)
                result.append(word)
        return result[:20]

    @staticmethod
    def validate(title: str, bullets: list[str], description: str, keywords: list[str], marketplace: str) -> list[str]:
        errors: list[str] = []
        limit = ListingGenerationService.MARKETPLACE_TITLE_LIMITS[marketplace]
        if not title:
            errors.append("Title is required")
        if len(title) > limit:
            errors.append(f"Title exceeds {limit} characters")
        if not bullets:
            errors.append("At least one bullet is required")
        if not description:
            errors.append("Description is required")
        if len(keywords) < 3:
            errors.append("At least 3 search keywords are recommended")
        return errors

    @staticmethod
    def _score(title: str, bullets: list[str], description: str, keywords: list[str], errors: list[str]) -> float:
        score = 100.0
        score -= min(25.0, len(errors) * 12.5)
        if len(title) < 20:
            score -= 5
        if len(bullets) < 5:
            score -= 5
        if len(description) < 80:
            score -= 5
        if len(keywords) < 10:
            score -= 5
        return max(0.0, round(score, 2))
