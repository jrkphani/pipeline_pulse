# backend/app/core/session.py

from typing import Optional, Dict, Any
from uuid import UUID, uuid4
import json
import logging
from datetime import datetime, timedelta
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from fastapi import Request, HTTPException

from ..models.session import Session as DBSession  # Alias to avoid name conflict
from ..core.database import get_db

logger = logging.getLogger(__name__)


class SessionData(BaseModel):
    """Session data model for user authentication."""
    user_id: str
    username: Optional[str] = None
    email: Optional[str] = None
    is_superuser: bool = False
    created_at: Optional[datetime] = None


class SQLAlchemySessionStore:
    """
    Custom session store implementation for database-backed sessions.
    Stores session data in PostgreSQL using SQLAlchemy.
    """
    
    def __init__(self):
        self.default_expiry_hours = 8  # 8 hours default session expiry
    
    async def read(self, session_id: str) -> Optional[SessionData]:
        """Load session data from database."""
        logger.info(f"🔍 Reading session: {session_id}")
        print(f"🔍 DEBUG: Reading session: {session_id}")
        
        session_data_to_return: Optional[SessionData] = None
        
        try:
            session_uuid = UUID(session_id)
        except ValueError:
            logger.warning(f"Invalid session ID format: {session_id}")
            print(f"🔍 DEBUG: Invalid session ID format: {session_id}")
            return None
            
        # Use proper async context manager for database session
        try:
            async for db in get_db():
                try:
                    # Query for active, non-expired session
                    query = select(DBSession).where(
                        DBSession.id == session_uuid,
                        DBSession.is_active.is_(True),
                        DBSession.expires_at > datetime.utcnow()
                    )
                    result = await db.execute(query)
                    session_record = result.scalar_one_or_none()
                    
                    print(f"🔍 DEBUG: Session query result: {session_record}")
                    logger.info(f"🔍 Session query result: {session_record}")
                    
                    if session_record and session_record.data:
                        # Parse JSON string into SessionData
                        data_dict = json.loads(session_record.data)
                        print(f"🔍 DEBUG: Successfully loaded session data for user: {data_dict.get('user_id')}")
                        logger.info(f"🔍 Successfully loaded session data for user: {data_dict.get('user_id')}")
                        session_data_to_return = SessionData(**data_dict)
                        print(f"🔍 DEBUG: Created SessionData object: {session_data_to_return}")
                    
                except Exception as e:
                    print(f"🔍 DEBUG: Error loading session {session_id}: {e}")
                    logger.error(f"Error loading session {session_id}: {e}")
                finally:
                    # Session is automatically closed by get_db() context manager
                    break
        except Exception as e:
            print(f"🔍 DEBUG: Database connection error: {e}")
            logger.error(f"Database connection error: {e}")
            return None
        
        # Return the data after the database session is properly closed
        if session_data_to_return:
            print(f"✅ DEBUG: Successfully returning session for user: {session_data_to_return.user_id}")
            logger.info(f"✅ Successfully loaded and returning session for user: {session_data_to_return.user_id}")
        else:
            print(f"🤷 DEBUG: No valid session found for ID: {session_id}")
            logger.warning(f"🤷 No valid session found for ID: {session_id}")
            
        return session_data_to_return
    
    async def create(self, session_id: str, data: SessionData) -> None:
        """Create new session in database."""
        await self.save(session_id, data)
    
    async def save(self, session_id: str, data: SessionData, db: AsyncSession = None) -> None:
        """Save session data to database."""
        logger.info(f"💾 Saving session: {session_id} for user: {data.user_id}")
        print(f"💾 DEBUG: Saving session: {session_id} for user: {data.user_id}")
        try:
            session_uuid = UUID(session_id)
        except ValueError:
            logger.error(f"Invalid session ID format: {session_id}")
            return
        
        # If external session is provided, use it directly
        if db is not None:
            logger.info(f"💾 Using external database session")
            print(f"💾 DEBUG: Using external database session")
            try:
                # Check if session exists
                query = select(DBSession).where(DBSession.id == session_uuid)
                result = await db.execute(query)
                session_record = result.scalar_one_or_none()
                
                # Serialize data to JSON string
                json_data = data.json()
                print(f"💾 DEBUG: Serialized data: {json_data}")
                
                if session_record:
                    # Update existing session
                    print(f"💾 DEBUG: Updating existing session")
                    session_record.data = json_data
                    session_record.user_id = data.user_id
                else:
                    # Create new session
                    expires_at = datetime.utcnow() + timedelta(hours=self.default_expiry_hours)
                    print(f"💾 DEBUG: Creating new session, expires at: {expires_at}")
                    
                    session_record = DBSession(
                        id=session_uuid,
                        user_id=data.user_id,
                        data=json_data,
                        expires_at=expires_at,
                        is_active=True
                    )
                    db.add(session_record)
                    print(f"💾 DEBUG: Added session to database transaction")
                
                # Flush to ensure session is added to the current transaction
                # but don't commit - let the caller handle the transaction
                await db.flush()
                print(f"💾 DEBUG: Session flushed successfully: {session_id}")
                logger.info(f"💾 Session flushed successfully: {session_id}")
                return
            except Exception as e:
                print(f"💾 DEBUG: Error saving session {session_id}: {e}")
                logger.error(f"💾 Error saving session {session_id}: {e}")
                raise
        
        # Create our own session using proper context management
        try:
            async for db in get_db():
                try:
                    # Check if session exists
                    query = select(DBSession).where(DBSession.id == session_uuid)
                    result = await db.execute(query)
                    session_record = result.scalar_one_or_none()
                    
                    # Serialize data to JSON string
                    json_data = data.json()
                    
                    if session_record:
                        # Update existing session
                        session_record.data = json_data
                        session_record.user_id = data.user_id
                    else:
                        # Create new session
                        expires_at = datetime.utcnow() + timedelta(hours=self.default_expiry_hours)
                        
                        session_record = DBSession(
                            id=session_uuid,
                            user_id=data.user_id,
                            data=json_data,
                            expires_at=expires_at,
                            is_active=True
                        )
                        db.add(session_record)
                    
                    await db.commit()
                except Exception as e:
                    logger.error(f"Error saving session {session_id}: {e}")
                    await db.rollback()
                    raise
                finally:
                    break
        except Exception as e:
            logger.error(f"Database connection error during save: {e}")
            raise
    
    async def delete(self, session_id: str) -> None:
        """Delete session from database."""
        try:
            session_uuid = UUID(session_id)
        except ValueError:
            logger.warning(f"Invalid session ID format: {session_id}")
            return
            
        try:
            async for db in get_db():
                try:
                    # Soft delete by marking as inactive
                    query = update(DBSession).where(
                        DBSession.id == session_uuid
                    ).values(
                        is_active=False
                    )
                    
                    await db.execute(query)
                    await db.commit()
                except Exception as e:
                    logger.error(f"Error deleting session {session_id}: {e}")
                    await db.rollback()
                    raise
                finally:
                    break
        except Exception as e:
            logger.error(f"Database connection error during session delete: {e}")
    
    async def cleanup_expired_sessions(self) -> int:
        """Clean up expired sessions. Returns number of sessions cleaned."""
        try:
            async for db in get_db():
                try:
                    query = delete(DBSession).where(
                        DBSession.expires_at <= datetime.utcnow()
                    )
                    
                    result = await db.execute(query)
                    await db.commit()
                    
                    count = result.rowcount
                    if count > 0:
                        logger.info(f"Cleaned up {count} expired sessions")
                    
                    return count
                except Exception as e:
                    logger.error(f"Error cleaning up sessions: {e}")
                    await db.rollback()
                    return 0
                finally:
                    break
        except Exception as e:
            logger.error(f"Database connection error during cleanup: {e}")
            return 0
    
    async def get_user_sessions(self, user_id: str) -> list:
        """Get all active sessions for a user."""
        try:
            async for db in get_db():
                try:
                    query = select(DBSession).where(
                        DBSession.user_id == user_id,
                        DBSession.is_active.is_(True),
                        DBSession.expires_at > datetime.utcnow()
                    )
                    result = await db.execute(query)
                    return result.scalars().all()
                except Exception as e:
                    logger.error(f"Error getting user sessions: {e}")
                    return []
                finally:
                    break
        except Exception as e:
            logger.error(f"Database connection error: {e}")
            return []
    
    async def revoke_user_sessions(self, user_id: str) -> int:
        """Revoke all sessions for a user. Returns number of sessions revoked."""
        try:
            async for db in get_db():
                try:
                    query = update(DBSession).where(
                        DBSession.user_id == user_id,
                        DBSession.is_active.is_(True)
                    ).values(
                        is_active=False
                    )
                    
                    result = await db.execute(query)
                    await db.commit()
                    
                    count = result.rowcount
                    if count > 0:
                        logger.info(f"Revoked {count} sessions for user {user_id}")
                    
                    return count
                except Exception as e:
                    logger.error(f"Error revoking user sessions: {e}")
                    await db.rollback()
                    return 0
                finally:
                    break
        except Exception as e:
            logger.error(f"Database connection error during revoke: {e}")
            return 0


