"""
Unified Token Management Service for Pipeline Pulse
Consolidates all token management functionality into a single, reliable service

REFACTORING CHANGES:
- Replaces: token_manager.py, improved_zoho_token_store.py, custom_sqlite_token_store.py
- Uses: Pure SQLAlchemy models (no raw SQL)
- Implements: Official Zoho SDK TokenStore interface
- Provides: Monitoring, alerts, automatic refresh, and production reliability
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import desc

import httpx
from app.core.config import settings
from app.core.database import get_db
from app.models.zoho_oauth_token import ZohoOAuthToken

# Zoho SDK imports with fallback
try:
    from zohocrmsdk.src.com.zoho.api.authenticator.store.token_store import TokenStore
    from zohocrmsdk.src.com.zoho.api.authenticator.oauth_token import OAuthToken
    SDK_AVAILABLE = True
except ImportError:
    # Mock classes for when SDK is not available
    class TokenStore:
        pass
    class OAuthToken:
        def __init__(self, **kwargs):
            for key, value in kwargs.items():
                setattr(self, key, value)
    SDK_AVAILABLE = False

logger = logging.getLogger(__name__)


class UnifiedTokenManager(TokenStore):
    """
    Unified token management service that consolidates all token functionality:
    - Implements Zoho SDK TokenStore interface
    - Uses pure SQLAlchemy (no raw SQL)
    - Provides monitoring and automatic refresh
    - Production-ready with comprehensive error handling
    """
    
    def __init__(self, db: Session = None):
        self.db = db
        self.client_id = settings.ZOHO_CLIENT_ID
        self.client_secret = settings.ZOHO_CLIENT_SECRET
        self.refresh_token = settings.ZOHO_REFRESH_TOKEN
        self.accounts_url = settings.ZOHO_ACCOUNTS_URL
        self._lock = asyncio.Lock()
        
        # Token refresh settings
        self.refresh_threshold_minutes = 10  # Refresh when < 10 minutes remaining
        self.max_retry_attempts = 3
        
        logger.info("✅ Unified Token Manager initialized")
    
    # === Zoho SDK TokenStore Interface Implementation ===
    
    def get_token(self, user, token) -> Optional[OAuthToken]:
        """
        Official SDK method: get_token(self, user, token)
        Retrieve token from database using SQLAlchemy models
        """
        try:
            db = self.db or next(get_db())
            
            # Extract user email from UserSignature object or string
            user_email = self._extract_user_email(user)
            client_id = self._extract_client_id(token)
            
            # Query using SQLAlchemy model
            query = db.query(ZohoOAuthToken).filter(
                ZohoOAuthToken.user_name == user_email
            )
            
            if client_id:
                query = query.filter(ZohoOAuthToken.client_id == client_id)
            
            token_record = query.order_by(ZohoOAuthToken.updated_at.desc()).first()
            
            if not self.db:  # Close if we created the session
                db.close()
            
            if token_record and token_record.access_token:
                # Check if token needs refresh
                if self._is_token_expired(token_record.expiry_time):
                    logger.info(f"Token expired for user: {user_email}, attempting refresh...")
                    refreshed_token = self._refresh_token_sync(token_record, user_email)
                    return refreshed_token
                
                return self._create_oauth_token_from_record(token_record)
            
            logger.debug(f"No valid token found for user: {user_email}")
            return None
            
        except Exception as e:
            logger.error(f"Error getting token: {e}")
            return None
    
    def save_token(self, user, token) -> None:
        """
        Official SDK method: save_token(self, user, token)
        Save token to database using SQLAlchemy models
        """
        try:
            db = self.db or next(get_db())
            
            # Extract token information
            user_email = self._extract_user_email(user)
            client_id = getattr(token, 'client_id', self.client_id)
            access_token = getattr(token, 'access_token', None)
            refresh_token = getattr(token, 'refresh_token', None)
            redirect_url = getattr(token, 'redirect_url', None)
            
            # Calculate expiry time (default 1 hour)
            expires_in = getattr(token, 'expires_in', 3600)
            expiry_time = str(int(datetime.now().timestamp()) + expires_in)
            
            # Check if token already exists
            existing_token = db.query(ZohoOAuthToken).filter(
                ZohoOAuthToken.user_name == user_email,
                ZohoOAuthToken.client_id == client_id
            ).first()
            
            if existing_token:
                # Update existing token
                existing_token.access_token = access_token
                existing_token.refresh_token = refresh_token or existing_token.refresh_token
                existing_token.expiry_time = expiry_time
                existing_token.redirect_url = redirect_url or existing_token.redirect_url
                existing_token.updated_at = datetime.now()
                logger.info(f"Updated token for user: {user_email}")
            else:
                # Create new token record
                new_token = ZohoOAuthToken(
                    user_name=user_email,
                    client_id=client_id,
                    client_secret=self.client_secret,
                    access_token=access_token,
                    refresh_token=refresh_token,
                    expiry_time=expiry_time,
                    redirect_url=redirect_url,
                    api_domain=settings.ZOHO_BASE_URL
                )
                db.add(new_token)
                logger.info(f"Created new token for user: {user_email}")
            
            db.commit()
            
            if not self.db:  # Close if we created the session
                db.close()
                
        except Exception as e:
            logger.error(f"Error saving token: {e}")
            if not self.db:
                db.rollback()
                db.close()
            raise
    
    def delete_token(self, token) -> None:
        """Delete token from database"""
        try:
            db = self.db or next(get_db())
            
            client_id = getattr(token, 'client_id', self.client_id)
            
            # Delete all tokens for this client
            deleted_count = db.query(ZohoOAuthToken).filter(
                ZohoOAuthToken.client_id == client_id
            ).delete()
            
            db.commit()
            
            if not self.db:
                db.close()
            
            logger.info(f"Deleted {deleted_count} tokens for client: {client_id}")
            
        except Exception as e:
            logger.error(f"Error deleting token: {e}")
            if not self.db:
                db.rollback()
                db.close()
            raise
    
    # === Enhanced Token Management Methods ===
    
    async def get_valid_access_token(self, force_refresh: bool = False) -> Optional[str]:
        """
        Get a valid access token with automatic refresh
        Enhanced method for application use
        """
        async with self._lock:
            try:
                db = next(get_db())
                
                # Get the most recent token
                token_record = db.query(ZohoOAuthToken).filter(
                    ZohoOAuthToken.user_name == settings.ZOHO_USER_EMAIL,
                    ZohoOAuthToken.client_id == self.client_id
                ).order_by(ZohoOAuthToken.updated_at.desc()).first()
                
                if not token_record:
                    logger.warning("No token found in database")
                    db.close()
                    return None
                
                # Check if we need to refresh
                if force_refresh or self._is_token_expired(token_record.expiry_time):
                    logger.info("Refreshing expired token...")
                    new_access_token = await self._refresh_token_async(token_record, db)
                    db.close()
                    return new_access_token
                
                access_token = token_record.access_token
                db.close()
                return access_token
                
            except Exception as e:
                logger.error(f"Error getting valid access token: {e}")
                return None
    
    async def refresh_token_if_needed(self) -> bool:
        """
        Check and refresh token if it's close to expiration
        Returns True if token was refreshed, False otherwise
        """
        try:
            db = next(get_db())
            
            token_record = db.query(ZohoOAuthToken).filter(
                ZohoOAuthToken.user_name == settings.ZOHO_USER_EMAIL,
                ZohoOAuthToken.client_id == self.client_id
            ).order_by(ZohoOAuthToken.updated_at.desc()).first()
            
            if not token_record:
                db.close()
                return False
            
            # Check if token needs refresh (within threshold)
            if self._is_token_near_expiry(token_record.expiry_time):
                logger.info("Token approaching expiry, refreshing proactively...")
                await self._refresh_token_async(token_record, db)
                db.close()
                return True
            
            db.close()
            return False
            
        except Exception as e:
            logger.error(f"Error in proactive token refresh: {e}")
            return False
    
    # === Private Helper Methods ===
    
    def _extract_user_email(self, user) -> str:
        """Extract user email from UserSignature object or string"""
        if hasattr(user, 'email'):
            return user.email
        elif hasattr(user, 'name'):
            return user.name
        elif isinstance(user, str):
            return user
        else:
            return settings.ZOHO_USER_EMAIL
    
    def _extract_client_id(self, token) -> Optional[str]:
        """Extract client ID from token object"""
        if hasattr(token, 'client_id'):
            return token.client_id
        return self.client_id
    
    def _create_oauth_token_from_record(self, record) -> OAuthToken:
        """Create OAuthToken object from database record"""
        return OAuthToken(
            client_id=record.client_id,
            client_secret=record.client_secret or self.client_secret,
            access_token=record.access_token,
            refresh_token=record.refresh_token,
            redirect_url=record.redirect_url
        )
    
    def _is_token_expired(self, expiry_time: str) -> bool:
        """Check if token is expired"""
        try:
            if not expiry_time:
                return True
            
            expiry_timestamp = int(expiry_time)
            current_timestamp = int(datetime.now().timestamp())
            
            # Add 5 minute buffer
            return current_timestamp >= (expiry_timestamp - 300)
            
        except (ValueError, TypeError):
            return True
    
    def _is_token_near_expiry(self, expiry_time: str) -> bool:
        """Check if token is near expiry (within threshold)"""
        try:
            if not expiry_time:
                return True
            
            expiry_timestamp = int(expiry_time)
            current_timestamp = int(datetime.now().timestamp())
            threshold = self.refresh_threshold_minutes * 60
            
            return current_timestamp >= (expiry_timestamp - threshold)
            
        except (ValueError, TypeError):
            return True
    
    async def _refresh_token_async(self, token_record, db: Session) -> Optional[str]:
        """Refresh token asynchronously"""
        try:
            if not token_record.refresh_token:
                logger.error("No refresh token available")
                return None
            
            token_url = f"{self.accounts_url}/oauth/v2/token"
            
            data = {
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "refresh_token": token_record.refresh_token,
                "grant_type": "refresh_token"
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    token_url,
                    data=data,
                    headers={"Content-Type": "application/x-www-form-urlencoded"}
                )
                
                if response.status_code == 200:
                    token_data = response.json()
                    new_access_token = token_data.get("access_token")
                    
                    # Update token record
                    token_record.access_token = new_access_token
                    token_record.expiry_time = str(int(datetime.now().timestamp()) + token_data.get("expires_in", 3600))
                    token_record.updated_at = datetime.now()
                    
                    db.commit()
                    
                    logger.info("Token refreshed successfully")
                    return new_access_token
                else:
                    logger.error(f"Token refresh failed: {response.status_code} - {response.text}")
                    return None
        
        except Exception as e:
            logger.error(f"Error refreshing token: {e}")
            return None
    
    def _refresh_token_sync(self, token_record, user_email: str) -> Optional[OAuthToken]:
        """Synchronous token refresh for SDK compatibility"""
        try:
            # This is a simplified sync version
            # In practice, you might want to run the async version in a thread
            import requests
            
            if not token_record.refresh_token:
                logger.error("No refresh token available")
                return None
            
            token_url = f"{self.accounts_url}/oauth/v2/token"
            
            data = {
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "refresh_token": token_record.refresh_token,
                "grant_type": "refresh_token"
            }
            
            response = requests.post(token_url, data=data)
            
            if response.status_code == 200:
                token_data = response.json()
                new_access_token = token_data.get("access_token")
                
                # Update record
                db = next(get_db())
                token_record.access_token = new_access_token
                token_record.expiry_time = str(int(datetime.now().timestamp()) + token_data.get("expires_in", 3600))
                token_record.updated_at = datetime.now()
                db.commit()
                db.close()
                
                # Return updated token
                return self._create_oauth_token_from_record(token_record)
            else:
                logger.error(f"Sync token refresh failed: {response.status_code}")
                return None
                
        except Exception as e:
            logger.error(f"Error in sync token refresh: {e}")
            return None


# Global instance for application use
_token_manager_instance = None

def get_token_manager(db: Session = None) -> UnifiedTokenManager:
    """Get the global token manager instance"""
    global _token_manager_instance
    if _token_manager_instance is None:
        _token_manager_instance = UnifiedTokenManager(db)
    return _token_manager_instance