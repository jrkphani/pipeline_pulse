"""
Enhanced health check endpoint with database connectivity test
"""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
import time
import os
from app.core.config import settings
from app.core.database import get_db

router = APIRouter()

@router.get("/health")
async def health_check(db: Session = Depends(get_db)):
    """
    Comprehensive health check including database connectivity
    """
    start_time = time.time()
    health_status = {
        "status": "healthy",
        "timestamp": int(time.time()),
        "environment": settings.ENVIRONMENT,
        "app_name": settings.APP_NAME,
        "version": "1.0.0",
        "checks": {}
    }
    
    # Basic application health
    health_status["checks"]["application"] = {
        "status": "healthy",
        "message": "Application is running"
    }
    
    # Database connectivity test
    try:
        result = db.execute(text("SELECT 1")).fetchone()
        if result:
            # Get the correct database URL based on environment
            if settings.ENVIRONMENT == "production":
                db_url = settings.DATABASE_URL_PRODUCTION
            else:
                db_url = settings.DATABASE_URL

            health_status["checks"]["database"] = {
                "status": "healthy",
                "message": "Database connection successful",
                "connection_url": db_url.split("@")[1] if "@" in db_url else db_url
            }
        else:
            health_status["checks"]["database"] = {
                "status": "unhealthy",
                "message": "Database query returned no results"
            }
            health_status["status"] = "unhealthy"
    except Exception as e:
        health_status["checks"]["database"] = {
            "status": "unhealthy",
            "message": f"Database connection failed: {str(e)}",
            "error_type": type(e).__name__
        }
        health_status["status"] = "unhealthy"
    
    # Secrets Manager check (production only)
    if settings.ENVIRONMENT == "production":
        try:
            from app.core.secrets import secrets_manager
            secrets = secrets_manager.get_secret('pipeline-pulse/app-secrets')

            # Check if all required secrets are present
            required_secrets = ['database_password', 'zoho_client_secret', 'currency_api_key', 'jwt_secret']
            missing_secrets = [key for key in required_secrets if not secrets.get(key)]

            if missing_secrets:
                health_status["checks"]["secrets_manager"] = {
                    "status": "warning",
                    "message": f"Missing secrets: {', '.join(missing_secrets)}"
                }
            else:
                health_status["checks"]["secrets_manager"] = {
                    "status": "healthy",
                    "message": "All secrets retrieved from AWS Secrets Manager",
                    "secrets_count": len([k for k, v in secrets.items() if v])
                }
        except Exception as e:
            health_status["checks"]["secrets_manager"] = {
                "status": "unhealthy",
                "message": f"Secrets Manager error: {str(e)}",
                "error_type": type(e).__name__
            }
    else:
        health_status["checks"]["secrets_manager"] = {
            "status": "info",
            "message": "Using environment variables (development mode)"
        }

    # Environment variables check
    required_env_vars = ["ZOHO_CLIENT_ID"]
    missing_vars = [var for var in required_env_vars if not getattr(settings, var, None)]

    if missing_vars:
        health_status["checks"]["environment"] = {
            "status": "warning",
            "message": f"Missing environment variables: {', '.join(missing_vars)}"
        }
    else:
        health_status["checks"]["environment"] = {
            "status": "healthy",
            "message": "All required environment variables are set"
        }
    
    # File system check
    try:
        upload_dir = settings.UPLOAD_DIR
        if os.path.exists(upload_dir) and os.access(upload_dir, os.W_OK):
            health_status["checks"]["filesystem"] = {
                "status": "healthy",
                "message": f"Upload directory {upload_dir} is accessible"
            }
        else:
            health_status["checks"]["filesystem"] = {
                "status": "warning",
                "message": f"Upload directory {upload_dir} is not accessible"
            }
    except Exception as e:
        health_status["checks"]["filesystem"] = {
            "status": "unhealthy",
            "message": f"Filesystem check failed: {str(e)}"
        }
    
    # Response time
    response_time = (time.time() - start_time) * 1000
    health_status["response_time_ms"] = round(response_time, 2)
    
    # Set HTTP status code based on health
    if health_status["status"] == "unhealthy":
        raise HTTPException(status_code=503, detail=health_status)
    
    return health_status

@router.get("/health/simple")
async def simple_health_check():
    """
    Simple health check without database dependency
    """
    return {
        "status": "healthy",
        "timestamp": int(time.time()),
        "version": "1.0.0"
    }
