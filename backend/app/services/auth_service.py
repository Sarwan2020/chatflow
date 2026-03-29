"""
Authentication service layer.

Handles user registration, credential verification, session
creation (JWT), session validation, and logout logic.
"""

from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.auth import Token, UserRegister, UserResponse
from app.utils.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)


def register_user(db: Session, data: UserRegister) -> UserResponse:
    """
    Register a new user account.

    Args:
        db: Database session.
        data: Registration payload with email and password.

    Returns:
        The newly created user profile.

    Raises:
        HTTPException 400: If the email is already registered.
    """
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    user = User(
        email=data.email,
        password_hash=hash_password(data.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return UserResponse.model_validate(user)


def authenticate_user(db: Session, email: str, password: str) -> Optional[User]:
    """
    Verify user credentials.

    Args:
        db: Database session.
        email: The user's email address.
        password: The plain-text password to verify.

    Returns:
        The User object if credentials are valid, None otherwise.
    """
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


def create_session(user: User) -> Token:
    """
    Generate a JWT access token for an authenticated user.

    The token payload includes the user's ID (``sub``) and email.

    Args:
        user: The authenticated User object.

    Returns:
        A Token schema containing the access_token and token_type.
    """
    token_data = {
        "sub": str(user.id),
        "email": user.email,
    }
    access_token = create_access_token(data=token_data)
    return Token(access_token=access_token, token_type="bearer")


def validate_session(db: Session, token: str) -> Optional[User]:
    """
    Validate a JWT token and return the associated user.

    Args:
        db: Database session.
        token: The encoded JWT string.

    Returns:
        The User object if the token is valid, None otherwise.
    """
    payload = decode_access_token(token)
    if payload is None:
        return None

    user_id = payload.get("sub")
    if user_id is None:
        return None

    try:
        user_id_int = int(user_id)
    except (ValueError, TypeError):
        return None

    user = db.query(User).filter(User.id == user_id_int).first()
    return user


def logout() -> dict:
    """
    Handle logout.

    JWT tokens are stateless, so server-side logout is a no-op.
    The client is responsible for removing the stored token.

    Returns:
        A confirmation message.
    """
    return {"message": "Successfully logged out"}
