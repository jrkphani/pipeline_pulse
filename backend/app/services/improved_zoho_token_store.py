"""
Improved Zoho TokenStore Implementation
Following official Zoho documentation with our proven manual refresh as backup
Combines official method signatures with production-ready reliability
"""

import sqlite3
import logging
import json
from datetime import datetime
from typing import Optional, List
from app.core.config import settings

try:
    # Try official zcrmsdk first
    from zcrmsdk.src.com.zoho.api.authenticator.store import TokenStore
    from zcrmsdk.src.com.zoho.api.authenticator.oauth_token import OAuthToken
    SDK_VERSION = "official_zcrmsdk"
    logger = logging.getLogger(__name__)
    logger.info("✅ Using official zcrmsdk package")
except ImportError:
    try:
        # Fallback to alternative SDK
        from zohocrmsdk.src.com.zoho.api.authenticator.store.token_store import TokenStore
        from zohocrmsdk.src.com.zoho.api.authenticator.oauth_token import OAuthToken
        SDK_VERSION = "fallback_zohocrmsdk"
        logger = logging.getLogger(__name__)
        logger.warning("⚠️ Using fallback zohocrmsdk package")
    except ImportError:
        SDK_VERSION = "none"
        logger = logging.getLogger(__name__)
        logger.error("❌ No Zoho SDK available")
        # Mock classes
        class TokenStore:
            pass
        class OAuthToken:
            pass

logger = logging.getLogger(__name__)


