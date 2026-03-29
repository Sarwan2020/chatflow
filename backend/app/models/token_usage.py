"""
Token Usage model for tracking LLM API consumption.

Records prompt tokens, completion tokens, and total tokens
for each message sent through the LLM router, enabling
usage analytics and cost tracking.
"""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class TokenUsage(Base):
    """
    SQLAlchemy model representing token usage for a single LLM interaction.

    Attributes:
        id: Auto-incrementing primary key.
        user_id: Foreign key referencing the user who made the request.
        conversation_id: Foreign key referencing the conversation.
        message_id: Foreign key referencing the specific message.
        provider: LLM provider used (e.g., 'openai', 'anthropic').
        model: Specific model used (e.g., 'gpt-4', 'claude-3-sonnet').
        prompt_tokens: Number of tokens in the prompt/input.
        completion_tokens: Number of tokens in the completion/output.
        total_tokens: Total tokens used (prompt + completion).
        created_at: Timestamp when the usage was recorded.
        user: Relationship to the User.
        conversation: Relationship to the Conversation.
        message: Relationship to the Message.
    """

    __tablename__ = "token_usage"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    conversation_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("conversations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    message_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("messages.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    provider: Mapped[str] = mapped_column(String(50), nullable=False)
    model: Mapped[str] = mapped_column(String(100), nullable=False)
    prompt_tokens: Mapped[int] = mapped_column(Integer, nullable=False)
    completion_tokens: Mapped[int] = mapped_column(Integer, nullable=False)
    total_tokens: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )

    # Relationships
    user = relationship("User", back_populates="token_usages")
    conversation = relationship("Conversation", back_populates="token_usages")
    message = relationship("Message", back_populates="token_usage")

    def __repr__(self) -> str:
        return (
            f"<TokenUsage(id={self.id}, provider='{self.provider}', "
            f"model='{self.model}', total_tokens={self.total_tokens})>"
        )
