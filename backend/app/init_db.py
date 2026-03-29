"""
Database initialization script.

Creates all database tables defined by the SQLAlchemy models.
Run this script to set up a fresh database:

    python -m app.init_db

This will create the SQLite database file and all tables
if they do not already exist.
"""

import os
import sys

# Ensure the backend directory is on the Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.config import get_settings
from app.database import Base, engine

# Import all models so they register with Base.metadata
from app.models import APIKey, Conversation, Message, TokenUsage, User  # noqa: F401


def init_database() -> None:
    """
    Initialize the database by creating all tables.

    Creates the data directory if it doesn't exist, then uses
    SQLAlchemy's `create_all` to create any missing tables.
    """
    settings = get_settings()

    # Ensure the data directory exists for SQLite
    if settings.database_url.startswith("sqlite"):
        db_path = settings.database_url.replace("sqlite:///", "")
        db_dir = os.path.dirname(db_path)
        if db_dir:
            os.makedirs(db_dir, exist_ok=True)
            print(f"✓ Data directory ensured: {db_dir}")

    # Create all tables
    Base.metadata.create_all(bind=engine)
    print("✓ Database tables created successfully!")

    # List created tables
    table_names = list(Base.metadata.tables.keys())
    print(f"✓ Tables: {', '.join(table_names)}")
    print(f"✓ Database URL: {settings.database_url}")


if __name__ == "__main__":
    print("Initializing database...")
    print("=" * 50)
    init_database()
    print("=" * 50)
    print("Database initialization complete!")
