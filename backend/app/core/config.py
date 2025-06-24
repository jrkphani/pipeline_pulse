"""
Configuration settings for Pipeline Pulse
(Authentication removed - direct access mode)
"""

from pydantic_settings import BaseSettings
from typing import List, Optional
import os
from dotenv import load_dotenv

# Load .env file explicitly
load_dotenv()


class Settings(BaseSettings):
    """Application settings"""

    # App settings
    APP_NAME: str = "Pipeline Pulse"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"

    # CORS settings - Read from environment variable
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000")

    @property
    def ALLOWED_HOSTS(self) -> List[str]:
        """Parse CORS_ORIGINS into list"""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
    
    # Database settings (local development default)
    DATABASE_URL: str = "sqlite:///./pipeline_pulse.db"

    # Zoho CRM settings (for data access only - no authentication)
    # Note: All ZOHO_* settings are loaded dynamically via properties for consistent timing

    # File upload settings
    MAX_FILE_SIZE: int = 50 * 1024 * 1024  # 50MB
    UPLOAD_DIR: str = "uploads"

    # Currency settings
    BASE_CURRENCY: str = "SGD"
    CURRENCY_CACHE_DAYS: int = 7  # Cache exchange rates for 7 days

    # Bulk Export settings
    ZOHO_BULK_EXPORT_CALLBACK_URL: str = os.getenv("ZOHO_BULK_EXPORT_CALLBACK_URL", "")

    # Production URLs - Environment driven
    BASE_URL: str = os.getenv("BASE_URL", "http://localhost:8000")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")

    # AWS Region
    AWS_REGION: str = os.getenv("AWS_REGION", "ap-southeast-1")

    # Dynamic properties using Secrets Manager
    @property
    def DATABASE_URL_PRODUCTION(self) -> str:
        """Get database URL with IAM authentication for production"""
        if self.ENVIRONMENT == "production":
            from app.core.iam_database import iam_db_auth
            return iam_db_auth.get_database_url_with_iam()
        return self.DATABASE_URL

    @property
    def ZOHO_CLIENT_ID(self) -> str:
        """Get Zoho client ID from environment or Secrets Manager"""
        # For dev branch, prioritize environment variables for development flexibility
        env_client_id = os.getenv("ZOHO_CLIENT_ID", "")
        if env_client_id:
            return env_client_id

        # Fall back to Secrets Manager only in production
        if self.ENVIRONMENT == "production":
            try:
                from app.core.secrets import secrets_manager
                return secrets_manager.get_zoho_client_id()
            except Exception:
                return ""
        return ""

    @property
    def ZOHO_CLIENT_SECRET(self) -> str:
        """Get Zoho client secret from environment or Secrets Manager"""
        # For dev branch, prioritize environment variables for development flexibility
        env_secret = os.getenv("ZOHO_CLIENT_SECRET", "")
        if env_secret:
            return env_secret

        # Fall back to Secrets Manager only in production
        if self.ENVIRONMENT == "production":
            try:
                from app.core.secrets import secrets_manager
                return secrets_manager.get_zoho_client_secret()
            except Exception:
                return ""
        return ""

    @property
    def ZOHO_REFRESH_TOKEN(self) -> str:
        """Get Zoho refresh token from environment or Secrets Manager"""
        # For dev branch, prioritize environment variables for development flexibility
        env_token = os.getenv("ZOHO_REFRESH_TOKEN", "")
        if env_token:
            return env_token

        # Fall back to Secrets Manager only in production
        if self.ENVIRONMENT == "production":
            try:
                from app.core.secrets import secrets_manager
                return secrets_manager.get_zoho_refresh_token()
            except Exception:
                return ""
        return ""

    @property
    def ZOHO_BASE_URL(self) -> str:
        """Get Zoho base URL from environment or default"""
        return os.getenv("ZOHO_BASE_URL", "https://www.zohoapis.in/crm/v8")

    @property
    def ZOHO_ACCOUNTS_URL(self) -> str:
        """Get Zoho accounts URL from environment or default"""
        return os.getenv("ZOHO_ACCOUNTS_URL", "https://accounts.zoho.in")

    @property
    def CURRENCY_API_KEY(self) -> str:
        """Get Currency API key from environment or Secrets Manager"""
        # For dev branch, prioritize environment variables for development flexibility
        env_key = os.getenv("CURRENCY_API_KEY", "")
        if env_key:
            return env_key

        # Fall back to Secrets Manager only in production
        if self.ENVIRONMENT == "production":
            try:
                from app.core.secrets import secrets_manager
                return secrets_manager.get_currency_api_key()
            except Exception:
                return ""
        return ""

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Ignore extra environment variables


# Create settings instance
settings = Settings()

# Ensure upload directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
