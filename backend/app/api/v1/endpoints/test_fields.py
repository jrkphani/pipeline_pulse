"""
Simple test endpoint for field discovery.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
import structlog

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.services.zoho_crm_service import zoho_crm_service

logger = structlog.get_logger()
router = APIRouter()

@router.get("/fields-simple")
async def test_fields_simple(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Simple test of field discovery."""
    try:
        logger.info(f"Testing field discovery for user: {current_user.email}")
        
        # Try to get fields for just Deals module
        result = await zoho_crm_service.get_module_fields_for_user(
            user_email=current_user.email,
            module_name="Deals"
        )
        
        if result and "fields" in result:
            fields = result["fields"]
            return {
                "success": True,
                "module": "Deals",
                "total_fields": len(fields),
                "sample_fields": fields[:5] if fields else [],
                "user_email": current_user.email
            }
        else:
            return {
                "success": False,
                "error": "No fields returned",
                "user_email": current_user.email
            }
            
    except Exception as e:
        logger.error(f"Field discovery error: {str(e)}", exc_info=True)
        return {
            "success": False,
            "error": str(e),
            "error_type": type(e).__name__,
            "user_email": current_user.email
        }