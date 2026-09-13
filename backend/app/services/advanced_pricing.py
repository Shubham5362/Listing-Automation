from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class AdvancedPriceResult:
    recommended_price: float
    floor_price: float | None
    ceiling_price: float | None
    margin_percent: float | None
    competitor_price: float | None
    buy_box_price: float | None
    confidence: float
    action: str
    reason: str


class AdvancedPricingService:
    """Deterministic, provider-neutral pricing policy engine."""

    @staticmethod
    def recommend(current_price: float, cost_price: float | None, min_price: float | None, max_price: float | None, competitor_price: float | None = None, buy_box_price: float | None = None, target_margin_percent: float | None = None, undercut: float = 1.0, max_step_percent: float = 5.0) -> AdvancedPriceResult:
        if current_price <= 0 or undercut < 0 or max_step_percent <= 0:
            raise ValueError("Invalid pricing parameters")
        if min_price is not None and min_price <= 0:
            raise ValueError("min_price must be positive")
        if max_price is not None and max_price <= 0:
            raise ValueError("max_price must be positive")
        if min_price is not None and max_price is not None and min_price > max_price:
            raise ValueError("min_price cannot exceed max_price")

        floor = min_price
        if cost_price is not None and target_margin_percent is not None:
            if cost_price < 0 or not 0 <= target_margin_percent <= 100:
                raise ValueError("Invalid cost or target margin")
            margin_floor = cost_price / max(1 - target_margin_percent / 100, 0.0001)
            floor = max(floor or 0, margin_floor)
        ceiling = max_price
        if floor is not None and ceiling is not None and floor > ceiling:
            raise ValueError("Margin floor cannot exceed max_price")

        targets = [p for p in (buy_box_price, competitor_price) if p is not None and p > 0]
        target = min(targets) - undercut if targets else current_price
        target = max(target, 0.01)
        if floor is not None:
            target = max(target, floor)
        if ceiling is not None:
            target = min(target, ceiling)
        step = current_price * max_step_percent / 100
        target = min(max(target, current_price - step), current_price + step)
        target = round(max(target, 0.01), 2)
        margin = round((target - cost_price) / target * 100, 2) if cost_price is not None else None
        confidence = 0.95 if buy_box_price is not None else 0.8 if competitor_price is not None else 0.5
        action = "hold" if abs(target - current_price) < 0.01 else "decrease" if target < current_price else "increase"
        reason = "No external market signal supplied; preserving current price." if not targets else "Market signal used with margin and min/max price protections."
        return AdvancedPriceResult(target, floor, ceiling, margin, competitor_price, buy_box_price, confidence, action, reason)
