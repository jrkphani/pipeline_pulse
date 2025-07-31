"""
Temporary test endpoint for debugging authentication.
"""
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import structlog

from app.core.database import get_db
from app.models.user import User
from app.models.zoho_oauth_token import ZohoOAuthToken
from app.core.session import SessionCookie, get_session_store

logger = structlog.get_logger()
router = APIRouter()

@router.get("/debug-session")
async def debug_session(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Debug endpoint to check current session and user status."""
    try:
        # Get session cookie
        session_cookie = SessionCookie()
        session_id = session_cookie.extract_from_request(request)
        
        if not session_id:
            return {"error": "No session cookie found"}
        
        # Get session data
        session_store = get_session_store()
        session_data = await session_store.read(session_id)
        
        if not session_data:
            return {"error": "Session not found or expired", "session_id": session_id}
        
        # Get user
        user_id = int(session_data.user_id)
        query = select(User).where(User.id == user_id)
        result = await db.execute(query)
        user = result.scalar_one_or_none()
        
        if not user:
            return {"error": "User not found", "user_id": user_id}
        
        # Check Zoho token
        token_query = select(ZohoOAuthToken).where(ZohoOAuthToken.user_email == user.email)
        token_result = await db.execute(token_query)
        token = token_result.scalar_one_or_none()
        
        return {
            "session_id": session_id,
            "user": {
                "id": user.id,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "is_active": user.is_active,
                "is_temp_user": user.email.startswith("temp_oauth_user")
            },
            "zoho_token": {
                "exists": token is not None,
                "has_refresh_token": bool(token.refresh_token) if token else False,
                "has_access_token": bool(token.access_token) if token else False,
                "user_email": token.user_email if token else None
            }
        }
        
    except Exception as e:
        logger.error("Debug session error", error=str(e))
        return {"error": str(e)}