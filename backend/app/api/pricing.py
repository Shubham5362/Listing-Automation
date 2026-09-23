from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.catalog import Listing, Product
from app.models.core import MarketplaceAccount, SellerAccount, User
from app.models.pricing import BuyBoxSnapshot, CompetitorPrice, PriceHistory, PricingRule
from app.schemas.pricing import (
    AdvancedPriceRecommendation, BuyBoxRead, BuyBoxRequest, CompetitorPriceRead,
    CompetitorPriceRequest, PriceHistoryRead, PriceRecommendation, PriceUpdateRequest,
    PricingRuleRead, PricingRuleRequest,
)
from app.services.advanced_pricing import AdvancedPricingService

router = APIRouter(prefix="/pricing", tags=["pricing"])


def _owned_listing(db: Session, user: User, listing_id: int) -> Listing:
    listing = db.get(Listing, listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    account = db.get(MarketplaceAccount, listing.marketplace_account_id)
    if not account:
        raise HTTPException(status_code=404, detail="Marketplace account not found")
    seller = db.get(SellerAccount, account.seller_account_id)
    if not seller or seller.user_id != user.id:
        raise HTTPException(status_code=404, detail="Listing not found")
    return listing


@router.get("", response_model=list[dict])
def pricing_workspace(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[dict]:
    listings = list(db.scalars(
        select(Listing)
        .join(Product, Product.id == Listing.product_id)
        .join(MarketplaceAccount, MarketplaceAccount.id == Listing.marketplace_account_id)
        .join(SellerAccount, SellerAccount.id == MarketplaceAccount.seller_account_id)
        .where(SellerAccount.user_id == user.id)
        .order_by(Listing.id.desc())
    ))
    return [{
        "id": item.id,
        "name": item.title or item.sku,
        "title": item.title,
        "sku": item.sku,
        "currentPrice": float(item.price) if item.price is not None else 0,
        "suggestedPrice": float(item.price) if item.price is not None else 0,
        "priceStatus": "Optimal",
        "buyBoxWon": False,
        "buyBox": "Unknown",
        "minPrice": 0,
        "maxPrice": 0,
        "costPrice": 0,
        "marginPercent": 0,
        "marginAmount": 0,
        "marketplaces": [],
        "category": "",
        "asin": item.external_listing_id or "",
        "hasAiSuggested": False,
        "estProfitLift": 0,
        "marketPriceAvg": 0,
        "priceRank": "",
        "lowestCompetitorPrice": 0,
        "totalCompetitors": 0,
        "aiInsightText": "",
    } for item in listings]


@router.patch("/{listing_id}", response_model=dict)
def update_workspace_price(listing_id: int, payload: PriceUpdateRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    listing = _owned_listing(db, user, listing_id)
    old = float(listing.price) if listing.price is not None else None
    rule = db.scalar(select(PricingRule).where(PricingRule.listing_id == listing.id, PricingRule.enabled.is_(True)))
    if rule and ((rule.min_price is not None and payload.price < float(rule.min_price)) or (rule.max_price is not None and payload.price > float(rule.max_price))):
        raise HTTPException(status_code=409, detail="Price violates active pricing rule")
    listing.price = payload.price
    db.add(PriceHistory(listing_id=listing.id, old_price=old, new_price=payload.price, source=payload.source.value, reason=payload.reason))
    db.commit(); db.refresh(listing)
    return {"id": listing.id, "currentPrice": float(listing.price), "priceStatus": "Optimal", "buyBoxWon": False, "buyBox": "Unknown"}


@router.post("/price", response_model=PriceHistoryRead, status_code=201)
def update_price(payload: PriceUpdateRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> PriceHistory:
    listing = _owned_listing(db, user, payload.listing_id)
    product = db.get(Product, listing.product_id)
    if payload.source.value in {"rule", "ai"} and not product:
        raise HTTPException(status_code=400, detail="Product required for automated pricing")
    old = float(listing.price) if listing.price is not None else None
    rule = db.scalar(select(PricingRule).where(PricingRule.listing_id == listing.id, PricingRule.enabled.is_(True)))
    if rule and ((rule.min_price is not None and payload.price < float(rule.min_price)) or (rule.max_price is not None and payload.price > float(rule.max_price))):
        raise HTTPException(status_code=409, detail="Price violates active pricing rule")
    listing.price = payload.price
    history = PriceHistory(listing_id=listing.id, old_price=old, new_price=payload.price, source=payload.source.value, reason=payload.reason)
    db.add(history)
    db.commit()
    db.refresh(history)
    return history


@router.get("/history/{listing_id}", response_model=list[PriceHistoryRead])
def price_history(listing_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[PriceHistory]:
    listing = _owned_listing(db, user, listing_id)
    return list(db.scalars(select(PriceHistory).where(PriceHistory.listing_id == listing.id).order_by(PriceHistory.created_at.desc())).all())


@router.post("/rules", response_model=PricingRuleRead, status_code=201)
def create_rule(payload: PricingRuleRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> PricingRule:
    sellers = db.scalars(select(SellerAccount).where(SellerAccount.user_id == user.id)).all()
    if not sellers:
        raise HTTPException(status_code=404, detail="Seller account not found")
    if payload.min_price is not None and payload.max_price is not None and payload.min_price > payload.max_price:
        raise HTTPException(status_code=422, detail="min_price cannot exceed max_price")
    listing = _owned_listing(db, user, payload.listing_id) if payload.listing_id else None
    data = payload.model_dump()
    data.pop("listing_id", None)
    rule = PricingRule(seller_account_id=(db.get(MarketplaceAccount, listing.marketplace_account_id).seller_account_id if listing else sellers[0].id), listing_id=listing.id if listing else None, **data)
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule


@router.get("/rules", response_model=list[PricingRuleRead])
def list_rules(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[PricingRule]:
    seller_ids = select(SellerAccount.id).where(SellerAccount.user_id == user.id)
    return list(db.scalars(select(PricingRule).where(PricingRule.seller_account_id.in_(seller_ids)).order_by(PricingRule.id.desc())).all())


@router.post("/competitors", response_model=CompetitorPriceRead, status_code=201)
def add_competitor(payload: CompetitorPriceRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> CompetitorPrice:
    listing = _owned_listing(db, user, payload.listing_id)
    data = payload.model_dump(); data.pop("listing_id", None)
    row = CompetitorPrice(listing_id=listing.id, **data); db.add(row); db.commit(); db.refresh(row); return row


@router.get("/competitors/{listing_id}", response_model=list[CompetitorPriceRead])
def competitors(listing_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[CompetitorPrice]:
    listing = _owned_listing(db, user, listing_id)
    return list(db.scalars(select(CompetitorPrice).where(CompetitorPrice.listing_id == listing.id).order_by(CompetitorPrice.captured_at.desc())).all())


@router.post("/buy-box", response_model=BuyBoxRead, status_code=201)
def record_buy_box(payload: BuyBoxRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> BuyBoxSnapshot:
    listing = _owned_listing(db, user, payload.listing_id)
    data = payload.model_dump(); data.pop("listing_id", None)
    row = BuyBoxSnapshot(listing_id=listing.id, **data); db.add(row); db.commit(); db.refresh(row); return row


@router.get("/buy-box/{listing_id}", response_model=list[BuyBoxRead])
def buy_box_history(listing_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[BuyBoxSnapshot]:
    listing = _owned_listing(db, user, listing_id)
    return list(db.scalars(select(BuyBoxSnapshot).where(BuyBoxSnapshot.listing_id == listing.id).order_by(BuyBoxSnapshot.captured_at.desc())).all())


@router.get("/recommendation/{listing_id}", response_model=PriceRecommendation)
def recommendation(listing_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> PriceRecommendation:
    listing = _owned_listing(db, user, listing_id)
    latest = db.scalar(select(CompetitorPrice).where(CompetitorPrice.listing_id == listing.id).order_by(CompetitorPrice.captured_at.desc()))
    current = float(listing.price) if listing.price is not None else None
    competitor = float(latest.price) if latest else None
    if competitor is None:
        return PriceRecommendation(listing_id=listing.id, current_price=current, competitor_price=None, recommended_price=current, reason="No competitor price data available")
    recommended = max(0.01, competitor - 1) if current is None or current > competitor else current
    return PriceRecommendation(listing_id=listing.id, current_price=current, competitor_price=competitor, recommended_price=recommended, reason="Target competitor price while preserving current price when already competitive")


@router.get("/advanced-recommendation/{listing_id}", response_model=AdvancedPriceRecommendation)
def advanced_recommendation(listing_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> AdvancedPriceRecommendation:
    listing = _owned_listing(db, user, listing_id)
    product = db.get(Product, listing.product_id)
    if listing.price is None:
        raise HTTPException(status_code=400, detail="Current listing price required")
    rule = db.scalar(select(PricingRule).where(PricingRule.listing_id == listing.id, PricingRule.enabled.is_(True)))
    competitor = db.scalar(select(CompetitorPrice).where(CompetitorPrice.listing_id == listing.id).order_by(CompetitorPrice.captured_at.desc()))
    buy_box = db.scalar(select(BuyBoxSnapshot).where(BuyBoxSnapshot.listing_id == listing.id).order_by(BuyBoxSnapshot.captured_at.desc()))
    result = AdvancedPricingService.recommend(float(listing.price), float(product.cost_price) if product and product.cost_price is not None else None, float(rule.min_price) if rule and rule.min_price is not None else None, float(rule.max_price) if rule and rule.max_price is not None else None, float(competitor.price) if competitor else None, float(buy_box.winning_price) if buy_box and buy_box.winning_price is not None else None, float(rule.target_margin_percent) if rule and rule.target_margin_percent is not None else None)
    return AdvancedPriceRecommendation(listing_id=listing.id, current_price=float(listing.price), **result.__dict__)
