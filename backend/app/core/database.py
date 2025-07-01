"""
Database configuration for Pipeline Pulse
Automatically detects and uses appropriate database configuration
"""

import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

# Detect database type and import appropriate configuration
if "sqlite" in settings.DATABASE_URL.lower():
    logger.info("Using SQLite database configuration for local development")
    from app.core.local_database import engine, SessionLocal, Base, get_db, get_reader_db, create_tables

    # Create a mock aurora_db for compatibility
    class MockAuroraDB:
        def get_writer_engine(self):
            return engine
        def get_reader_engine(self):
            return engine

    aurora_db = MockAuroraDB()

else:
    logger.info("Using Aurora PostgreSQL database configuration")
    from app.core.aurora_database import aurora_db, engine, SessionLocal, Base, get_db, get_reader_db

    def create_tables():
        """Create all tables using Aurora writer engine"""
        Base.metadata.create_all(bind=aurora_db.get_writer_engine())

# Backward compatibility functions
def create_database_engine():
    """Create database engine"""
    if hasattr(aurora_db, 'get_writer_engine'):
        return aurora_db.get_writer_engine()
    return engine

# Export for backward compatibility
__all__ = ['aurora_db', 'engine', 'SessionLocal', 'Base', 'get_db', 'get_reader_db', 'create_database_engine', 'create_tables']
