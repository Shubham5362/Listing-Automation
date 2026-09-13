from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.core import User
from app.services.audit import record_audit
from app.services.auth import create_session, get_user_by_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])
bearer = HTTPBearer(auto_error=False)


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    token: str
    user_id: int
    email: EmailStr


@router.post("/register", response_model=AuthResponse, status_code=201)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> AuthResponse:
    if len(payload.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    email = str(payload.email).lower()
    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(status_code=409, detail="Email already registered")
    user = User(email=email, full_name=payload.full_name, password_hash=hash_password(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    record_audit(db, action="user.register", resource_type="user", resource_id=str(user.id), user_id=user.id)
    return AuthResponse(token=create_session(db, user), user_id=user.id, email=user.email)


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> AuthResponse:
    user = db.scalar(select(User).where(User.email == str(payload.email).lower()))
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="User account is inactive")
    record_audit(db, action="user.login", resource_type="user", resource_id=str(user.id), user_id=user.id)
    return AuthResponse(token=create_session(db, user), user_id=user.id, email=user.email)


@router.get("/me")
def me(credentials: HTTPAuthorizationCredentials | None = Depends(bearer), db: Session = Depends(get_db)) -> dict[str, object]:
    if not credentials:
        raise HTTPException(status_code=401, detail="Authentication required")
    user = get_user_by_token(db, credentials.credentials)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    return {"id": user.id, "email": user.email, "full_name": user.full_name, "role": user.role, "is_active": user.is_active}
