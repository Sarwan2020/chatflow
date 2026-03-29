"""
User model for authentication and identity management.

Stores user credentials and profile information. Serves as the
root entity for conversations, API keys, and token usage tracking.
"""

from datetime import datetime

from sqlalchemy import DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    """
    SQLAlchemy model representing an application user.

    Attributes:
        id: Auto-incrementing primary key.
        email: Unique email address used for authentication.
        password_hash: Bcrypt-hashed password (never stored in plain text).
        created_at: Timestamp when the user was created.
        updated_at: Timestamp of the last profile update.
        conversations: Relationship to user's conversations.
        api_keys: Relationship to user's stored API keys.
        token_usages: Relationship to user's token usage records.
    """

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False, index=True
    )
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    conversations = relationship(
        "Conversation", back_populates="user", cascade="all, delete-orphan"
    )
    api_keys = relationship(
        "APIKey", back_populates="user", cascade="all, delete-orphan"
    )
    token_usages = relationship(
        "TokenUsage", back_populates="user", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email='{self.email}')>"
