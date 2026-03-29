"""
Configuration management for the Multi-Modal AI Chat Interface.

Loads and validates all application settings from environment variables
using Pydantic Settings. Provides a singleton-like access pattern via
the `get_settings()` function with LRU caching.
"""

import json
from functools import lru_cache
from typing import List, Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables and .env file.

    All settings can be overridden via environment variables. The .env file
    is read from the backend directory automatically.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # -------------------------------------------------------------------------
    # Application Settings
    # -------------------------------------------------------------------------
    app_name: str = "Multi-Modal AI Chat"
    app_version: str = "0.1.0"
    debug: bool = True
    environment: str = "development"

    # -------------------------------------------------------------------------
    # Server Settings
    # -------------------------------------------------------------------------
    host: str = "0.0.0.0"
    port: int = 8000

    # -------------------------------------------------------------------------
    # Database Settings
    # -------------------------------------------------------------------------
    database_url: str = "sqlite:///./data/chat.db"

    # -------------------------------------------------------------------------
    # ChromaDB Settings
    # -------------------------------------------------------------------------
    chroma_persist_dir: str = "./data/chroma"
    chroma_collection_name: str = "user_memories"

    # -------------------------------------------------------------------------
    # Authentication / JWT Settings
    # -------------------------------------------------------------------------
    secret_key: str = "your-secret-key-change-this-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440  # 24 hours

    # -------------------------------------------------------------------------
    # CORS Settings
    # -------------------------------------------------------------------------
    cors_origins: str = '["http://localhost:5173","http://localhost:3000"]'

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins from JSON string to list."""
        try:
            return json.loads(self.cors_origins)
        except (json.JSONDecodeError, TypeError):
            return ["http://localhost:5173", "http://localhost:3000"]

    # -------------------------------------------------------------------------
    # LLM Provider API Keys
    # -------------------------------------------------------------------------
    openai_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None
    router_api_key: Optional[str] = None
    ollama_base_url: str = "http://localhost:11434"

    # -------------------------------------------------------------------------
    # Embedding Model Settings
    # -------------------------------------------------------------------------
    embedding_model: str = "all-MiniLM-L6-v2"

    # -------------------------------------------------------------------------
    # Memory Settings
    # -------------------------------------------------------------------------
    memory_search_top_k: int = 5
    memory_relevance_threshold: float = 0.7


@lru_cache()
def get_settings() -> Settings:
    """
    Get cached application settings instance.

    Uses LRU cache to ensure settings are only loaded once from
    environment variables and .env file.

    Returns:
        Settings: The application settings instance.
    """
    return Settings()
