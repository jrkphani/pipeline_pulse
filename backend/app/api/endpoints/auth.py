"""
Authentication API endpoints for SAML SSO
"""

from fastapi import APIRouter, Request, Form, HTTPException, Depends, Response
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import logging

from app.auth.saml_auth import saml_auth_service, SAMLUser
from app.services.permission_service import permission_manager
from app.services.zoho_service import ZohoService
from app.core.database import get_db
from sqlalchemy.orm import Session
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer()


class LoginRequest(BaseModel):
    """Login request model"""
    relay_state: Optional[str] = None


class TokenResponse(BaseModel):
    """Token response model"""
    access_token: str
    token_type: str
    user: Dict[str, Any]


@router.get("/saml/login")
async def saml_login(request: Request, relay_state: Optional[str] = None):
    """
    Initiate SAML SSO login with Zoho Directory
    """
    try:
        # Generate SAML authentication request
        saml_data = saml_auth_service.generate_saml_request(relay_state)
        
        # Create HTML form for auto-submission to IdP
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Redirecting to Zoho Directory...</title>
            <style>
                body {{ 
                    font-family: Arial, sans-serif; 
                    display: flex; 
                    justify-content: center; 
                    align-items: center; 
                    height: 100vh; 
                    margin: 0;
                    background-color: #f5f5f5;
                }}
                .container {{ 
                    text-align: center; 
                    background: white; 
                    padding: 2rem; 
                    border-radius: 8px; 
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }}
                .spinner {{ 
                    border: 4px solid #f3f3f3; 
                    border-top: 4px solid #3498db; 
                    border-radius: 50%; 
                    width: 40px; 
                    height: 40px; 
                    animation: spin 2s linear infinite; 
                    margin: 0 auto 1rem;
                }}
                @keyframes spin {{ 0% {{ transform: rotate(0deg); }} 100% {{ transform: rotate(360deg); }} }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="spinner"></div>
                <h2>Redirecting to Zoho Directory...</h2>
                <p>Please wait while we redirect you to the login page.</p>
                <form id="samlForm" method="POST" action="{saml_data['sso_url']}">
                    <input type="hidden" name="SAMLRequest" value="{saml_data['saml_request']}" />
                    <input type="hidden" name="RelayState" value="{saml_data['relay_state']}" />
                    <noscript>
                        <input type="submit" value="Continue to Zoho Directory" />
                    </noscript>
                </form>
            </div>
            <script>
                // Auto-submit the form
                document.getElementById('samlForm').submit();
            </script>
        </body>
        </html>
        """
        
        return HTMLResponse(content=html_content)
        
    except Exception as e:
        logger.error(f"SAML login error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to initiate SAML login")


@router.post("/saml/acs")
async def saml_acs(
    request: Request,
    SAMLResponse: str = Form(...),
    RelayState: Optional[str] = Form(None)
):
    """
    SAML Assertion Consumer Service (ACS) endpoint
    Processes SAML response from Zoho Directory
    """
    try:
        # Process the SAML response
        auth_result = saml_auth_service.process_saml_response(SAMLResponse, RelayState)
        
        if auth_result["success"]:
            # Create success page with token and redirect
            user = auth_result["user"]
            token = auth_result["token"]
            redirect_url = auth_result["redirect_url"]
            
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <title>Login Successful</title>
                <style>
                    body {{ 
                        font-family: Arial, sans-serif; 
                        display: flex; 
                        justify-content: center; 
                        align-items: center; 
                        height: 100vh; 
                        margin: 0;
                        background-color: #f5f5f5;
                    }}
                    .container {{ 
                        text-align: center; 
                        background: white; 
                        padding: 2rem; 
                        border-radius: 8px; 
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                        max-width: 400px;
                    }}
                    .success {{ color: #27ae60; }}
                    .user-info {{ 
                        background: #f8f9fa; 
                        padding: 1rem; 
                        border-radius: 4px; 
                        margin: 1rem 0; 
                        text-align: left;
                    }}
                </style>
            </head>
            <body>
                <div class="container">
                    <h2 class="success">✅ Login Successful!</h2>
                    <div class="user-info">
                        <strong>Welcome, {user.get('display_name', user.get('email', 'User'))}!</strong><br>
                        <small>Email: {user.get('email', 'N/A')}</small>
                    </div>
                    <p>Redirecting to Pipeline Pulse...</p>
                </div>
                <script>
                    // Store token in localStorage
                    localStorage.setItem('auth_token', '{token}');
                    localStorage.setItem('user_info', JSON.stringify({user}));
                    
                    // Redirect to the application
                    setTimeout(() => {{
                        window.location.href = '{redirect_url}';
                    }}, 2000);
                </script>
            </body>
            </html>
            """
            
            return HTMLResponse(content=html_content)
        else:
            raise HTTPException(status_code=400, detail="SAML authentication failed")
            
    except Exception as e:
        logger.error(f"SAML ACS error: {str(e)}")
        # Return error page
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Login Failed</title>
            <style>
                body {{ 
                    font-family: Arial, sans-serif; 
                    display: flex; 
                    justify-content: center; 
                    align-items: center; 
                    height: 100vh; 
                    margin: 0;
                    background-color: #f5f5f5;
                }}
                .container {{ 
                    text-align: center; 
                    background: white; 
                    padding: 2rem; 
                    border-radius: 8px; 
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    max-width: 400px;
                }}
                .error {{ color: #e74c3c; }}
            </style>
        </head>
        <body>
            <div class="container">
                <h2 class="error">❌ Login Failed</h2>
                <p>There was an error processing your login. Please try again.</p>
                <p><small>Error: {str(e)}</small></p>
                <a href="/auth/saml/login">Try Again</a>
            </div>
        </body>
        </html>
        """
        return HTMLResponse(content=html_content, status_code=400)


@router.get("/saml/logout")
async def saml_logout(request: Request):
    """
    Initiate SAML logout
    """
    try:
        # Get user email from token (if available)
        auth_header = request.headers.get("Authorization")
        user_email = "user@example.com"  # Default fallback
        
        if auth_header and auth_header.startswith("Bearer "):
            try:
                token = auth_header.split(" ")[1]
                user_data = saml_auth_service.verify_jwt_token(token)
                user_email = user_data.get("email", user_email)
            except:
                pass  # Use default email
        
        # Generate SAML logout request
        logout_data = saml_auth_service.generate_logout_request(user_email)
        
        # Create HTML form for auto-submission to IdP
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Logging out...</title>
            <style>
                body {{ 
                    font-family: Arial, sans-serif; 
                    display: flex; 
                    justify-content: center; 
                    align-items: center; 
                    height: 100vh; 
                    margin: 0;
                    background-color: #f5f5f5;
                }}
                .container {{ 
                    text-align: center; 
                    background: white; 
                    padding: 2rem; 
                    border-radius: 8px; 
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <h2>Logging out...</h2>
                <p>Please wait while we log you out.</p>
                <form id="logoutForm" method="POST" action="{logout_data['sls_url']}">
                    <input type="hidden" name="SAMLRequest" value="{logout_data['saml_request']}" />
                    <noscript>
                        <input type="submit" value="Continue Logout" />
                    </noscript>
                </form>
            </div>
            <script>
                // Clear local storage
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user_info');
                
                // Auto-submit the form
                document.getElementById('logoutForm').submit();
            </script>
        </body>
        </html>
        """
        
        return HTMLResponse(content=html_content)
        
    except Exception as e:
        logger.error(f"SAML logout error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to initiate SAML logout")


@router.post("/verify-token")
async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Verify JWT token and return user information
    """
    try:
        user_data = saml_auth_service.verify_jwt_token(credentials.credentials)
        return {
            "valid": True,
            "user": user_data
        }
    except HTTPException as e:
        return {
            "valid": False,
            "error": e.detail
        }


@router.get("/user")
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Get current authenticated user information
    """
    user_data = saml_auth_service.verify_jwt_token(credentials.credentials)
    return user_data


@router.post("/logout")
async def logout():
    """
    Local logout (clears session)
    """
    return {
        "success": True,
        "message": "Logged out successfully",
        "redirect_url": "/auth/saml/logout"
    }


@router.post("/zoho/oauth-callback")
async def zoho_oauth_callback(
    code: str,
    db: Session = Depends(get_db)
):
    """
    Handle Zoho OAuth callback and fetch user permissions
    """
    try:
        zoho_service = ZohoService()

        # Exchange code for tokens
        token_data = await zoho_service.exchange_code_for_tokens(
            code,
            zoho_service.client_id,
            zoho_service.client_secret
        )

        access_token = token_data.get("access_token")
        if not access_token:
            raise HTTPException(status_code=400, detail="No access token received")

        # Get complete user info with permissions
        user_info = await zoho_service.get_complete_user_info(access_token)
        profile = user_info.get('profile', {})

        # Update user cache with fresh permissions
        await permission_manager.update_user_cache(
            profile.get('id'),
            user_info,
            db
        )

        # Generate JWT token
        jwt_payload = {
            "zoho_user_id": profile.get('id'),
            "email": profile.get('email'),
            "first_name": profile.get('first_name', ''),
            "last_name": profile.get('last_name', ''),
            "display_name": profile.get('full_name', ''),
            "permissions": user_info.get('permissions', {}),
            "territories": user_info.get('territories', []),
            "exp": datetime.utcnow() + timedelta(hours=24),
            "iat": datetime.utcnow(),
            "iss": "pipeline-pulse"
        }

        token = saml_auth_service._generate_jwt_token_from_payload(jwt_payload)

        return {
            "success": True,
            "user": {
                "zoho_user_id": profile.get('id'),
                "email": profile.get('email'),
                "first_name": profile.get('first_name', ''),
                "last_name": profile.get('last_name', ''),
                "display_name": profile.get('full_name', ''),
                "territories": user_info.get('territories', []),
                "permissions": user_info.get('permissions', {})
            },
            "token": token,
            "redirect_url": "/dashboard"
        }

    except Exception as e:
        logger.error(f"Zoho OAuth callback error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"OAuth callback failed: {str(e)}")


@router.get("/permissions")
async def get_user_permissions(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """
    Get current user's permissions from cache or Zoho
    """
    try:
        # Verify JWT token
        user_data = saml_auth_service.verify_jwt_token(credentials.credentials)
        zoho_user_id = user_data.get("zoho_user_id")

        if not zoho_user_id:
            raise HTTPException(status_code=401, detail="Invalid token - no Zoho user ID")

        # Get fresh permissions (will use cache if valid)
        zoho_service = ZohoService()
        access_token = await zoho_service.get_access_token()

        permissions = await permission_manager.get_user_permissions(
            zoho_user_id,
            access_token,
            db
        )

        return {
            "success": True,
            "permissions": permissions
        }

    except Exception as e:
        logger.error(f"Error getting permissions: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get permissions")


@router.post("/refresh-permissions")
async def refresh_user_permissions(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """
    Force refresh user permissions from Zoho
    """
    try:
        # Verify JWT token
        user_data = saml_auth_service.verify_jwt_token(credentials.credentials)
        zoho_user_id = user_data.get("zoho_user_id")

        if not zoho_user_id:
            raise HTTPException(status_code=401, detail="Invalid token - no Zoho user ID")

        # Force fresh fetch from Zoho
        zoho_service = ZohoService()
        access_token = await zoho_service.get_access_token()

        fresh_permissions = await permission_manager.fetch_fresh_permissions(
            zoho_user_id,
            access_token
        )

        # Update cache
        await permission_manager.update_user_cache(
            zoho_user_id,
            fresh_permissions,
            db
        )

        return {
            "success": True,
            "message": "Permissions refreshed successfully",
            "permissions": fresh_permissions
        }

    except Exception as e:
        logger.error(f"Error refreshing permissions: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to refresh permissions")