class ImprovedZohoTokenStore(TokenStore):
    """
    Improved TokenStore following official Zoho patterns with production reliability
    - Uses official method signatures: get_token(user, token), save_token(user, token)
    - Implements official oauthtoken table schema
    - Includes proven manual refresh as backup safety mechanism
    - Maintains backward compatibility with our existing implementation
    """
    
    def __init__(self, db_path: str = None):
        self.db_path = db_path or self._get_db_path_from_settings()
        self.table_name = "oauthtoken"  # Official table name
        self._ensure_official_table_exists()
        self._migrate_from_old_schema()
        logger.info(f"✅ Improved TokenStore initialized with official schema: {self.db_path}")
    
    def _get_db_path_from_settings(self) -> str:
        """Extract database path from settings DATABASE_URL"""
        db_url = settings.DATABASE_URL
        if db_url.startswith("sqlite:///"):
            return db_url.replace("sqlite:///", "")
        return "./pipeline_pulse.db"
    
    def _get_connection(self) -> sqlite3.Connection:
        """Get database connection"""
        return sqlite3.connect(self.db_path)
    
    def _ensure_official_table_exists(self):
        """Create official oauthtoken table structure as per Zoho documentation"""
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            
            # Official table structure from Zoho docs
            cursor.execute(f"""
                CREATE TABLE IF NOT EXISTS {self.table_name} (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_mail VARCHAR(255) NOT NULL,
                    client_id VARCHAR(255),
                    refresh_token VARCHAR(255),
                    access_token VARCHAR(255),
                    grant_token VARCHAR(255),
                    expiry_time VARCHAR(20),
                    redirect_url VARCHAR(255),
                    api_domain VARCHAR(255),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Create indexes for performance
            cursor.execute(f"CREATE INDEX IF NOT EXISTS idx_user_mail ON {self.table_name} (user_mail)")
            cursor.execute(f"CREATE INDEX IF NOT EXISTS idx_client_id ON {self.table_name} (client_id)")
            
            conn.commit()
            conn.close()
            logger.info("✅ Official oauthtoken table structure verified")
            
        except Exception as e:
            logger.error(f"❌ Error creating official token table: {e}")
            raise
    
    def _migrate_from_old_schema(self):
        """Migrate data from old zoho_oauth_tokens table to new official schema"""
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            
            # Check if old table exists
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='zoho_oauth_tokens'")
            old_table_exists = cursor.fetchone() is not None
            
            if old_table_exists:
                logger.info("🔄 Migrating from old schema to official schema...")
                
                # Copy data from old table to new table
                cursor.execute(f"""
                    INSERT OR REPLACE INTO {self.table_name} 
                    (user_mail, client_id, refresh_token, access_token, grant_token, expiry_time, redirect_url, api_domain)
                    SELECT 
                        COALESCE(user_name, id) as user_mail,
                        client_id,
                        refresh_token,
                        access_token,
                        grant_token,
                        expiry_time,
                        redirect_uri as redirect_url,
                        api_domain
                    FROM zoho_oauth_tokens 
                    WHERE user_name IS NOT NULL OR id IS NOT NULL
                """)
                
                migrated_count = cursor.rowcount
                conn.commit()
                
                if migrated_count > 0:
                    logger.info(f"✅ Migrated {migrated_count} tokens to official schema")
                    # Keep old table as backup but rename it
                    cursor.execute("ALTER TABLE zoho_oauth_tokens RENAME TO zoho_oauth_tokens_backup")
                    conn.commit()
                    logger.info("📦 Old table backed up as zoho_oauth_tokens_backup")
            
            conn.close()
            
        except Exception as e:
            logger.warning(f"⚠️ Migration from old schema failed (this is OK for new installs): {e}")
    
    # Official TokenStore Interface Implementation
    
    def get_token(self, user, token) -> Optional[OAuthToken]:
        """
        Official method signature: get_token(self, user, token)
        Retrieve token from storage with automatic refresh capability
        """
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            
            # Extract user email from UserSignature object or string
            user_email = self._extract_user_email(user)
            
            # Find token by user email and client_id
            client_id = self._extract_client_id(token)
            
            if client_id:
                cursor.execute(
                    f"SELECT * FROM {self.table_name} WHERE user_mail = ? AND client_id = ? ORDER BY updated_at DESC LIMIT 1",
                    (user_email, client_id)
                )
            else:
                cursor.execute(
                    f"SELECT * FROM {self.table_name} WHERE user_mail = ? ORDER BY updated_at DESC LIMIT 1",
                    (user_email,)
                )
            
            row = cursor.fetchone()
            conn.close()
            
            if row:
                # Row structure: id, user_mail, client_id, refresh_token, access_token, grant_token, expiry_time, redirect_url, api_domain, created_at, updated_at
                stored_token = self._create_oauth_token_from_row(row)
                
                # Check if token needs refresh (our proven safety mechanism)
                if self._is_token_expired(row[6]):  # expiry_time
                    logger.warning(f"🔄 Token expired for user: {user_email}, attempting refresh...")
                    refreshed_token = self._refresh_token_safely(row, user_email)
                    if refreshed_token:
                        logger.info(f"✅ Token refreshed successfully for user: {user_email}")
                        return refreshed_token
                    else:
                        logger.error(f"❌ Token refresh failed for user: {user_email}")
                        return None
                
                logger.debug(f"✅ Found valid token for user: {user_email}")
                return stored_token
            
            logger.debug(f"No token found for user: {user_email}")
            return None
            
        except Exception as e:
            logger.error(f"❌ Error getting token: {e}")
            return None
    
    def save_token(self, user, token) -> None:
        """
        Official method signature: save_token(self, user, token)
        Save token to storage following official schema
        """
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            
            # Extract user email
            user_email = self._extract_user_email(user)
            
            # Extract token attributes
            client_id = self._extract_token_attribute(token, 'client_id')
            refresh_token = self._extract_token_attribute(token, 'refresh_token')
            access_token = self._extract_token_attribute(token, 'access_token')
            grant_token = self._extract_token_attribute(token, 'grant_token')
            expiry_time = self._extract_token_attribute(token, 'expiry_time')
            redirect_url = self._extract_token_attribute(token, 'redirect_url') or settings.ZOHO_REDIRECT_URI
            api_domain = getattr(settings, 'ZOHO_BASE_URL', 'https://www.zohoapis.in')
            
            # Convert expiry_time to string if needed
            if expiry_time is not None and not isinstance(expiry_time, str):
                expiry_time = str(expiry_time)
            elif expiry_time is None and access_token:
                # Set default expiry time (1 hour from now) if not provided
                expiry_time = str(int(datetime.now().timestamp()) + 3600)
            
            # Check if token exists for this user and client
            cursor.execute(
                f"SELECT id FROM {self.table_name} WHERE user_mail = ? AND client_id = ? LIMIT 1",
                (user_email, client_id)
            )
            existing_id = cursor.fetchone()
            
            if existing_id:
                # Update existing token
                cursor.execute(f"""
                    UPDATE {self.table_name}
                    SET refresh_token = ?, access_token = ?, grant_token = ?, 
                        expiry_time = ?, redirect_url = ?, api_domain = ?,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE user_mail = ? AND client_id = ?
                """, (refresh_token, access_token, grant_token, expiry_time, 
                      redirect_url, api_domain, user_email, client_id))
                logger.debug(f"✅ Updated token for user: {user_email}")
            else:
                # Insert new token
                cursor.execute(f"""
                    INSERT INTO {self.table_name}
                    (user_mail, client_id, refresh_token, access_token, grant_token, 
                     expiry_time, redirect_url, api_domain)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (user_email, client_id, refresh_token, access_token, grant_token,
                      expiry_time, redirect_url, api_domain))
                logger.debug(f"✅ Saved new token for user: {user_email}")
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            logger.error(f"❌ Error saving token: {e}")
            raise
    
    def delete_token(self, token) -> None:
        """
        Official method signature: delete_token(self, token)
        Delete specific token from storage
        """
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            
            # Extract identifying information
            client_id = self._extract_token_attribute(token, 'client_id')
            refresh_token = self._extract_token_attribute(token, 'refresh_token')
            
            if client_id and refresh_token:
                cursor.execute(
                    f"DELETE FROM {self.table_name} WHERE client_id = ? AND refresh_token = ?",
                    (client_id, refresh_token)
                )
                deleted_count = cursor.rowcount
            elif client_id:
                cursor.execute(
                    f"DELETE FROM {self.table_name} WHERE client_id = ?",
                    (client_id,)
                )
                deleted_count = cursor.rowcount
            else:
                logger.warning("❌ Cannot delete token: insufficient identifying information")
                return
            
            conn.commit()
            conn.close()
            
            if deleted_count > 0:
                logger.info(f"✅ Deleted {deleted_count} token(s)")
            else:
                logger.warning("⚠️ No tokens found to delete")
            
        except Exception as e:
            logger.error(f"❌ Error deleting token: {e}")
            raise
    
    def get_tokens(self) -> List[OAuthToken]:
        """
        Official method signature: get_tokens(self)
        Return all stored tokens
        """
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            cursor.execute(f"SELECT * FROM {self.table_name} ORDER BY updated_at DESC")
            rows = cursor.fetchall()
            conn.close()
            
            tokens = []
            for row in rows:
                token = self._create_oauth_token_from_row(row)
                if token:
                    tokens.append(token)
            
            logger.debug(f"✅ Retrieved {len(tokens)} tokens from storage")
            return tokens
            
        except Exception as e:
            logger.error(f"❌ Error getting all tokens: {e}")
            return []
    
    # Additional abstract methods that may be required by some SDK versions
    
    def delete_tokens(self) -> None:
        """
        Delete all tokens from storage
        Required by some TokenStore implementations
        """
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            cursor.execute(f"DELETE FROM {self.table_name}")
            deleted_count = cursor.rowcount
            conn.commit()
            conn.close()
            
            logger.info(f"✅ Deleted all tokens: {deleted_count} records removed")
            
        except Exception as e:
            logger.error(f"❌ Error deleting all tokens: {e}")
            raise
    
    def find_token(self, token) -> Optional[OAuthToken]:
        """
        Legacy method signature support for backward compatibility
        Redirects to get_token with default user
        """
        try:
            # Create a default user for legacy compatibility
            default_user = getattr(settings, 'ZOHO_USER_EMAIL', 'admin@1cloudhub.com')
            return self.get_token(default_user, token)
        except Exception as e:
            logger.error(f"❌ Error in legacy find_token: {e}")
            return None
    
    def find_token_by_id(self, token_id: str) -> Optional[OAuthToken]:
        """
        Find token by unique identifier
        Required by some TokenStore implementations
        """
        try:
            conn = self._get_connection()
            cursor = conn.cursor()
            
            # Try to find by various ID fields
            cursor.execute(
                f"SELECT * FROM {self.table_name} WHERE id = ? OR user_mail = ? OR client_id = ? LIMIT 1",
                (token_id, token_id, token_id)
            )
            
            row = cursor.fetchone()
            conn.close()
            
            if row:
                token = self._create_oauth_token_from_row(row)
                logger.debug(f"✅ Found token by ID: {token_id}")
                return token
            
            logger.debug(f"No token found with ID: {token_id}")
            return None
            
        except Exception as e:
            logger.error(f"❌ Error finding token by ID: {e}")
            return None
    
    # Helper methods for token management
    
    def _extract_user_email(self, user) -> str:
        """Extract email from UserSignature object or string"""
        if hasattr(user, 'email'):
            return user.email
        elif hasattr(user, 'get_email'):
            return user.get_email()
        elif isinstance(user, str):
            return user
        else:
            return str(user)
    
    def _extract_client_id(self, token) -> Optional[str]:
        """Extract client_id from token object"""
        return self._extract_token_attribute(token, 'client_id')
    
    def _extract_token_attribute(self, token, attribute: str):
        """Extract attribute from token object with multiple fallback patterns"""
        if hasattr(token, attribute):
            return getattr(token, attribute)
        elif hasattr(token, f'_{attribute}'):
            return getattr(token, f'_{attribute}')
        elif hasattr(token, f'get_{attribute}'):
            method = getattr(token, f'get_{attribute}')
            return method() if callable(method) else method
        return None
    
    def _create_oauth_token_from_row(self, row) -> Optional[OAuthToken]:
        """Create OAuthToken object from database row"""
        try:
            # Row structure: id, user_mail, client_id, refresh_token, access_token, grant_token, expiry_time, redirect_url, api_domain, created_at, updated_at
            token = OAuthToken(
                client_id=row[2],  # client_id
                client_secret=settings.ZOHO_CLIENT_SECRET,  # From settings
                refresh_token=row[3],  # refresh_token
                access_token=row[4],  # access_token
                redirect_url=row[7]  # redirect_url
            )
            
            # Set additional attributes if possible
            if hasattr(token, 'expiry_time') or hasattr(token, '_expiry_time'):
                setattr(token, 'expiry_time', row[6])
            
            return token
            
        except Exception as e:
            logger.error(f"❌ Error creating OAuthToken from row: {e}")
            return None
    
    def _is_token_expired(self, expiry_time: str) -> bool:
        """Check if token is expired (our proven logic)"""
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
            logger.error(f"❌ Error checking token expiry: {e}")
            return True
    
    def _refresh_token_safely(self, db_row, user_email: str) -> Optional[OAuthToken]:
        """
        Safely refresh expired token using our proven manual approach
        This is our backup safety mechanism when SDK auto-refresh fails
        """
        try:
            import urllib.request
            import urllib.parse
            import json
            
            # Extract data from database row
            client_id = db_row[2]
            refresh_token = db_row[3]
            redirect_url = db_row[7]
            
            logger.debug(f"🔄 Refreshing token for user: {user_email}")
            
            if not refresh_token or not client_id:
                logger.error("❌ Missing required data for token refresh")
                return None
            
            # Use our proven manual refresh method
            token_url = f"{settings.ZOHO_ACCOUNTS_URL}/oauth/v2/token"
            
            data = {
                "client_id": client_id,
                "client_secret": settings.ZOHO_CLIENT_SECRET,
                "refresh_token": refresh_token,
                "grant_type": "refresh_token"
            }
            
            # Encode and make request
            data_encoded = urllib.parse.urlencode(data).encode('utf-8')
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
                    logger.info("✅ Token refresh API call successful")
            except urllib.error.HTTPError as e:
                error_text = e.read().decode('utf-8') if e.fp else str(e)
                logger.error(f"❌ Token refresh failed: {e.code} - {error_text}")
                return None
            
            # Create new token with refreshed access token
            new_access_token = token_data.get("access_token")
            expires_in = token_data.get("expires_in", 3600)
            
            if new_access_token:
                # Update database directly
                new_expiry_time = int(datetime.now().timestamp()) + expires_in
                
                conn = self._get_connection()
                cursor = conn.cursor()
                cursor.execute(f"""
                    UPDATE {self.table_name}
                    SET access_token = ?, expiry_time = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE user_mail = ? AND client_id = ?
                """, (new_access_token, str(new_expiry_time), user_email, client_id))
                conn.commit()
                conn.close()
                
                # Create new OAuthToken object
                new_token = OAuthToken(
                    client_id=client_id,
                    client_secret=settings.ZOHO_CLIENT_SECRET,
                    refresh_token=refresh_token,
                    access_token=new_access_token,
                    redirect_url=redirect_url
                )
                
                setattr(new_token, 'expiry_time', str(new_expiry_time))
                
                logger.info("✅ Token refreshed and saved successfully")
                return new_token
            
            return None
            
        except Exception as e:
            logger.error(f"❌ Error in safe token refresh: {e}")
            return None