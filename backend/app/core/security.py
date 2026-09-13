import json
from collections.abc import Mapping

from cryptography.fernet import Fernet, InvalidToken

from app.core.config import get_settings


class CredentialEncryptionError(ValueError):
    pass


def _fernet() -> Fernet:
    key = get_settings().credentials_encryption_key
    if not key:
        raise CredentialEncryptionError("Credentials encryption key is not configured")
    try:
        return Fernet(key.encode("utf-8"))
    except (ValueError, TypeError) as exc:
        raise CredentialEncryptionError("Credentials encryption key is invalid") from exc


def encrypt_credentials(credentials: Mapping[str, object]) -> str:
    payload = json.dumps(dict(credentials), separators=(",", ":"), sort_keys=True).encode("utf-8")
    return _fernet().encrypt(payload).decode("utf-8")


def decrypt_credentials(value: str) -> dict[str, object]:
    try:
        payload = _fernet().decrypt(value.encode("utf-8"))
        decoded = json.loads(payload.decode("utf-8"))
    except (InvalidToken, UnicodeDecodeError, json.JSONDecodeError, ValueError, TypeError) as exc:
        raise CredentialEncryptionError("Stored credentials could not be decrypted") from exc
    if not isinstance(decoded, dict):
        raise CredentialEncryptionError("Stored credentials must be an object")
    return decoded
