"""
Database configuration for Pipeline Pulse
Uses Aurora Serverless v2 with read/write endpoint separation
"""

# Import Aurora database configuration
from app.core.aurora_database import aurora_db, engine, SessionLocal, Base, get_db, get_reader_db
import logging

logger = logging.getLogger(__name__)

# Backward compatibility functions
def create_database_engine():
    """Create database engine - now uses Aurora configuration"""
    return aurora_db.get_writer_engine()

def create_tables():
    """Create all tables using Aurora writer engine"""
    Base.metadata.create_all(bind=aurora_db.get_writer_engine())

# Export for backward compatibility
__all__ = ['aurora_db', 'engine', 'SessionLocal', 'Base', 'get_db', 'get_reader_db', 'create_database_engine', 'create_tables']
