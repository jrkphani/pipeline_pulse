"""
OAuth 2.0 endpoints for Zoho CRM user authentication
Handles user authorization flow for connecting Zoho CRM accounts
"""

from fastapi import APIRouter, HTTPException, Depends, Request, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
import logging
import httpx
import urllib.parse
import secrets
import hashlib

from app.core.database import get_db
from app.core.config import settings
from app.core.secrets import secrets_manager

logger = logging.getLogger(__name__)

router = APIRouter(tags=["OAuth"])

# In-memory storage for OAuth state (in production, use Redis or database)
oauth_states = {}

class OAuthTokenManager:
    """Manages OAuth tokens for user connections"""
    
    def __init__(self):
        self.client_id = settings.ZOHO_CLIENT_ID
        self.client_secret = settings.ZOHO_CLIENT_SECRET
        self.accounts_url = settings.ZOHO_ACCOUNTS_URL
        # Use environment-appropriate redirect URI
        if settings.ENVIRONMENT == "production":
            self.redirect_uri = "https://api.1chsalesreports.com/api/zoho/auth/callback"
        else:
            self.redirect_uri = "http://localhost:8000/api/zoho/auth/callback"
        
    async def generate_auth_url(self, state: str) -> str:
        """Generate OAuth authorization URL"""
        params = {
            "scope": "ZohoCRM.modules.ALL,ZohoCRM.settings.ALL,ZohoCRM.users.ALL,ZohoCRM.org.ALL",
            "client_id": self.client_id,
            "response_type": "code",
            "access_type": "offline",
            "redirect_uri": self.redirect_uri,
            "state": state
        }
        
        query_string = urllib.parse.urlencode(params)
        return f"{self.accounts_url}/oauth/v2/auth?{query_string}"
    
    async def exchange_code_for_tokens(self, code: str) -> Dict[str, Any]:
        """Exchange authorization code for access and refresh tokens"""
        token_url = f"{self.accounts_url}/oauth/v2/token"
        
        data = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": self.redirect_uri
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                token_url,
                data=data,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            
            if response.status_code != 200:
                logger.error(f"Token exchange failed: {response.status_code} - {response.text}")
                raise HTTPException(
                    status_code=400, 
                    detail=f"Token exchange failed: {response.text}"
                )
            
            return response.json()
    
    async def get_user_info(self, access_token: str) -> Dict[str, Any]:
        """Get user information from Zoho"""
        user_info_url = f"{settings.ZOHO_BASE_URL}/users?type=CurrentUser"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                user_info_url,
                headers={
                    "Authorization": f"Zoho-oauthtoken {access_token}",
                    "Content-Type": "application/json"
                }
            )
            
            if response.status_code != 200:
                logger.error(f"User info fetch failed: {response.status_code} - {response.text}")
                raise HTTPException(
                    status_code=400,
                    detail=f"Failed to get user info: {response.text}"
                )
            
            data = response.json()
            if data.get("users"):
                return data["users"][0]
            else:
                raise HTTPException(status_code=400, detail="No user data returned")
    
    async def store_user_tokens(self, user_id: str, tokens: Dict[str, Any], user_info: Dict[str, Any]):
        """Store user tokens securely"""
        # In production, store in AWS Secrets Manager or encrypted database
        # For now, we'll update the global tokens (since we're in direct access mode)
        
        if settings.ENVIRONMENT == "production":
            # Store in AWS Secrets Manager
            try:
                access_token = tokens.get("access_token")
                refresh_token = tokens.get("refresh_token")

                await secrets_manager.update_zoho_tokens(
                    access_token=access_token if access_token else None,
                    refresh_token=refresh_token if refresh_token else None
                )
                logger.info(f"Tokens stored in AWS Secrets Manager for user {user_id}")
            except Exception as e:
                logger.error(f"Failed to store tokens in AWS Secrets Manager: {e}")
                raise HTTPException(status_code=500, detail="Failed to store tokens securely")
        else:
            # Development: Log token info (don't log actual tokens)
            logger.info(f"OAuth tokens received for user {user_id}: {user_info.get('full_name', 'Unknown')}")

# Initialize OAuth manager
oauth_manager = OAuthTokenManager()

@router.get("/zoho/auth-url")
async def get_zoho_auth_url() -> Dict[str, Any]:
    """Generate Zoho OAuth authorization URL"""
    try:
        # Generate secure state parameter
        state = secrets.token_urlsafe(32)
        
        # Store state with timestamp (expires in 10 minutes)
        oauth_states[state] = {
            "created_at": datetime.now(),
            "expires_at": datetime.now() + timedelta(minutes=10)
        }
        
        # Generate authorization URL
        auth_url = await oauth_manager.generate_auth_url(state)
        
        return {
            "auth_url": auth_url,
            "state": state,
            "expires_in": 600  # 10 minutes
        }
        
    except Exception as e:
        logger.error(f"Failed to generate auth URL: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate auth URL: {str(e)}")

