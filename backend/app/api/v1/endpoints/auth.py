from datetime import datetime
from uuid import uuid4
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
import structlog
from ....core.database import get_db
from ....core.security import verify_password, get_password_hash, create_access_token
from ....core.session import SessionData, get_session_store, get_session_cookie
from ....models.user import User
from ....schemas.user_schemas import UserLogin, UserResponse, UserCreate

logger = structlog.get_logger()
router = APIRouter()


# Dependency functions moved here to avoid circular imports
async def get_current_session(request: Request) -> SessionData:
    """Get current user session data."""
    try:
        session_cookie = get_session_cookie()
        session_id = session_cookie.extract_from_request(request)
        
        logger.info(f"🍪 Extracted session ID from cookies: {session_id}")
        logger.info(f"🍪 All cookies: {dict(request.cookies)}")
        
        if not session_id:
            logger.warning("🍪 No session cookie found")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Not authenticated",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        session_store = get_session_store()
        session_data = await session_store.read(session_id)
        
        if not session_data:
            logger.warning(f"🍪 No session data found for ID: {session_id}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session expired or invalid",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        logger.info(f"🍪 Successfully loaded session for user: {session_data.user_id}")
        return session_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Session validation failed", error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(
    session_data: SessionData = Depends(get_current_session),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Get current authenticated user."""
    try:
        query = select(User).where(User.id == int(session_data.user_id))
        result = await db.execute(query)
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User account is disabled",
            )
        
        return user
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("User validation failed", error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed",
        )


async def get_current_user_optional(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> Optional[User]:
    """
    Gets the current user from the session if they are authenticated.
    If not authenticated, returns None instead of raising an error.
    """
    try:
        # Re-use the existing get_current_user logic but catch the exception
        session_data = await get_current_session(request)
        return await get_current_user(session_data, db)
    except HTTPException:
        # This will catch the 401 errors if the user is not logged in
        return None


@router.post("/login", response_model=UserResponse)
async def login(
    user_credentials: UserLogin,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """User login endpoint with session management."""
    try:
        # Get user from database
        query = select(User).where(User.email == user_credentials.email)
        result = await db.execute(query)
        user = result.scalar_one_or_none()
        
        if not user or not verify_password(user_credentials.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User account is disabled",
            )
        
        # Update last login
        await db.execute(
            update(User).where(User.id == user.id).values(last_login=datetime.utcnow())
        )
        
        # Create session data
        session_data = SessionData(
            user_id=str(user.id),
            username=user.email,
            email=user.email,
            is_superuser=user.is_superuser,
            created_at=datetime.utcnow()
        )
        
        # Create session in the current transaction
        try:
            session_id = str(uuid4())
            session_store = get_session_store()
            
            logger.info("Creating session", session_id=session_id, user_id=user.id)
            print(f"🚨 DEBUG: About to save session {session_id}")  # Basic debug
            await session_store.save(session_id, session_data, db)
            print(f"🚨 DEBUG: Session save completed for {session_id}")  # Basic debug
            
            # Commit the transaction to ensure session is persisted
            await db.commit()
            logger.info("Session created and committed", session_id=session_id)
            
            # Set session cookie in response
            response.set_cookie(
                key="session",
                value=session_id,
                httponly=True,
                samesite='lax',
                max_age=28800,  # 8 hours
                path="/"
            )
            
        except Exception as session_error:
            logger.error(
                "Session creation failed",
                session_id=session_id if 'session_id' in locals() else 'not_created',
                user_id=user.id,
                error=str(session_error),
                exc_info=True
            )
            await db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Session creation failed: {str(session_error)}"
            )
        
        # Create access token for API access
        access_token = create_access_token(
            data={"sub": str(user.id), "email": user.email, "role": user.role}
        )
        
        logger.info(
            "User logged in successfully",
            user_id=user.id,
            email=user.email,
            session_id=session_id,
        )
        
        # Add token to response headers
        response.headers["X-Access-Token"] = access_token
        
        return UserResponse.from_orm(user)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Login failed", error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.post("/logout")
async def logout(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """User logout endpoint."""
    try:
        session_cookie = get_session_cookie()
        session_id = session_cookie.extract_from_request(request)
        
        if session_id:
            session_store = get_session_store()
            await session_store.delete(session_id)
            # Clear cookie
            response.headers["Set-Cookie"] = f"{session_cookie.cookie_name}=; Path=/; HttpOnly; Max-Age=0"
            
            logger.info("User logged out successfully", session_id=session_id)
        
        return {"message": "Logged out successfully"}
        
    except Exception as e:
        logger.error("Logout failed", error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get("/me", response_model=UserResponse)
async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Get current user information from session."""
    try:
        session_cookie = get_session_cookie()
        session_id = session_cookie.extract_from_request(request)
        
        logger.info(f"🍪 /me endpoint - session ID: {session_id}")
        logger.info(f"🍪 /me endpoint - cookies: {dict(request.cookies)}")
        logger.info(f"🍪 /me endpoint - cookie name: {session_cookie.cookie_name}")
        print(f"🍪 DEBUG: /me endpoint - session ID: {session_id}")
        print(f"🍪 DEBUG: /me endpoint - cookies: {dict(request.cookies)}")
        
        if not session_id:
            logger.warning("🍪 /me endpoint - no session cookie")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Not authenticated",
            )
        
        session_store = get_session_store()
        session_data = await session_store.read(session_id)
        
        if not session_data:
            logger.warning(f"🍪 /me endpoint - no session data for ID: {session_id}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session expired or invalid",
            )
        
        # Get user from database
        query = select(User).where(User.id == int(session_data.user_id))
        result = await db.execute(query)
        user = result.scalar_one_or_none()
        
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive",
            )
        
        return UserResponse.from_orm(user)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Get current user failed", error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.post("/register", response_model=UserResponse)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db),
):
    """User registration endpoint."""
    try:
        # Check if user already exists
        query = select(User).where(User.email == user_data.email)
        result = await db.execute(query)
        existing_user = result.scalar_one_or_none()
        
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )
        
        # Create new user
        hashed_password = get_password_hash(user_data.password)
        new_user = User(
            email=user_data.email,
            hashed_password=hashed_password,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            role=user_data.role,
            is_active=user_data.is_active,
        )
        
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)
        
        logger.info(
            "User registered successfully",
            user_id=new_user.id,
            email=new_user.email,
        )
        
        return UserResponse.from_orm(new_user)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Registration failed", error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )