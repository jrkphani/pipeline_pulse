"""
AWS Secrets Manager integration for Pipeline Pulse v2.0
Provides secure access to sensitive configuration data.
"""

import boto3
import json
import os
from functools import lru_cache
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)


class SecretsManager:
    """
    AWS Secrets Manager client for retrieving application secrets.
    Falls back to environment variables for local development.
    """

    def __init__(self):
        self.region = os.getenv('AWS_REGION', 'ap-southeast-1')
        self.environment = os.getenv('APP_ENV', 'development')
        self._secrets_cache: Dict[str, Any] = {}

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
        """Get secret from AWS Secrets Manager with caching."""
        if self.environment in ['development', 'local'] or not self.client:
            return self._get_local_secrets()

        try:
            if secret_name in self._secrets_cache:
                return self._secrets_cache[secret_name]

            response = self.client.get_secret_value(SecretId=secret_name)
            secret_string = response['SecretString']

            try:
                secrets = json.loads(secret_string)
                self._secrets_cache[secret_name] = secrets
                return secrets
            except json.JSONDecodeError:
                secret_value = {'value': secret_string}
                self._secrets_cache[secret_name] = secret_value
                return secret_value

        except Exception as e:
            logger.error(f"Error retrieving secret {secret_name}: {e}")
            return self._get_local_secrets()

    def _get_local_secrets(self) -> Dict[str, Any]:
        """Fallback to environment variables for local development."""
        return {
            'database_password': os.getenv('DATABASE_PASSWORD', ''),
            'currency_api_key': os.getenv('CURRENCY_API_KEY', ''),
            'jwt_secret': os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production'),
        }

    def get_database_url(self) -> str:
        """Construct database URL with secret password."""
        if self.environment == 'production':
            secrets = self.get_secret('pipeline-pulse/app-secrets')
            password = secrets.get('database_password', '')
            db_endpoint = os.getenv('DB_ENDPOINT', 'localhost')
            db_name = os.getenv('DB_NAME', 'pipeline_pulse')
            db_user = os.getenv('DB_USER', 'postgres')
            return f"postgresql+asyncpg://{db_user}:{password}@{db_endpoint}:5432/{db_name}"
        return os.getenv('DATABASE_URL', 'postgresql+asyncpg://pipeline_pulse:pipeline_pulse@localhost:5432/pipeline_pulse')

    def get_currency_api_key(self) -> str:
        """Get Currency API key."""
        if self.environment == 'production':
            secrets = self.get_secret('pipeline-pulse/app-secrets')
            return secrets.get('currency_api_key', '')
        return os.getenv('CURRENCY_API_KEY', '')

    def get_jwt_secret(self) -> str:
        """Get JWT signing secret."""
        if self.environment == 'production':
            secrets = self.get_secret('pipeline-pulse/app-secrets')
            return secrets.get('jwt_secret', '')
        return os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')

    def refresh_cache(self) -> None:
        """Clear the secrets cache to force refresh."""
        self._secrets_cache.clear()
        self.get_secret.cache_clear()
        logger.info("Secrets cache cleared")


secrets_manager = SecretsManager()
