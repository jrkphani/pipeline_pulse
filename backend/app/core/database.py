"""
Database configuration and session management
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import settings
import logging

logger = logging.getLogger(__name__)

# Determine database URL based on environment
if settings.ENVIRONMENT == "production":
    database_url = settings.DATABASE_URL_PRODUCTION
    logger.info("Using production database with Secrets Manager")
else:
    database_url = settings.DATABASE_URL
    logger.info("Using local development database")

# Configure connection args based on database type
connect_args = {}
if "sqlite" in database_url:
    connect_args = {"check_same_thread": False}
elif "postgresql" in database_url and settings.ENVIRONMENT == "production":
    connect_args = {
        "sslmode": "require",
        "connect_timeout": 10,
        "application_name": "pipeline-pulse"
    }

# Create database engine
engine = create_engine(
    database_url,
    connect_args=connect_args,
    pool_pre_ping=True,
    pool_recycle=300,
    echo=settings.ENVIRONMENT == "development"  # Log SQL in development
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create base class for models
Base = declarative_base()


def get_db():
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    """Create all tables"""
    Base.metadata.create_all(bind=engine)
