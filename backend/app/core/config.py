"""
Configuration settings for Pipeline Pulse
(Authentication removed - direct access mode)
"""

from pydantic_settings import BaseSettings
from typing import List, Optional
import os


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
    ZOHO_CLIENT_ID: str = os.getenv("ZOHO_CLIENT_ID", "")
    ZOHO_REFRESH_TOKEN: str = os.getenv("ZOHO_REFRESH_TOKEN", "")
    ZOHO_BASE_URL: str = "https://www.zohoapis.in/crm/v2"
    ZOHO_ACCOUNTS_URL: str = "https://accounts.zoho.in"

    # File upload settings
    MAX_FILE_SIZE: int = 50 * 1024 * 1024  # 50MB
    UPLOAD_DIR: str = "uploads"

    # Currency settings
    BASE_CURRENCY: str = "SGD"
    CURRENCY_CACHE_DAYS: int = 7  # Cache exchange rates for 7 days

    # Production URLs - Environment driven
    BASE_URL: str = os.getenv("BASE_URL", "http://localhost:8000")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")

    # AWS Region
    AWS_REGION: str = os.getenv("AWS_REGION", "ap-southeast-1")

    # Dynamic properties using Secrets Manager
    @property
    def DATABASE_URL_PRODUCTION(self) -> str:
        """Get database URL with secret password for production"""
        if self.ENVIRONMENT == "production":
            from app.core.secrets import secrets_manager
            return secrets_manager.get_database_url()
        return self.DATABASE_URL

    @property
    def ZOHO_CLIENT_SECRET(self) -> str:
        """Get Zoho client secret from Secrets Manager in production"""
        if self.ENVIRONMENT == "production":
            from app.core.secrets import secrets_manager
            return secrets_manager.get_zoho_client_secret()
        return os.getenv("ZOHO_CLIENT_SECRET", "")

    @property
    def CURRENCY_API_KEY(self) -> str:
        """Get Currency API key from Secrets Manager in production"""
        if self.ENVIRONMENT == "production":
            from app.core.secrets import secrets_manager
            return secrets_manager.get_currency_api_key()
        return os.getenv("CURRENCY_API_KEY", "")

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Ignore extra environment variables


# Create settings instance
settings = Settings()

# Ensure upload directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