class SessionCookie:
    """Session cookie management for extracting session IDs from requests."""
    
    def __init__(self, cookie_name: str = "session"):
        self.cookie_name = cookie_name
    
    def extract_from_request(self, request: Request) -> Optional[str]:
        """Extract session ID from request cookies."""
        return request.cookies.get(self.cookie_name)
    
    def create_session_response(self, session_id: str, max_age: int = 28800) -> Dict[str, str]:
        """Create session cookie headers for response."""
        return {
            "Set-Cookie": f"{self.cookie_name}={session_id}; Path=/; HttpOnly; Max-Age={max_age}; SameSite=Lax"
        }


# Initialize global instances
_session_store = SQLAlchemySessionStore()
_session_cookie = SessionCookie()


def get_session_store() -> SQLAlchemySessionStore:
    """Get the global session store instance."""
    return _session_store


def get_session_cookie() -> SessionCookie:
    """Get the global session cookie handler instance."""
    return _session_cookie


async def create_session(user_id: str, username: str = None, email: str = None, is_superuser: bool = False) -> str:
    """Create a new user session and return session ID."""
    session_id = str(uuid4())
    session_data = SessionData(
        user_id=user_id,
        username=username,
        email=email,
        is_superuser=is_superuser,
        created_at=datetime.utcnow()
    )
    
    await _session_store.create(session_id, session_data)
    return session_id


async def destroy_session(session_id: str) -> None:
    """Destroy a user session."""
    await _session_store.delete(session_id)


async def init_session_management(db_session_factory=None) -> None:
    """Initialize session management (called during app startup)."""
    logger.info("Session management initialized")
    
    # Schedule periodic cleanup of expired sessions
    # This would typically be done with APScheduler or similar
    try:
        cleaned = await _session_store.cleanup_expired_sessions()
        logger.info(f"Initial session cleanup: removed {cleaned} expired sessions")
    except Exception as e:
        logger.warning(f"Failed to perform initial session cleanup: {e}")