"""
AWS Secrets Manager integration for Pipeline Pulse
Provides secure access to sensitive configuration data
"""

import boto3
import json
import os
from functools import lru_cache
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class SecretsManager:
    """
    AWS Secrets Manager client for retrieving application secrets
    Falls back to environment variables for local development
    """
    
    def __init__(self):
        self.region = os.getenv('AWS_REGION', 'ap-southeast-1')
        self.environment = os.getenv('ENVIRONMENT', 'development')
        self._secrets_cache = {}
        
        # Initialize AWS client only in production
        if self.environment == 'production':
            try:
                self.client = boto3.client('secretsmanager', region_name=self.region)
                logger.info(f"Initialized Secrets Manager client for region: {self.region}")
            except Exception as e:
                logger.error(f"Failed to initialize Secrets Manager client: {e}")
                self.client = None
        else:
            self.client = None
            logger.info("Using environment variables for local development")
    
    @lru_cache(maxsize=10)
    def get_secret(self, secret_name: str) -> Dict[str, Any]:
        """
        Get secret from AWS Secrets Manager with caching
        
        Args:
            secret_name: Name of the secret in AWS Secrets Manager
            
        Returns:
            Dictionary containing secret values
        """
        
        # For local development, use environment variables
        if self.environment in ['development', 'local'] or not self.client:
            return self._get_local_secrets()
        
        try:
            # Check cache first
            if secret_name in self._secrets_cache:
                logger.debug(f"Retrieved secret from cache: {secret_name}")
                return self._secrets_cache[secret_name]
            
            # Retrieve from AWS Secrets Manager
            logger.info(f"Retrieving secret from AWS: {secret_name}")
            response = self.client.get_secret_value(SecretId=secret_name)
            secret_string = response['SecretString']
            
            # Parse JSON secrets
            try:
                secrets = json.loads(secret_string)
                self._secrets_cache[secret_name] = secrets
                logger.info(f"Successfully retrieved and cached secret: {secret_name}")
                return secrets
            except json.JSONDecodeError:
                # Single string secret
                secret_value = {'value': secret_string}
                self._secrets_cache[secret_name] = secret_value
                return secret_value
                
        except Exception as e:
            logger.error(f"Error retrieving secret {secret_name}: {e}")
            logger.warning("Falling back to environment variables")
            # Fallback to environment variables
            return self._get_local_secrets()
    
    def _get_local_secrets(self) -> Dict[str, Any]:
        """
        Fallback to environment variables for local development
        
        Returns:
            Dictionary containing secrets from environment variables
        """
        return {
            'database_password': os.getenv('DATABASE_PASSWORD', ''),
            'zoho_client_secret': os.getenv('ZOHO_CLIENT_SECRET', ''),
            'currency_api_key': os.getenv('CURRENCY_API_KEY', ''),
            'jwt_secret': os.getenv('JWT_SECRET', 'dev-secret-key-change-in-production')
        }
    
    def get_database_url(self) -> str:
        """
        Construct database URL with secret password
        
        Returns:
            Complete database connection URL
        """
        if self.environment == 'production':
            secrets = self.get_secret('pipeline-pulse/app-secrets')
            password = secrets.get('database_password', '')
            
            # Use RDS endpoint from environment
            db_endpoint = os.getenv('DB_ENDPOINT', 'pipeline-pulse-db-dev.c39du3coqgj0.ap-southeast-1.rds.amazonaws.com')
            db_name = os.getenv('DB_NAME', 'pipeline_pulse')
            db_user = os.getenv('DB_USER', 'postgres')
            
            return f"postgresql://{db_user}:{password}@{db_endpoint}:5432/{db_name}"
        else:
            # Local development database URL
            return os.getenv('DATABASE_URL', 'sqlite:///./pipeline_pulse.db')
    
    def get_zoho_client_secret(self) -> str:
        """Get Zoho CRM client secret"""
        if self.environment == 'production':
            secrets = self.get_secret('pipeline-pulse/app-secrets')
            return secrets.get('zoho_client_secret', '')
        return os.getenv('ZOHO_CLIENT_SECRET', '')
    
    def get_currency_api_key(self) -> str:
        """Get Currency API key"""
        if self.environment == 'production':
            secrets = self.get_secret('pipeline-pulse/app-secrets')
            return secrets.get('currency_api_key', '')
        return os.getenv('CURRENCY_API_KEY', '')
    
    def get_jwt_secret(self) -> str:
        """Get JWT signing secret"""
        if self.environment == 'production':
            secrets = self.get_secret('pipeline-pulse/app-secrets')
            return secrets.get('jwt_secret', '')
        return os.getenv('JWT_SECRET', 'dev-secret-key-change-in-production')
    
    def refresh_cache(self) -> None:
        """Clear the secrets cache to force refresh"""
        self._secrets_cache.clear()
        # Clear the LRU cache
        self.get_secret.cache_clear()
        logger.info("Secrets cache cleared")

# Global instance
secrets_manager = SecretsManager()
