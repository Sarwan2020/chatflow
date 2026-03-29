"""
Authentication API router.

Provides endpoints for user registration, login, logout,
and retrieving the current authenticated user profile.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.auth import Token, UserLogin, UserRegister, UserResponse
from app.services.auth_service import (
    authenticate_user,
    create_session,
    logout,
    register_user,
)
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
)
def register(data: UserRegister, db: Session = Depends(get_db)):
    """
    Create a new user account.

    - Validates email format and password strength.
    - Returns the created user profile (without password).
    """
    return register_user(db, data)


@router.post(
    "/login",
    response_model=Token,
    summary="Login and receive access token",
)
def login(data: UserLogin, db: Session = Depends(get_db)):
    """
    Authenticate with email and password.

    Returns a JWT access token on success.
    """
    user = authenticate_user(db, data.email, data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return create_session(user)


@router.post(
    "/logout",
    summary="Logout current user",
)
def logout_user():
    """
    Logout the current user.

    Since JWT tokens are stateless, the server simply returns a
    success message. The client is responsible for discarding the
    stored token.
    """
    return logout()


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user profile",
)
def get_me(current_user: User = Depends(get_current_user)):
    """
    Return the profile of the currently authenticated user.

    Requires a valid JWT token in the Authorization header.
    """
    return UserResponse.model_validate(current_user)
