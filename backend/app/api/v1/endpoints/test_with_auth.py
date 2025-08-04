"""
Test endpoints with authentication.
"""
from fastapi import APIRouter, Depends, Request
import structlog
import traceback

from app.core.deps import get_current_user
from app.models.user import User

logger = structlog.get_logger()
router = APIRouter()

@router.get("/test-auth")
async def test_with_auth(
    request: Request,
    current_user: User = Depends(get_current_user)
):
    """Test endpoint with authentication."""
    try:
        return {
            "success": True,
            "user": {
                "id": current_user.id,
                "email": current_user.email,
                "name": f"{current_user.first_name} {current_user.last_name}"
            },
            "cookies": dict(request.cookies)
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "type": type(e).__name__,
            "traceback": traceback.format_exc()
        }

@router.get("/test-zoho-import")
async def test_zoho_import(
    current_user: User = Depends(get_current_user)
):
    """Test importing Zoho modules with auth."""
    results = {}
    
    # Test each import separately
    try:
        from app.core.zoho_sdk import get_user_token_status
        results["zoho_sdk"] = "imported"
    except Exception as e:
        results["zoho_sdk"] = f"error: {str(e)}"
    
    try:
        from app.services.zoho_crm_service import zoho_crm_service
        results["zoho_service"] = "imported"
    except Exception as e:
        results["zoho_service"] = f"error: {str(e)}"
    
    try:
        from app.core.zoho_sdk_manager import zoho_sdk_manager
        results["zoho_manager"] = "imported"
        results["sdk_initialized"] = zoho_sdk_manager.is_initialized()
    except Exception as e:
        results["zoho_manager"] = f"error: {str(e)}"
    
    return {
        "user": current_user.email,
        "imports": results
    }