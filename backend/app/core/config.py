"""
Configuration settings for Pipeline Pulse
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
    
    # Database settings
    DATABASE_URL: str = "sqlite:///./pipeline_pulse.db"
    
    # Zoho CRM settings
    ZOHO_CLIENT_ID: str = ""
    ZOHO_CLIENT_SECRET: str = ""
    ZOHO_REFRESH_TOKEN: str = ""
    ZOHO_BASE_URL: str = "https://www.zohoapis.in/crm/v2"
    ZOHO_ACCOUNTS_URL: str = "https://accounts.zoho.in"
    
    # File upload settings
    MAX_FILE_SIZE: int = 50 * 1024 * 1024  # 50MB
    UPLOAD_DIR: str = "uploads"
    
    # Currency settings
    BASE_CURRENCY: str = "SGD"
    CURRENCY_API_KEY: Optional[str] = None  # CurrencyFreaks API key
    CURRENCY_CACHE_DAYS: int = 7  # Cache exchange rates for 7 days
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Production URLs - Environment driven
    BASE_URL: str = os.getenv("BASE_URL", "http://localhost:8000")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")

    # SAML SSO Configuration
    SAML_ENTITY_ID: str = ""
    SAML_ACS_URL: str = ""
    SAML_SLS_URL: str = ""

    # Zoho Directory SAML IdP Configuration
    ZOHO_SAML_ENTITY_ID: str = ""
    ZOHO_SAML_SSO_URL: str = ""
    ZOHO_SAML_METADATA_URL: str = ""
    ZOHO_SAML_SLS_URL: str = ""
    ZOHO_SAML_X509_CERT: str = ""

    # JWT Configuration
    JWT_SECRET: str = "your-super-secret-jwt-key"

    # AWS Region
    AWS_REGION: str = "ap-southeast-1"

    class Config:
        env_file = ".env"
        case_sensitive = True


# Create settings instance
settings = Settings()

# Ensure upload directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
