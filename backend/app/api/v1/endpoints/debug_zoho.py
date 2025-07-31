"""
Debug endpoint for Zoho field discovery issues.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
import structlog
import traceback

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.core.zoho_sdk import get_user_token_status

logger = structlog.get_logger()
router = APIRouter()

@router.get("/debug-zoho")
async def debug_zoho(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Debug Zoho connection and field discovery."""
    results = {
        "user": {
            "id": current_user.id,
            "email": current_user.email,
            "name": f"{current_user.first_name} {current_user.last_name}"
        },
        "steps": []
    }
    
    # Step 1: Check token status
    try:
        token_status = await get_user_token_status(current_user.email)
        results["steps"].append({
            "step": "Check token status",
            "success": True,
            "result": token_status
        })
    except Exception as e:
        results["steps"].append({
            "step": "Check token status",
            "success": False,
            "error": str(e),
            "error_type": type(e).__name__,
            "traceback": traceback.format_exc()
        })
        return results
    
    # Step 2: Try to import Zoho service
    try:
        from app.services.zoho_crm_service import zoho_crm_service
        results["steps"].append({
            "step": "Import Zoho service",
            "success": True
        })
    except Exception as e:
        results["steps"].append({
            "step": "Import Zoho service",
            "success": False,
            "error": str(e),
            "error_type": type(e).__name__,
            "traceback": traceback.format_exc()
        })
        return results
    
    # Step 3: Check if SDK is initialized
    try:
        from app.core.zoho_sdk_manager import zoho_sdk_manager
        is_initialized = zoho_sdk_manager.is_initialized()
        results["steps"].append({
            "step": "Check SDK initialization",
            "success": True,
            "initialized": is_initialized
        })
    except Exception as e:
        results["steps"].append({
            "step": "Check SDK initialization",
            "success": False,
            "error": str(e),
            "error_type": type(e).__name__,
            "traceback": traceback.format_exc()
        })
        return results
    
    # Step 4: Try to switch user context
    try:
        from app.core.zoho_sdk import switch_zoho_user
        switch_result = await switch_zoho_user(current_user.email)
        results["steps"].append({
            "step": "Switch user context",
            "success": True,
            "result": switch_result
        })
    except Exception as e:
        results["steps"].append({
            "step": "Switch user context",
            "success": False,
            "error": str(e),
            "error_type": type(e).__name__,
            "traceback": traceback.format_exc()
        })
        return results
    
    # Step 5: Try to get fields for a module
    try:
        fields_result = await zoho_crm_service.get_module_fields_for_user(
            user_email=current_user.email,
            module_name="Deals"
        )
        
        field_count = len(fields_result.get("fields", [])) if fields_result else 0
        results["steps"].append({
            "step": "Get Deals fields",
            "success": True,
            "field_count": field_count,
            "has_fields": field_count > 0
        })
    except Exception as e:
        results["steps"].append({
            "step": "Get Deals fields",
            "success": False,
            "error": str(e),
            "error_type": type(e).__name__,
            "traceback": traceback.format_exc()
        })
    
    return results