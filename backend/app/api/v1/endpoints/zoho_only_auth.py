# backend/app/api/v1/endpoints/zoho_only_auth.py
"""
Zoho-only authentication endpoints.
This module implements authentication exclusively through Zoho OAuth,
eliminating the need for separate user registration or password management.
"""
from typing import Optional
import structlog
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import uuid4
from datetime import datetime

from app.core.database import get_db
from app.core.config import settings
from app.core.zoho_sdk_manager import zoho_sdk_manager
from app.core.zoho_sdk import store_user_token, revoke_user_token, get_user_token_status
from app.core.session import SessionData, get_session_store
from app.models.user import User
from app.models.zoho_oauth_token import ZohoOAuthToken
from app.services.zoho_crm_service import zoho_crm_service
from app.schemas.user_schemas import UserResponse

logger = structlog.get_logger()
router = APIRouter()


@router.get("/login")
async def zoho_login():
    """
    Initiate Zoho OAuth login flow.
    This is the primary login method for Pipeline Pulse.
    """
    try:
        logger.info("Initiating Zoho OAuth login")
        
        # Build Zoho OAuth authorization URL
        # Map region to proper domain
        region_domain_map = {
            'US': 'zoho.com',
            'EU': 'zoho.eu',
            'IN': 'zoho.in',
            'AU': 'zoho.com.au',
            'CN': 'zoho.com.cn',
        }
        domain = region_domain_map.get(settings.zoho_region, 'zoho.in')
        base_url = f"https://accounts.{domain}/oauth/v2/auth"
        params = {
            "scope": "ZohoCRM.modules.ALL,ZohoCRM.settings.ALL,ZohoCRM.users.ALL,ZohoCRM.org.ALL,ZohoCRM.bulk.ALL",
            "client_id": settings.zoho_client_id,
            "response_type": "code",
            "access_type": "offline",
            "redirect_uri": settings.zoho_redirect_uri,
            "state": "zoho_login",  # Identify this as a login flow
            "prompt": "consent"  # Always show consent to ensure we get refresh token
        }
        
        # Build query string
        from urllib.parse import urlencode
        query_string = urlencode(params)
        authorization_url = f"{base_url}?{query_string}"
        
        logger.info("Redirecting to Zoho authorization URL")
        
        return RedirectResponse(
            url=authorization_url,
            status_code=status.HTTP_302_FOUND
        )
        
    except Exception as e:
        logger.error("Failed to initiate Zoho login", error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to initiate login"
        )


