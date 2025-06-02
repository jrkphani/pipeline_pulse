"""
Unified Zoho CRM Authentication Manager
Consolidates all authentication logic from existing services
"""

import httpx
import asyncio
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from app.core.config import settings
from .exceptions import ZohoAuthError
import logging

logger = logging.getLogger(__name__)


class ZohoAuthManager:
    """Centralized authentication for all Zoho CRM operations"""
    
    def __init__(self):
        self.base_url = settings.ZOHO_BASE_URL
        self.accounts_url = getattr(settings, 'ZOHO_ACCOUNTS_URL', 'https://accounts.zoho.in')
        self.client_id = settings.ZOHO_CLIENT_ID
        self.client_secret = settings.ZOHO_CLIENT_SECRET
        self.refresh_token = settings.ZOHO_REFRESH_TOKEN
        self.access_token = None
        self.token_expires_at = None
        self._auth_lock = asyncio.Lock()
    
    async def get_access_token(self, force_refresh: bool = False) -> str:
        """Get valid access token with automatic refresh"""
        async with self._auth_lock:
            if not force_refresh and self._is_token_valid():
                return self.access_token
            
            return await self._refresh_access_token()
    
    async def _refresh_access_token(self) -> str:
        """Refresh access token from Zoho"""
        if not self.refresh_token:
            raise ZohoAuthError("Zoho refresh token not configured")
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.accounts_url}/oauth/v2/token",
                    data={
                        "refresh_token": self.refresh_token,
                        "client_id": self.client_id,
                        "client_secret": self.client_secret,
                        "grant_type": "refresh_token"
                    }
                )
                
                if response.status_code == 200:
                    token_data = response.json()
                    self.access_token = token_data.get("access_token")
                    # Zoho tokens typically expire in 1 hour
                    self.token_expires_at = datetime.now() + timedelta(seconds=3500)
                    logger.info("Successfully refreshed Zoho access token")
                    return self.access_token
                else:
                    error_msg = f"Failed to refresh access token: {response.text}"
                    logger.error(error_msg)
                    raise ZohoAuthError(error_msg, status_code=response.status_code)
        except httpx.RequestError as e:
            error_msg = f"Network error during token refresh: {str(e)}"
            logger.error(error_msg)
            raise ZohoAuthError(error_msg)
    
    def _is_token_valid(self) -> bool:
        """Check if current token is valid and not expired"""
        if not self.access_token or not self.token_expires_at:
            return False
        
        # Add 5 minute buffer before expiration
        buffer_time = datetime.now() + timedelta(minutes=5)
        return buffer_time < self.token_expires_at
    
    async def validate_connection(self) -> Dict[str, Any]:
        """Validate connection and get org info"""
        try:
            token = await self.get_access_token()
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/org",
                    headers={"Authorization": f"Zoho-oauthtoken {token}"}
                )
                
                if response.status_code == 200:
                    org_data = response.json()
                    return {
                        "authenticated": True,
                        "org_info": org_data,
                        "connection_time": datetime.now().isoformat()
                    }
                else:
                    return {
                        "authenticated": False,
                        "error": f"Failed to validate: {response.text}"
                    }
        except Exception as e:
            return {
                "authenticated": False,
                "error": str(e)
            }
    
    async def get_user_info(self) -> Dict[str, Any]:
        """Get current user information and permissions"""
        try:
            token = await self.get_access_token()
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/users?type=CurrentUser",
                    headers={"Authorization": f"Zoho-oauthtoken {token}"}
                )
                
                if response.status_code == 200:
                    data = response.json()
                    users = data.get("users", [])
                    return users[0] if users else {}
                else:
                    raise ZohoAuthError(f"Failed to get user info: {response.text}")
        except httpx.RequestError as e:
            raise ZohoAuthError(f"Network error getting user info: {str(e)}")
    
    async def exchange_code_for_tokens(self, code: str, client_id: str, client_secret: str) -> Dict[str, Any]:
        """Exchange authorization code for tokens (for initial setup)"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.accounts_url}/oauth/v2/token",
                    data={
                        "grant_type": "authorization_code",
                        "client_id": client_id,
                        "client_secret": client_secret,
                        "redirect_uri": "http://localhost:8000/auth/callback",
                        "code": code
                    }
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    raise ZohoAuthError(f"Failed to exchange code: {response.text}")
        except httpx.RequestError as e:
            raise ZohoAuthError(f"Network error during code exchange: {str(e)}")
