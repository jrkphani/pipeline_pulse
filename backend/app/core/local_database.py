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
    """Create all tables"""
    logger.info("Creating database tables...")
    
    # Import all models to ensure they're registered with Base
    from app.models.analysis import Analysis
    from app.models.currency_rate import CurrencyRate
    from app.models.system_settings import SystemSetting
    
    # Import bulk export models if they exist
    try:
        from app.models.bulk_export import BulkExportJob, BulkExportRecord
        logger.info("Bulk export models imported")
    except ImportError as e:
        logger.warning(f"Bulk export models not found: {e}")
    
    # Import O2R models if they exist
    try:
        from app.models.o2r.opportunity import O2ROpportunity
        logger.info("O2R opportunity model imported")
    except ImportError as e:
        logger.warning(f"O2R models not found: {e}")
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created successfully")

# Export for compatibility
__all__ = ['engine', 'SessionLocal', 'Base', 'get_db', 'get_reader_db', 'create_tables']