@router.get("/zoho/callback")
async def zoho_oauth_callback(
    code: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    error: Optional[str] = Query(None)
) -> RedirectResponse:
    """Handle OAuth callback from Zoho"""
    try:
        # Check for OAuth errors
        if error:
            logger.error(f"OAuth error: {error}")
            return RedirectResponse(
                url=f"{settings.FRONTEND_URL}/login?error=oauth_error&message={error}",
                status_code=302
            )
        
        # Validate required parameters
        if not code or not state:
            logger.error("Missing code or state parameter")
            return RedirectResponse(
                url=f"{settings.FRONTEND_URL}/login?error=missing_params",
                status_code=302
            )
        
        # Validate state parameter
        if state not in oauth_states:
            logger.error(f"Invalid state parameter: {state}")
            return RedirectResponse(
                url=f"{settings.FRONTEND_URL}/login?error=invalid_state",
                status_code=302
            )

        # Check state expiration
        state_info = oauth_states[state]
        if datetime.now() > state_info["expires_at"]:
            logger.error("State parameter expired")
            del oauth_states[state]
            return RedirectResponse(
                url=f"{settings.FRONTEND_URL}/login?error=state_expired",
                status_code=302
            )
        
        # Clean up state
        del oauth_states[state]
        
        # Exchange code for tokens
        tokens = await oauth_manager.exchange_code_for_tokens(code)
        
        # Get user information
        user_info = await oauth_manager.get_user_info(tokens["access_token"])
        
        # Store tokens securely
        user_id = user_info.get("id", "default_user")
        await oauth_manager.store_user_tokens(user_id, tokens, user_info)
        
        # Redirect to dashboard (successful login)
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/?success=true&user={user_info.get('full_name', 'User')}",
            status_code=302
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"OAuth callback failed: {e}")
        return RedirectResponse(
            url=f"{settings.FRONTEND_URL}/login?error=callback_failed&message={str(e)}",
            status_code=302
        )

@router.get("/zoho/status")
async def get_oauth_status() -> Dict[str, Any]:
    """Get current OAuth connection status"""
    try:
        # Check if we have valid tokens
        if settings.ZOHO_REFRESH_TOKEN:
            # Try to get user info to verify connection
            from app.services.zoho_crm.core.auth_manager import ZohoAuthManager
            auth_manager = ZohoAuthManager()
            
            try:
                access_token = await auth_manager.get_access_token()
                user_info = await oauth_manager.get_user_info(access_token)
                
                return {
                    "connected": True,
                    "user": {
                        "id": user_info.get("id"),
                        "name": user_info.get("full_name"),
                        "email": user_info.get("email"),
                        "role": user_info.get("role", {}).get("name")
                    },
                    "connection_time": datetime.now().isoformat()
                }
            except Exception as e:
                logger.warning(f"Token validation failed: {e}")
                return {
                    "connected": False,
                    "error": "Token validation failed"
                }
        else:
            return {
                "connected": False,
                "error": "No refresh token available"
            }
            
    except Exception as e:
        logger.error(f"Status check failed: {e}")
        return {
            "connected": False,
            "error": f"Status check failed: {str(e)}"
        }

@router.post("/zoho/disconnect")
async def disconnect_zoho() -> Dict[str, Any]:
    """Disconnect Zoho CRM account"""
    try:
        # In production, revoke tokens and clear from storage
        if settings.ENVIRONMENT == "production":
            # Revoke refresh token
            if settings.ZOHO_REFRESH_TOKEN:
                revoke_url = f"{settings.ZOHO_ACCOUNTS_URL}/oauth/v2/token/revoke"
                async with httpx.AsyncClient() as client:
                    await client.get(f"{revoke_url}?token={settings.ZOHO_REFRESH_TOKEN}")
            
            # Clear from AWS Secrets Manager
            try:
                await secrets_manager.clear_zoho_tokens()
            except Exception as e:
                logger.warning(f"Failed to clear tokens from AWS: {e}")
        
        return {
            "success": True,
            "message": "Zoho CRM account disconnected successfully"
        }
        
    except Exception as e:
        logger.error(f"Disconnect failed: {e}")
        raise HTTPException(status_code=500, detail=f"Disconnect failed: {str(e)}")
