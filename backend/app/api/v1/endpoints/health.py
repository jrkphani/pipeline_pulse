from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from ....core.deps import get_db
from ....core.config import settings
import time
from datetime import datetime

router = APIRouter()


@router.get("/health")
async def health_check():
    """Basic health check endpoint."""
    return {
        "status": "healthy",
        "app": settings.app_name,
        "version": "1.0.0",
        "environment": settings.app_env,
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/health/detailed")
async def detailed_health_check(db: AsyncSession = Depends(get_db)):
    """Detailed health check including database connectivity."""
    start_time = time.time()
    
    # Basic health info
    health_info = {
        "status": "healthy",
        "app": settings.app_name,
        "version": "1.0.0",
        "environment": settings.app_env,
        "timestamp": datetime.utcnow().isoformat(),
        "checks": {}
    }
    
    # Database connectivity check
    try:
        result = await db.execute(text("SELECT 1"))
        row = result.fetchone()
        db_status = "healthy" if row and row[0] == 1 else "unhealthy"
        health_info["checks"]["database"] = {
            "status": db_status,
            "message": "Database connection successful"
        }
    except Exception as e:
        health_info["status"] = "unhealthy"
        health_info["checks"]["database"] = {
            "status": "unhealthy",
            "message": f"Database connection failed: {str(e)}"
        }
    
    # Response time
    response_time = round((time.time() - start_time) * 1000, 2)
    health_info["response_time_ms"] = response_time
    
    return health_info