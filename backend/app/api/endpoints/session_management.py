"""
Session Management API endpoints for JWT token persistence in database
Follows Zoho SDK database token store pattern for session management
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
import logging
import json
from jose import jwt, JWTError

from app.core.database import get_db
from app.core.config import settings
from app.models.token_management import SessionToken

logger = logging.getLogger(__name__)

router = APIRouter()

class SessionManager:
    """
    Session Management following Zoho SDK database token store pattern
    Stores JWT tokens in database instead of localStorage
    """
    
    def __init__(self, db: Session):
        self.db = db
        # Simple in-memory cache for user-token mappings
        self._user_cache = {}
    
    async def extract_user_info(self, token: str) -> Dict[str, Any]:
        """
        Extract user information from a JWT token, using session data as fallback.
        Cache user-token mappings for improved performance.
        """
        try:
            # Check cache first
            if token in self._user_cache:
                return self._user_cache[token]

            # Decode JWT
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])

            # Extract user info
            user_email = payload.get("sub")
            user_id = payload.get("user_id") or user_email
            region = payload.get("region")
            name = payload.get("name")
            roles = payload.get("roles", [])

            # Verify email
            if not user_email:
                # Fallback to session data
                existing_session = self.db.query(SessionToken).filter(SessionToken.jwt_token == token).first()
                if existing_session:
                    user_email = existing_session.user_email
                    user_id = existing_session.user_id
                    region = existing_session.region
                    name = existing_session.name
                    roles = json.loads(existing_session.roles) if existing_session.roles else []

            # Return error if no email resolved
            if not user_email:
                raise ValueError("User email could not be extracted from token")

            # Cache and return
            user_info = {
                "user_email": user_email,
                "user_id": user_id,
                "region": region,
                "name": name,
                "roles": roles
            }

            self._user_cache[token] = user_info
            return user_info

        except Exception as e:
            logger.error(f"Error extracting user info: {e}")
            raise HTTPException(status_code=500, detail="Failed to extract user info")
    
    async def store_session(self, token: str, user_id: str = None) -> Dict[str, Any]:
        """
        Store JWT token in database following Zoho SDK pattern
        Similar to save_token() method in TokenStore
        """
        try:
            # Use the new extract_user_info method with fallback strategies
            user_info = await self.extract_user_info(token)
            
            # Decode JWT for expiration and issued time
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            exp = payload.get("exp")
            iat = payload.get("iat")
            
            user_email = user_info["user_email"]
            user_id = user_info["user_id"]
            region = user_info["region"]
            name = user_info["name"]
            roles = user_info["roles"]
            
            # Check if token is expired
            if exp and exp < datetime.utcnow().timestamp():
                raise HTTPException(status_code=401, detail="Token is expired")
            
            # Check if session already exists for this user
            existing_session = self.db.query(SessionToken).filter(
                SessionToken.user_email == user_email
            ).first()
            
            if existing_session:
                # Update existing session
                existing_session.jwt_token = token
                existing_session.user_id = user_id
                existing_session.region = region
                existing_session.name = name
                existing_session.roles = json.dumps(roles) if roles else None
                existing_session.expires_at = datetime.utcfromtimestamp(exp) if exp else None
                existing_session.issued_at = datetime.utcfromtimestamp(iat) if iat else None
                existing_session.updated_at = datetime.utcnow()
                
                logger.info(f"Updated session for user: {user_email}")
            else:
                # Create new session
                new_session = SessionToken(
                    user_email=user_email,
                    user_id=user_id,
                    jwt_token=token,
                    region=region,
                    name=name,
                    roles=json.dumps(roles) if roles else None,
                    expires_at=datetime.utcfromtimestamp(exp) if exp else None,
                    issued_at=datetime.utcfromtimestamp(iat) if iat else None,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                
                self.db.add(new_session)
                logger.info(f"Created new session for user: {user_email}")
            
            self.db.commit()
            
            return {
                "success": True,
                "user_email": user_email,
                "user_id": user_id,
                "region": region,
                "expires_at": exp
            }
            
        except JWTError as e:
            logger.error(f"JWT decode error: {e}")
            raise HTTPException(status_code=401, detail="Invalid token")
        except Exception as e:
            logger.error(f"Error storing session: {e}")
            self.db.rollback()
            raise HTTPException(status_code=500, detail=f"Failed to store session: {str(e)}")
    
    async def retrieve_session(self, user_id: str = None) -> Dict[str, Any]:
        """
        Retrieve JWT token from database following Zoho SDK pattern
        Similar to find_token() method in TokenStore
        """
        try:
            # Default to admin user if no user_id provided
            user_email = user_id or "admin@1cloudhub.com"
            
            # Find session by user email
            session = self.db.query(SessionToken).filter(
                SessionToken.user_email == user_email
            ).first()
            
            if not session:
                logger.debug(f"No session found for user: {user_email}")
                return {"token": None}
            
            # Check if token is expired
            if session.expires_at and session.expires_at < datetime.utcnow():
                logger.warning(f"Session expired for user: {user_email}")
                # Delete expired session
                self.db.delete(session)
                self.db.commit()
                return {"token": None}
            
            # Verify JWT token is still valid
            try:
                payload = jwt.decode(
                    session.jwt_token, 
                    settings.SECRET_KEY, 
                    algorithms=[settings.ALGORITHM]
                )
                
                logger.info(f"Retrieved valid session for user: {user_email}")
                return {
                    "token": session.jwt_token,
                    "user_email": session.user_email,
                    "user_id": session.user_id,
                    "region": session.region,
                    "name": session.name,
                    "roles": json.loads(session.roles) if session.roles else [],
                    "expires_at": session.expires_at.isoformat() if session.expires_at else None
                }
                
            except JWTError:
                logger.warning(f"Invalid JWT token for user: {user_email}")
                # Delete invalid session
                self.db.delete(session)
                self.db.commit()
                return {"token": None}
                
        except Exception as e:
            logger.error(f"Error retrieving session: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to retrieve session: {str(e)}")
    
    async def clear_session(self, user_id: str = None) -> Dict[str, Any]:
        """
        Clear JWT token from database following Zoho SDK pattern
        Similar to delete_token() method in TokenStore
        """
        try:
            # Default to admin user if no user_id provided
            user_email = user_id or "admin@1cloudhub.com"
            
            # Find and delete session
            session = self.db.query(SessionToken).filter(
                SessionToken.user_email == user_email
            ).first()
            
            if session:
                self.db.delete(session)
                self.db.commit()
                logger.info(f"Cleared session for user: {user_email}")
                return {"success": True, "message": f"Session cleared for user: {user_email}"}
            else:
                logger.debug(f"No session found to clear for user: {user_email}")
                return {"success": True, "message": f"No session found for user: {user_email}"}
                
        except Exception as e:
            logger.error(f"Error clearing session: {e}")
            self.db.rollback()
            raise HTTPException(status_code=500, detail=f"Failed to clear session: {str(e)}")
    
    async def clear_all_sessions(self) -> Dict[str, Any]:
        """
        Clear all JWT tokens from database following Zoho SDK pattern
        Similar to delete_tokens() method in TokenStore
        """
        try:
            deleted_count = self.db.query(SessionToken).delete()
            self.db.commit()
            
            logger.info(f"Cleared all sessions: {deleted_count} sessions deleted")
            return {
                "success": True,
                "message": f"Cleared all sessions: {deleted_count} sessions deleted"
            }
            
        except Exception as e:
            logger.error(f"Error clearing all sessions: {e}")
            self.db.rollback()
            raise HTTPException(status_code=500, detail=f"Failed to clear all sessions: {str(e)}")
    
    async def get_all_sessions(self) -> Dict[str, Any]:
        """
        Get all stored sessions following Zoho SDK pattern
        Similar to get_tokens() method in TokenStore
        """
        try:
            sessions = self.db.query(SessionToken).all()
            
            session_data = []
            for session in sessions:
                session_data.append({
                    "user_email": session.user_email,
                    "user_id": session.user_id,
                    "region": session.region,
                    "name": session.name,
                    "roles": json.loads(session.roles) if session.roles else [],
                    "expires_at": session.expires_at.isoformat() if session.expires_at else None,
                    "created_at": session.created_at.isoformat() if session.created_at else None,
                    "updated_at": session.updated_at.isoformat() if session.updated_at else None
                })
            
            logger.info(f"Retrieved {len(session_data)} sessions")
            return {
                "success": True,
                "sessions": session_data,
                "count": len(session_data)
            }
            
        except Exception as e:
            logger.error(f"Error getting all sessions: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to get sessions: {str(e)}")

# API Endpoints

@router.post("/session/store")
async def store_session(
    request: Request,
    db: Session = Depends(get_db)
) -> JSONResponse:
    """
    Store JWT token in database
    Follows Zoho SDK TokenStore.save_token() pattern
    """
    try:
        body = await request.json()
        token = body.get("token")
        user_id = body.get("user_id")
        
        if not token:
            raise HTTPException(status_code=400, detail="Token is required")
        
        session_manager = SessionManager(db)
        result = await session_manager.store_session(token, user_id)
        
        return JSONResponse(content=result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Session store endpoint error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to store session: {str(e)}")

@router.get("/session/retrieve")
async def retrieve_session(
    user_id: Optional[str] = None,
    db: Session = Depends(get_db)
) -> JSONResponse:
    """
    Retrieve JWT token from database
    Follows Zoho SDK TokenStore.find_token() pattern
    """
    try:
        session_manager = SessionManager(db)
        result = await session_manager.retrieve_session(user_id)
        
        return JSONResponse(content=result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Session retrieve endpoint error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve session: {str(e)}")

@router.post("/session/clear")
async def clear_session(
    request: Request,
    db: Session = Depends(get_db)
) -> JSONResponse:
    """
    Clear JWT token from database
    Follows Zoho SDK TokenStore.delete_token() pattern
    """
    try:
        body = await request.json()
        user_id = body.get("user_id")
        
        session_manager = SessionManager(db)
        result = await session_manager.clear_session(user_id)
        
        return JSONResponse(content=result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Session clear endpoint error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to clear session: {str(e)}")

@router.delete("/session/clear-all")
async def clear_all_sessions(
    db: Session = Depends(get_db)
) -> JSONResponse:
    """
    Clear all JWT tokens from database
    Follows Zoho SDK TokenStore.delete_tokens() pattern
    """
    try:
        session_manager = SessionManager(db)
        result = await session_manager.clear_all_sessions()
        
        return JSONResponse(content=result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Clear all sessions endpoint error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to clear all sessions: {str(e)}")

@router.get("/session/all")
async def get_all_sessions(
    db: Session = Depends(get_db)
) -> JSONResponse:
    """
    Get all stored sessions
    Follows Zoho SDK TokenStore.get_tokens() pattern
    """
    try:
        session_manager = SessionManager(db)
        result = await session_manager.get_all_sessions()
        
        return JSONResponse(content=result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get all sessions endpoint error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get sessions: {str(e)}")

@router.post("/session/extract-user-info")
async def extract_user_info(
    request: Request,
    db: Session = Depends(get_db)
) -> JSONResponse:
    """
    Extract user information from JWT token with fallback strategies
    Demonstrates Step 5 functionality: Extract user info from token when missing
    """
    try:
        body = await request.json()
        token = body.get("token")
        
        if not token:
            raise HTTPException(status_code=400, detail="Token is required")
        
        session_manager = SessionManager(db)
        user_info = await session_manager.extract_user_info(token)
        
        return JSONResponse(content={
            "success": True,
            "user_info": user_info,
            "message": "User information extracted successfully",
            "timestamp": datetime.utcnow().isoformat()
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Extract user info endpoint error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to extract user info: {str(e)}")
