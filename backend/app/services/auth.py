import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.core import User, UserSession


_PASSWORD_ITERATIONS = 600_000


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, _PASSWORD_ITERATIONS)
    return f"pbkdf2_sha256${_PASSWORD_ITERATIONS}${salt.hex()}${digest.hex()}"


def verify_password(password: str, password_hash: str) -> bool:
    try:
        algorithm, iterations, salt_hex, digest_hex = password_hash.split("$", 3)
        if algorithm != "pbkdf2_sha256":
            return False
        iterations_value = int(iterations)
        if iterations_value < 300_000 or iterations_value > 2_000_000:
            return False
        digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), bytes.fromhex(salt_hex), iterations_value)
        return secrets.compare_digest(digest.hex(), digest_hex)
    except (ValueError, TypeError):
        return False


def create_session(db: Session, user: User, ttl_hours: int | None = None) -> str:
    raw_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
    hours = ttl_hours if ttl_hours is not None else get_settings().session_ttl_hours
    hours = min(max(hours, 1), 168)
    session = UserSession(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(hours=hours),
    )
    db.add(session)
    db.commit()
    return raw_token


def get_user_by_token(db: Session, token: str) -> User | None:
    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
    session = db.scalar(select(UserSession).where(UserSession.token_hash == token_hash))
    if not session:
        return None
    if session.expires_at <= datetime.now(timezone.utc).replace(tzinfo=None):
        db.delete(session)
        db.commit()
        return None
    return db.get(User, session.user_id)


def revoke_session(db: Session, token: str) -> bool:
    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
    result = db.execute(delete(UserSession).where(UserSession.token_hash == token_hash))
    db.commit()
    return bool(result.rowcount)