@router.get("/callback")
async def zoho_login_callback(
    request: Request,
    response: Response,
    code: Optional[str] = None,
    state: Optional[str] = None,
    error: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Handle OAuth callback from Zoho for login flow.
    This creates or updates the user account and establishes a session.
    """
    try:
        logger.info("Received Zoho OAuth callback for login", 
                   has_code=bool(code),
                   state=state,
                   error=error)
        
        # Handle OAuth errors
        if error:
            logger.error("Zoho OAuth error", error=error)
            return RedirectResponse(
                url=f"{settings.frontend_url}/login?error=oauth_failed&message={error}",
                status_code=status.HTTP_302_FOUND
            )
        
        # Validate required parameters
        if not code:
            logger.error("Missing authorization code")
            return RedirectResponse(
                url=f"{settings.frontend_url}/login?error=invalid_response",
                status_code=status.HTTP_302_FOUND
            )
        
        # Step 1: Exchange grant token for access/refresh tokens
        logger.info("Exchanging grant token for tokens")
        
        # Create a temporary identifier for token storage
        temp_user_id = f"temp_login_{uuid4()}"
        
        # Store the token using the SDK
        token_stored = await store_user_token(temp_user_id, code)
        
        if not token_stored:
            logger.error("Failed to exchange grant token")
            return RedirectResponse(
                url=f"{settings.frontend_url}/login?error=token_exchange_failed",
                status_code=status.HTTP_302_FOUND
            )
        
        # Step 2: Get user information from Zoho
        logger.info("Fetching user information from Zoho")
        zoho_user_info = await zoho_crm_service.get_current_zoho_user(temp_user_id)
        
        if not zoho_user_info:
            logger.error("Failed to get user information from Zoho")
            # Clean up temp token
            await revoke_user_token(temp_user_id)
            return RedirectResponse(
                url=f"{settings.frontend_url}/login?error=user_info_failed",
                status_code=status.HTTP_302_FOUND
            )
        
        # Extract user information
        user_email = zoho_user_info.get("email")
        first_name = zoho_user_info.get("first_name", "")
        last_name = zoho_user_info.get("last_name", "")
        zoho_user_id = zoho_user_info.get("id")
        
        if not user_email:
            logger.error("No email in Zoho user data")
            await revoke_user_token(temp_user_id)
            return RedirectResponse(
                url=f"{settings.frontend_url}/login?error=no_email",
                status_code=status.HTTP_302_FOUND
            )
        
        logger.info("Retrieved Zoho user info", 
                   email=user_email, 
                   name=f"{first_name} {last_name}",
                   zoho_id=zoho_user_id)
        
        # Step 3: Find or create user account
        query = select(User).where(User.email == user_email)
        result = await db.execute(query)
        user = result.scalar_one_or_none()
        
        if not user:
            # Create new user account
            logger.info("Creating new user account", email=user_email)
            
            # For Zoho-only auth, we don't need a password
            from app.core.security import get_password_hash
            import secrets
            
            user = User(
                email=user_email,
                hashed_password=get_password_hash(secrets.token_urlsafe(32)),  # Random, unused password
                first_name=first_name,
                last_name=last_name,
                zoho_user_id=zoho_user_id,
                is_active=True,
                role="user"  # Default role, can be updated based on Zoho role
            )
            
            db.add(user)
            await db.commit()
            await db.refresh(user)
            
            logger.info("Created new user", user_id=user.id, email=user_email)
        else:
            # Update existing user's Zoho ID if needed
            if not user.zoho_user_id:
                user.zoho_user_id = zoho_user_id
                await db.commit()
            
            logger.info("Found existing user", user_id=user.id, email=user_email)
        
        # Step 4: Transfer OAuth token from temp storage to user's email
        logger.info("Transferring OAuth token to user", from_id=temp_user_id, to_email=user_email)
        
        # Get the temp token
        temp_token_query = select(ZohoOAuthToken).where(ZohoOAuthToken.user_email == temp_user_id)
        temp_token_result = await db.execute(temp_token_query)
        temp_token = temp_token_result.scalar_one_or_none()
        
        if temp_token:
            # Check if user already has a token
            user_token_query = select(ZohoOAuthToken).where(ZohoOAuthToken.user_email == user_email)
            user_token_result = await db.execute(user_token_query)
            user_token = user_token_result.scalar_one_or_none()
            
            if user_token:
                # Update existing token
                user_token.client_id = temp_token.client_id
                user_token.client_secret = temp_token.client_secret
                user_token.refresh_token = temp_token.refresh_token
                user_token.access_token = temp_token.access_token
                user_token.grant_token = temp_token.grant_token
                user_token.expiry_time = temp_token.expiry_time
                user_token.redirect_url = temp_token.redirect_url
                user_token.api_domain = temp_token.api_domain
            else:
                # Create new token for user
                user_token = ZohoOAuthToken(
                    user_email=user_email,
                    client_id=temp_token.client_id,
                    client_secret=temp_token.client_secret,
                    refresh_token=temp_token.refresh_token,
                    access_token=temp_token.access_token,
                    grant_token=temp_token.grant_token,
                    expiry_time=temp_token.expiry_time,
                    redirect_url=temp_token.redirect_url,
                    api_domain=temp_token.api_domain
                )
                db.add(user_token)
            
            # Delete temp token
            await db.delete(temp_token)
            await db.commit()
            
            logger.info("Token transferred successfully")
        
        # Step 5: Update last login
        user.last_login = datetime.utcnow()
        await db.commit()
        
        # Step 6: Create session
        session_data = SessionData(
            user_id=str(user.id),
            username=user.email,
            email=user.email,
            is_superuser=user.is_superuser,
            created_at=datetime.utcnow()
        )
        
        session_id = str(uuid4())
        session_store = get_session_store()
        
        logger.info("Creating session", session_id=session_id, user_id=user.id)
        await session_store.save(session_id, session_data, db)
        await db.commit()
        
        # Step 7: Set session cookie and redirect
        response = RedirectResponse(
            url=f"{settings.frontend_url}/",
            status_code=status.HTTP_302_FOUND
        )
        
        response.set_cookie(
            key="session",
            value=session_id,
            httponly=True,
            samesite='lax',
            max_age=28800,  # 8 hours
            path="/"
        )
        
        logger.info("Login successful", user_id=user.id, email=user_email)
        
        return response
        
    except Exception as e:
        logger.error("Error in Zoho login callback", error=str(e), exc_info=True)
        return RedirectResponse(
            url=f"{settings.frontend_url}/login?error=login_failed",
            status_code=status.HTTP_302_FOUND
        )


@router.post("/logout")
async def logout(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """
    Logout user by clearing session.
    Note: This doesn't revoke Zoho OAuth tokens, allowing quick re-login.
    """
    try:
        from app.core.session import get_session_cookie
        
        session_cookie = get_session_cookie()
        session_id = session_cookie.extract_from_request(request)
        
        if session_id:
            session_store = get_session_store()
            await session_store.delete(session_id)
            
            # Clear cookie
            response.delete_cookie(
                key="session",
                path="/"
            )
            
            logger.info("User logged out", session_id=session_id)
        
        return {"message": "Logged out successfully"}
        
    except Exception as e:
        logger.error("Logout failed", error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Logout failed"
        )


@router.post("/revoke")
async def revoke_zoho_access(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """
    Revoke Zoho OAuth tokens and logout user.
    This completely disconnects the user from Zoho CRM.
    """
    try:
        from app.core.session import get_session_cookie, get_session_store
        from .auth import get_current_user
        
        # Get current user
        user = await get_current_user(request=request, db=db)
        
        if user:
            # Revoke Zoho tokens
            await revoke_user_token(user.email)
            logger.info("Revoked Zoho tokens", user_id=user.id, email=user.email)
        
        # Clear session
        session_cookie = get_session_cookie()
        session_id = session_cookie.extract_from_request(request)
        
        if session_id:
            session_store = get_session_store()
            await session_store.delete(session_id)
            
            # Clear cookie
            response.delete_cookie(
                key="session",
                path="/"
            )
        
        return {"message": "Zoho access revoked and logged out successfully"}
        
    except Exception as e:
        logger.error("Failed to revoke Zoho access", error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to revoke access"
        )


@router.get("/status")
async def get_auth_status(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Get current authentication status.
    Returns user info if authenticated, otherwise returns not authenticated.
    """
    try:
        from app.core.session import get_session_cookie, get_session_store
        
        session_cookie = get_session_cookie()
        session_id = session_cookie.extract_from_request(request)
        
        if not session_id:
            return {
                "authenticated": False,
                "user": None,
                "zoho_connected": False
            }
        
        session_store = get_session_store()
        session_data = await session_store.read(session_id)
        
        if not session_data:
            return {
                "authenticated": False,
                "user": None,
                "zoho_connected": False
            }
        
        # Get user
        query = select(User).where(User.id == int(session_data.user_id))
        result = await db.execute(query)
        user = result.scalar_one_or_none()
        
        if not user or not user.is_active:
            return {
                "authenticated": False,
                "user": None,
                "zoho_connected": False
            }
        
        # Check Zoho connection status
        token_status = await get_user_token_status(user.email)
        zoho_connected = token_status and token_status.get("has_token", False)
        
        return {
            "authenticated": True,
            "user": UserResponse.from_orm(user),
            "zoho_connected": zoho_connected,
            "token_status": token_status
        }
        
    except Exception as e:
        logger.error("Failed to get auth status", error=str(e), exc_info=True)
        return {
            "authenticated": False,
            "user": None,
            "zoho_connected": False,
            "error": "Failed to check authentication status"
        }