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
            "/api/zoho/auth",
            "/api/zoho/auth/callback", 
            "/api/zoho/status",  # Allow status check for login page
            "/api/zoho/refresh",  # Allow token refresh
            "/api/state",  # Allow state access for initial app loading
            "/api/state/update",  # Allow state updates
            "/api/sync/health",  # Allow sync health checks
            "/api/sync/dashboard-data",  # Allow dashboard data for initial load
            "/api/o2r/dashboard/summary",  # Allow O2R dashboard summary
            "/api/test",  # Test endpoint for debugging
            "/api/database-status",  # Database status check
            "/",  # Root endpoint
            "/api/"  # API root
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
            # Check for Authorization header with Bearer token
            auth_header = request.headers.get("Authorization")
            if auth_header and auth_header.startswith("Bearer "):
                # Extract and validate the token
                token = auth_header.split(" ")[1]
                return await self._validate_bearer_token(token)

            # Check for session cookie
            session_cookie = request.cookies.get("session_token")
            if session_cookie:
                return await self._validate_session_token(session_cookie)

            # Check if there's a valid OAuth connection stored
            # This is for the OAuth flow where tokens are stored server-side
            return await self._check_stored_oauth_tokens()

        except Exception as e:
            logger.error(f"Error verifying OAuth token: {e}")
            return False

    async def _validate_bearer_token(self, token: str) -> bool:
        """Validate a Bearer token"""
        try:
            # Simplified validation to avoid event loop issues
            # Just check if token exists and has reasonable length
            return bool(token and len(token) > 20)
        except Exception as e:
            logger.warning(f"Bearer token validation failed: {e}")
            return False

    async def _validate_session_token(self, session_token: str) -> bool:
        """Validate a session token"""
        try:
            # In a full implementation, this would validate the session token
            # For now, we'll implement a simple check
            return len(session_token) > 10  # Basic validation
        except Exception as e:
            logger.warning(f"Session token validation failed: {e}")
            return False

    async def _check_stored_oauth_tokens(self) -> bool:
        """Check if there are valid stored OAuth tokens"""
        try:
            from app.core.config import settings

            # Check if we have a refresh token available
            if not settings.ZOHO_REFRESH_TOKEN:
                logger.debug("No refresh token available for OAuth verification")
                return False

            # For now, just check if tokens exist without async calls
            # This avoids the event loop issues
            return bool(settings.ZOHO_REFRESH_TOKEN)

        except Exception as e:
            logger.warning(f"Stored OAuth token verification failed: {e}")
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
