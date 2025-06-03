"""
SAML Authentication Routes for Pipeline Pulse
Handles SAML SSO flow with Zoho Directory
"""

import os
import logging
from typing import Optional
from urllib.parse import urlencode, urlparse
from datetime import datetime, timedelta

from fastapi import APIRouter, Request, Response, HTTPException, Depends
from fastapi.responses import RedirectResponse, HTMLResponse
from sqlalchemy.orm import Session

# Note: These imports will be available once pysaml2 is properly installed
# For now, we'll create placeholder functions
try:
    from saml2 import BINDING_HTTP_POST, BINDING_HTTP_REDIRECT
    from saml2.client import Saml2Client
    from saml2.config import Config as Saml2Config
    from saml2.response import StatusError
    SAML_AVAILABLE = True
except ImportError:
    SAML_AVAILABLE = False
    print("Warning: pysaml2 not available. SAML routes will return errors.")

from app.auth.saml_config import get_saml_settings, get_attribute_mapping
from app.core.database import get_db
from app.models.user import User
from app.auth.jwt_handler import create_saml_token
from app.auth.saml_auth import saml_auth_service

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth/saml", tags=["SAML Authentication"])


def get_saml_client() -> Optional[object]:
    """Initialize SAML client with configuration"""
    if not SAML_AVAILABLE:
        return None
    
    try:
        settings = get_saml_settings()
        config = Saml2Config()
        config.load(settings)
        return Saml2Client(config=config)
    except Exception as e:
        logger.error(f"Failed to initialize SAML client: {e}")
        return None


@router.get("/login")
async def saml_login(relay_state: Optional[str] = None):
    """Initiate SAML login flow - redirect to Zoho Directory SAML"""
    try:
        # Generate SAML request
        saml_data = saml_auth_service.generate_saml_request(relay_state)

        # Construct the SAML request URL
        # For Zoho Directory, we need to send the SAML request as a GET parameter
        from urllib.parse import urlencode

        params = {
            'SAMLRequest': saml_data['saml_request']
        }

        if saml_data.get('relay_state'):
            params['RelayState'] = saml_data['relay_state']

        # Construct the full URL
        auth_url = f"{saml_data['sso_url']}?{urlencode(params)}"

        logger.info(f"Redirecting to SAML IdP: {saml_data['sso_url']}")
        return RedirectResponse(url=auth_url)

    except Exception as e:
        logger.error(f"SAML login error: {e}")
        raise HTTPException(status_code=500, detail=f"SAML login failed: {str(e)}")


@router.post("/acs")
async def saml_acs(request: Request, db: Session = Depends(get_db)):
    """SAML Assertion Consumer Service - handles SAML response"""
    if not SAML_AVAILABLE:
        raise HTTPException(status_code=500, detail="SAML not configured")
    
    client = get_saml_client()
    if not client:
        raise HTTPException(status_code=500, detail="SAML client initialization failed")
    
    try:
        # Get SAML response from form data
        form_data = await request.form()
        saml_response = form_data.get("SAMLResponse")
        relay_state = form_data.get("RelayState", "/dashboard")
        
        if not saml_response:
            raise HTTPException(status_code=400, detail="No SAML response received")
        
        # Parse SAML response
        authn_response = client.parse_authn_request_response(
            saml_response, BINDING_HTTP_POST
        )
        
        # Extract user information from SAML attributes
        user_info = extract_user_info(authn_response)
        
        # Create or update user in database
        user = await create_or_update_user(db, user_info)
        
        # Generate JWT token using existing auth service
        access_token = saml_auth_service._generate_jwt_token_from_payload({
            "email": user.email,
            "first_name": user.first_name or "",
            "last_name": user.last_name or "",
            "department": user.department or "",
            "auth_provider": "saml",
            "exp": datetime.utcnow() + timedelta(hours=24),
            "iat": datetime.utcnow(),
            "iss": "pipeline-pulse"
        })
        
        # Redirect to frontend with token
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        redirect_url = f"{frontend_url}{relay_state}?token={access_token}"
        
        logger.info(f"SAML authentication successful for user: {user.email}")
        return RedirectResponse(url=redirect_url)
        
    except StatusError as e:
        logger.error(f"SAML status error: {e}")
        raise HTTPException(status_code=400, detail=f"SAML authentication failed: {str(e)}")
    except Exception as e:
        logger.error(f"SAML ACS error: {e}")
        raise HTTPException(status_code=500, detail=f"Authentication processing failed: {str(e)}")


