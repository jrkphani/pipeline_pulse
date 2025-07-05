from datetime import datetime
from uuid import uuid4
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
        await db.commit()
        
        # Create session data
        session_data = SessionData(
            user_id=str(user.id),
            username=user.email,
            role=user.role,
            permissions={
                "can_create_opportunities": user.can_create_opportunities,
                "can_manage_sync": user.can_manage_sync,
                "is_superuser": user.is_superuser,
            },
            last_activity=datetime.utcnow(),
        )
        
        # Create session
        session_id = uuid4()
        session_store = get_session_store()
        session_cookie = get_session_cookie()
        
        await session_store.create(session_id, session_data)
        session_cookie.attach_to_response(response, session_id)
        
        # Create access token for API access
        access_token = create_access_token(
            data={"sub": str(user.id), "email": user.email, "role": user.role}
        )
        
        logger.info(
            "User logged in successfully",
            user_id=user.id,
            email=user.email,
            session_id=str(session_id),
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
            session_cookie.delete_from_response(response)
            
            logger.info("User logged out successfully", session_id=str(session_id))
        
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
        
        if not session_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Not authenticated",
            )
        
        session_store = get_session_store()
        session_data = await session_store.read(session_id)
        
        if not session_data:
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