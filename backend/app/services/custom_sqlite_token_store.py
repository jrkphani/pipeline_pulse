"""
Custom SQLite Token Store for Zoho SDK
Implements the TokenStore interface to work with SQLite database
"""

import sqlite3
import logging
from datetime import datetime
from typing import List, Optional
from app.core.config import settings

try:
    from zohocrmsdk8_0.src.com.zoho.api.authenticator.store.token_store import TokenStore
    from zohocrmsdk8_0.src.com.zoho.api.authenticator.oauth_token import OAuthToken
    SDK_AVAILABLE = True
except ImportError:
    try:
        from zohocrmsdk.src.com.zoho.api.authenticator.store.token_store import TokenStore
        from zohocrmsdk.src.com.zoho.api.authenticator.oauth_token import OAuthToken
        SDK_AVAILABLE = True
    except ImportError:
        SDK_AVAILABLE = False
        
        # Mock classes for when SDK is not available
        class TokenStore:
            pass
            
        class OAuthToken:
            pass

logger = logging.getLogger(__name__)


class SQLiteTokenStore(TokenStore):
    """Custom token store implementation for SQLite database"""
    
    def __init__(self, db_path: str = None, table_name: str = "zoho_oauth_tokens"):
        self.db_path = db_path or self._get_db_path_from_settings()
        self.table_name = table_name
        logger.info(f"SQLiteTokenStore initialized with database: {self.db_path}")
    
    def _get_db_path_from_settings(self) -> str:
        """Extract database path from settings DATABASE_URL"""
        db_url = settings.DATABASE_URL
        if db_url.startswith("sqlite:///"):
            return db_url.replace("sqlite:///", "")
        return "./pipeline_pulse.db"
    
    def _get_connection(self) -> sqlite3.Connection:
        """Get database connection"""
        return sqlite3.connect(self.db_path)
    
    def find_token(self, token: OAuthToken) -> Optional[OAuthToken]:
        """Find token by token attributes"""
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            
            # Find token by client_id and user_name combination
            client_id = getattr(token, 'client_id', None) or getattr(token, '_client_id', None)
            user_email = getattr(token, 'id', None) or getattr(token, '_id', None) or 'admin@1cloudhub.com'
            
            if client_id:
                cursor.execute(
                    f"SELECT * FROM {self.table_name} WHERE client_id = ? AND user_name = ? LIMIT 1",
                    (client_id, user_email)
                )
            else:
                cursor.execute(
                    f"SELECT * FROM {self.table_name} WHERE user_name = ? LIMIT 1",
                    (user_email,)
                )
            
            row = cursor.fetchone()
            conn.close()
            
            if row:
                # Create OAuthToken from database row
                # Row format: id, user_name, client_id, client_secret, refresh_token, access_token, grant_token, expiry_time, redirect_url, api_domain
                stored_token = OAuthToken(
                    client_id=row[2],  # client_id
                    client_secret=row[3],  # client_secret
                    refresh_token=row[4],  # refresh_token
                    access_token=row[5],  # access_token
                    redirect_url=row[8],  # redirect_url
                    id=row[0]  # id (primary key)
                )
                
                # Check if token is expired and refresh if needed
                if self._is_token_expired(row[7]):  # expiry_time
                    logger.warning(f"🔄 Token expired for user: {user_email}, attempting automatic refresh...")
                    # Pass the raw database data for refresh instead of the OAuthToken object
                    refreshed_token = self._refresh_token_from_db_row(row)
                    if refreshed_token:
                        logger.info(f"✅ Token refreshed successfully for user: {user_email}")
                        return refreshed_token
                    else:
                        logger.error(f"❌ Token refresh failed for user: {user_email}")
                        return None
                
                logger.info(f"✅ Found valid token for user: {user_email} (expires in {int(row[7]) - int(datetime.now().timestamp())} seconds)")
                return stored_token
            
            logger.debug(f"No token found for user: {user_email}")
            return None
            
        except Exception as e:
            logger.error(f"Error finding token: {e}")
            return None
    
    def save_token(self, token: OAuthToken) -> None:
        """Save token to database"""
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            
            # Extract token attributes
            token_id = getattr(token, 'id', None) or getattr(token, '_id', None) or 'admin@1cloudhub.com'
            client_id = getattr(token, 'client_id', None) or getattr(token, '_client_id', None)
            client_secret = getattr(token, 'client_secret', None) or getattr(token, '_client_secret', None)
            refresh_token = getattr(token, 'refresh_token', None) or getattr(token, '_refresh_token', None)
            access_token = getattr(token, 'access_token', None) or getattr(token, '_access_token', None)
            grant_token = getattr(token, 'grant_token', None) or getattr(token, '_grant_token', None)
            redirect_url = getattr(token, 'redirect_url', None) or getattr(token, '_redirect_url', None)
            expiry_time = getattr(token, 'expiry_time', None) or getattr(token, '_expiry_time', None)
            
            # Convert expiry_time to string if it's not already
            if expiry_time is not None and not isinstance(expiry_time, str):
                expiry_time = str(expiry_time)
            elif expiry_time is None:
                # Set default expiry time (1 hour from now) in seconds
                expiry_time = str(int(datetime.now().timestamp()) + 3600)
            
            # Check if token exists
            cursor.execute(f"SELECT COUNT(*) FROM {self.table_name} WHERE id = ?", (token_id,))
            exists = cursor.fetchone()[0] > 0
            
            if exists:
                # Update existing token
                cursor.execute(f"""
                    UPDATE {self.table_name}
                    SET client_id = ?, client_secret = ?, refresh_token = ?, 
                        access_token = ?, grant_token = ?, redirect_url = ?, 
                        expiry_time = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                """, (client_id, client_secret, refresh_token, access_token, 
                      grant_token, redirect_url, expiry_time, token_id))
                logger.debug(f"Updated token for user: {token_id}")
            else:
                # Insert new token
                cursor.execute(f"""
                    INSERT INTO {self.table_name}
                    (id, user_name, client_id, client_secret, refresh_token, 
                     access_token, grant_token, expiry_time, redirect_url, api_domain)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (token_id, token_id, client_id, client_secret, refresh_token,
                      access_token, grant_token, expiry_time, redirect_url, 
                      'https://www.zohoapis.in'))
                logger.debug(f"Saved new token for user: {token_id}")
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            logger.error(f"Error saving token: {e}")
            raise
    
    def delete_token(self, token_id: str) -> None:
        """Delete token by ID"""
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            cursor.execute(f"DELETE FROM {self.table_name} WHERE id = ?", (token_id,))
            conn.commit()
            conn.close()
            logger.debug(f"Deleted token for user: {token_id}")
        except Exception as e:
            logger.error(f"Error deleting token: {e}")
            raise
    
    def get_tokens(self) -> List[OAuthToken]:
        """Get all stored tokens"""
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            cursor.execute(f"SELECT * FROM {self.table_name}")
            rows = cursor.fetchall()
            conn.close()
            
            tokens = []
            for row in rows:
                token = OAuthToken(
                    client_id=row[2],  # client_id
                    client_secret=row[3],  # client_secret
                    refresh_token=row[4],  # refresh_token
                    access_token=row[5],  # access_token
                    redirect_url=row[8],  # redirect_url
                    id=row[0]  # id (primary key)
                )
                tokens.append(token)
            
            logger.debug(f"Retrieved {len(tokens)} tokens from database")
            return tokens
            
        except Exception as e:
            logger.error(f"Error getting tokens: {e}")
            return []
    
    def delete_tokens(self) -> None:
        """Delete all tokens"""
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            cursor.execute(f"DELETE FROM {self.table_name}")
            conn.commit()
            conn.close()
            logger.debug("Deleted all tokens from database")
        except Exception as e:
            logger.error(f"Error deleting all tokens: {e}")
            raise
    
    def find_token_by_id(self, token_id: str) -> Optional[OAuthToken]:
        """Find token by ID"""
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            cursor.execute(f"SELECT * FROM {self.table_name} WHERE id = ? LIMIT 1", (token_id,))
            row = cursor.fetchone()
            conn.close()
            
            if row:
                token = OAuthToken(
                    client_id=row[2],  # client_id
                    client_secret=row[3],  # client_secret
                    refresh_token=row[4],  # refresh_token
                    access_token=row[5],  # access_token
                    redirect_url=row[8],  # redirect_url
                    id=row[0]  # id (primary key)
                )
                logger.debug(f"Found token by ID: {token_id}")
                return token
            
            logger.debug(f"No token found with ID: {token_id}")
            return None
            
        except Exception as e:
            logger.error(f"Error finding token by ID: {e}")
            return None
    
    def _is_token_expired(self, expiry_time: str) -> bool:
        """Check if token is expired"""
        try:
            if not expiry_time:
                return True
            
            # Handle both seconds and milliseconds
            expiry_timestamp = int(expiry_time)
            current_timestamp = int(datetime.now().timestamp())
            
            # If expiry_time is in milliseconds, convert to seconds
            if expiry_timestamp > 9999999999:  # More than 10 digits = milliseconds
                expiry_timestamp = expiry_timestamp // 1000
            
            # Add 5 minute buffer for refresh
            return current_timestamp >= (expiry_timestamp - 300)
            
        except Exception as e:
            logger.error(f"Error checking token expiry: {e}")
            return True
    
    def _refresh_token(self, token: OAuthToken) -> Optional[OAuthToken]:
        """Refresh expired token"""
        try:
            import httpx
            from app.core.config import settings
            
            # Debug: Check what attributes are available
            logger.debug(f"Token attributes: {dir(token)}")
            
            refresh_token = getattr(token, 'refresh_token', None) or getattr(token, '_refresh_token', None)
            client_id = getattr(token, 'client_id', None) or getattr(token, '_client_id', None)
            client_secret = getattr(token, 'client_secret', None) or getattr(token, '_client_secret', None)
            
            logger.debug(f"Extracted - client_id: {client_id}, refresh_token: {'***' if refresh_token else None}, client_secret: {'***' if client_secret else None}")
            
            if not refresh_token or not client_id or not client_secret:
                logger.error(f"Missing required token data for refresh - refresh_token: {bool(refresh_token)}, client_id: {bool(client_id)}, client_secret: {bool(client_secret)}")
                return None
            
            # Use urllib for HTTP requests since it's built-in
            import urllib.request
            import urllib.parse
            import json
            
            token_url = f"{settings.ZOHO_ACCOUNTS_URL}/oauth/v2/token"
            
            data = {
                "client_id": client_id,
                "client_secret": client_secret,
                "refresh_token": refresh_token,
                "grant_type": "refresh_token"
            }
            
            # Encode the data
            data_encoded = urllib.parse.urlencode(data).encode('utf-8')
            
            # Create the request
            req = urllib.request.Request(
                token_url,
                data=data_encoded,
                headers={'Content-Type': 'application/x-www-form-urlencoded'},
                method='POST'
            )
            
            try:
                with urllib.request.urlopen(req) as response:
                    response_text = response.read().decode('utf-8')
                    token_data = json.loads(response_text)
            except urllib.error.HTTPError as e:
                error_text = e.read().decode('utf-8') if e.fp else str(e)
                logger.error(f"Token refresh failed: {e.code} - {error_text}")
                token_data = None
            except Exception as e:
                logger.error(f"Token refresh request failed: {e}")
                token_data = None
            
            if not token_data:
                return None
            
            # Create new token with refreshed access token
            new_access_token = token_data.get("access_token")
            expires_in = token_data.get("expires_in", 3600)
            
            if new_access_token:
                # Update token with new access token and expiry time
                new_expiry_time = int(datetime.now().timestamp()) + expires_in
                
                new_token = OAuthToken(
                    client_id=client_id,
                    client_secret=client_secret,
                    refresh_token=refresh_token,
                    access_token=new_access_token,
                    redirect_url=getattr(token, 'redirect_url', None) or getattr(token, '_redirect_url', None),
                    id=getattr(token, 'id', None) or getattr(token, '_id', None)
                )
                
                # Set expiry time manually since OAuthToken doesn't have expiry_time in constructor
                setattr(new_token, 'expiry_time', str(new_expiry_time))
                
                # Save refreshed token
                self.save_token(new_token)
                
                logger.info("Token refreshed and saved successfully")
                return new_token
            
            return None
            
        except Exception as e:
            logger.error(f"Error refreshing token: {e}")
            return None
    
    def _refresh_token_from_db_row(self, db_row) -> Optional[OAuthToken]:
        """Refresh expired token using database row data"""
        try:
            from app.core.config import settings
            
            # Extract data from database row
            # Row format: id, user_name, client_id, client_secret, refresh_token, access_token, grant_token, expiry_time, redirect_url, api_domain
            user_id = db_row[0]
            client_id = db_row[2]
            client_secret = db_row[3]
            refresh_token = db_row[4]
            redirect_url = db_row[8]
            
            logger.debug(f"Refreshing token for user: {user_id}")
            
            if not refresh_token or not client_id or not client_secret:
                logger.error(f"Missing required token data for refresh - refresh_token: {bool(refresh_token)}, client_id: {bool(client_id)}, client_secret: {bool(client_secret)}")
                return None
            
            # Use urllib for HTTP requests since it's built-in
            import urllib.request
            import urllib.parse
            import json
            
            token_url = f"{settings.ZOHO_ACCOUNTS_URL}/oauth/v2/token"
            
            data = {
                "client_id": client_id,
                "client_secret": client_secret,
                "refresh_token": refresh_token,
                "grant_type": "refresh_token"
            }
            
            # Encode the data
            data_encoded = urllib.parse.urlencode(data).encode('utf-8')
            
            # Create the request
            req = urllib.request.Request(
                token_url,
                data=data_encoded,
                headers={'Content-Type': 'application/x-www-form-urlencoded'},
                method='POST'
            )
            
            try:
                with urllib.request.urlopen(req) as response:
                    response_text = response.read().decode('utf-8')
                    token_data = json.loads(response_text)
                    logger.info("🔄 Token refresh API call successful")
            except urllib.error.HTTPError as e:
                error_text = e.read().decode('utf-8') if e.fp else str(e)
                logger.error(f"❌ Token refresh failed: {e.code} - {error_text}")
                return None
            except Exception as e:
                logger.error(f"❌ Token refresh request failed: {e}")
                return None
            
            if not token_data:
                return None
            
            # Create new token with refreshed access token
            new_access_token = token_data.get("access_token")
            expires_in = token_data.get("expires_in", 3600)
            
            if new_access_token:
                # Update token with new access token and expiry time
                new_expiry_time = int(datetime.now().timestamp()) + expires_in
                
                new_token = OAuthToken(
                    client_id=client_id,
                    client_secret=client_secret,
                    refresh_token=refresh_token,
                    access_token=new_access_token,
                    redirect_url=redirect_url,
                    id=user_id
                )
                
                # Set expiry time manually since OAuthToken doesn't have expiry_time in constructor
                setattr(new_token, 'expiry_time', str(new_expiry_time))
                
                # Save refreshed token
                self.save_token(new_token)
                
                logger.info("✅ Token refreshed and saved successfully")
                return new_token
            
            return None
            
        except Exception as e:
            logger.error(f"Error refreshing token from DB row: {e}")
            return None