from __future__ import annotations

import json
import re
from dataclasses import dataclass

from app.models.catalog import Product


@dataclass(frozen=True)
class AdvancedListingResult:
    title: str
    bullets: list[str]
    description: str
    search_terms: list[str]
    attributes: dict[str, object]
    competitor_insights: list[str]
    compliance_issues: list[str]
    quality_score: float
    ready_for_approval: bool


class AdvancedListingAgent:
    """Deterministic provider-neutral listing agent.

    Produces an approval-ready listing plan from first-party product data. It does
    not invent competitor facts, marketplace policies, certifications, or claims.
    An external LLM/search provider can later replace individual planning stages.
    """

    LIMITS = {"amazon": 200, "flipkart": 150}
    CLAIM_WORDS = {"best", "number one", "#1", "guaranteed", "100%", "cure", "free"}

    def build(self, product: Product, marketplace: str, language: str = "en") -> AdvancedListingResult:
        marketplace = marketplace.lower().strip()
        if marketplace not in self.LIMITS:
            raise ValueError("Unsupported marketplace")
        if language not in {"en", "hi"}:
            raise ValueError("Language must be 'en' or 'hi'")
        attrs = self._attributes(product)
        keywords = self._keywords(product, attrs)
        title = self._title(product, marketplace, language)
        bullets = self._bullets(product, attrs, language)
        description = self._description(product, attrs, language)
        compliance = self._compliance(title, bullets, description)
        insights = ["Competitor research is provider-ready; no unsupported competitor claims were inferred."]
        score = self._score(title, bullets, description, keywords, compliance)
        return AdvancedListingResult(title, bullets, description, keywords, attrs, insights, compliance, score, not compliance and score >= 80)

    @staticmethod
    def _attributes(product: Product) -> dict[str, object]:
        try:
            value = json.loads(getattr(product, "attributes_json", None) or "{}")
        except (TypeError, ValueError):
            value = {}
        return value if isinstance(value, dict) else {}

    def _title(self, product: Product, marketplace: str, language: str) -> str:
        parts = [str(x).strip() for x in (product.brand, product.title, product.category) if x and str(x).strip()]
        title = " | ".join(dict.fromkeys(parts))
        if language == "hi":
            title = f"{title} | दैनिक उपयोग के लिए" if title else "दैनिक उपयोग के लिए उत्पाद"
        return re.sub(r"\s+", " ", title).strip()[: self.LIMITS[marketplace]].strip(" |")

    @staticmethod
    def _bullets(product: Product, attrs: dict[str, object], language: str) -> list[str]:
        bullets: list[str] = []
        if product.brand:
            bullets.append(f"Brand: {product.brand}")
        if product.category:
            bullets.append(f"Category: {product.category}")
        for key, value in list(attrs.items())[:3]:
            bullets.append(f"{str(key).replace('_', ' ').title()}: {value}")
        if product.description:
            bullets.append("Product details are based on the supplied product description.")
        else:
            bullets.append("Practical product-focused design for everyday use.")
        if language == "hi":
            bullets = [f"{item} | आसान उपयोग" for item in bullets]
        return bullets[:5]

    @staticmethod
    def _description(product: Product, attrs: dict[str, object], language: str) -> str:
        base = (product.description or "").strip()
        if not base:
            base = f"{product.title or 'This product'} is designed for practical everyday use."
        if attrs:
            detail = "; ".join(f"{k}: {v}" for k, v in list(attrs.items())[:5])
            base = f"{base} Key details: {detail}."
        if language == "hi":
            base += " यह विवरण उपलब्ध उत्पाद जानकारी पर आधारित है।"
        return base[:4000]

    @staticmethod
    def _keywords(product: Product, attrs: dict[str, object]) -> list[str]:
        text = " ".join(filter(None, [product.title, product.brand, product.category, product.description, *map(str, attrs.values())]))
        words = re.findall(r"[A-Za-z0-9][A-Za-z0-9+&-]{2,}", text.lower())
        seen: set[str] = set()
        result: list[str] = []
        for word in words:
            if word not in seen:
                seen.add(word)
                result.append(word)
        return result[:25]

    def _compliance(self, *texts: str | list[str]) -> list[str]:
        flat = " ".join(" ".join(x) if isinstance(x, list) else x for x in texts).lower()
        issues = [f"unsupported_claim:{word}" for word in self.CLAIM_WORDS if word in flat]
        return sorted(issues)

    @staticmethod
    def _score(title: str, bullets: list[str], description: str, keywords: list[str], compliance: list[str]) -> float:
        score = 100.0
        score -= min(40, len(compliance) * 15)
        if len(title) < 20:
            score -= 5
        if len(bullets) < 5:
            score -= 5
        if len(description) < 80:
            score -= 5
        if len(keywords) < 10:
            score -= 5
        return max(0, round(score, 2))
