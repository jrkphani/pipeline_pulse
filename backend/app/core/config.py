from functools import lru_cache
from typing import Optional, List
import secrets
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings — Pipeline Pulse v2.0 (standalone CRM)."""

    # Application
    app_name: str = "Pipeline Pulse"
    app_env: str = Field("development", pattern=r'^(development|staging|production)$')
    debug: bool = False
    api_v1_prefix: str = "/api/v1"

    # Database
    database_url: str = Field(
        "postgresql+asyncpg://pipeline_pulse:pipeline_pulse@localhost:5432/pipeline_pulse",
        alias="DATABASE_URL"
    )
    database_pool_size: int = Field(10, ge=1, le=50, alias="DATABASE_POOL_SIZE")
    database_max_overflow: int = Field(20, ge=0, le=100, alias="DATABASE_MAX_OVERFLOW")

    # Security (JWT — no external OAuth in v1.0)
    secret_key: str = Field(default_factory=lambda: secrets.token_urlsafe(32))
    algorithm: str = "HS256"
    access_token_expire_minutes: int = Field(480, gt=0)

    # Currency (SGD base, Currency Freaks API)
    base_currency: str = Field("SGD", pattern=r'^[A-Z]{3}$')
    currency_api_key: str = Field("", alias="CURRENCY_API_KEY")
    currency_api_url: str = Field("https://api.currencyfreaks.com/v2.0", alias="CURRENCY_API_URL")
    currency_cache_days: int = Field(7, ge=1, le=30)

    # AWS (Textract, Bedrock, S3, Secrets Manager)
    aws_region: str = Field("ap-southeast-1", alias="AWS_REGION")
    aws_s3_bucket_name: str = Field("pipeline-pulse-documents", alias="AWS_S3_BUCKET_NAME")
    aws_s3_presigned_url_expiry: int = Field(3600, alias="AWS_S3_PRESIGNED_URL_EXPIRY_SECONDS")
    aws_textract_region: str = Field("ap-southeast-1", alias="AWS_TEXTRACT_REGION")
    aws_bedrock_region: str = Field("us-east-1", alias="AWS_BEDROCK_REGION")
    aws_bedrock_model_id: str = Field(
        "anthropic.claude-3-sonnet-20240229-v1:0",
        alias="AWS_BEDROCK_MODEL_ID"
    )

    # Document AI pipeline
    docai_max_file_size_mb: int = Field(20, alias="DOCAI_MAX_FILE_SIZE_MB")
    docai_min_confidence_threshold: float = Field(0.80, alias="DOCAI_MIN_CONFIDENCE_THRESHOLD")

    # Monitoring
    sentry_dsn: Optional[str] = Field(None, alias="SENTRY_DSN")
    log_level: str = Field("INFO", alias="LOG_LEVEL")

    # CORS
    backend_cors_origins: List[str] = Field(
        default_factory=lambda: [
            "http://localhost:3000",
            "http://localhost:5173",
        ],
        alias="BACKEND_CORS_ORIGINS"
    )

    @field_validator('database_url')
    @classmethod
    def validate_database_url(cls, v: str) -> str:
        if not v.startswith(('postgresql://', 'postgresql+asyncpg://', 'postgresql+psycopg://')):
            raise ValueError('Database URL must be PostgreSQL')
        return v

    @field_validator('backend_cors_origins', mode='before')
    @classmethod
    def assemble_cors_origins(cls, v: object) -> List[str]:
        if isinstance(v, str):
            return [i.strip() for i in v.split(",")]
        return list(v)  # type: ignore[arg-type]

    model_config = {"env_file": ".env", "case_sensitive": True, "extra": "allow"}


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
