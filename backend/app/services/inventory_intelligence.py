from __future__ import annotations
from dataclasses import dataclass
from statistics import mean
from app.models.inventory import InventoryItem

@dataclass(frozen=True)
class InventoryInsight:
    sales_velocity: float
    days_inventory: float | None
    reorder_point: float
    demand_forecast: float
    stockout_risk: str
    overstock: bool
    recommended_quantity: int
    recommendation_type: str
    reason: str

class InventoryIntelligenceService:
    """Provider-neutral inventory intelligence from supplied sales history."""
    @staticmethod
    def analyze(item: InventoryItem, daily_units: list[float], lead_time_days: int = 7, safety_days: int = 3, forecast_days: int = 30) -> InventoryInsight:
        if lead_time_days < 0 or safety_days < 0 or forecast_days <= 0:
            raise ValueError("Invalid planning parameters")
        history = [max(float(x), 0.0) for x in daily_units]
        velocity = mean(history[-30:]) if history else 0.0
        recent = history[-7:]
        if recent:
            weighted = sum(value * (index + 1) for index, value in enumerate(recent)) / sum(range(1, len(recent) + 1))
            velocity = max(velocity, weighted)
        available = max(int(item.quantity) - int(item.reserved_quantity), 0)
        days = available / velocity if velocity > 0 else None
        forecast = velocity * forecast_days
        reorder = velocity * (lead_time_days + safety_days)
        risk = "high" if velocity > 0 and days is not None and days <= lead_time_days else "medium" if velocity > 0 and days is not None and days <= lead_time_days + safety_days else "low"
        overstock = velocity > 0 and days is not None and days > max(forecast_days * 1.5, lead_time_days + safety_days + 30)
        recommendation = max(int(round(reorder)) - available, 0)
        rec_type = "reorder" if recommendation > 0 else "overstock" if overstock else "monitor"
        reason = f"Available stock covers about {days:.1f} days at current velocity." if days is not None else "No positive sales history was supplied; demand is currently unproven."
        if recommendation > 0:
            reason += f" Replenish about {recommendation} units to cover lead time and safety stock."
        elif overstock:
            reason += " Inventory materially exceeds the planning horizon."
        return InventoryInsight(round(velocity, 4), round(days, 2) if days is not None else None, round(reorder, 2), round(forecast, 2), risk, overstock, recommendation, rec_type, reason)
