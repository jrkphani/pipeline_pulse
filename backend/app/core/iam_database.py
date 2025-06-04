"""
IAM Database Authentication for RDS PostgreSQL
Provides secure database connections using AWS IAM roles instead of passwords
"""

import boto3
import os
import logging
from typing import Optional
from functools import lru_cache

logger = logging.getLogger(__name__)


class IAMDatabaseAuth:
    """
    AWS RDS IAM Database Authentication
    Generates temporary database passwords using IAM roles
    """
    
    def __init__(self):
        self.region = os.getenv('AWS_REGION', 'ap-southeast-1')
        self.environment = os.getenv('ENVIRONMENT', 'development')
        
        # Initialize RDS client only in production
        if self.environment == 'production':
            try:
                self.rds_client = boto3.client('rds', region_name=self.region)
                logger.info(f"Initialized RDS client for IAM auth in region: {self.region}")
            except Exception as e:
                logger.error(f"Failed to initialize RDS client: {e}")
                self.rds_client = None
        else:
            self.rds_client = None
            logger.info("IAM database auth disabled for local development")
    
    def generate_auth_token(
        self, 
        db_hostname: str, 
        port: int, 
        db_username: str
    ) -> Optional[str]:
        """
        Generate IAM database authentication token
        
        Args:
            db_hostname: RDS instance hostname
            port: Database port (usually 5432 for PostgreSQL)
            db_username: Database username (must be configured for IAM auth)
            
        Returns:
            Temporary authentication token or None if failed
        """
        
        if not self.rds_client:
            logger.warning("RDS client not available - using password authentication")
            return None
        
        try:
            # Generate authentication token (valid for 15 minutes)
            token = self.rds_client.generate_db_auth_token(
                DBHostname=db_hostname,
                Port=port,
                DBUsername=db_username,
                Region=self.region
            )
            
            logger.info(f"Generated IAM auth token for user: {db_username}")
            return token
            
        except Exception as e:
            logger.error(f"Failed to generate IAM auth token: {e}")
            return None
    
    def get_database_url_with_iam(self) -> str:
        """
        Get database URL using IAM authentication
        Falls back to password authentication if IAM fails
        
        Returns:
            Database connection URL
        """
        
        if self.environment != 'production':
            # Use local development database
            return os.getenv('DATABASE_URL', 'sqlite:///./pipeline_pulse.db')
        
        # Production database configuration
        db_endpoint = os.getenv('DB_ENDPOINT', 'pipeline-pulse-db-dev.c39du3coqgj0.ap-southeast-1.rds.amazonaws.com')
        db_name = os.getenv('DB_NAME', 'pipeline_pulse')
        db_user = os.getenv('DB_USER', 'postgres')
        port = int(os.getenv('DB_PORT', '5432'))
        
        # Try IAM authentication first
        auth_token = self.generate_auth_token(db_endpoint, port, db_user)
        
        if auth_token:
            # Use IAM token as password
            logger.info("Using IAM database authentication")
            return f"postgresql://{db_user}:{auth_token}@{db_endpoint}:{port}/{db_name}?sslmode=require"
        else:
            # Fallback to password authentication
            logger.warning("IAM auth failed, falling back to password authentication")
            from app.core.secrets import secrets_manager
            secrets = secrets_manager.get_secret('pipeline-pulse/app-secrets')
            password = secrets.get('database_password', '')
            return f"postgresql://{db_user}:{password}@{db_endpoint}:{port}/{db_name}?sslmode=require"
    
    def test_iam_connection(self) -> bool:
        """
        Test IAM database authentication
        
        Returns:
            True if IAM auth is working, False otherwise
        """
        
        if self.environment != 'production':
            logger.info("IAM auth test skipped for non-production environment")
            return False
        
        try:
            db_endpoint = os.getenv('DB_ENDPOINT', 'pipeline-pulse-db-dev.c39du3coqgj0.ap-southeast-1.rds.amazonaws.com')
            db_user = os.getenv('DB_USER', 'postgres')
            port = int(os.getenv('DB_PORT', '5432'))
            
            # Try to generate a token
            token = self.generate_auth_token(db_endpoint, port, db_user)
            
            if token:
                logger.info("IAM database authentication test successful")
                return True
            else:
                logger.error("IAM database authentication test failed")
                return False
                
        except Exception as e:
            logger.error(f"IAM auth test error: {e}")
            return False


# Global instance
iam_db_auth = IAMDatabaseAuth()
