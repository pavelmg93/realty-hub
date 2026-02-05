"""Database connection management."""

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker


def get_engine(db_url: str) -> Engine:
    """Create a SQLAlchemy engine for the given database URL.

    Args:
        db_url: PostgreSQL connection string.

    Returns:
        SQLAlchemy Engine instance.
    """
    return create_engine(db_url, pool_pre_ping=True)


def get_session(engine: Engine) -> Session:
    """Create a new database session from the given engine.

    Args:
        engine: SQLAlchemy Engine instance.

    Returns:
        A new SQLAlchemy Session.
    """
    session_factory = sessionmaker(bind=engine)
    return session_factory()
