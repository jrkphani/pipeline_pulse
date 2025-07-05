from functools import lru_cache
from typing import Optional, List
import secrets
from pydantic import Field, validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings with validation."""
    
    # Application
    app_name: str = "Pipeline Pulse"
    app_env: str = Field("development", pattern=r'^(development|staging|production)$')
    debug: bool = False
    api_v1_prefix: str = "/api/v1"
    
    # Database
    database_url: str = Field("postgresql+psycopg://pipeline_pulse:pipeline_pulse@localhost:5432/pipeline_pulse", env="DATABASE_URL")
    database_pool_size: int = Field(10, ge=1, le=50, env="DATABASE_POOL_SIZE")
    database_max_overflow: int = Field(20, ge=0, le=100, env="DATABASE_MAX_OVERFLOW")
    
    # Security
    secret_key: str = Field(default_factory=lambda: secrets.token_urlsafe(32))
    algorithm: str = "HS256"
    access_token_expire_minutes: int = Field(480, gt=0)
    
    # Zoho CRM
    zoho_client_id: str = Field("dev-zoho-client-id", env="ZOHO_CLIENT_ID")
    zoho_client_secret: str = Field("dev-zoho-client-secret", env="ZOHO_CLIENT_SECRET")
    zoho_redirect_uri: str = Field("http://localhost:8000/auth/zoho/callback", env="ZOHO_REDIRECT_URI")
    zoho_region: str = Field("US", pattern=r'^(US|EU|IN|AU|JP)$')
    
    # Currency
    base_currency: str = Field("SGD", pattern=r'^[A-Z]{3}$')
    currency_api_key: str = Field("dev-currency-api-key", env="CURRENCY_API_KEY")
    currency_cache_days: int = Field(7, ge=1, le=30)
    
    # Redis
    redis_url: str = Field("redis://localhost:6379/0", env="REDIS_URL")
    
    # Monitoring
    sentry_dsn: Optional[str] = Field(None, env="SENTRY_DSN")
    log_level: str = Field("INFO", env="LOG_LEVEL")
    
    # CORS
    backend_cors_origins: List[str] = Field(
        default_factory=lambda: ["http://localhost:3000", "http://localhost:5173"],
        env="BACKEND_CORS_ORIGINS"
    )
    
    @validator('database_url')
    def validate_database_url(cls, v):
        if not v.startswith(('postgresql://', 'postgresql+asyncpg://', 'postgresql+psycopg://')):
            raise ValueError('Database URL must be PostgreSQL')
        return v
    
    @validator('debug')
    def validate_debug(cls, v, values):
        if v and values.get('app_env') == 'production':
            raise ValueError('Debug cannot be True in production')
        return v
    
    @validator('backend_cors_origins')
    def assemble_cors_origins(cls, v: List[str]) -> List[str]:
        if isinstance(v, str):
            return [i.strip() for i in v.split(",")]
        return v
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "allow"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()