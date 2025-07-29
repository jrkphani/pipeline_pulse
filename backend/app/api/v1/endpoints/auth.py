# backend/app/api/v1/endpoints/auth.py
import structlog
from typing import Optional, Annotated
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response, Body
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr

from app.core.database import get_db
from app.core.security import verify_password, create_access_token, get_password_hash
from app.core.session import SessionCookie, SessionData, get_session_store
from app.models.user import User
from app.schemas.user_schemas import UserCreate, UserResponse

logger = structlog.get_logger()
router = APIRouter()

# Session cookie configuration
session_cookie = SessionCookie()


class CompleteProfileRequest(BaseModel):
    """Request model for completing user profile after OAuth."""
    email: EmailStr
    first_name: str
    last_name: str


@router.post("/login", response_model=UserResponse)
async def login(
    response: Response,
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: AsyncSession = Depends(get_db),
):
    """
    OAuth2 compatible login endpoint using username (email) and password.
    
    This endpoint:
    1. Validates the user's credentials
    2. Creates a server-side session
    3. Sets an httpOnly session cookie
    4. Returns the user data
    """
    logger.info("Login attempt", username=form_data.username)
    
    # Find user by email (username in OAuth2 terms)
    query = select(User).where(User.email == form_data.username)
    result = await db.execute(query)
    user = result.scalar_one_or_none()
    
    # Verify user exists and password is correct
    if not user or not verify_password(form_data.password, user.hashed_password):
        logger.warning("Invalid login credentials", username=form_data.username)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if user is active
    if not user.is_active:
        logger.warning("Inactive user login attempt", user_id=user.id)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    # Create session data
    session_data = SessionData(
        user_id=str(user.id),
        username=user.email,
        email=user.email,
        is_superuser=user.is_superuser
    )
    
    # Store session and get session ID
    session_store = get_session_store()
    from uuid import uuid4
    session_id = str(uuid4())
    await session_store.save(session_id, session_data, db)
    await db.commit()  # Ensure session is persisted
    
    # Set session cookie
    session_cookie.set_cookie(response, session_id)
    
    # Update last login time
    user.last_login = session_data.created_at
    await db.commit()
    
    logger.info("User logged in successfully", 
               user_id=user.id, 
               session_id=session_id)
    
    return UserResponse.from_orm(user)


