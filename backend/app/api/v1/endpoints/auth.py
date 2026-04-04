"""Authentication endpoints — Pipeline Pulse v2.0 (JWT-based)."""

import structlog
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime

from app.core.database import get_db
from app.core.config import settings
from app.core.security import verify_password, create_access_token, get_password_hash
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.user_schemas import UserCreate, UserResponse, LoginResponse

logger = structlog.get_logger()
router = APIRouter()


# ---------------------------------------------------------------------------
# POST /auth/login
# ---------------------------------------------------------------------------

@router.post("/login", response_model=LoginResponse)
async def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> LoginResponse:
    """
    Authenticate with email + password.

    Returns the JWT access_token in the response body (for API/Swagger clients)
    and also sets it as an httpOnly cookie (for browser clients using
    withCredentials: true).
    """
    logger.info("Login attempt", username=form_data.username)

    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalar_one_or_none()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    # Stamp last login
    user.last_login = datetime.utcnow()
    await db.commit()
    await db.refresh(user)

    # Issue JWT — sub carries the user PK as a string
    access_token = create_access_token(data={"sub": str(user.id)})

    # Browser clients: httpOnly cookie — JS cannot read this token
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=settings.app_env == "production",  # HTTPS-only in prod
        samesite="lax",
        max_age=settings.access_token_expire_minutes * 60,
        path="/",
    )

    logger.info("User logged in", user_id=user.id, role=user.role)

    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


# ---------------------------------------------------------------------------
# POST /auth/register
# ---------------------------------------------------------------------------

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    """Register a new user account."""
    result = await db.execute(select(User).where(User.email == user_data.email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    new_user = User(
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        role=user_data.role,
        is_active=user_data.is_active,
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    logger.info("User registered", user_id=new_user.id)
    return UserResponse.model_validate(new_user)


# ---------------------------------------------------------------------------
# POST /auth/logout
# ---------------------------------------------------------------------------

@router.post("/logout")
async def logout(response: Response) -> dict:
    """
    Logout the current user.

    Clears the httpOnly access_token cookie.
    For Bearer-token clients, just discard the token on the client side.
    """
    response.delete_cookie(key="access_token", path="/")
    return {"message": "Logged out successfully"}


# ---------------------------------------------------------------------------
# GET /auth/me
# ---------------------------------------------------------------------------

@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    """Return the authenticated user's profile."""
    return UserResponse.model_validate(current_user)
