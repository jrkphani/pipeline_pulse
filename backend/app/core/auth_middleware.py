# backend/app/core/auth_middleware.py
"""
Authentication middleware for Pipeline Pulse.
Supports both traditional session-based auth and Zoho OAuth authentication.
"""
import structlog
from typing import Optional
from fastapi import Request, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from .session import get_session_cookie, get_session_store
from .zoho_sdk import get_user_token_status
from ..models.user import User
from .database import get_db

logger = structlog.get_logger()


class AuthMiddleware:
    """
    Authentication middleware that validates user sessions and Zoho OAuth tokens.
    """
    
    async def get_current_user_from_session(
        self, 
        request: Request,
        db: AsyncSession
    ) -> Optional[User]:
        """
        Get the current user from session cookie.
        
        Args:
            request: FastAPI request object
            db: Database session
            
        Returns:
            User object if authenticated, None otherwise
        """
        try:
            session_cookie = get_session_cookie()
            session_id = session_cookie.extract_from_request(request)
            
            if not session_id:
                logger.debug("No session cookie found")
                return None
            
            session_store = get_session_store()
            session_data = await session_store.read(session_id)
            
            if not session_data:
                logger.debug("No session data found", session_id=session_id)
                return None
            
            # Get user from database
            query = select(User).where(User.id == int(session_data.user_id))
            result = await db.execute(query)
            user = result.scalar_one_or_none()
            
            if not user or not user.is_active:
                logger.warning("User not found or inactive", 
                             user_id=session_data.user_id if session_data else None)
                return None
            
            return user
            
        except Exception as e:
            logger.error("Error getting user from session", error=str(e), exc_info=True)
            return None
    
    async def validate_zoho_connection(self, user: User) -> bool:
        """
        Validate that the user has a valid Zoho OAuth connection.
        
        Args:
            user: User object to validate
            
        Returns:
            True if user has valid Zoho tokens, False otherwise
        """
        try:
            token_status = await get_user_token_status(user.email)
            
            if not token_status or not token_status.get("has_token"):
                logger.debug("User has no Zoho token", user_email=user.email)
                return False
            
            # Check if we have a refresh token (required for API calls)
            if not token_status.get("has_refresh_token"):
                logger.warning("User has token but no refresh token", user_email=user.email)
                return False
            
            return True
            
        except Exception as e:
            logger.error("Error validating Zoho connection", 
                        user_email=user.email, 
                        error=str(e), 
                        exc_info=True)
            return False
    
    async def require_authenticated_user(
        self, 
        request: Request,
        db: AsyncSession
    ) -> User:
        """
        Require an authenticated user with a valid session.
        
        Args:
            request: FastAPI request object
            db: Database session
            
        Returns:
            User object
            
        Raises:
            HTTPException: If user is not authenticated
        """
        user = await self.get_current_user_from_session(request, db)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Not authenticated",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return user
    
    async def require_zoho_authenticated_user(
        self, 
        request: Request,
        db: AsyncSession
    ) -> User:
        """
        Require an authenticated user with a valid Zoho OAuth connection.
        
        Args:
            request: FastAPI request object
            db: Database session
            
        Returns:
            User object with valid Zoho connection
            
        Raises:
            HTTPException: If user is not authenticated or lacks Zoho connection
        """
        user = await self.require_authenticated_user(request, db)
        
        # Validate Zoho connection
        has_valid_zoho = await self.validate_zoho_connection(user)
        
        if not has_valid_zoho:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Zoho CRM connection required. Please connect your Zoho account.",
                headers={"X-Zoho-Connect-Required": "true"},
            )
        
        return user
    
    async def get_optional_user(
        self, 
        request: Request,
        db: AsyncSession
    ) -> Optional[User]:
        """
        Get the current user if authenticated, otherwise return None.
        Does not raise exceptions.
        
        Args:
            request: FastAPI request object
            db: Database session
            
        Returns:
            User object if authenticated, None otherwise
        """
        return await self.get_current_user_from_session(request, db)


# Create a singleton instance
auth_middleware = AuthMiddleware()


# FastAPI dependency functions
async def get_current_user(
    request: Request,
    db: AsyncSession = next(get_db())
) -> User:
    """
    FastAPI dependency to get the current authenticated user.
    """
    return await auth_middleware.require_authenticated_user(request, db)


async def get_current_user_with_zoho(
    request: Request,
    db: AsyncSession = next(get_db())
) -> User:
    """
    FastAPI dependency to get the current authenticated user with Zoho connection.
    """
    return await auth_middleware.require_zoho_authenticated_user(request, db)


async def get_optional_current_user(
    request: Request,
    db: AsyncSession = next(get_db())
) -> Optional[User]:
    """
    FastAPI dependency to get the current user if authenticated.
    Returns None if not authenticated.
    """
    return await auth_middleware.get_optional_user(request, db)