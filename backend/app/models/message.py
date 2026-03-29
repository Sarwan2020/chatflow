"""
Message model for individual chat messages.

Stores each message in a conversation with its role, content,
content type, optional metadata (e.g., code language, image URL),
and token count information.
"""

import json
import uuid
from datetime import datetime
from typing import Any, Dict, Optional

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def _generate_uuid() -> str:
    """Generate a new UUID4 string for use as a primary key."""
    return str(uuid.uuid4())


class Message(Base):
    """
    SQLAlchemy model representing a single message in a conversation.

    Attributes:
        id: UUID primary key.
        conversation_id: Foreign key referencing the parent conversation.
        role: Message role - 'user', 'assistant', or 'system'.
        content: The text content of the message.
        content_type: Type of content - 'text', 'code', or 'image'.
        metadata_json: JSON string storing additional metadata
            (e.g., language for code, image_url for images).
        token_count: Number of tokens in this message.
        created_at: Timestamp when the message was created.
        conversation: Relationship to the parent Conversation.
        token_usage: Relationship to the token usage record for this message.
    """

    __tablename__ = "messages"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=_generate_uuid
    )
    conversation_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("conversations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    role: Mapped[str] = mapped_column(
        String(20), nullable=False
    )  # 'user', 'assistant', 'system'
    content: Mapped[str] = mapped_column(Text, nullable=False)
    content_type: Mapped[str] = mapped_column(
        String(20), nullable=False, default="text"
    )  # 'text', 'code', 'image'
    metadata_json: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True
    )  # JSON string for language, image_url, etc.
    token_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )

    # Relationships
    conversation = relationship("Conversation", back_populates="messages")
    token_usage = relationship(
        "TokenUsage", back_populates="message", cascade="all, delete-orphan",
        uselist=False,
    )

    @property
    def parsed_metadata(self) -> Dict[str, Any]:
        """Parse metadata_json into a Python dictionary."""
        if self.metadata_json:
            try:
                return json.loads(self.metadata_json)
            except (json.JSONDecodeError, TypeError):
                return {}
        return {}

    @parsed_metadata.setter
    def parsed_metadata(self, value: Dict[str, Any]) -> None:
        """Serialize a Python dictionary into metadata_json."""
        self.metadata_json = json.dumps(value) if value else None

    def __repr__(self) -> str:
        return (
            f"<Message(id='{self.id}', role='{self.role}', "
            f"content_type='{self.content_type}')>"
        )
