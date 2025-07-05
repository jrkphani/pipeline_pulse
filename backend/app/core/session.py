from datetime import datetime, timedelta
from typing import Optional, Dict, Any, Callable
from uuid import UUID
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException
from fastapi_sessions.backends.session_backend import SessionBackend
from fastapi_sessions.frontends.implementations.cookie import SessionCookie, CookieParameters
from ..models.session import Session
from ..core.config import settings


class SessionData(BaseModel):
    """Schema for session data."""
    user_id: str
    username: Optional[str] = None
    role: Optional[str] = None
    permissions: Optional[Dict[str, Any]] = None
    last_activity: Optional[datetime] = None
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class SQLAlchemySessionStore(SessionBackend[UUID, SessionData]):
    """Custom session store using SQLAlchemy."""
    
    def __init__(self, db_session_factory: Callable[[], AsyncSession]):
        self.db_session_factory = db_session_factory
        self.default_expiry_hours = 8  # 8 hours default session expiry
    
    async def create(self, session_id: UUID, data: SessionData) -> None:
        """Create a new session."""
        try:
            async with self.db_session_factory() as db:
                expires_at = datetime.utcnow() + timedelta(hours=self.default_expiry_hours)
                
                new_session = Session(
                    id=session_id,
                    user_id=data.user_id,
                    data=data.json(),
                    expires_at=expires_at,
                    is_active=True
                )
                
                db.add(new_session)
                await db.commit()
                await db.refresh(new_session)
        except IntegrityError:
            raise HTTPException(status_code=400, detail="Session already exists")
    
    async def read(self, session_id: UUID) -> Optional[SessionData]:
        """Read session data."""
        async with self.db_session_factory() as db:
            query = select(Session).where(
                Session.id == session_id,
                Session.is_active.is_(True),
                Session.expires_at > datetime.utcnow()
            )
            result = await db.execute(query)
            session_record = result.scalar_one_or_none()
            
            if session_record:
                # Update last activity
                await self._update_last_activity(db, session_id)
                return SessionData.parse_raw(session_record.data)
            
            return None
    
    async def update(self, session_id: UUID, data: SessionData) -> None:
        """Update session data."""
        async with self.db_session_factory() as db:
            query = update(Session).where(
                Session.id == session_id,
                Session.is_active.is_(True),
                Session.expires_at > datetime.utcnow()
            ).values(
                data=data.json()
            )
            
            result = await db.execute(query)
            await db.commit()
            
            if result.rowcount == 0:
                raise HTTPException(status_code=404, detail="Session not found or expired")
    
    async def delete(self, session_id: UUID) -> None:
        """Delete/deactivate session."""
        async with self.db_session_factory() as db:
            query = update(Session).where(
                Session.id == session_id
            ).values(
                is_active=False
            )
            
            await db.execute(query)
            await db.commit()
    
    async def _update_last_activity(self, db: AsyncSession, session_id: UUID) -> None:
        """Update last activity timestamp."""
        # This is a placeholder - we could implement last_activity tracking
        # For now, we're not updating last activity
        pass
    
    async def cleanup_expired_sessions(self) -> int:
        """Clean up expired sessions."""
        async with self.db_session_factory() as db:
            query = delete(Session).where(
                Session.expires_at <= datetime.utcnow()
            )
            
            result = await db.execute(query)
            await db.commit()
            return result.rowcount
    
    async def get_active_sessions_count(self, user_id: str) -> int:
        """Get count of active sessions for a user."""
        async with self.db_session_factory() as db:
            query = select(Session).where(
                Session.user_id == user_id,
                Session.is_active.is_(True),
                Session.expires_at > datetime.utcnow()
            )
            result = await db.execute(query)
            return len(result.scalars().all())
    
    async def revoke_user_sessions(self, user_id: str) -> int:
        """Revoke all sessions for a user."""
        async with self.db_session_factory() as db:
            query = update(Session).where(
                Session.user_id == user_id,
                Session.is_active.is_(True)
            ).values(
                is_active=False
            )
            
            result = await db.execute(query)
            await db.commit()
            return result.rowcount


def create_session_cookie() -> SessionCookie:
    """Create session cookie configuration."""
    cookie_params = CookieParameters(
        httponly=True,
        secure=settings.app_env == "production",
        samesite="lax",
        max_age=28800,  # 8 hours in seconds
    )
    
    return SessionCookie(
        cookie_name="pipeline_pulse_session",
        identifier="pipeline_pulse_session_manager",
        secret_key=settings.secret_key,
        cookie_params=cookie_params,
    )


def create_session_store(db_session_factory: Callable[[], AsyncSession]) -> SQLAlchemySessionStore:
    """Create session store with database backend."""
    return SQLAlchemySessionStore(db_session_factory)


# Global session components (to be initialized in main.py)
session_store: Optional[SQLAlchemySessionStore] = None
session_cookie: Optional[SessionCookie] = None


def init_session_management(db_session_factory: Callable[[], AsyncSession]) -> None:
    """Initialize session management components."""
    global session_store, session_cookie
    
    session_store = create_session_store(db_session_factory)
    session_cookie = create_session_cookie()


def get_session_store() -> SQLAlchemySessionStore:
    """Get the initialized session store."""
    if session_store is None:
        raise RuntimeError("Session management not initialized. Call init_session_management() first.")
    return session_store


def get_session_cookie() -> SessionCookie:
    """Get the initialized session cookie."""
    if session_cookie is None:
        raise RuntimeError("Session management not initialized. Call init_session_management() first.")
    return session_cookie