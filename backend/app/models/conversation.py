"""
Conversation model for chat session management.

Each conversation belongs to a user and contains an ordered
sequence of messages exchanged between the user and the AI assistant.
"""

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def _generate_uuid() -> str:
    """Generate a new UUID4 string for use as a primary key."""
    return str(uuid.uuid4())


class Conversation(Base):
    """
    SQLAlchemy model representing a chat conversation.

    Attributes:
        id: UUID primary key.
        user_id: Foreign key referencing the owning user.
        title: Optional conversation title (auto-generated or user-set).
        created_at: Timestamp when the conversation was created.
        updated_at: Timestamp of the last activity in the conversation.
        user: Relationship to the owning User.
        messages: Relationship to messages in this conversation.
        token_usages: Relationship to token usage records for this conversation.
    """

    __tablename__ = "conversations"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=_generate_uuid
    )
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    user = relationship("User", back_populates="conversations")
    messages = relationship(
        "Message", back_populates="conversation", cascade="all, delete-orphan",
        order_by="Message.created_at"
    )
    token_usages = relationship(
        "TokenUsage", back_populates="conversation", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Conversation(id='{self.id}', title='{self.title}')>"
