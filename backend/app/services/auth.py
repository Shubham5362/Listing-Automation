import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

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
        digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), bytes.fromhex(salt_hex), int(iterations))
        return secrets.compare_digest(digest.hex(), digest_hex)
    except (ValueError, TypeError):
        return False


def create_session(db: Session, user: User, ttl_hours: int = 24) -> str:
    raw_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
    session = UserSession(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(hours=ttl_hours),
    )
    db.add(session)
    db.commit()
    return raw_token


def get_user_by_token(db: Session, token: str) -> User | None:
    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
    session = db.scalar(select(UserSession).where(UserSession.token_hash == token_hash))
    if not session or session.expires_at <= datetime.now(timezone.utc).replace(tzinfo=None):
        return None
    return db.get(User, session.user_id)
