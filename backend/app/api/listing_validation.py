from __future__ import annotations
import json
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.catalog import Product
from app.models.core import SellerAccount, User
from app.models.listing_validation import ListingValidation
from app.schemas.listing_validation import ListingValidationScanRequest
from app.services.auth import get_user_by_token
from app.services.listing_validator import validate_listing
router=APIRouter(tags=["listing-validation"]); bearer=HTTPBearer(auto_error=False)
def current_user(credentials:HTTPAuthorizationCredentials|None=Depends(bearer),db:Session=Depends(get_db)):
    if not credentials: raise HTTPException(401,"Authentication required")
    user=get_user_by_token(db,credentials.credentials)
    if not user or not user.is_active: raise HTTPException(401,"Invalid or expired session")
    return user
def owned(db,pid,user):
    p=db.scalar(select(Product).join(SellerAccount,SellerAccount.id==Product.seller_account_id).where(Product.id==pid,SellerAccount.user_id==user.id))
    if not p: raise HTTPException(404,"Product not found")
    return p
def read(r): return {"id":r.id,"seller_account_id":r.seller_account_id,"product_id":r.product_id,"marketplace_account_id":r.marketplace_account_id,"status":r.status,"content_score":float(r.content_score),"seo_score":float(r.seo_score),"attributes_score":float(r.attributes_score),"compliance_score":float(r.compliance_score),"image_score":float(r.image_score),"variation_score":float(r.variation_score),"health_score":float(r.health_score),"findings":json.loads(r.findings_json),"recommendations":json.loads(r.recommendations_json)}
@router.post("/listing-validation/scan")
def scan(payload:ListingValidationScanRequest,db:Session=Depends(get_db),user:User=Depends(current_user)):
    p=owned(db,payload.product_id,user); return read(validate_listing(db,p,p.seller_account_id,payload.marketplace_account_id))
@router.get("/listing-validation")
def listing_validation(product_id:int|None=None,db:Session=Depends(get_db),user:User=Depends(current_user)):
    q=select(ListingValidation).join(SellerAccount,SellerAccount.id==ListingValidation.seller_account_id).where(SellerAccount.user_id==user.id)
    if product_id: q=q.where(ListingValidation.product_id==product_id)
    return [read(r) for r in db.scalars(q.order_by(ListingValidation.updated_at.desc())).all()]
@router.get("/listing-validation/{validation_id}")
def detail(validation_id:int,db:Session=Depends(get_db),user:User=Depends(current_user)):
    r=db.get(ListingValidation,validation_id)
    if not r: raise HTTPException(404,"Validation not found")
    owned(db,r.product_id,user); return read(r)
@router.get("/listing-health/{product_id}")
def health(product_id:int,db:Session=Depends(get_db),user:User=Depends(current_user)):
    p=owned(db,product_id,user); r=validate_listing(db,p,p.seller_account_id,None); return read(r)
@router.post("/listing-health/recalculate")
def recalculate(payload:ListingValidationScanRequest,db:Session=Depends(get_db),user:User=Depends(current_user)):
    p=owned(db,payload.product_id,user); return read(validate_listing(db,p,p.seller_account_id,payload.marketplace_account_id))
