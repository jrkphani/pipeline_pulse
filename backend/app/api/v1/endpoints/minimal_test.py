"""
Minimal test endpoint to isolate the issue.
"""
from fastapi import APIRouter, Depends
import structlog

logger = structlog.get_logger()
router = APIRouter()

@router.get("/test1")
async def test1():
    """Test basic endpoint."""
    return {"test": "basic endpoint works"}

@router.get("/test2")
async def test2():
    """Test with user import."""
    try:
        from app.core.deps import get_current_user
        return {"test": "user import works"}
    except Exception as e:
        return {"error": str(e), "type": type(e).__name__}

@router.get("/test3") 
async def test3():
    """Test with database import."""
    try:
        from app.core.database import get_db
        return {"test": "database import works"}
    except Exception as e:
        return {"error": str(e), "type": type(e).__name__}

@router.get("/test4")
async def test4():
    """Test with Zoho SDK import."""
    try:
        from app.core.zoho_sdk import get_user_token_status
        return {"test": "zoho_sdk import works"}
    except Exception as e:
        return {"error": str(e), "type": type(e).__name__}

@router.get("/test5")
async def test5():
    """Test with Zoho service import."""
    try:
        from app.services.zoho_crm_service import zoho_crm_service
        return {"test": "zoho_crm_service import works"}
    except Exception as e:
        return {"error": str(e), "type": type(e).__name__}