from __future__ import annotations

import json

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.catalog import Listing, Product
from app.models.core import MarketplaceAccount, SellerAccount, User
from app.schemas.catalog import ListingCreate, ListingRead, ListingUpdate, ProductCreate, ProductRead, ProductUpdate
from app.services.auth import get_user_by_token

router = APIRouter(prefix="/catalog", tags=["catalog"])
bearer = HTTPBearer(auto_error=False)


def get_current_user(credentials: HTTPAuthorizationCredentials | None = Depends(bearer), db: Session = Depends(get_db)) -> User:
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    user = get_user_by_token(db, credentials.credentials)
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired session")
    return user


def _product_read(product: Product) -> ProductRead:
    return ProductRead(id=product.id, seller_account_id=product.seller_account_id, sku=product.sku, title=product.title, description=product.description, brand=product.brand, category=product.category, hsn_code=product.hsn_code, gst_rate=product.gst_rate, cost_price=product.cost_price, mrp=product.mrp, attributes=json.loads(product.attributes_json or "{}"), image_urls=json.loads(product.image_urls_json or "[]"), parent_sku=product.parent_sku, is_active=product.is_active)


def _listing_read(listing: Listing) -> ListingRead:
    return ListingRead(id=listing.id, product_id=listing.product_id, marketplace_account_id=listing.marketplace_account_id, sku=listing.sku, external_listing_id=listing.external_listing_id, status=listing.status, title=listing.title, price=listing.price, inventory_quantity=listing.inventory_quantity, attributes=json.loads(listing.attributes_json or "{}"), marketplace_data=json.loads(listing.marketplace_data_json or "{}"), validation_errors=json.loads(listing.validation_errors_json or "[]"))


@router.post("/products", response_model=ProductRead, status_code=201)
def create_product(payload: ProductCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> ProductRead:
    if not db.get(SellerAccount, payload.seller_account_id): raise HTTPException(404, "Seller account not found")
    if db.scalar(select(Product).where(Product.seller_account_id == payload.seller_account_id, Product.sku == payload.sku)): raise HTTPException(409, "SKU already exists for this seller account")
    product = Product(seller_account_id=payload.seller_account_id, sku=payload.sku, title=payload.title, description=payload.description, brand=payload.brand, category=payload.category, hsn_code=payload.hsn_code, gst_rate=payload.gst_rate, cost_price=payload.cost_price, mrp=payload.mrp, attributes_json=json.dumps(payload.attributes), image_urls_json=json.dumps(payload.image_urls), parent_sku=payload.parent_sku, is_active=payload.is_active)
    db.add(product); db.commit(); db.refresh(product)
    return _product_read(product)


@router.get("/products", response_model=list[ProductRead])
def list_products(seller_account_id: int | None = Query(default=None), sku: str | None = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> list[ProductRead]:
    stmt = select(Product).order_by(Product.id.desc())
    if seller_account_id is not None: stmt = stmt.where(Product.seller_account_id == seller_account_id)
    if sku: stmt = stmt.where(Product.sku == sku)
    return [_product_read(p) for p in db.scalars(stmt).all()]


@router.get("/products/{product_id}", response_model=ProductRead)
def get_product(product_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> ProductRead:
    product = db.get(Product, product_id)
    if not product: raise HTTPException(404, "Product not found")
    return _product_read(product)


@router.patch("/products/{product_id}", response_model=ProductRead)
def update_product(product_id: int, payload: ProductUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> ProductRead:
    product = db.get(Product, product_id)
    if not product: raise HTTPException(404, "Product not found")
    for field in ("title", "description", "brand", "category", "hsn_code", "gst_rate", "cost_price", "mrp", "parent_sku", "is_active"):
        value = getattr(payload, field)
        if value is not None: setattr(product, field, value)
    if payload.attributes is not None: product.attributes_json = json.dumps(payload.attributes)
    if payload.image_urls is not None: product.image_urls_json = json.dumps(payload.image_urls)
    db.commit(); db.refresh(product)
    return _product_read(product)


@router.post("/listings", response_model=ListingRead, status_code=201)
def create_listing(payload: ListingCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> ListingRead:
    if not db.get(Product, payload.product_id): raise HTTPException(404, "Product not found")
    if not db.get(MarketplaceAccount, payload.marketplace_account_id): raise HTTPException(404, "Marketplace account not found")
    if db.scalar(select(Listing).where(Listing.marketplace_account_id == payload.marketplace_account_id, Listing.sku == payload.sku)): raise HTTPException(409, "Listing SKU already exists for this marketplace account")
    listing = Listing(product_id=payload.product_id, marketplace_account_id=payload.marketplace_account_id, sku=payload.sku, external_listing_id=payload.external_listing_id, status=payload.status.value, title=payload.title, price=payload.price, inventory_quantity=payload.inventory_quantity, attributes_json=json.dumps(payload.attributes), marketplace_data_json=json.dumps(payload.marketplace_data), validation_errors_json="[]")
    db.add(listing); db.commit(); db.refresh(listing)
    return _listing_read(listing)


@router.get("/listings", response_model=list[ListingRead])
def list_listings(marketplace_account_id: int | None = Query(default=None), sku: str | None = None, status_filter: str | None = Query(default=None, alias="status"), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> list[ListingRead]:
    stmt = select(Listing).order_by(Listing.id.desc())
    if marketplace_account_id is not None: stmt = stmt.where(Listing.marketplace_account_id == marketplace_account_id)
    if sku: stmt = stmt.where(Listing.sku == sku)
    if status_filter: stmt = stmt.where(Listing.status == status_filter)
    return [_listing_read(item) for item in db.scalars(stmt).all()]


@router.get("/listings/{listing_id}", response_model=ListingRead)
def get_listing(listing_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> ListingRead:
    listing = db.get(Listing, listing_id)
    if not listing: raise HTTPException(404, "Listing not found")
    return _listing_read(listing)


@router.patch("/listings/{listing_id}", response_model=ListingRead)
def update_listing(listing_id: int, payload: ListingUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> ListingRead:
    listing = db.get(Listing, listing_id)
    if not listing: raise HTTPException(404, "Listing not found")
    for field in ("external_listing_id", "title", "price", "inventory_quantity"):
        value = getattr(payload, field)
        if value is not None: setattr(listing, field, value)
    if payload.status is not None: listing.status = payload.status.value
    if payload.attributes is not None: listing.attributes_json = json.dumps(payload.attributes)
    if payload.marketplace_data is not None: listing.marketplace_data_json = json.dumps(payload.marketplace_data)
    if payload.validation_errors is not None: listing.validation_errors_json = json.dumps(payload.validation_errors)
    db.commit(); db.refresh(listing)
    return _listing_read(listing)