@router.get("/logout")
async def saml_logout(request: Request):
    """Initiate SAML logout flow"""
    if not SAML_AVAILABLE:
        # Simple logout for non-SAML environments
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        return RedirectResponse(url=f"{frontend_url}/login")
    
    client = get_saml_client()
    if not client:
        raise HTTPException(status_code=500, detail="SAML client initialization failed")
    
    try:
        # Generate SAML logout request
        reqid, info = client.global_logout()
        
        # Get the redirect URL
        redirect_url = None
        for key, value in info['headers']:
            if key == 'Location':
                redirect_url = value
                break
        
        if not redirect_url:
            # Fallback to simple logout
            frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
            redirect_url = f"{frontend_url}/login"
        
        logger.info(f"SAML logout initiated")
        return RedirectResponse(url=redirect_url)
        
    except Exception as e:
        logger.error(f"SAML logout error: {e}")
        # Fallback to simple logout
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        return RedirectResponse(url=f"{frontend_url}/login")


@router.get("/metadata")
async def saml_metadata():
    """Return SAML metadata for this service provider"""
    if not SAML_AVAILABLE:
        raise HTTPException(status_code=500, detail="SAML not configured")
    
    client = get_saml_client()
    if not client:
        raise HTTPException(status_code=500, detail="SAML client initialization failed")
    
    try:
        metadata = client.config.getattr("metadata", "sp")
        return Response(content=metadata, media_type="application/xml")
    except Exception as e:
        logger.error(f"SAML metadata error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate metadata: {str(e)}")


def extract_user_info(authn_response) -> dict:
    """Extract user information from SAML response"""
    if not SAML_AVAILABLE:
        return {}
    
    try:
        # Get user identity
        identity = authn_response.get_identity()
        subject = authn_response.get_subject()
        
        # Get attribute mapping
        attr_map = get_attribute_mapping()
        
        # Extract user information
        user_info = {
            "email": subject.text if subject else None,
            "auth_provider": "saml",
        }
        
        # Map SAML attributes to user fields
        for field, saml_attr in attr_map.items():
            if saml_attr in identity:
                values = identity[saml_attr]
                if values and len(values) > 0:
                    user_info[field] = values[0]
        
        # Ensure email is set
        if not user_info.get("email") and "email" in identity:
            email_values = identity["email"]
            if email_values:
                user_info["email"] = email_values[0]
        
        return user_info
        
    except Exception as e:
        logger.error(f"Error extracting user info from SAML response: {e}")
        raise


async def create_or_update_user(db: Session, user_info: dict) -> User:
    """Create or update user based on SAML information"""
    email = user_info.get("email")
    if not email:
        raise ValueError("Email is required for user creation")
    
    # Check if user exists
    user = db.query(User).filter(User.email == email).first()
    
    if user:
        # Update existing user
        user.first_name = user_info.get("first_name", user.first_name)
        user.last_name = user_info.get("last_name", user.last_name)
        user.department = user_info.get("department", user.department)
        user.auth_provider = "saml"
        logger.info(f"Updated existing user: {email}")
    else:
        # Create new user
        user = User(
            email=email,
            first_name=user_info.get("first_name", ""),
            last_name=user_info.get("last_name", ""),
            department=user_info.get("department"),
            auth_provider="saml",
            is_active=True
        )
        db.add(user)
        logger.info(f"Created new user: {email}")
    
    db.commit()
    db.refresh(user)
    return user
