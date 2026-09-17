from dataclasses import dataclass
from typing import Iterable


@dataclass(frozen=True)
class AdvertisingAIResult:
    action: str
    confidence: float
    reasons: list[str]
    recommended_budget: float | None
    bid_multiplier: float | None
    waste_score: float


class AdvertisingAIService:
    """Deterministic advertising intelligence. Actions are advisory only."""

    @staticmethod
    def optimize(*, spend: float, sales: float, clicks: int, conversions: int,
                 daily_budget: float, target_acos: float = 30.0,
                 max_budget_step_percent: float = 15.0) -> AdvertisingAIResult:
        if min(spend, sales, daily_budget, target_acos, max_budget_step_percent) < 0:
            raise ValueError("advertising metrics and limits cannot be negative")
        if target_acos == 0 or max_budget_step_percent == 0:
            raise ValueError("target_acos and max_budget_step_percent must be positive")
        acos = spend / sales * 100 if sales else 0.0
        roas = sales / spend if spend else 0.0
        cvr = conversions / clicks * 100 if clicks else 0.0
        waste = min(1.0, spend / max(sales, 1.0)) if spend else 0.0
        reasons: list[str] = []
        if spend > 0 and sales == 0:
            return AdvertisingAIResult("pause_or_review", 0.97, ["spend has no attributed sales"], max(0.0, round(daily_budget * 0.5, 2)), 0.75, 1.0)
        if acos > target_acos * 1.35:
            reasons.append(f"ACOS {acos:.2f}% is materially above target")
            return AdvertisingAIResult("reduce", 0.93, reasons, round(daily_budget * 0.85, 2), 0.85, round(waste, 4))
        if roas >= 4 and acos <= target_acos and daily_budget > 0:
            reasons.append(f"ROAS {roas:.2f} and ACOS {acos:.2f}% indicate efficient spend")
            return AdvertisingAIResult("scale", 0.91, reasons, round(daily_budget * (1 + max_budget_step_percent / 100), 2), 1.1, round(waste, 4))
        if clicks >= 20 and cvr < 2:
            reasons.append(f"conversion rate {cvr:.2f}% is weak for {clicks} clicks")
            return AdvertisingAIResult("reduce", 0.82, reasons, round(daily_budget * 0.9, 2), 0.9, round(waste, 4))
        return AdvertisingAIResult("hold", 0.68, ["performance does not meet a stronger optimization threshold"], daily_budget, 1.0, round(waste, 4))

    @staticmethod
    def keyword_actions(rows: Iterable[object], target_acos: float = 30.0) -> list[dict]:
        if target_acos <= 0:
            raise ValueError("target_acos must be positive")
        grouped: dict[str, dict[str, float]] = {}
        for row in rows:
            keyword = getattr(row, "keyword", None)
            if not keyword:
                continue
            item = grouped.setdefault(str(keyword), {"spend": 0.0, "sales": 0.0, "clicks": 0.0, "conversions": 0.0})
            item["spend"] += float(getattr(row, "spend", 0) or 0)
            item["sales"] += float(getattr(row, "sales", 0) or 0)
            item["clicks"] += float(getattr(row, "clicks", 0) or 0)
            item["conversions"] += float(getattr(row, "conversions", 0) or 0)
        result = []
        for keyword, m in grouped.items():
            acos = m["spend"] / m["sales"] * 100 if m["sales"] else 0
            if m["spend"] > 0 and m["sales"] == 0:
                action = "negative_or_pause"
            elif acos > target_acos * 1.35:
                action = "lower_bid"
            elif acos <= target_acos and m["conversions"] > 0:
                action = "raise_bid"
            else:
                action = "monitor"
            result.append({"keyword": keyword, "action": action, "spend": round(m["spend"], 2), "sales": round(m["sales"], 2), "acos": round(acos, 4)})
        return sorted(result, key=lambda x: (-x["spend"], x["keyword"]))
