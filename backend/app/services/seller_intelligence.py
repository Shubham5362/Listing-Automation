from __future__ import annotations
from dataclasses import dataclass
from statistics import median

@dataclass(frozen=True)
class PricingInsight:
    current_price: float
    recommended_price: float
    competitor_median: float | None
    margin_percent: float | None
    reason: str
    confidence: float

@dataclass(frozen=True)
class AdvertisingInsightResult:
    acos: float | None
    roas: float | None
    ctr: float | None
    conversion_rate: float | None
    waste_score: float
    action: str
    reason: str

class SellerIntelligenceService:
    @staticmethod
    def pricing(current_price: float, cost: float | None, competitor_prices: list[float], min_price: float | None = None, max_price: float | None = None, target_margin_percent: float | None = None) -> PricingInsight:
        if current_price <= 0 or (cost is not None and cost < 0):
            raise ValueError("Invalid pricing inputs")
        comps = [float(x) for x in competitor_prices if float(x) > 0]
        market = median(comps) if comps else None
        recommended = current_price
        reasons: list[str] = []
        if market is not None:
            recommended = market
            reasons.append(f"Competitor median is ₹{market:.2f}.")
        if target_margin_percent is not None and cost is not None:
            target = cost / max(1 - target_margin_percent / 100, 0.01)
            recommended = max(recommended, target)
            reasons.append(f"Target margin implies a minimum price of ₹{target:.2f}.")
        if min_price is not None: recommended = max(recommended, min_price)
        if max_price is not None: recommended = min(recommended, max_price)
        margin = ((current_price - cost) / current_price * 100) if cost is not None and current_price else None
        confidence = min(0.95, 0.55 + min(len(comps), 8) * 0.05) if comps else 0.35
        return PricingInsight(round(current_price, 2), round(recommended, 2), round(market, 2) if market else None, round(margin, 2) if margin is not None else None, " ".join(reasons) or "No competitor or margin target data available; maintain current price.", round(confidence, 2))

    @staticmethod
    def advertising(spend: float, sales: float, impressions: int, clicks: int, conversions: int, target_acos: float = 30) -> AdvertisingInsightResult:
        if min(spend, sales, impressions, clicks, conversions, target_acos) < 0 or target_acos <= 0:
            raise ValueError("Invalid advertising inputs")
        acos = spend / sales * 100 if sales > 0 else None
        roas = sales / spend if spend > 0 else None
        ctr = clicks / impressions * 100 if impressions > 0 else None
        cvr = conversions / clicks * 100 if clicks > 0 else None
        waste = 100.0 if spend > 0 and sales <= 0 else min(100.0, max(0.0, ((acos - target_acos) / target_acos * 100))) if acos is not None else 50.0
        if acos is None or (spend > 0 and sales <= 0): action, reason = "investigate", "Spend has not produced attributable sales in the supplied period."
        elif acos > target_acos * 1.25: action, reason = "reduce", f"ACOS {acos:.1f}% is materially above the {target_acos:.1f}% target."
        elif acos < target_acos * 0.75: action, reason = "scale", f"ACOS {acos:.1f}% is comfortably below the {target_acos:.1f}% target."
        else: action, reason = "maintain", f"ACOS {acos:.1f}% is within the target operating band."
        return AdvertisingInsightResult(*(round(x, 2) if x is not None else None for x in (acos, roas, ctr, cvr)), round(waste, 2), action, reason)

    @staticmethod
    def sku_health(inventory_score: float | None, pricing_score: float | None, profitability_score: float | None, advertising_score: float | None, sales_score: float | None) -> tuple[int, str]:
        values = [x for x in (inventory_score, pricing_score, profitability_score, advertising_score, sales_score) if x is not None]
        score = round(sum(values) / len(values)) if values else 0
        label = "healthy" if score >= 80 else "watch" if score >= 60 else "at_risk" if score >= 40 else "critical"
        return score, label
