"""
OAuth 2.0 endpoints for Zoho CRM user authentication using SDK
Handles user authorization flow for connecting Zoho CRM accounts with official SDK
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
from app.services.zoho_sdk_manager import get_sdk_manager, initialize_zoho_sdk

# Zoho SDK OAuth imports
try:
    from zohocrmsdk.src.com.zoho.api.authenticator.oauth_token import OAuthToken
    from zohocrmsdk.src.com.zoho.crm.api.initializer import Initializer
    SDK_AVAILABLE = True
except ImportError:
    SDK_AVAILABLE = False
    logger.warning("Zoho SDK not available for OAuth operations")

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
                    await self._store_sdk_token(oauth_token, token_data)
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
    
    async def _initialize_sdk_with_token(self, oauth_token) -> bool:
        """Initialize SDK with OAuth token"""
        try:
            # Initialize SDK with the OAuth token
            success = initialize_zoho_sdk(
                client_id=self.client_id,
                client_secret=self.client_secret,
                redirect_uri=self.redirect_uri,
                data_center="IN",  # India data center for Zoho IN
                environment="PRODUCTION",
                token_store_type="FILE",
                token_store_path="./zoho_tokens.txt",
                application_name="PipelinePulse"
            )
            
            if success:
                # Now set the OAuth token in the SDK
                from zohocrmsdk.src.com.zoho.crm.api.initializer import Initializer
                Initializer.switch_user(oauth_token)
                
            return success
            
        except Exception as e:
            logger.error(f"SDK initialization with token failed: {e}")
            return False
    
    async def _get_stored_tokens(self) -> Dict[str, Any]:
        """Retrieve tokens from SDK token store"""
        try:
            # Read tokens from the file store
            # The SDK stores tokens in the configured file
            import json
            token_file_path = "./zoho_tokens.txt"
            
            with open(token_file_path, 'r') as f:
                token_data = json.load(f)
                
            # Extract the latest token data
            if token_data and isinstance(token_data, list) and len(token_data) > 0:
                latest_token = token_data[-1]  # Get the most recent token
                return {
                    "access_token": latest_token.get("access_token"),
                    "refresh_token": latest_token.get("refresh_token"),
                    "expires_in": latest_token.get("expires_in", 3600),
                    "token_type": "Bearer"
                }
            
            return {}
            
        except Exception as e:
            logger.error(f"Failed to retrieve stored tokens: {e}")
            return {}
    
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

    async def _store_sdk_token(self, oauth_token, token_data: Dict[str, Any]):
        """Store token in SDK-compatible format"""
        try:
            from zohocrmsdk.src.com.zoho.api.authenticator.store import FileStore
            
            # Use file store for tokens (as recommended in documentation)
            store = FileStore(file_path="./zoho_tokens.txt")
            
            # The SDK will automatically handle token storage when we use it
            # For now, we'll store it manually in the format the SDK expects
            token_json = {
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "refresh_token": token_data.get("refresh_token"),
                "access_token": token_data.get("access_token"),
                "redirect_url": self.redirect_uri,
                "api_domain": settings.ZOHO_BASE_URL,
                "expiry_time": str(int(datetime.now().timestamp()) + token_data.get("expires_in", 3600))
            }
            
            # Write token to file (following SDK file format)
            import json
            with open("./zoho_tokens.txt", "w") as f:
                json.dump([token_json], f, indent=2)
                
            logger.info("Token stored in SDK-compatible format")
            
        except Exception as e:
            logger.error(f"Failed to store SDK token: {e}")
            raise

    async def store_user_tokens(self, user_id: str, tokens: Dict[str, Any], user_info: Dict[str, Any]):
        """Store user tokens securely"""
        # Store tokens in environment settings for immediate use
        
        if settings.ENVIRONMENT == "production":
            # Store in AWS Secrets Manager for backup
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
                # Don't fail - SDK already has the tokens stored
        
        # Update settings for immediate use
        if tokens.get("refresh_token"):
            settings.ZOHO_REFRESH_TOKEN = tokens["refresh_token"]
        
        logger.info(f"OAuth tokens stored via SDK for user {user_id}: {user_info.get('full_name', 'Unknown')}")

# Initialize OAuth manager
oauth_manager = OAuthTokenManager()

async def _get_valid_access_token() -> Optional[str]:
    """Get a valid access token using stored tokens"""
    try:
        # First try to get token from file store
        try:
            import json
            import os
            
            token_file_path = "./zoho_tokens.txt"
            if os.path.exists(token_file_path):
                with open(token_file_path, 'r') as f:
                    token_data = json.load(f)
                
                if token_data and isinstance(token_data, list) and len(token_data) > 0:
                    latest_token = token_data[-1]
                    access_token = latest_token.get("access_token")
                    expiry_time = int(latest_token.get("expiry_time", 0))
                    
                    # Check if token is still valid
                    current_time = int(datetime.now().timestamp())
                    if access_token and current_time < expiry_time - 300:  # 5 minute buffer
                        logger.info("Retrieved valid access token from token store")
                        return access_token
                    else:
                        logger.info("Access token expired, refreshing...")
                
        except Exception as e:
            logger.warning(f"Failed to read token store: {e}")
        
        # Fallback to manual token refresh
        return await _manual_token_refresh()
        
    except Exception as e:
        logger.error(f"Error getting valid access token: {e}")
        return None

async def _manual_token_refresh() -> Optional[str]:
    """Manual token refresh as fallback"""
    try:
        refresh_token = settings.ZOHO_REFRESH_TOKEN
        if not refresh_token:
            logger.error("No refresh token available for manual refresh")
            return None
            
        token_url = f"{settings.ZOHO_ACCOUNTS_URL}/oauth/v2/token"
        
        data = {
            "client_id": settings.ZOHO_CLIENT_ID,
            "client_secret": settings.ZOHO_CLIENT_SECRET,
            "refresh_token": refresh_token,
            "grant_type": "refresh_token"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                token_url,
                data=data,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            
            if response.status_code == 200:
                token_data = response.json()
                new_access_token = token_data.get("access_token")
                
                # Update production secrets if needed
                if settings.ENVIRONMENT == "production" and new_access_token:
                    try:
                        await secrets_manager.update_zoho_tokens(
                            access_token=new_access_token,
                            refresh_token=refresh_token
                        )
                    except Exception as e:
                        logger.warning(f"Failed to update tokens in secrets manager: {e}")
                
                logger.info("Access token refreshed manually")
                return new_access_token
            else:
                logger.error(f"Manual token refresh failed: {response.status_code} - {response.text}")
                return None
    
    except Exception as e:
        logger.error(f"Manual token refresh error: {e}")
        return None

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

@router.get("/zoho/auth/callback")
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
    """Get current OAuth connection status with SDK integration"""
    try:
        # Check if we have OAuth tokens configured
        if not settings.ZOHO_REFRESH_TOKEN or not settings.ZOHO_CLIENT_ID:
            return {
                "connected": False,
                "error": "No Zoho credentials configured",
                "status": "not_configured",
                "sdk_available": SDK_AVAILABLE
            }
        
        # Check SDK status
        sdk_manager = get_sdk_manager()
        sdk_status = sdk_manager.validate_initialization()
        
        # Try to get a valid access token
        try:
            access_token = await _get_valid_access_token()
            if not access_token:
                return {
                    "connected": False,
                    "error": "Failed to obtain valid access token",
                    "status": "authentication_failed",
                    "sdk_status": sdk_status
                }
        except Exception as e:
            logger.error(f"Token validation failed: {e}")
            return {
                "connected": False,
                "error": f"Token validation failed: {str(e)}",
                "status": "token_error",
                "sdk_status": sdk_status
            }
        
        # Get real user information from Zoho
        try:
            user_info = await oauth_manager.get_user_info(access_token)
            
            # Transform user data to our expected format
            user_data = {
                "id": user_info.get("id", "unknown"),
                "name": user_info.get("full_name") or user_info.get("name", "Unknown User"),
                "first_name": user_info.get("first_name", ""),
                "last_name": user_info.get("last_name", ""),
                "email": user_info.get("email", ""),
                "display_name": user_info.get("display_name") or user_info.get("full_name") or user_info.get("name", ""),
                "full_name": user_info.get("full_name") or user_info.get("name", ""),
                "role": user_info.get("role", {}).get("name", "User") if user_info.get("role") else "User",
                "profile": user_info.get("profile", {}),
                "timezone": user_info.get("time_zone", ""),
                "locale": user_info.get("locale", "")
            }
            
            return {
                "connected": True,
                "user": user_data,
                "connection_time": datetime.now().isoformat(),
                "status": "authenticated",
                "token_valid": True,
                "sdk_status": sdk_status,
                "sdk_available": SDK_AVAILABLE
            }
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to fetch user info: {e}")
            return {
                "connected": False,
                "error": f"Failed to fetch user info: {str(e)}",
                "status": "user_fetch_failed",
                "sdk_status": sdk_status
            }
            
    except Exception as e:
        logger.error(f"Status check failed: {e}")
        return {
            "connected": False,
            "error": f"Status check failed: {str(e)}",
            "status": "error",
            "sdk_available": SDK_AVAILABLE
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

@router.post("/zoho/webhooks/setup")
async def setup_zoho_webhooks() -> Dict[str, Any]:
    """Configure Zoho CRM webhooks for real-time updates"""
    try:
        from app.services.enhanced_zoho_service import EnhancedZohoService
        
        zoho_service = EnhancedZohoService()
        result = await zoho_service.setup_webhooks()
        
        if result.get("success"):
            return {
                "success": True,
                "message": f"Webhooks configured: {result.get('webhooks_configured')}/{result.get('total_events')}",
                "details": result
            }
        else:
            return {
                "success": False,
                "message": f"Webhook setup failed: {result.get('error')}",
                "details": result
            }
            
    except Exception as e:
        logger.error(f"Webhook setup failed: {e}")
        raise HTTPException(status_code=500, detail=f"Webhook setup failed: {str(e)}")

@router.get("/zoho/webhooks/list")
async def list_zoho_webhooks() -> Dict[str, Any]:
    """List existing Zoho CRM webhook configurations"""
    try:
        from app.services.enhanced_zoho_service import EnhancedZohoService
        
        zoho_service = EnhancedZohoService()
        result = await zoho_service.list_webhooks()
        
        return result
        
    except Exception as e:
        logger.error(f"Failed to list webhooks: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to list webhooks: {str(e)}")

@router.delete("/zoho/webhooks/{webhook_id}")
async def delete_zoho_webhook(webhook_id: str) -> Dict[str, Any]:
    """Delete a specific Zoho CRM webhook"""
    try:
        from app.services.enhanced_zoho_service import EnhancedZohoService
        
        zoho_service = EnhancedZohoService()
        success = await zoho_service.delete_webhook(webhook_id)
        
        if success:
            return {
                "success": True,
                "message": f"Webhook {webhook_id} deleted successfully"
            }
        else:
            return {
                "success": False,
                "message": f"Failed to delete webhook {webhook_id}"
            }
            
    except Exception as e:
        logger.error(f"Failed to delete webhook: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete webhook: {str(e)}")

@router.get("/zoho/test-sdk")
async def test_sdk_integration() -> Dict[str, Any]:
    """Test SDK integration and authentication"""
    try:
        # Test SDK manager
        sdk_manager = get_sdk_manager()
        sdk_status = sdk_manager.validate_initialization()
        
        # Test authentication
        access_token = await _get_valid_access_token()
        
        # Test basic API call if authentication works
        api_test_result = None
        if access_token:
            try:
                from app.services.async_zoho_wrapper import AsyncZohoWrapper
                async with AsyncZohoWrapper() as wrapper:
                    # Try to get organization info as a simple test
                    result = await wrapper.get_records("Deals", page=1, per_page=1)
                    api_test_result = {
                        "status": result.get("status"),
                        "message": "API call successful" if result.get("status") == "success" else f"API call failed: {result.get('message')}"
                    }
            except Exception as e:
                api_test_result = {
                    "status": "error",
                    "message": f"API test failed: {str(e)}"
                }
        
        return {
            "status": "success",
            "sdk_available": SDK_AVAILABLE,
            "sdk_status": sdk_status,
            "access_token_available": bool(access_token),
            "api_test": api_test_result,
            "message": "SDK integration test completed"
        }
        
    except Exception as e:
        logger.error(f"SDK test failed: {e}")
        return {
            "status": "error",
            "message": f"SDK test failed: {str(e)}",
            "sdk_available": SDK_AVAILABLE
        }
