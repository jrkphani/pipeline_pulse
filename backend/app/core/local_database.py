"""
Local SQLite Database Configuration for Pipeline Pulse
Simple setup for local development and testing
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# Create SQLite engine
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {},
    echo=settings.DEBUG
)

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class
Base = declarative_base()

def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_reader_db():
    """Get reader database session (same as writer for SQLite)"""
    return get_db()

def create_tables():
    """DEPRECATED: Use Alembic migrations instead"""
    logger.warning("create_tables() is deprecated. Use 'alembic upgrade head' instead.")
    raise NotImplementedError(
        "Direct table creation is disabled. Use Alembic migrations: 'alembic upgrade head'"
    )

# Export for compatibility
__all__ = ['engine', 'SessionLocal', 'Base', 'get_db', 'get_reader_db', 'create_tables']