@router.post("/register", response_model=UserResponse)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Register a new user account.
    
    This endpoint:
    1. Validates the user data
    2. Checks for existing users with the same email
    3. Creates a new user account
    4. Returns the created user data
    """
    logger.info("Registration attempt", email=user_data.email)
    
    # Check if user already exists
    query = select(User).where(User.email == user_data.email)
    result = await db.execute(query)
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        logger.warning("Registration with existing email", email=user_data.email)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        role=user_data.role,
        is_active=user_data.is_active
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    logger.info("User registered successfully", user_id=new_user.id)
    
    return UserResponse.from_orm(new_user)


@router.post("/logout")
async def logout(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """
    Logout the current user.
    
    This endpoint:
    1. Retrieves the session ID from the cookie
    2. Deletes the session from the store
    3. Clears the session cookie
    """
    # Get session ID from cookie
    session_id = session_cookie.extract_from_request(request)
    
    if session_id:
        # Delete the session
        session_store = get_session_store()
        await session_store.delete(session_id, db)
        await db.commit()
        
        logger.info("User logged out", session_id=session_id)
    else:
        logger.warning("🍪 Logout attempt without session cookie")
    
    # Clear the session cookie
    session_cookie.clear_cookie(response)
    
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Get the current authenticated user information.
    
    This endpoint:
    1. Retrieves the session ID from the cookie
    2. Loads the session data
    3. Returns the user information
    """
    # Get session ID from cookie
    session_id = session_cookie.extract_from_request(request)
    
    # Debug logging
    logger.info(f"🍪 DEBUG: /me endpoint - session ID: {session_id}")
    logger.info(f"🍪 DEBUG: /me endpoint - cookies: {request.cookies}")
    
    if not session_id:
        logger.warning("🍪 /me endpoint - no session cookie")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    # Load session data
    session_store = get_session_store()
    session_data = await session_store.read(session_id)
    
    if not session_data:
        logger.warning("Invalid or expired session", session_id=session_id)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session"
        )
    
    # Get user from database
    try:
        user_id = int(session_data.user_id)
        query = select(User).where(User.id == user_id)
        result = await db.execute(query)
        user = result.scalar_one_or_none()
        
        if not user:
            logger.error("User not found for session", 
                        user_id=user_id, 
                        session_id=session_id)
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        if not user.is_active:
            logger.warning("Inactive user session access", user_id=user_id)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive"
            )
        
        logger.info("Current user retrieved", user_id=user.id)
        return UserResponse.from_orm(user)
        
    except ValueError as e:
        logger.error("Invalid user ID in session", 
                    user_id=session_data.user_id, 
                    error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Invalid session data"
        )
    except Exception as e:
        logger.error("Get current user failed", error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.post("/complete-profile", response_model=UserResponse)
async def complete_profile(
    request: Request,
    profile_data: CompleteProfileRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Complete user profile after OAuth authentication.
    
    This endpoint:
    1. Gets the current temporary user from session
    2. Updates their email and profile information
    3. Transfers OAuth tokens from temp email to real email
    4. Updates the session with new user information
    """
    # Get session ID from cookie
    session_id = session_cookie.extract_from_request(request)
    
    if not session_id:
        logger.warning("Complete profile attempt without session")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    # Load session data
    session_store = get_session_store()
    session_data = await session_store.read(session_id)
    
    if not session_data:
        logger.warning("Invalid session for profile completion", session_id=session_id)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session"
        )
    
    try:
        # Get current temp user
        user_id = int(session_data.user_id)
        query = select(User).where(User.id == user_id)
        result = await db.execute(query)
        temp_user = result.scalar_one_or_none()
        
        if not temp_user:
            logger.error("Temp user not found", user_id=user_id)
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Check if this is actually a temp user
        if not temp_user.email.startswith("temp_oauth_user"):
            logger.warning("Profile completion attempt for non-temp user", 
                          user_id=user_id, 
                          email=temp_user.email)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Profile already completed"
            )
        
        logger.info("Completing profile for temp user", 
                   temp_user_id=user_id, 
                   temp_email=temp_user.email,
                   new_email=profile_data.email)
        
        # Check if a user with the new email already exists
        existing_query = select(User).where(User.email == profile_data.email)
        existing_result = await db.execute(existing_query)
        existing_user = existing_result.scalar_one_or_none()
        
        if existing_user:
            # User already exists, we need to merge accounts
            logger.info("Found existing user with email, merging accounts", 
                       existing_user_id=existing_user.id,
                       email=profile_data.email)
            
            # Transfer OAuth tokens from temp user to existing user
            from app.models.zoho_oauth_token import ZohoOAuthToken
            
            # Find temp user's OAuth token
            temp_token_query = select(ZohoOAuthToken).where(
                ZohoOAuthToken.user_email == temp_user.email
            )
            temp_token_result = await db.execute(temp_token_query)
            temp_token = temp_token_result.scalar_one_or_none()
            
            if temp_token:
                # Update the token to use the existing user's email
                temp_token.user_email = existing_user.email
                await db.commit()
                
                logger.info("Transferred OAuth token to existing user", 
                           from_email=temp_user.email,
                           to_email=existing_user.email)
            
            # Delete the temp user
            await db.delete(temp_user)
            await db.commit()
            
            # Update session to use the existing user
            session_data.user_id = str(existing_user.id)
            session_data.username = existing_user.email
            session_data.email = existing_user.email
            session_data.is_superuser = existing_user.is_superuser
            
            await session_store.save(session_id, session_data, db)
            await db.commit()
            
            logger.info("Profile completion merged with existing user", 
                       user_id=existing_user.id)
            
            return UserResponse.from_orm(existing_user)
        
        else:
            # Update the temp user with real information
            old_email = temp_user.email
            temp_user.email = profile_data.email
            temp_user.first_name = profile_data.first_name
            temp_user.last_name = profile_data.last_name
            
            # Transfer OAuth tokens
            from app.models.zoho_oauth_token import ZohoOAuthToken
            
            token_update_query = select(ZohoOAuthToken).where(
                ZohoOAuthToken.user_email == old_email
            )
            token_result = await db.execute(token_update_query)
            token = token_result.scalar_one_or_none()
            
            if token:
                token.user_email = profile_data.email
                logger.info("Updated OAuth token email", 
                           from_email=old_email,
                           to_email=profile_data.email)
            
            # Update SDK manager
            from app.core.zoho_sdk_manager import zoho_sdk_manager
            
            if token:
                # Remove old user from SDK manager
                await zoho_sdk_manager.remove_user(old_email)
                
                # Add with new email
                await zoho_sdk_manager.add_user(
                    user_email=profile_data.email,
                    refresh_token=token.refresh_token,
                    client_id=token.client_id,
                    client_secret=token.client_secret
                )
            
            await db.commit()
            await db.refresh(temp_user)
            
            # Update session with new user information
            session_data.username = temp_user.email
            session_data.email = temp_user.email
            
            await session_store.save(session_id, session_data, db)
            await db.commit()
            
            logger.info("Profile completed successfully", 
                       user_id=temp_user.id,
                       email=temp_user.email)
            
            return UserResponse.from_orm(temp_user)
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error completing profile", error=str(e), exc_info=True)
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to complete profile"
        )


async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Dependency to get the current authenticated user.
    
    This is used by other endpoints that require authentication.
    """
    # Get session ID from cookie
    session_id = session_cookie.extract_from_request(request)
    
    if not session_id:
        logger.warning("🍪 No session cookie found")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    # The rest of the logic is similar to get_current_user endpoint
    # This is kept as a separate function for use as a dependency
    
    # Load session data
    session_store = get_session_store()
    session_data = await session_store.read(session_id)
    
    if not session_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session"
        )
    
    # Get user from database
    user_id = int(session_data.user_id)
    query = select(User).where(User.id == user_id)
    result = await db.execute(query)
    user = result.scalar_one_or_none()
    
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
    return user