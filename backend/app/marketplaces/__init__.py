"""Universal marketplace adapter framework for Listing Automation."""

from app.marketplaces.base import MarketplaceAdapter, MarketplaceCapability, MarketplaceSchema
from app.marketplaces.registry import get_adapter, list_marketplaces

__all__ = ["MarketplaceAdapter", "MarketplaceCapability", "MarketplaceSchema", "get_adapter", "list_marketplaces"]
