from __future__ import annotations

from app.marketplaces.adapters import ADAPTERS
from app.marketplaces.base import MarketplaceAdapter


def list_marketplaces() -> list[dict[str, object]]:
    return [
        {
            "marketplace": adapter.marketplace,
            "adapter_version": adapter.version,
            "capabilities": [c.__dict__ for c in adapter.capabilities()],
            "categories": [s.category for s in adapter.schemas()],
        }
        for adapter in ADAPTERS.values()
    ]


def get_adapter(marketplace: str) -> MarketplaceAdapter:
    try:
        return ADAPTERS[marketplace.casefold()]
    except KeyError as exc:
        raise ValueError(f"Unsupported marketplace: {marketplace}") from exc
