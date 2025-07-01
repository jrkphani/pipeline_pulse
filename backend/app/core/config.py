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
    
    # CORS settings
    ALLOWED_HOSTS: List[str] = ["http://localhost:5173", "http://localhost:3000"]
    
    # Database settings
    DATABASE_URL: str = "sqlite:///./pipeline_pulse.db"
    
    # Zoho CRM settings
    ZOHO_CLIENT_ID: str = ""
    ZOHO_CLIENT_SECRET: str = ""
    ZOHO_REFRESH_TOKEN: str = ""
    ZOHO_API_VERSION: str = "v8"  # Default to v8, can be changed to v6 if needed
    ZOHO_BASE_URL: str = "https://www.zohoapis.com/crm/v8"  # Updated for v8
    ZOHO_ACCOUNTS_URL: str = "https://accounts.zoho.com"  # Updated for global (US) data center
    
    # Live CRM integration settings
    APP_BASE_URL: str = "http://localhost:8000"
    WEBHOOK_TOKEN: str = "your-webhook-secret-token"
    
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
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Create settings instance
settings = Settings()

# Ensure upload directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
