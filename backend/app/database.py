"""
Database connection and session management.

Sets up SQLAlchemy engine, session factory, and declarative base
for the SQLite database. Provides a dependency function for
FastAPI route injection.
"""

from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import get_settings


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy ORM models."""

    pass


def _get_engine():
    """
    Create and configure the SQLAlchemy engine.

    For SQLite, enables WAL mode and foreign key enforcement
    via connection event listeners.

    Returns:
        Engine: Configured SQLAlchemy engine instance.
    """
    settings = get_settings()
    connect_args = {}

    # SQLite-specific configuration
    if settings.database_url.startswith("sqlite"):
        connect_args["check_same_thread"] = False

    engine = create_engine(
        settings.database_url,
        connect_args=connect_args,
        echo=settings.debug,
    )

    # Enable SQLite foreign key support and WAL mode
    if settings.database_url.startswith("sqlite"):

        @event.listens_for(engine, "connect")
        def _set_sqlite_pragma(dbapi_connection, connection_record):
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.execute("PRAGMA journal_mode=WAL")
            cursor.close()

    return engine


engine = _get_engine()

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


def get_db() -> Session:
    """
    FastAPI dependency that provides a database session.

    Yields a SQLAlchemy session and ensures it is closed after
    the request completes, even if an exception occurs.

    Yields:
        Session: A SQLAlchemy database session.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
