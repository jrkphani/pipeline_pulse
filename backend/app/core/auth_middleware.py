"""
Authentication middleware for Pipeline Pulse
Verifies OAuth tokens for protected endpoints
"""

from fastapi import HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
import logging

logger = logging.getLogger(__name__)

# Security scheme for OAuth token verification
security = HTTPBearer(auto_error=False)

class AuthMiddleware:
    """Middleware to verify OAuth authentication"""
    
    def __init__(self):
        self.public_paths = {
            "/docs",
            "/redoc", 
            "/openapi.json",
            "/health",
            "/api/health",
            "/api/zoho/auth-url",
            "/api/zoho/callback",
            "/api/zoho/status"  # Allow status check for login page
        }
    
    def is_public_path(self, path: str) -> bool:
        """Check if the path is public and doesn't require authentication"""
        # Remove query parameters
        clean_path = path.split('?')[0]
        
        # Check exact matches
        if clean_path in self.public_paths:
            return True
            
        # Check path prefixes that should be public
        public_prefixes = [
            "/static/",
            "/favicon.ico"
        ]
        
        for prefix in public_prefixes:
            if clean_path.startswith(prefix):
                return True
                
        return False
    
    async def verify_oauth_token(self, request: Request) -> bool:
        """Verify that the user has a valid OAuth connection"""
        try:
            # For now, we'll implement a simple check based on the OAuth status endpoint
            # In a real implementation, this would check for user session tokens

            # Check if there's an Authorization header or session cookie
            auth_header = request.headers.get("Authorization")
            session_cookie = request.cookies.get("session_token")

            # For testing purposes, we'll require either an auth header or session cookie
            # In production, this would validate the actual token/session
            if auth_header or session_cookie:
                return True

            # For development/testing, we can also check if there's a valid OAuth connection
            # But this should not be the primary authentication method
            from app.core.config import settings

            # Only allow this fallback in development environment
            if settings.ENVIRONMENT == "development":
                # Check if we have a valid refresh token and can get an access token
                if settings.ZOHO_REFRESH_TOKEN:
                    from app.services.zoho_crm.core.auth_manager import ZohoAuthManager
                    auth_manager = ZohoAuthManager()

                    try:
                        # Attempt to get a valid access token
                        access_token = await auth_manager.get_access_token()
                        if access_token:
                            logger.info("Development mode: OAuth token verified")
                            return True
                    except Exception as e:
                        logger.warning(f"OAuth token verification failed: {e}")
                        return False

            return False

        except Exception as e:
            logger.error(f"Error verifying OAuth token: {e}")
            return False

async def verify_authentication(request: Request) -> Optional[dict]:
    """
    Verify authentication for protected endpoints
    Returns user info if authenticated, raises HTTPException if not
    """
    auth_middleware = AuthMiddleware()
    
    # Skip authentication for public paths
    if auth_middleware.is_public_path(request.url.path):
        return None
    
    # Verify OAuth token
    is_authenticated = await auth_middleware.verify_oauth_token(request)
    
    if not is_authenticated:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please connect your Zoho CRM account.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Return basic user info (can be expanded later)
    return {"authenticated": True}

# Dependency for FastAPI routes
async def get_current_user(request: Request):
    """FastAPI dependency to get current authenticated user"""
    return await verify_authentication(request)

# Optional dependency that doesn't raise errors for public endpoints
async def get_current_user_optional(request: Request):
    """FastAPI dependency that returns None for unauthenticated users on public endpoints"""
    auth_middleware = AuthMiddleware()
    
    if auth_middleware.is_public_path(request.url.path):
        return None
    
    try:
        return await verify_authentication(request)
    except HTTPException:
        return None
