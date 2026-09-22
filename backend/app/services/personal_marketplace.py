from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.core.security import CredentialEncryptionError, encrypt_credentials
from app.models.core import Marketplace, MarketplaceAccount, SellerAccount


@dataclass(frozen=True)
class MarketplaceBootstrapSpec:
    marketplace: Marketplace
    display_name: str
    external_account_id: str | None
    credentials: dict[str, object]


def _specs(settings: Settings) -> list[MarketplaceBootstrapSpec]:
    specs: list[MarketplaceBootstrapSpec] = []
    amazon = {
        "client_id": settings.amazon_lwa_client_id,
        "client_secret": settings.amazon_lwa_client_secret,
        "refresh_token": settings.amazon_lwa_refresh_token,
        "aws_access_key_id": settings.amazon_aws_access_key_id,
        "aws_secret_access_key": settings.amazon_aws_secret_access_key,
        "aws_session_token": settings.amazon_aws_session_token,
    }
    amazon_credentials = {key: value for key, value in amazon.items() if value not in (None, "")}
    if settings.amazon_seller_id or amazon_credentials:
        specs.append(MarketplaceBootstrapSpec(Marketplace.AMAZON, "Amazon", settings.amazon_seller_id, amazon_credentials))

    flipkart = {"app_id": settings.flipkart_app_id, "app_secret": settings.flipkart_app_secret}
    flipkart_credentials = {key: value for key, value in flipkart.items() if value not in (None, "")}
    if settings.flipkart_seller_id or flipkart_credentials:
        specs.append(MarketplaceBootstrapSpec(Marketplace.FLIPKART, "Flipkart", settings.flipkart_seller_id, flipkart_credentials))
    return specs


def ensure_personal_marketplaces(db: Session, settings: Settings | None = None) -> list[MarketplaceAccount]:
    """Create/update the single personal seller workspace from server-side environment configuration."""
    settings = settings or get_settings()
    seller = db.scalar(select(SellerAccount).where(SellerAccount.user_id.is_(None)).order_by(SellerAccount.id.asc()))
    if not seller:
        seller = SellerAccount(name=settings.personal_seller_name, user_id=None, is_active=True)
        db.add(seller)
        db.flush()
    elif seller.name != settings.personal_seller_name:
        seller.name = settings.personal_seller_name

    accounts: list[MarketplaceAccount] = []
    for spec in _specs(settings):
        account = db.scalar(select(MarketplaceAccount).where(MarketplaceAccount.seller_account_id == seller.id, MarketplaceAccount.marketplace == spec.marketplace.value))
        if not account:
            account = MarketplaceAccount(
                seller_account_id=seller.id,
                marketplace=spec.marketplace.value,
                display_name=spec.display_name,
                external_account_id=spec.external_account_id,
                is_connected=False,
            )
            db.add(account)
            db.flush()
        else:
            account.display_name = spec.display_name
            if spec.external_account_id:
                account.external_account_id = spec.external_account_id

        if spec.credentials:
            try:
                account.credentials_ref = encrypt_credentials(spec.credentials)
            except CredentialEncryptionError:
                raise
        accounts.append(account)

    db.commit()
    for account in accounts:
        db.refresh(account)
    return accounts


def personal_seller_id(db: Session) -> int | None:
    seller = db.scalar(select(SellerAccount.id).where(SellerAccount.user_id.is_(None), SellerAccount.is_active.is_(True)).order_by(SellerAccount.id.desc()))
    if seller is None:
        seller = db.scalar(select(SellerAccount.id).order_by(SellerAccount.id.desc()))
    return int(seller) if seller is not None else None


def personal_marketplace_account(db: Session, account_id: int) -> MarketplaceAccount | None:
    seller_id = personal_seller_id(db)
    if seller_id is None:
        return None
    return db.scalar(select(MarketplaceAccount).where(MarketplaceAccount.id == account_id, MarketplaceAccount.seller_account_id == seller_id))
