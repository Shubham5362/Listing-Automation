from __future__ import annotations

from dataclasses import dataclass
from typing import Literal


@dataclass(frozen=True)
class AgentTool:
    name: str
    description: str
    capability: Literal["read", "plan", "write"]
    approval_required: bool


TOOLS: tuple[AgentTool, ...] = (
    AgentTool("get_business_context", "Read current marketplace, catalog and inventory context.", "read", False),
    AgentTool("analyze_inventory_risk", "Identify stockout and replenishment risks from verified inventory movements.", "read", False),
    AgentTool("analyze_advertising", "Evaluate campaign spend, sales, ACOS and ROAS signals.", "read", False),
    AgentTool("analyze_pricing", "Identify low-margin pricing opportunities from current listings and product cost.", "read", False),
    AgentTool("get_recommendations", "Read prioritized business recommendations from verified live data.", "read", False),
    AgentTool("build_action_plan", "Build a prioritized, explainable action plan without executing writes.", "plan", False),
    AgentTool("request_marketplace_action", "Create a concrete marketplace operation for the existing approval pipeline.", "write", True),
)


def list_tools() -> list[dict[str, object]]:
    return [{"name": t.name, "description": t.description, "capability": t.capability, "approval_required": t.approval_required} for t in TOOLS]
