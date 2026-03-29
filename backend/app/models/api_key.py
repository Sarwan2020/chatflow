"""
API Key model for storing user-provided LLM provider keys.

Stores encrypted API keys for various LLM providers (OpenAI,
Anthropic, Router API, Ollama) on a per-user basis.
"""

from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class APIKey(Base):
    """
    SQLAlchemy model representing a stored API key for an LLM provider.

    Attributes:
        id: Auto-incrementing primary key.
        user_id: Foreign key referencing the owning user.
        provider: LLM provider name (e.g., 'openai', 'anthropic', 'router_api', 'ollama').
        api_key: The encrypted API key string.
        is_active: Whether this key is currently active/enabled.
        created_at: Timestamp when the key was stored.
        user: Relationship to the owning User.
    """

    __tablename__ = "api_keys"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    provider: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # 'openai', 'anthropic', 'router_api', 'ollama'
    api_key: Mapped[str] = mapped_column(String(500), nullable=False)  # Encrypted
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )

    # Relationships
    user = relationship("User", back_populates="api_keys")

    def __repr__(self) -> str:
        return (
            f"<APIKey(id={self.id}, provider='{self.provider}', "
            f"is_active={self.is_active})>"
        )
