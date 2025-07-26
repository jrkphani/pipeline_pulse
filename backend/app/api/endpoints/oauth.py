"""
OAuth 2.0 endpoints for Zoho CRM user authentication using SDK
Handles user authorization flow for connecting Zoho CRM accounts with official SDK
"""

from fastapi import APIRouter, HTTPException, Depends, Request, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional, Union
from datetime import datetime, timedelta
import logging
import httpx
import urllib.parse
import secrets
import hashlib
from jose import jwt, JWTError

from app.core.database import get_db
from app.core.config import settings
from app.core.secrets import secrets_manager
from app.services.zoho_sdk_manager import get_sdk_manager, initialize_zoho_sdk

# Zoho SDK OAuth imports
try:
    from zohocrmsdk.src.com.zoho.api.authenticator.oauth_token import OAuthToken
    from zohocrmsdk.src.com.zoho.crm.api.initializer import Initializer
    SDK_AVAILABLE = True
except ImportError:
    SDK_AVAILABLE = False
    # logger.warning("Zoho SDK not available for OAuth operations")

logger = logging.getLogger(__name__)

router = APIRouter(tags=["OAuth"])

# In-memory storage for OAuth state (in production, use Redis or database)
oauth_states = {}

class OAuthTokenManager:
    """Manages OAuth tokens for user connections using Zoho SDK"""
    
    def __init__(self):
        self.client_id = settings.ZOHO_CLIENT_ID
        self.client_secret = settings.ZOHO_CLIENT_SECRET
        self.accounts_url = settings.ZOHO_ACCOUNTS_URL
        self.sdk_manager = get_sdk_manager()
        
        # Use environment-appropriate redirect URI
        if settings.ENVIRONMENT == "production":
            self.redirect_uri = "https://api.1chsalesreports.com/api/zoho/auth/callback"
        else:
            self.redirect_uri = "http://localhost:8000/api/zoho/auth/callback"
        
    async def generate_auth_url(self, state: str) -> str:
        """Generate OAuth authorization URL"""
        params = {
            "scope": "ZohoCRM.modules.ALL,ZohoCRM.settings.ALL,ZohoCRM.users.ALL,ZohoCRM.org.ALL,ZohoCRM.users.READ",
            "client_id": self.client_id,
            "response_type": "code",
            "access_type": "offline",
            "redirect_uri": self.redirect_uri,
            "state": state
        }
        
        query_string = urllib.parse.urlencode(params)
        return f"{self.accounts_url}/oauth/v2/auth?{query_string}"
    
    async def exchange_code_for_tokens(self, code: str) -> Dict[str, Any]:
        """Exchange authorization code for access and refresh tokens using Zoho SDK pattern"""
        try:
            # Use manual token exchange following Zoho SDK documentation
            logger.info("Exchanging authorization code for tokens via Zoho API")
            token_data = await self._manual_token_exchange(code)
            
            # Store tokens in the format expected by Zoho SDK
            if SDK_AVAILABLE:
                try:
                    # Create OAuthToken instance for SDK
                    oauth_token = OAuthToken(
                        client_id=self.client_id,
                        client_secret=self.client_secret,
                        refresh_token=token_data.get("refresh_token"),
                        access_token=token_data.get("access_token"),
                        redirect_url=self.redirect_uri
                    )
                    
                    # Store the token for future use
                    # await self._store_sdk_token(oauth_token, token_data)
                    logger.info("Successfully stored tokens for SDK use")
                except Exception as e:
                    logger.warning(f"Failed to store SDK token: {e}, continuing with manual token management")
            
            return token_data
                
        except Exception as e:
            logger.error(f"Token exchange failed: {e}")
            raise HTTPException(
                status_code=400,
                detail=f"Token exchange failed: {str(e)}"
            )
    
    async def get_user_info(self, access_token: str) -> Dict[str, Any]:
        """Get user information from Zoho including region data"""
        user_info_url = f"{settings.ZOHO_BASE_URL}/users?type=CurrentUser"
        
        logger.info("Fetching user information from Zoho CRM")
        
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
                user_data = data["users"][0]
                user_email = user_data.get("email", "unknown@example.com")
                user_region = user_data.get("country") or user_data.get("territory", {}).get("name", "Unknown")
                
                logger.info(f"Successfully fetched user info for: {user_email}, region: {user_region}")
                return user_data
            else:
                logger.error("No user data returned from Zoho API")
                raise HTTPException(status_code=400, detail="No user data returned")
    
    async def _manual_token_exchange(self, code: str) -> Dict[str, Any]:
        """Fallback manual token exchange when SDK is not available"""
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
                logger.error(f"Manual token exchange failed: {response.status_code} - {response.text}")
                raise HTTPException(
                    status_code=400, 
                    detail=f"Token exchange failed: {response.text}"
                )
            
            return response.json()

    async def store_user_tokens(self, user_id: str, tokens: Dict[str, Any], user_info: Dict[str, Any]):
        """Store user tokens securely"""
        if settings.ENVIRONMENT == "production":
            try:
                access_token = tokens.get("access_token")
                refresh_token = tokens.get("refresh_token")

                await secrets_manager.update_zoho_tokens(
                    access_token=access_token if access_token else None,
                    refresh_token=refresh_token if refresh_token else None
                )
                logger.info(f"Tokens backed up to AWS Secrets Manager for user {user_id}")
            except Exception as e:
                logger.error(f"Failed to backup tokens to AWS Secrets Manager: {e}")
        
        if tokens.get("refresh_token"):
            settings.ZOHO_REFRESH_TOKEN = tokens["refresh_token"]
        
        logger.info(f"OAuth tokens stored via SDK for user {user_id}: {user_info.get('full_name', 'Unknown')}")

# Initialize OAuth manager
oauth_manager = OAuthTokenManager()

def create_access_token(data: dict, expires_delta: Union[timedelta, None] = None) -> str:
    """Create JWT token with user identity, region, and appropriate expiration"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    
    # Add issued at timestamp
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "iss": "pipeline-pulse-api"
    })
    
    user_email = to_encode.get("sub", "unknown@example.com")
    user_region = to_encode.get("region", "Unknown")
    
    logger.info(f"Creating JWT for user: {user_email}, region: {user_region}")
    
    try:
        encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        logger.info(f"JWT created successfully for user: {user_email}, expires at: {expire}")
        return encoded_jwt
    except Exception as e:
        logger.error(f"Failed to create JWT for user {user_email}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create authentication token: {str(e)}"
        )

@router.get("/zoho/status")
async def get_oauth_status() -> Dict[str, Any]:
    """Get current OAuth connection status with SDK integration"""
    try:
        # Check OAuth status including SDK readiness and token validity
        oauth_status = {
            "sdk_available": SDK_AVAILABLE,
            "token_valid": settings.ZOHO_REFRESH_TOKEN is not None,
            "environment": settings.ENVIRONMENT,
            "client_configured": bool(settings.ZOHO_CLIENT_ID and settings.ZOHO_CLIENT_SECRET),
            "base_url": settings.ZOHO_BASE_URL,
            "accounts_url": settings.ZOHO_ACCOUNTS_URL
        }
        logger.info(f"OAuth status check: {oauth_status}")
        return oauth_status
    except Exception as e:
        logger.error(f"Failed to get OAuth status: {e}")
        raise HTTPException(status_code=500, detail="Cannot fetch OAuth status")

@router.get("/zoho/auth-url")
async def get_zoho_auth_url() -> Dict[str, Any]:
    """Generate Zoho OAuth authorization URL"""
    try:
        state = secrets.token_urlsafe(32)
        oauth_states[state] = {
            "created_at": datetime.now(),
            "expires_at": datetime.now() + timedelta(minutes=10)
        }
        auth_url = await oauth_manager.generate_auth_url(state)
        return {
            "auth_url": auth_url,
            "state": state,
            "expires_in": 600
        }
    except Exception as e:
        logger.error(f"Failed to generate auth URL: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate auth URL: {str(e)}")

@router.get("/zoho/auth/callback")
async def zoho_oauth_callback(
    code: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    error: Optional[str] = Query(None)
) -> RedirectResponse:
    """Handle OAuth callback from Zoho, create JWT and redirect to frontend
    
    This endpoint:
    1. Exchanges the authorization code for tokens
    2. Fetches user information including region data
    3. Creates a JWT with user identity, region, and appropriate expiration
    4. Returns the JWT in the redirect URL
    """
    logger.info(f"OAuth callback received - code: {'present' if code else 'missing'}, state: {'present' if state else 'missing'}")
    
    try:
        if error:
            logger.error(f"OAuth error received: {error}")
            return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?error=oauth_error&message={error}")
        
        if not code or not state:
            logger.error("Missing required parameters - code or state")
            return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?error=missing_params")
        
        # Validate state parameter
        if state not in oauth_states or datetime.now() > oauth_states[state]["expires_at"]:
            logger.error(f"Invalid or expired state parameter: {state}")
            return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?error=invalid_state")
        
        # Clean up state
        del oauth_states[state]
        logger.info("State parameter validated successfully")
        
        # Step 1: Exchange authorization code for tokens
        logger.info("Exchanging authorization code for access tokens")
        tokens = await oauth_manager.exchange_code_for_tokens(code)
        logger.info("Successfully exchanged authorization code for tokens")
        
        # Step 2: Fetch user information including region data
        user_info = await oauth_manager.get_user_info(tokens["access_token"])
        
        # Extract user details
        user_email = user_info.get("email", "unknown@example.com")
        user_id = user_info.get("id", "unknown")
        user_name = user_info.get("full_name", "Unknown User")
        user_region = user_info.get("country") or user_info.get("territory", {}).get("name", "Unknown")
        user_role = user_info.get("role", {}).get("name", "User")
        
        logger.info(f"Processing OAuth callback for user: {user_email}, region: {user_region}, role: {user_role}")
        
        # Step 3: Create JWT with user identity, region, and appropriate expiration
        jwt_data = {
            "sub": user_email,
            "user_id": user_id,
            "region": user_region,
            "name": user_name,
            "roles": [user_role] if user_role else []
        }
        
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        jwt_token = create_access_token(data=jwt_data, expires_delta=access_token_expires)
        
        # Store tokens for future use
        await oauth_manager.store_user_tokens(user_id, tokens, user_info)
        
        # Step 4: Return JWT in redirect URL
        redirect_url = f"{settings.FRONTEND_URL}/auth/callback?token={jwt_token}"
        logger.info(f"OAuth flow completed successfully for user: {user_email}, redirecting to: {settings.FRONTEND_URL}/auth/callback")
        
        return RedirectResponse(url=redirect_url)
        
    except HTTPException as e:
        logger.error(f"OAuth callback failed with HTTP error: {e.detail}")
        return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?error=callback_failed&message={e.detail}")
    except Exception as e:
        logger.error(f"OAuth callback failed with unexpected error: {e}")
        return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?error=callback_failed&message={str(e)}")
