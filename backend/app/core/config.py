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

    # CORS settings
    ALLOWED_HOSTS: List[str] = ["http://localhost:5173", "http://localhost:3000"]
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"
    
    # Database settings
    DATABASE_URL: str = "sqlite:///./pipeline_pulse.db"
    
    # Zoho CRM settings
    ZOHO_CLIENT_ID: str = ""
    ZOHO_CLIENT_SECRET: str = ""
    ZOHO_REDIRECT_URI: str = ""
    ZOHO_REFRESH_TOKEN: str = ""
    ZOHO_API_VERSION: str = "v8"  # Default to v8, can be changed to v6 if needed
    ZOHO_BASE_URL: str = "https://www.zohoapis.in/crm/v8"  # Updated for v8 India data center
    ZOHO_ACCOUNTS_URL: str = "https://accounts.zoho.in"  # Updated for India data center
    
    # Zoho SDK specific settings
    ZOHO_SDK_DATA_CENTER: str = "IN"  # IN for India, US for United States
    ZOHO_SDK_ENVIRONMENT: str = "PRODUCTION"  # PRODUCTION or SANDBOX
    ZOHO_SDK_TOKEN_STORE_TYPE: str = "DB"  # DB (recommended for AWS deployment) or FILE
    ZOHO_SDK_TOKEN_STORE_PATH: Optional[str] = None  # Not needed for DB mode
    ZOHO_SDK_APPLICATION_NAME: str = "PipelinePulse"
    ZOHO_SDK_LOG_LEVEL: str = "INFO"  # DEBUG, INFO, WARNING, ERROR
    ZOHO_SDK_RESOURCE_PATH: str = "./zoho_sdk_resources"
    ZOHO_USER_EMAIL: str = "admin@1cloudhub.com"
    
    # Proxy settings (optional)
    PROXY_HOST: Optional[str] = None
    PROXY_PORT: Optional[int] = None
    PROXY_USER: Optional[str] = None
    PROXY_PASSWORD: Optional[str] = None
    
    # Live CRM integration settings
    APP_BASE_URL: str = "http://localhost:8000"
    BASE_URL: str = "http://localhost:8000"
    FRONTEND_URL: str = "http://localhost:5173"
    WEBHOOK_TOKEN: str = "your-webhook-secret-token"
    ZOHO_BULK_EXPORT_CALLBACK_URL: str = "http://localhost:8000/api/bulk-export/callback"
    
    # Live sync settings
    SYNC_INTERVAL_MINUTES: int = 15  # How often to sync with CRM
    CACHE_EXPIRY_MINUTES: int = 30  # Cache expiry for dashboard data
    
    # Currency settings
    BASE_CURRENCY: str = "SGD"
    CURRENCY_API_KEY: Optional[str] = None  # CurrencyFreaks API key
    CURRENCY_CACHE_DAYS: int = 7  # Cache exchange rates for 7 days
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # AWS settings
    AWS_REGION: str = "ap-southeast-1"
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "allow"  # Allow extra fields from .env file


# Create settings instance
settings = Settings()

# Live CRM sync is configured
