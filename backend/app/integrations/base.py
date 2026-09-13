from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from typing import Any

from app.models.core import Marketplace


class MarketplaceIntegrationError(RuntimeError):
    """Base error for marketplace adapter failures."""


class MarketplaceAuthenticationError(MarketplaceIntegrationError):
    """Raised when marketplace credentials are invalid or expired."""


class MarketplaceRateLimitError(MarketplaceIntegrationError):
    """Raised when a marketplace asks the client to slow down."""


@dataclass(frozen=True)
class MarketplaceAccountContext:
    account_id: int
    marketplace: Marketplace
    external_account_id: str | None = None


@dataclass(frozen=True)
class MarketplaceProduct:
    sku: str
    title: str
    external_id: str | None = None
    attributes: dict[str, Any] | None = None


@dataclass(frozen=True)
class MarketplaceOrder:
    external_order_id: str
    status: str
    ordered_at: datetime
    total: Decimal
    currency: str = "INR"
    items: list[dict[str, Any]] | None = None


@dataclass(frozen=True)
class InventoryItem:
    sku: str
    quantity: int
    reserved_quantity: int = 0
    fulfillment_center: str | None = None


@dataclass(frozen=True)
class PriceQuote:
    sku: str
    price: Decimal
    currency: str = "INR"
    buy_box_price: Decimal | None = None


class MarketplaceClient(ABC):
    """Provider-neutral contract implemented by each marketplace adapter."""

    marketplace: Marketplace

    @abstractmethod
    def test_connection(self, account: MarketplaceAccountContext) -> bool:
        raise NotImplementedError

    @abstractmethod
    def list_products(self, account: MarketplaceAccountContext, *, limit: int = 50) -> list[MarketplaceProduct]:
        raise NotImplementedError

    @abstractmethod
    def list_orders(self, account: MarketplaceAccountContext, *, limit: int = 50) -> list[MarketplaceOrder]:
        raise NotImplementedError

    @abstractmethod
    def get_inventory(self, account: MarketplaceAccountContext, *, skus: list[str] | None = None) -> list[InventoryItem]:
        raise NotImplementedError

    @abstractmethod
    def get_prices(self, account: MarketplaceAccountContext, *, skus: list[str]) -> list[PriceQuote]:
        raise NotImplementedError

    @abstractmethod
    def update_inventory(self, account: MarketplaceAccountContext, *, sku: str, quantity: int) -> None:
        raise NotImplementedError

    @abstractmethod
    def update_price(self, account: MarketplaceAccountContext, *, sku: str, price: Decimal) -> None:
        raise NotImplementedError

    @abstractmethod
    def fetch_report(self, account: MarketplaceAccountContext, report_type: str) -> dict[str, Any]:
        raise NotImplementedError
