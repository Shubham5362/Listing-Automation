from datetime import datetime
import logging
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.core import User, SellerAccount, MarketplaceAccount, Marketplace
from app.services.auth import hash_password

logger = logging.getLogger("seed_sellerhub")


def seed_sellerhub(db: Session) -> None:
    """Ensure primary user and seller account exist, but start with completely empty seller data."""
    # 1. Primary User
    user = db.scalar(select(User).where(User.email == "shubham@sellerhub.io"))
    if not user:
        user = User(
            email="shubham@sellerhub.io",
            full_name="Shubham",
            password_hash=hash_password("SellerHub@123"),
            is_active=True,
        )
        db.add(user)
        db.flush()

    # 2. Primary Seller Account
    seller = db.scalar(select(SellerAccount).where(SellerAccount.name == "Shubham Enterprises"))
    if not seller:
        seller = SellerAccount(
            name="Shubham Enterprises",
            user_id=user.id,
            is_active=True,
        )
        db.add(seller)
        db.flush()
    elif seller.user_id != user.id:
        seller.user_id = user.id
        db.flush()

    # Marketplaces start unconnected (is_connected=False) with no fake external accounts
    amazon_account = db.scalar(
        select(MarketplaceAccount).where(
            MarketplaceAccount.seller_account_id == seller.id,
            MarketplaceAccount.marketplace == Marketplace.AMAZON.value,
        )
    )
    if not amazon_account:
        amazon_account = MarketplaceAccount(
            seller_account_id=seller.id,
            marketplace=Marketplace.AMAZON.value,
            display_name="Amazon India",
            external_account_id=None,
            is_connected=False,
            last_sync_at=None,
        )
        db.add(amazon_account)
        db.flush()
    else:
        amazon_account.is_connected = False
        amazon_account.external_account_id = None
        amazon_account.last_sync_at = None

    flipkart_account = db.scalar(
        select(MarketplaceAccount).where(
            MarketplaceAccount.seller_account_id == seller.id,
            MarketplaceAccount.marketplace == Marketplace.FLIPKART.value,
        )
    )
    if not flipkart_account:
        flipkart_account = MarketplaceAccount(
            seller_account_id=seller.id,
            marketplace=Marketplace.FLIPKART.value,
            display_name="Flipkart India",
            external_account_id=None,
            is_connected=False,
            last_sync_at=None,
        )
        db.add(flipkart_account)
        db.flush()
    else:
        flipkart_account.is_connected = False
        flipkart_account.external_account_id = None
        flipkart_account.last_sync_at = None

    db.commit()
    logger.info("Empty seller account initialized with no seed business data.")
