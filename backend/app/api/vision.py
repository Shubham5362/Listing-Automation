from __future__ import annotations
import json
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.core import SellerAccount, User
from app.models.catalog import Product
from app.models.media import ProductMedia
from app.models.vision_analysis import VisionAnalysis
from app.schemas.vision import VisionAnalyzeRequest, VisionReviewRequest
from app.services.auth import get_user_by_token
from app.services.vision_ai import analyze_image

router=APIRouter(prefix="/vision",tags=["vision"]); bearer=HTTPBearer(auto_error=False)
def current_user(credentials: HTTPAuthorizationCredentials|None=Depends(bearer),db:Session=Depends(get_db)):
    if not credentials: raise HTTPException(401,"Authentication required")
    user=get_user_by_token(db,credentials.credentials)
    if not user or not user.is_active: raise HTTPException(401,"Invalid or expired session")
    return user
def owned(db,pid,user):
    row=db.scalar(select(Product).join(SellerAccount,SellerAccount.id==Product.seller_account_id).where(Product.id==pid,SellerAccount.user_id==user.id))
    if not row: raise HTTPException(404,"Product not found")
    return row
@router.post("/analyze")
def analyze(payload:VisionAnalyzeRequest,db:Session=Depends(get_db),user:User=Depends(current_user)):
    product=owned(db,payload.product_id,user); result=analyze_image(payload.image_url)
    row=db.scalar(select(VisionAnalysis).where(VisionAnalysis.seller_account_id==product.seller_account_id,VisionAnalysis.product_id==product.id,VisionAnalysis.image_hash==result["image_hash"]))
    if not row: row=VisionAnalysis(seller_account_id=product.seller_account_id,product_id=product.id,image_hash=result["image_hash"],image_url=payload.image_url)
    row.media_id=payload.media_id; row.width=result.get("width"); row.height=result.get("height"); row.quality_score=result["quality_score"]; row.blur_score=result["blur_score"]; row.findings_json=json.dumps(result["findings"]); row.attributes_json=json.dumps(result["attributes"]); row.confidence=result["confidence"]; row.provider=result["provider"]; db.add(row); db.commit(); db.refresh(row)
    return {"id":row.id,"product_id":row.product_id,"media_id":row.media_id,"image_url":row.image_url,"quality_score":float(row.quality_score),"blur_score":float(row.blur_score),"findings":json.loads(row.findings_json),"attributes":json.loads(row.attributes_json),"confidence":row.confidence,"provider":row.provider}
@router.get("/{analysis_id}")
def get_analysis(analysis_id:int,db:Session=Depends(get_db),user:User=Depends(current_user)):
    row=db.get(VisionAnalysis,analysis_id)
    if not row: raise HTTPException(404,"Vision analysis not found")
    owned(db,row.product_id,user); return {"id":row.id,"product_id":row.product_id,"image_url":row.image_url,"quality_score":float(row.quality_score),"findings":json.loads(row.findings_json),"attributes":json.loads(row.attributes_json),"confidence":row.confidence,"provider":row.provider}
@router.post("/{analysis_id}/review")
def review(analysis_id:int,payload:VisionReviewRequest,db:Session=Depends(get_db),user:User=Depends(current_user)):
    row=db.get(VisionAnalysis,analysis_id)
    if not row: raise HTTPException(404,"Vision analysis not found")
    owned(db,row.product_id,user); data=json.loads(row.attributes_json or "{}"); data["reviewed"]=payload.accepted; data["review_notes"]=payload.notes; row.attributes_json=json.dumps(data); db.commit(); return {"status":"accepted" if payload.accepted else "rejected","analysis_id":row.id}
