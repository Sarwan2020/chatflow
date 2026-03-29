"""
Security utilities for authentication and encryption.

Provides password hashing/verification using bcrypt, JWT token
creation/validation, and API key encryption/decryption using Fernet.
"""

import base64
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import get_settings

# ---------------------------------------------------------------------------
# Password hashing
# ---------------------------------------------------------------------------

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)


def hash_password(password: str) -> str:
    """
    Hash a plain-text password using bcrypt.

    Args:
        password: The plain-text password to hash.

    Returns:
        The bcrypt hash string.
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain-text password against a bcrypt hash.

    Args:
        plain_password: The plain-text password to check.
        hashed_password: The stored bcrypt hash.

    Returns:
        True if the password matches, False otherwise.
    """
    return pwd_context.verify(plain_password, hashed_password)


# ---------------------------------------------------------------------------
# JWT token management
# ---------------------------------------------------------------------------


def create_access_token(
    data: dict,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """
    Create a signed JWT access token.

    Args:
        data: Payload dictionary (must include ``sub`` claim).
        expires_delta: Optional custom expiration duration.
            Defaults to ``ACCESS_TOKEN_EXPIRE_MINUTES`` from settings.

    Returns:
        Encoded JWT string.
    """
    settings = get_settings()
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.access_token_expire_minutes
        )

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode,
        settings.secret_key,
        algorithm=settings.algorithm,
    )
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    """
    Decode and validate a JWT access token.

    Args:
        token: The encoded JWT string.

    Returns:
        The decoded payload dictionary, or None if the token is
        invalid or expired.
    """
    settings = get_settings()
    try:
        payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[settings.algorithm],
        )
        return payload
    except JWTError:
        return None


# ---------------------------------------------------------------------------
# API key encryption (symmetric Fernet-like using AES via secret_key)
# ---------------------------------------------------------------------------


def _derive_fernet_key() -> bytes:
    """
    Derive a 32-byte Fernet-compatible key from the application secret.

    Uses SHA-256 to produce a deterministic key from ``SECRET_KEY``,
    then base64-url-encodes it for use with Fernet.

    Returns:
        A 32-byte URL-safe base64-encoded key.
    """
    settings = get_settings()
    digest = hashlib.sha256(settings.secret_key.encode()).digest()
    return base64.urlsafe_b64encode(digest)


def encrypt_api_key(api_key: str) -> str:
    """
    Encrypt an API key for safe storage in the database.

    Uses Fernet symmetric encryption derived from the application
    secret key.

    Args:
        api_key: The plain-text API key.

    Returns:
        The encrypted API key as a string.
    """
    from cryptography.fernet import Fernet

    key = _derive_fernet_key()
    f = Fernet(key)
    return f.encrypt(api_key.encode()).decode()


def decrypt_api_key(encrypted_key: str) -> str:
    """
    Decrypt a stored API key.

    Args:
        encrypted_key: The encrypted API key string.

    Returns:
        The decrypted plain-text API key.
    """
    from cryptography.fernet import Fernet

    key = _derive_fernet_key()
    f = Fernet(key)
    return f.decrypt(encrypted_key.encode()).decode()
