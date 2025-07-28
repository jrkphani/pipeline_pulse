# backend/app/api/v1/endpoints/zoho_auth.py
from typing import Optional
import structlog
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.config import settings
from app.core.zoho_sdk import store_user_token, revoke_user_token, get_user_token_status
from app.core.zoho_sdk_manager import zoho_sdk_manager
from app.models.user import User
from app.services.zoho_crm_service import zoho_crm_service
from .auth import get_current_user
from app.core.session import SessionCookie, get_session_store

# Helper function to get current user optionally
async def get_current_user_optional(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> Optional[User]:
    """Get current user if authenticated, otherwise return None."""
    try:
        session_cookie = SessionCookie()
        session_id = session_cookie.extract_from_request(request)
        
        if not session_id:
            return None
            
        session_store = get_session_store()
        session_data = await session_store.get(session_id, db)
        
        if not session_data:
            return None
            
        user_id = int(session_data.user_id)
        query = select(User).where(User.id == user_id)
        result = await db.execute(query)
        user = result.scalar_one_or_none()
        
        return user if user and user.is_active else None
    except Exception:
        return None

logger = structlog.get_logger()
router = APIRouter()


@router.get("/zoho/connect")
async def initiate_zoho_connection(
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Initiate Zoho CRM OAuth connection. Handles both authenticated and
    unauthenticated users.
    
    This endpoint redirects the user to Zoho's authorization server
    to grant permissions for Pipeline Pulse to access their CRM data.
    """
    try:
        # Use the user's email for the state parameter if they are logged in,
        # otherwise use a placeholder for anonymous users.
        user_email_for_state = current_user.email if current_user else "anonymous"
        
        logger.info("Initiating Zoho connection", user_email=user_email_for_state)
        
        # Build Zoho OAuth authorization URL
        base_url = "https://accounts.zoho.in/oauth/v2/auth"  # Use appropriate region
        params = {
            "scope": "ZohoCRM.modules.ALL,ZohoCRM.settings.ALL,ZohoCRM.users.ALL,ZohoCRM.org.ALL,ZohoCRM.bulk.ALL",
            "client_id": settings.zoho_client_id,
            "response_type": "code",
            "access_type": "offline",
            "redirect_uri": settings.zoho_redirect_uri,
            "state": user_email_for_state,  # Use email as state parameter for security
        }
        
        # Build query string with proper URL encoding
        from urllib.parse import urlencode
        query_string = urlencode(params)
        authorization_url = f"{base_url}?{query_string}"
        
        logger.info("Redirecting to Zoho authorization", 
                   user_email=user_email_for_state, 
                   redirect_url=authorization_url)
        
        # Return a proper HTTP redirect response
        return RedirectResponse(
            url=authorization_url,
            status_code=status.HTTP_302_FOUND
        )
        
    except Exception as e:
        logger.error("Failed to initiate Zoho connection", 
                    error=str(e), 
                    exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to initiate Zoho connection"
        )


@router.get("/zoho/callback")
async def zoho_oauth_callback(
    request: Request,
    code: Optional[str] = None,
    state: Optional[str] = None,
    error: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Handle the OAuth callback from Zoho CRM.
    
    This endpoint receives the authorization code from Zoho and
    exchanges it for access and refresh tokens.
    """
    try:
        logger.info("Received Zoho OAuth callback", 
                   code=code[:10] + "..." if code else None,
                   state=state,
                   error=error)
        
        # Handle OAuth errors
        if error:
            logger.error("Zoho OAuth error", error=error)
            return RedirectResponse(
                url=f"{settings.frontend_url}/auth/login?error=zoho_oauth_failed&message={error}",
                status_code=status.HTTP_302_FOUND
            )
        
        # Validate required parameters
        if not code or not state:
            logger.error("Missing required OAuth parameters", code=bool(code), state=bool(state))
            return RedirectResponse(
                url=f"{settings.frontend_url}/auth/login?error=invalid_oauth_response&message=Invalid OAuth response from Zoho",
                status_code=status.HTTP_302_FOUND
            )
        
        # Handle the state parameter - could be user email or "anonymous"
        user_email = state
        user = None
        
        if user_email == "anonymous":
            # For anonymous users, we need to get their email from Zoho and create/login the user
            logger.info("Anonymous user completed OAuth, processing with single token exchange")
            
            try:
                # Step 1: Store the user's token using the grant token
                # The SDK will automatically handle token exchange and persistence
                logger.info("Storing user token from grant token")
                
                # Use a temporary user email for the initial token storage
                # Use a valid email format that passes Pydantic validation
                temp_user_email = "temp_oauth_user@example.com"
                token_stored = await store_user_token(temp_user_email, code)
                
                if not token_stored:
                    logger.error("Failed to store OAuth tokens")
                    return RedirectResponse(
                        url=f"{settings.frontend_url}/auth/login?error=token_storage_failed&message=Failed to store OAuth token",
                        status_code=status.HTTP_302_FOUND
                    )
                
                logger.info("Successfully stored OAuth tokens for temp user")
                
                # Step 2: Wait a moment for the token to be properly persisted
                import asyncio
                await asyncio.sleep(0.5)
                
                # Step 3: Try to get user info from Zoho
                logger.info("Getting user info from Zoho CRM")
                try:
                    zoho_user_info = await zoho_crm_service.get_current_zoho_user(temp_user_email)
                except Exception as e:
                    logger.error("Error getting Zoho user info", error=str(e), exc_info=True)
                    # If this fails due to MERGE_OBJECT, we'll need a different approach
                    zoho_user_info = None
                
                if not zoho_user_info:
                    logger.warning("Failed to get user info from Zoho - falling back to profile completion")
                    # Create a temporary session for the user to complete profile
                    from app.core.session import SessionData, get_session_store
                    from uuid import uuid4
                    from datetime import datetime
                    
                    # Create a temporary user record
                    temp_user = User(
                        email=temp_user_email,
                        hashed_password="",  # No password for OAuth users
                        first_name="Temporary",
                        last_name="User",
                        is_active=True,
                        role="user"
                    )
                    db.add(temp_user)
                    await db.commit()
                    await db.refresh(temp_user)
                    
                    # Create session
                    session_data = SessionData(
                        user_id=str(temp_user.id),
                        username=temp_user.email,
                        email=temp_user.email,
                        is_superuser=False,
                        created_at=datetime.utcnow()
                    )
                    
                    session_id = str(uuid4())
                    session_store = get_session_store()
                    await session_store.save(session_id, session_data, db)
                    await db.commit()
                    
                    # Redirect to profile completion with session
                    response = RedirectResponse(
                        url=f"{settings.frontend_url}/auth/complete-profile?oauth_success=true",
                        status_code=status.HTTP_302_FOUND
                    )
                    
                    # Set session cookie
                    response.set_cookie(
                        key="session",
                        value=session_id,
                        httponly=True,
                        samesite='lax',
                        max_age=28800,  # 8 hours
                        path="/"
                    )
                    
                    return response
                
                # Extract user information
                user_email = zoho_user_info.get("email")
                first_name = zoho_user_info.get("first_name", "")
                last_name = zoho_user_info.get("last_name", "")
                
                if not user_email:
                    logger.error("No email found in Zoho user data", user_info=zoho_user_info)
                    return RedirectResponse(
                        url=f"{settings.frontend_url}/auth/login?error=no_email&message=No email found in Zoho account",
                        status_code=status.HTTP_302_FOUND
                    )
                
                logger.info("Got user info from Zoho", email=user_email, name=f"{first_name} {last_name}")
                
                # Step 3: Find or create user in Pipeline Pulse
                query = select(User).where(User.email == user_email)
                result = await db.execute(query)
                user = result.scalar_one_or_none()
                
                if not user:
                    # Create new user account
                    from app.core.security import get_password_hash
                    import secrets
                    
                    # Generate a random password (user will need to reset it if they want to use email/password login)
                    random_password = secrets.token_urlsafe(32)
                    
                    user = User(
                        email=user_email,
                        hashed_password=get_password_hash(random_password),
                        first_name=first_name,
                        last_name=last_name,
                        is_active=True,
                        role="user"  # Default role
                    )
                    
                    db.add(user)
                    await db.commit()
                    await db.refresh(user)
                    
                    logger.info("Created new user account from Zoho OAuth", user_id=user.id, email=user_email)
                else:
                    logger.info("Found existing user account", user_id=user.id, email=user_email)
                
                # Step 4: Transfer the OAuth token from temp user to the real user
                from app.models.zoho_oauth_token import ZohoOAuthToken
                
                # Find the temp token
                temp_token_query = select(ZohoOAuthToken).where(ZohoOAuthToken.user_email == temp_user_email)
                temp_token_result = await db.execute(temp_token_query)
                temp_token = temp_token_result.scalar_one_or_none()
                
                if temp_token:
                    # Create or update token for the real user
                    real_user_token_query = select(ZohoOAuthToken).where(ZohoOAuthToken.user_email == user_email)
                    real_user_token_result = await db.execute(real_user_token_query)
                    real_user_token = real_user_token_result.scalar_one_or_none()
                    
                    if real_user_token:
                        # Update existing token
                        real_user_token.access_token = temp_token.access_token
                        real_user_token.refresh_token = temp_token.refresh_token
                        real_user_token.expiry_time = temp_token.expiry_time
                        real_user_token.client_id = temp_token.client_id
                        real_user_token.client_secret = temp_token.client_secret
                        real_user_token.redirect_url = temp_token.redirect_url
                        real_user_token.api_domain = temp_token.api_domain
                    else:
                        # Create new token
                        real_user_token = ZohoOAuthToken(
                            user_email=user_email,
                            access_token=temp_token.access_token,
                            refresh_token=temp_token.refresh_token,
                            expiry_time=temp_token.expiry_time,
                            client_id=temp_token.client_id,
                            client_secret=temp_token.client_secret,
                            redirect_url=temp_token.redirect_url,
                            api_domain=temp_token.api_domain
                        )
                        db.add(real_user_token)
                    
                    # Delete the temp token
                    await db.delete(temp_token)
                    await db.commit()
                    
                    logger.info("Transferred OAuth token to real user", user_email=user_email)
                    
                    # Register the real user with the SDK manager
                    from app.core.zoho_sdk_manager import zoho_sdk_manager
                    await zoho_sdk_manager.add_user(
                        user_email=user_email,
                        refresh_token=real_user_token.refresh_token,
                        client_id=settings.zoho_client_id,
                        client_secret=settings.zoho_client_secret
                    )
                    
                    # Remove the temp user from SDK manager
                    await zoho_sdk_manager.remove_user(temp_user_email)
                
                # Step 5: Create Pipeline Pulse session for the user
                from app.core.session import SessionData, get_session_store
                from uuid import uuid4
                from datetime import datetime
                
                session_data = SessionData(
                    user_id=str(user.id),
                    username=user.email,
                    email=user.email,
                    is_superuser=user.is_superuser,
                    created_at=datetime.utcnow()
                )
                
                session_id = str(uuid4())
                session_store = get_session_store()
                await session_store.save(session_id, session_data, db)
                await db.commit()
                
                logger.info("Created Pipeline Pulse session for Zoho OAuth user", 
                           session_id=session_id, user_id=user.id)
                
                # Step 6: Redirect to dashboard with session cookie
                response = RedirectResponse(
                    url=f"{settings.frontend_url}/?zoho_connected=true&oauth_success=true",
                    status_code=status.HTTP_302_FOUND
                )
                
                # Set session cookie
                response.set_cookie(
                    key="session",
                    value=session_id,
                    httponly=True,
                    samesite='lax',
                    max_age=28800,  # 8 hours
                    path="/"
                )
                
                return response
                    
            except Exception as e:
                logger.error("Error in anonymous OAuth flow", error=str(e), exc_info=True)
                return RedirectResponse(
                    url=f"{settings.frontend_url}/auth/login?error=oauth_processing_failed&message=OAuth processing failed",
                    status_code=status.HTTP_302_FOUND
                )
        
        # Find existing user by email
        query = select(User).where(User.email == user_email)
        result = await db.execute(query)
        user = result.scalar_one_or_none()
        
        if not user:
            logger.error("User not found for OAuth callback", user_email=user_email)
            return RedirectResponse(
                url=f"{settings.frontend_url}/auth/login?error=user_not_found&message=User account not found",
                status_code=status.HTTP_302_FOUND
            )
        
        # Store the user's OAuth token
        token_stored = await store_user_token(user_email, code)
        
        if token_stored:
            logger.info("Zoho OAuth token stored successfully", user_email=user_email)
            
            # Test the connection
            connection_test = await zoho_crm_service.test_connection_for_user(user_email)
            
            if connection_test.get("status") == "success":
                logger.info("Zoho CRM connection test successful", user_email=user_email)
                return RedirectResponse(
                    url=f"{settings.frontend_url}/?zoho_connected=true&oauth_success=true",
                    status_code=status.HTTP_302_FOUND
                )
            else:
                logger.warning("Zoho CRM connection test failed", 
                              user_email=user_email, 
                              test_result=connection_test)
                return RedirectResponse(
                    url=f"{settings.frontend_url}/?zoho_connected=false&error=connection_test_failed&oauth_success=true",
                    status_code=status.HTTP_302_FOUND
                )
        else:
            logger.error("Failed to store Zoho OAuth token", user_email=user_email)
            return RedirectResponse(
                url=f"{settings.frontend_url}/auth/login?error=token_storage_failed&message=Failed to store OAuth token",
                status_code=status.HTTP_302_FOUND
            )
        
    except Exception as e:
        logger.error("Error handling Zoho OAuth callback", error=str(e), exc_info=True)
        return RedirectResponse(
            url=f"{settings.frontend_url}/auth/login?error=callback_processing_failed&message=OAuth callback processing failed",
            status_code=status.HTTP_302_FOUND
        )


@router.get("/zoho/status")
async def get_zoho_connection_status(
    current_user: User = Depends(get_current_user),
):
    """
    Get the current user's Zoho CRM connection status.
    
    Returns information about whether the user has connected their
    Zoho CRM account and the status of their tokens.
    """
    try:
        logger.info("Getting Zoho connection status", 
                   user_id=current_user.id, 
                   user_email=current_user.email)
        
        # Get token status
        token_status = await get_user_token_status(current_user.email)
        
        if token_status and token_status.get("has_token"):
            # Test the connection
            connection_test = await zoho_crm_service.test_connection_for_user(current_user.email)
            
            return {
                "connected": True,
                "user_email": current_user.email,
                "token_status": token_status,
                "connection_test": connection_test,
                "last_tested": connection_test.get("timestamp")
            }
        else:
            return {
                "connected": False,
                "user_email": current_user.email,
                "token_status": token_status,
                "message": "Zoho CRM account not connected"
            }
        
    except Exception as e:
        logger.error("Error getting Zoho connection status", 
                    user_id=getattr(current_user, 'id', None), 
                    error=str(e), 
                    exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get Zoho connection status"
        )


@router.post("/zoho/disconnect")
async def disconnect_zoho_account(
    current_user: User = Depends(get_current_user),
):
    """
    Disconnect the current user's Zoho CRM account.
    
    This removes the stored OAuth tokens, effectively disconnecting
    Pipeline Pulse from the user's Zoho CRM.
    """
    try:
        logger.info("Disconnecting Zoho account", 
                   user_id=current_user.id, 
                   user_email=current_user.email)
        
        # Revoke the user's token
        token_revoked = await revoke_user_token(current_user.email)
        
        if token_revoked:
            logger.info("Zoho account disconnected successfully", user_email=current_user.email)
            return {
                "success": True,
                "message": "Zoho CRM account disconnected successfully",
                "user_email": current_user.email
            }
        else:
            logger.error("Failed to disconnect Zoho account", user_email=current_user.email)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to disconnect Zoho account"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error disconnecting Zoho account", 
                    user_id=getattr(current_user, 'id', None), 
                    error=str(e), 
                    exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to disconnect Zoho account"
        )


@router.get("/zoho/test-connection")
async def test_zoho_connection(
    current_user: User = Depends(get_current_user),
):
    """
    Test the current user's Zoho CRM connection.
    
    This endpoint attempts to make a simple API call to Zoho CRM
    to verify that the connection is working properly.
    """
    try:
        logger.info("Testing Zoho CRM connection", 
                   user_id=current_user.id, 
                   user_email=current_user.email)
        
        # Test the connection
        connection_test = await zoho_crm_service.test_connection_for_user(current_user.email)
        
        return {
            "user_email": current_user.email,
            "connection_test": connection_test,
            "timestamp": connection_test.get("timestamp")
        }
        
    except Exception as e:
        logger.error("Error testing Zoho connection", 
                    user_id=getattr(current_user, 'id', None), 
                    error=str(e), 
                    exc_info=True)
        
        return {
            "user_email": current_user.email,
            "connection_test": {
                "status": "error",
                "message": f"Connection test failed: {str(e)}"
            }
        }


@router.get("/zoho/data/deals")
async def get_zoho_deals(
    page: int = 1,
    per_page: int = 50,
    current_user: User = Depends(get_current_user),
):
    """
    Get deals from the current user's Zoho CRM.
    
    This is a sample endpoint demonstrating how to fetch data
    from Zoho CRM on behalf of the authenticated user.
    """
    try:
        logger.info("Fetching Zoho deals", 
                   user_id=current_user.id, 
                   user_email=current_user.email,
                   page=page, 
                   per_page=per_page)
        
        # Fetch deals for the current user
        deals_data = await zoho_crm_service.get_deals_for_user(
            user_email=current_user.email,
            page=page,
            per_page=min(per_page, 200),  # Limit to 200 per page
            fields=["id", "Deal_Name", "Amount", "Stage", "Account_Name", "Closing_Date"]
        )
        
        logger.info("Successfully fetched Zoho deals", 
                   user_email=current_user.email,
                   deal_count=len(deals_data.get("data", [])))
        
        return {
            "user_email": current_user.email,
            "deals": deals_data,
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total_records": deals_data.get("info", {}).get("count", 0)
            }
        }
        
    except Exception as e:
        logger.error("Error fetching Zoho deals", 
                    user_id=getattr(current_user, 'id', None), 
                    error=str(e), 
                    exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch deals: {str(e)}"
        )