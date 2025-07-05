from typing import AsyncGenerator
from fastapi import Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from .database import AsyncSessionLocal
from .session import get_session_store, get_session_cookie, SessionData
from ..models.user import User
import structlog

logger = structlog.get_logger()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Get database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def get_current_session(request: Request) -> SessionData:
    """Get current user session data."""
    try:
        session_cookie = get_session_cookie()
        session_id = session_cookie.extract_from_request(request)
        
        if not session_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Not authenticated",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        session_store = get_session_store()
        session_data = await session_store.read(session_id)
        
        if not session_data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session expired or invalid",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
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


async def get_current_active_superuser(
    current_user: User = Depends(get_current_user),
) -> User:
    """Get current user and verify they are a superuser."""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )
    return current_user


async def get_current_sales_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Get current user and verify they have sales permissions."""
    if not current_user.can_create_opportunities:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions for sales operations",
        )
    return current_user


async def get_current_sync_manager(
    current_user: User = Depends(get_current_user),
) -> User:
    """Get current user and verify they can manage sync operations."""
    if not current_user.can_manage_sync:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions for sync management",
        )
    return current_user