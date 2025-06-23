"""
Database configuration and session management
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import settings
import logging
import os
import psycopg2

logger = logging.getLogger(__name__)

def create_database_engine():
    """Create database engine with appropriate configuration"""

    if settings.ENVIRONMENT == "production":
        # Production: Use dynamic IAM authentication
        logger.info("Setting up production database with IAM authentication")

        # Database connection parameters
        db_endpoint = os.getenv('DB_ENDPOINT', 'pipeline-pulse-db-dev.c39du3coqgj0.ap-southeast-1.rds.amazonaws.com')
        db_name = os.getenv('DB_NAME', 'pipeline_pulse')
        db_user = os.getenv('DB_USER', 'postgres')
        port = int(os.getenv('DB_PORT', '5432'))

        # Create connection creator that generates fresh IAM tokens
        def create_connection():
            from app.core.iam_database import iam_db_auth

            # Generate fresh IAM token
            auth_token = iam_db_auth.generate_auth_token(db_endpoint, port, db_user)

            if auth_token:
                logger.debug("Using IAM authentication for database connection")
                connection_string = f"host={db_endpoint} port={port} dbname={db_name} user={db_user} password={auth_token} sslmode=require connect_timeout=10"
            else:
                logger.warning("IAM auth failed, falling back to password authentication")
                from app.core.secrets import secrets_manager
                secrets = secrets_manager.get_secret('pipeline-pulse/app-secrets')
                password = secrets.get('database_password', '')
                connection_string = f"host={db_endpoint} port={port} dbname={db_name} user={db_user} password={password} sslmode=require connect_timeout=10"

            return psycopg2.connect(connection_string)

        # Create engine with custom connection creator
        engine = create_engine(
            "postgresql://",  # Dummy URL, actual connection handled by creator
            creator=create_connection,
            pool_pre_ping=True,
            pool_recycle=300,  # Recycle connections every 5 minutes (before IAM token expires)
            pool_size=5,
            max_overflow=10,
            echo=False
        )

    else:
        # Development: Use standard connection
        database_url = settings.DATABASE_URL
        logger.info("Using local development database")

        # Configure connection args based on database type
        connect_args = {}
        if "sqlite" in database_url:
            connect_args = {"check_same_thread": False}
        elif "postgresql" in database_url:
            connect_args = {
                "connect_timeout": 10,
                "application_name": "pipeline-pulse"
            }

        # Create standard engine
        engine = create_engine(
            database_url,
            connect_args=connect_args,
            pool_pre_ping=True,
            pool_recycle=300,
            echo=settings.ENVIRONMENT == "development"  # Log SQL in development
        )

    return engine

# Create database engine
engine = create_database_engine()

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create base class for models
Base = declarative_base()


def get_db():
    """Dependency to get database session"""
    try:
        logger.info("🔧 Creating database session...")
        db = SessionLocal()
        logger.info("✅ Database session created successfully")
        try:
            yield db
        finally:
            logger.info("🔧 Closing database session...")
            db.close()
            logger.info("✅ Database session closed")
    except Exception as e:
        logger.error(f"❌ Database session error: {type(e).__name__}: {e}")
        import traceback
        logger.error(f"❌ Database session traceback: {traceback.format_exc()}")
        raise


def create_tables():
    """Create all tables"""
    Base.metadata.create_all(bind=engine)
