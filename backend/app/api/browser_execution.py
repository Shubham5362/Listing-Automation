from typing import Any
from fastapi import APIRouter,Depends,HTTPException
from pydantic import BaseModel,Field
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.autofill import AutofillSession
from app.models.browser_execution import BrowserExecution
from app.models.core import SellerAccount,User
from app.services.browser_execution import arm_execution,build_execution_plan,execution_view,record_result
router=APIRouter(prefix="/browser-execution",tags=["browser-execution"])
class PlanRequest(BaseModel):
    session_id:int
    page_fields:list[dict[str,Any]]=Field(default_factory=list)
    page_url:str|None=None
    mode:str=Field(default="dry_run",pattern="^(dry_run|armed)$")
class ValidateRequest(BaseModel):
    page_url:str
    page_fields:list[dict[str,Any]]=Field(default_factory=list)

class ResultRequest(BaseModel):
    sequence:int
    state:str=Field(pattern="^(filled|failed|skipped)$")
    error:str|None=None
def own_session(db,session_id,user):
    s=db.get(AutofillSession,session_id)
    if not s: raise HTTPException(404,"Autofill session not found")
    owner=db.scalar(select(SellerAccount).where(SellerAccount.id==s.seller_account_id,SellerAccount.user_id==user.id))
    if not owner: raise HTTPException(403,"Session access denied")
    return s
@router.post("/plan")
def plan(payload:PlanRequest,db:Session=Depends(get_db),user:User=Depends(get_current_user)):
    s=own_session(db,payload.session_id,user)
    try:return execution_view(db,build_execution_plan(db,s,payload.page_fields,payload.mode,payload.page_url).id)
    except ValueError as e:raise HTTPException(409,str(e))
@router.post("/{execution_id}/arm")
def arm(execution_id:int,db:Session=Depends(get_db),user:User=Depends(get_current_user)):
    ex=db.get(BrowserExecution,execution_id)
    if not ex: raise HTTPException(404,"Execution not found")
    own_session(db,ex.session_id,user)
    try:return execution_view(db,arm_execution(db,ex).id)
    except ValueError as e:raise HTTPException(409,str(e))
@router.post("/{execution_id}/validate")
def validate(execution_id:int,payload:ValidateRequest,db:Session=Depends(get_db),user:User=Depends(get_current_user)):
    ex=db.get(BrowserExecution,execution_id)
    if not ex: raise HTTPException(404,"Execution not found")
    own_session(db,ex.session_id,user)
    from app.services.browser_execution import _fingerprint
    from urllib.parse import urlparse
    host=urlparse(payload.page_url).hostname or ""
    allowed=(host=="sellercentral.amazon.in" or host=="sellercentral.amazon.com" or host=="seller.flipkart.com" or host.endswith(".sellercentral.amazon.in") or host.endswith(".sellercentral.amazon.com") or host.endswith(".seller.flipkart.com"))
    if not allowed: raise HTTPException(403,"Marketplace domain is not allowlisted")
    fingerprint=_fingerprint(payload.page_fields)
    if fingerprint!=ex.page_fingerprint: raise HTTPException(409,"Page fingerprint mismatch; refresh and create a new plan")
    return {"valid":True,"execution_id":ex.id,"page_fingerprint":fingerprint}

@router.post("/{execution_id}/result")
def result(execution_id:int,payload:ResultRequest,db:Session=Depends(get_db),user:User=Depends(get_current_user)):
    ex=db.get(BrowserExecution,execution_id)
    if not ex: raise HTTPException(404,"Execution not found")
    own_session(db,ex.session_id,user)
    try:return execution_view(db,record_result(db,ex,payload.sequence,payload.state,payload.error).id)
    except ValueError as e:raise HTTPException(422,str(e))
@router.get("/{execution_id}")
def get_execution(execution_id:int,db:Session=Depends(get_db),user:User=Depends(get_current_user)):
    ex=db.get(BrowserExecution,execution_id)
    if not ex: raise HTTPException(404,"Execution not found")
    own_session(db,ex.session_id,user); return execution_view(db,execution_id)
