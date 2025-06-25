"""
Aurora Serverless v2 Database Configuration
Provides read/write endpoint separation for optimal performance
"""

import os
import logging
from typing import Optional
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
import psycopg2

logger = logging.getLogger(__name__)

class AuroraDatabase:
    """
    Aurora Serverless v2 database manager with read/write endpoint separation
    """
    
    def __init__(self):
        self.environment = os.getenv('ENVIRONMENT', 'development')
        self.region = os.getenv('AWS_REGION', 'ap-southeast-1')
        
        # Aurora endpoints
        self.writer_endpoint = os.getenv('DB_ENDPOINT', 'pipeline-pulse-aurora-dev.cluster-c39du3coqgj0.ap-southeast-1.rds.amazonaws.com')
        self.reader_endpoint = os.getenv('DB_READER_ENDPOINT', 'pipeline-pulse-aurora-dev.cluster-ro-c39du3coqgj0.ap-southeast-1.rds.amazonaws.com')
        
        # Database configuration
        self.db_name = os.getenv('DB_NAME', 'pipeline_pulse')
        self.db_user = os.getenv('DB_USER', 'postgres')
        self.port = int(os.getenv('DB_PORT', '5432'))
        
        # Initialize engines
        self.writer_engine = None
        self.reader_engine = None
        self._setup_engines()
    
    def _create_connection_creator(self, endpoint: str):
        """Create a connection creator for the specified endpoint"""
        
        def create_connection():
            try:
                if self.environment == "production":
                    # Use IAM authentication in production
                    from app.core.iam_database import iam_db_auth
                    
                    auth_token = iam_db_auth.generate_auth_token(endpoint, self.port, self.db_user)
                    
                    if auth_token:
                        logger.debug(f"Using IAM authentication for {endpoint}")
                        connection_string = f"host={endpoint} port={self.port} dbname={self.db_name} user={self.db_user} password={auth_token} sslmode=require connect_timeout=10"
                        return psycopg2.connect(connection_string)
                    else:
                        logger.warning(f"IAM auth failed for {endpoint}, falling back to password authentication")
                        from app.core.secrets import secrets_manager
                        secrets = secrets_manager.get_secret('pipeline-pulse/app-secrets')
                        password = secrets.get('database_password', '')
                        connection_string = f"host={endpoint} port={self.port} dbname={self.db_name} user={self.db_user} password={password} sslmode=require connect_timeout=10"
                        return psycopg2.connect(connection_string)
                else:
                    # Development: use local database
                    database_url = os.getenv('DATABASE_URL', 'postgresql://localhost:5432/pipeline_pulse_dev')
                    return psycopg2.connect(database_url)
                    
            except Exception as e:
                logger.error(f"Database connection failed for {endpoint}: {e}")
                raise
        
        return create_connection
    
    def _setup_engines(self):
        """Setup read and write database engines"""
        
        if self.environment == "production":
            logger.info("Setting up Aurora Serverless v2 engines with read/write separation")
            
            # Writer engine (for INSERT, UPDATE, DELETE)
            self.writer_engine = create_engine(
                "postgresql://",  # Dummy URL, actual connection handled by creator
                creator=self._create_connection_creator(self.writer_endpoint),
                pool_pre_ping=True,
                pool_recycle=300,  # Recycle connections every 5 minutes (before IAM token expires)
                pool_size=5,
                max_overflow=10,
                echo=False
            )
            
            # Reader engine (for SELECT queries)
            self.reader_engine = create_engine(
                "postgresql://",  # Dummy URL, actual connection handled by creator
                creator=self._create_connection_creator(self.reader_endpoint),
                pool_pre_ping=True,
                pool_recycle=300,
                pool_size=3,  # Smaller pool for read-only operations
                max_overflow=5,
                echo=False
            )
            
            logger.info(f"✅ Aurora engines configured:")
            logger.info(f"  Writer: {self.writer_endpoint}")
            logger.info(f"  Reader: {self.reader_endpoint}")
            
        else:
            # Development: use single local database
            database_url = os.getenv('DATABASE_URL', 'postgresql://localhost:5432/pipeline_pulse_dev')
            logger.info(f"Using local development database: {database_url}")
            
            connect_args = {
                "connect_timeout": 10,
                "application_name": "pipeline-pulse"
            }
            
            self.writer_engine = create_engine(
                database_url,
                connect_args=connect_args,
                pool_pre_ping=True,
                pool_recycle=300,
                echo=True  # Log SQL in development
            )
            
            # In development, reader and writer are the same
            self.reader_engine = self.writer_engine
    
    def get_writer_engine(self):
        """Get the writer engine for write operations"""
        return self.writer_engine
    
    def get_reader_engine(self):
        """Get the reader engine for read operations"""
        return self.reader_engine
    
    def get_writer_session(self):
        """Get a database session for write operations"""
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.writer_engine)
        return SessionLocal()
    
    def get_reader_session(self):
        """Get a database session for read operations"""
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.reader_engine)
        return SessionLocal()
    
    def test_connections(self):
        """Test both read and write connections"""
        try:
            # Test writer connection
            with self.writer_engine.connect() as conn:
                conn.execute(text("SELECT 1"))
                logger.info("✅ Writer connection successful")
            
            # Test reader connection
            with self.reader_engine.connect() as conn:
                conn.execute(text("SELECT 1"))
                logger.info("✅ Reader connection successful")
                
            return True
            
        except Exception as e:
            logger.error(f"❌ Connection test failed: {e}")
            return False

# Global Aurora database instance
aurora_db = AuroraDatabase()

# Backward compatibility - use writer engine as default
engine = aurora_db.get_writer_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create base class for models
Base = declarative_base()

def get_db():
    """Dependency to get database session (writer by default)"""
    try:
        logger.debug("🔧 Creating database session (writer)...")
        db = SessionLocal()
        try:
            yield db
        finally:
            logger.debug("🔧 Closing database session...")
            db.close()
    except Exception as e:
        logger.error(f"❌ Database session error: {type(e).__name__}: {e}")
        raise

def get_reader_db():
    """Dependency to get read-only database session"""
    try:
        logger.debug("🔧 Creating read-only database session...")
        db = aurora_db.get_reader_session()
        try:
            yield db
        finally:
            logger.debug("🔧 Closing read-only database session...")
            db.close()
    except Exception as e:
        logger.error(f"❌ Read-only database session error: {type(e).__name__}: {e}")
        raise
