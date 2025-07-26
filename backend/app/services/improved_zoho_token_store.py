"""
Improved Zoho TokenStore Implementation
Following official Zoho documentation with our proven manual refresh as backup
Combines official method signatures with production-ready reliability
"""

import sqlite3
import logging
import json
import traceback
import uuid
from datetime import datetime
from typing import Optional, List
from app.core.config import settings

try:
    # Official Zoho CRM SDK v8.0 imports
    from zohocrmsdk.src.com.zoho.api.authenticator.store.token_store import TokenStore
    from zohocrmsdk.src.com.zoho.api.authenticator.oauth_token import OAuthToken
    SDK_VERSION = "zohocrmsdk8_0"
    logger = logging.getLogger(__name__)
    logger.info("✅ Using official zohocrmsdk8_0 package")
except ImportError as e:
    SDK_VERSION = "none"
    logger = logging.getLogger(__name__)
    logger.error(f"❌ No Zoho SDK available: {e}")
    # Mock classes for type hints
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
    
    def save_token(self, *args) -> None:
        """
        Flexible method to save a token using either:
        - save_token(user, token) - correct official interface
        - save_token(token) - buggy SDK call
        """
        # Generate unique correlation ID for this request
        correlation_id = str(uuid.uuid4())[:8]
        call_timestamp = datetime.now().isoformat()
        
        # Capture stack trace to identify the caller
        stack_trace = traceback.format_stack()
        caller_info = []
        for frame in stack_trace[-5:-1]:  # Get last 4 frames excluding current
            if 'save_token' not in frame:
                caller_info.append(frame.strip())
        
        # Log comprehensive debugging information at the start
        num_args = len(args)
        arg_types = [type(arg).__name__ for arg in args]
        
        if num_args == 2:
            # Expected correct call: save_token(user, token)
            user, token = args
            user_type = type(user).__name__
            token_type = type(token).__name__
            
            logger.debug(f"[{correlation_id}] save_token called with CORRECT signature at {call_timestamp}")
            logger.debug(f"[{correlation_id}] Arguments: {num_args} args - user({user_type}), token({token_type})")
            logger.debug(f"[{correlation_id}] User object: {user}")
            logger.debug(f"[{correlation_id}] Token attributes: {[attr for attr in dir(token) if not attr.startswith('_')]}")
            logger.debug(f"[{correlation_id}] Caller stack:\n{''.join(caller_info)}")
            
        elif num_args == 1:
            # Buggy SDK call: save_token(token)
            token = args[0]
            token_type = type(token).__name__
            
            logger.warning(f"[{correlation_id}] save_token called with BUGGY signature at {call_timestamp}")
            logger.warning(f"[{correlation_id}] Arguments: {num_args} args - token({token_type}) ONLY")
            logger.warning(f"[{correlation_id}] Missing user parameter - this is a bug in the SDK call")
            logger.warning(f"[{correlation_id}] Token attributes: {[attr for attr in dir(token) if not attr.startswith('_')]}")
            logger.warning(f"[{correlation_id}] Caller stack:\n{''.join(caller_info)}")
            
        else:
            # Invalid call
            logger.error(f"[{correlation_id}] save_token called with INVALID signature at {call_timestamp}")
            logger.error(f"[{correlation_id}] Arguments: {num_args} args - types: {arg_types}")
            logger.error(f"[{correlation_id}] Caller stack:\n{''.join(caller_info)}")
            raise ValueError(f"Invalid number of arguments provided to save_token: {num_args}")
        
        try:
            conn = self._get_connection()
            cursor = conn.cursor()

            # Handle both possible method signatures
            if len(args) == 2:
                user, token = args
                user_email = self._extract_user_email(user)
                logger.debug(f"[{correlation_id}] Extracted user email: {user_email}")
            elif len(args) == 1:
                token, = args
                user_email = getattr(token, 'user_mail', None) or 'default_email@example.com'
                logger.warning(f"[{correlation_id}] Using fallback user email: {user_email}")
            else:
                raise ValueError("Invalid number of arguments provided to save_token")

            # Extract token attributes with detailed logging
            client_id = self._extract_token_attribute(token, 'client_id')
            refresh_token = self._extract_token_attribute(token, 'refresh_token')
            access_token = self._extract_token_attribute(token, 'access_token')
            grant_token = self._extract_token_attribute(token, 'grant_token')
            expiry_time = self._extract_token_attribute(token, 'expiry_time')
            redirect_url = self._extract_token_attribute(token, 'redirect_url') or settings.ZOHO_REDIRECT_URI
            api_domain = getattr(settings, 'ZOHO_BASE_URL', 'https://www.zohoapis.in')
            
            # Log extracted token information (without sensitive data)
            logger.debug(f"[{correlation_id}] Token data extracted:")
            logger.debug(f"[{correlation_id}]   - client_id: {client_id}")
            logger.debug(f"[{correlation_id}]   - refresh_token: {'***' if refresh_token else None}")
            logger.debug(f"[{correlation_id}]   - access_token: {'***' if access_token else None}")
            logger.debug(f"[{correlation_id}]   - grant_token: {'***' if grant_token else None}")
            logger.debug(f"[{correlation_id}]   - expiry_time: {expiry_time}")
            logger.debug(f"[{correlation_id}]   - redirect_url: {redirect_url}")
            logger.debug(f"[{correlation_id}]   - api_domain: {api_domain}")

            # Convert expiry_time to string if needed
            if expiry_time is not None and not isinstance(expiry_time, str):
                expiry_time = str(expiry_time)
                logger.debug(f"[{correlation_id}] Converted expiry_time to string: {expiry_time}")
            elif expiry_time is None and access_token:
                # Set default expiry time (1 hour from now) if not provided
                expiry_time = str(int(datetime.now().timestamp()) + 3600)
                logger.debug(f"[{correlation_id}] Set default expiry_time: {expiry_time}")

            # Check if token exists for this user and client
            cursor.execute(
                f"SELECT id FROM {self.table_name} WHERE user_mail = ? AND client_id = ? LIMIT 1",
                (user_email, client_id)
            )
            existing_id = cursor.fetchone()

            if existing_id:
                # Update existing token
                logger.debug(f"[{correlation_id}] Updating existing token for user: {user_email}")
                cursor.execute(f"""
                    UPDATE {self.table_name}
                    SET refresh_token = ?, access_token = ?, grant_token = ?, 
                        expiry_time = ?, redirect_url = ?, api_domain = ?,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE user_mail = ? AND client_id = ?
                """, (refresh_token, access_token, grant_token, expiry_time, 
                      redirect_url, api_domain, user_email, client_id))
                logger.debug(f"[{correlation_id}] ✅ Updated token for user: {user_email}")
            else:
                # Insert new token
                logger.debug(f"[{correlation_id}] Inserting new token for user: {user_email}")
                cursor.execute(f"""
                    INSERT INTO {self.table_name}
                    (user_mail, client_id, refresh_token, access_token, grant_token, 
                     expiry_time, redirect_url, api_domain)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (user_email, client_id, refresh_token, access_token, grant_token,
                      expiry_time, redirect_url, api_domain))
                logger.debug(f"[{correlation_id}] ✅ Saved new token for user: {user_email}")

            conn.commit()
            conn.close()
            
            logger.debug(f"[{correlation_id}] save_token completed successfully at {datetime.now().isoformat()}")
            
        except Exception as e:
            logger.error(f"[{correlation_id}] ❌ Error saving token: {e}")
            logger.error(f"[{correlation_id}] Exception details: {traceback.format_exc()}")
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
        """Extract email from UserSignature object or string with comprehensive error handling"""
        if not user:
            logger.warning("⚠️ User is None, using default email")
            return getattr(settings, 'ZOHO_USER_EMAIL', 'admin@1cloudhub.com')
        
        try:
            # Try direct email attribute access
            if hasattr(user, 'email'):
                email = getattr(user, 'email', None)
                if email and isinstance(email, str) and email.strip():
                    validated_email = self._validate_email_format(email.strip())
                    if validated_email:
                        return validated_email
            
            # Try email getter method
            if hasattr(user, 'get_email'):
                try:
                    email_method = getattr(user, 'get_email')
                    if callable(email_method):
                        email = email_method()
                        if email and isinstance(email, str) and email.strip():
                            validated_email = self._validate_email_format(email.strip())
                            if validated_email:
                                return validated_email
                except Exception as e:
                    logger.warning(f"⚠️ Error calling get_email method: {e}")
            
            # Try string conversion if user is already a string
            if isinstance(user, str):
                email = user.strip()
                if email:
                    validated_email = self._validate_email_format(email)
                    if validated_email:
                        return validated_email
            
            # Try dictionary-like access
            if isinstance(user, dict):
                for key in ['email', 'user_email', 'mail', 'user_mail']:
                    if key in user:
                        email = user[key]
                        if email and isinstance(email, str) and email.strip():
                            validated_email = self._validate_email_format(email.strip())
                            if validated_email:
                                return validated_email
            
            # Try to extract from object attributes
            if hasattr(user, '__dict__'):
                user_dict = user.__dict__
                for key in ['email', 'user_email', 'mail', 'user_mail']:
                    if key in user_dict:
                        email = user_dict[key]
                        if email and isinstance(email, str) and email.strip():
                            validated_email = self._validate_email_format(email.strip())
                            if validated_email:
                                return validated_email
            
            # Last resort: try string representation
            user_str = str(user)
            if user_str and user_str != 'None':
                # Check if the string representation looks like an email
                if '@' in user_str and '.' in user_str:
                    validated_email = self._validate_email_format(user_str)
                    if validated_email:
                        return validated_email
            
            logger.warning(f"⚠️ Could not extract valid email from user object of type {type(user).__name__}, using default")
            return getattr(settings, 'ZOHO_USER_EMAIL', 'admin@1cloudhub.com')
            
        except Exception as e:
            logger.error(f"❌ Unexpected error extracting user email: {e}")
            return getattr(settings, 'ZOHO_USER_EMAIL', 'admin@1cloudhub.com')
    
    def _validate_email_format(self, email: str) -> Optional[str]:
        """Validate email format with basic checks"""
        try:
            if not email or not isinstance(email, str):
                return None
            
            email = email.strip().lower()
            
            # Basic email validation
            if not email or len(email) < 5:  # Minimum: a@b.c
                return None
            
            if email.count('@') != 1:
                return None
            
            local_part, domain_part = email.split('@')
            
            # Validate local part
            if not local_part or len(local_part) < 1:
                return None
            
            # Validate domain part
            if not domain_part or '.' not in domain_part:
                return None
            
            # Check for valid characters (basic check)
            if any(char in email for char in [' ', '\t', '\n', '\r']):
                return None
            
            return email
            
        except Exception as e:
            logger.warning(f"⚠️ Error validating email format: {e}")
            return None
    
    def _extract_client_id(self, token) -> Optional[str]:
        """Extract client_id from token object"""
        return self._extract_token_attribute(token, 'client_id')
    
    def _extract_token_attribute(self, token, attribute: str):
        """Extract attribute from token object with multiple fallback patterns and robust error handling"""
        if not token:
            logger.warning(f"⚠️ Token is None when extracting attribute: {attribute}")
            return None
        
        if not isinstance(attribute, str) or not attribute.strip():
            logger.warning(f"⚠️ Invalid attribute name: {attribute}")
            return None
        
        try:
            # Direct attribute access
            if hasattr(token, attribute):
                value = getattr(token, attribute, None)
                if value is not None:
                    return self._validate_token_attribute_value(value, attribute)
            
            # Private attribute access (with underscore prefix)
            private_attr = f'_{attribute}'
            if hasattr(token, private_attr):
                value = getattr(token, private_attr, None)
                if value is not None:
                    return self._validate_token_attribute_value(value, attribute)
            
            # Method-based access
            getter_method = f'get_{attribute}'
            if hasattr(token, getter_method):
                try:
                    method = getattr(token, getter_method)
                    if callable(method):
                        value = method()
                        if value is not None:
                            return self._validate_token_attribute_value(value, attribute)
                    else:
                        # It's a property, not a method
                        if method is not None:
                            return self._validate_token_attribute_value(method, attribute)
                except Exception as e:
                    logger.warning(f"⚠️ Error calling getter method {getter_method}: {e}")
            
            # Dictionary-like access if token is a dict
            if isinstance(token, dict):
                if attribute in token:
                    value = token[attribute]
                    if value is not None:
                        return self._validate_token_attribute_value(value, attribute)
                
                # Try with underscore prefix for dict
                private_key = f'_{attribute}'
                if private_key in token:
                    value = token[private_key]
                    if value is not None:
                        return self._validate_token_attribute_value(value, attribute)
            
            # Last resort: try to access as string representation
            if hasattr(token, '__dict__'):
                token_dict = token.__dict__
                if attribute in token_dict:
                    value = token_dict[attribute]
                    if value is not None:
                        return self._validate_token_attribute_value(value, attribute)
            
            logger.debug(f"🔍 No value found for attribute '{attribute}' in token of type {type(token).__name__}")
            return None
            
        except Exception as e:
            logger.error(f"❌ Unexpected error extracting attribute '{attribute}': {e}")
            return None
    
    def _validate_token_attribute_value(self, value, attribute: str):
        """Validate and sanitize token attribute values"""
        try:
            # Handle None values
            if value is None:
                return None
            
            # Handle empty strings
            if isinstance(value, str) and not value.strip():
                logger.debug(f"🔍 Empty string value for attribute '{attribute}'")
                return None
            
            # Handle numeric values that should be strings
            if attribute == 'expiry_time' and isinstance(value, (int, float)):
                return str(int(value))
            
            # Handle boolean values
            if isinstance(value, bool):
                return value
            
            # Handle string values
            if isinstance(value, str):
                # Sanitize string values
                sanitized = value.strip()
                
                # Special validation for sensitive attributes
                if attribute in ['client_id', 'client_secret', 'refresh_token', 'access_token']:
                    if len(sanitized) < 10:  # Minimum reasonable length for tokens
                        logger.warning(f"⚠️ Suspiciously short value for {attribute}: {len(sanitized)} characters")
                        return None
                
                # Validate URLs
                if attribute in ['redirect_url', 'api_domain']:
                    if not (sanitized.startswith('http://') or sanitized.startswith('https://')):
                        if attribute == 'api_domain':
                            # Add https:// prefix if missing for API domain
                            sanitized = f'https://{sanitized}'
                        else:
                            logger.warning(f"⚠️ Invalid URL format for {attribute}: {sanitized}")
                            return None
                
                return sanitized
            
            # Handle other types by converting to string
            if hasattr(value, '__str__'):
                return str(value)
            
            logger.warning(f"⚠️ Unable to process value of type {type(value).__name__} for attribute '{attribute}'")
            return None
            
        except Exception as e:
            logger.error(f"❌ Error validating attribute '{attribute}' value: {e}")
            return None
    
    def _create_oauth_token_from_row(self, row) -> Optional[OAuthToken]:
        """Create OAuthToken object from database row with comprehensive validation"""
        if not row:
            logger.warning("⚠️ Cannot create token from empty row")
            return None
        
        try:
            # Validate row structure
            expected_columns = 11  # id, user_mail, client_id, refresh_token, access_token, grant_token, expiry_time, redirect_url, api_domain, created_at, updated_at
            if len(row) < expected_columns:
                logger.warning(f"⚠️ Row has {len(row)} columns, expected at least {expected_columns}")
                return None
            
            # Extract and validate required fields
            user_mail = row[1] if len(row) > 1 else None
            client_id = row[2] if len(row) > 2 else None
            refresh_token = row[3] if len(row) > 3 else None
            access_token = row[4] if len(row) > 4 else None
            grant_token = row[5] if len(row) > 5 else None
            expiry_time = row[6] if len(row) > 6 else None
            redirect_url = row[7] if len(row) > 7 else None
            api_domain = row[8] if len(row) > 8 else None
            
            # Validate essential fields
            if not client_id or not isinstance(client_id, str) or len(client_id.strip()) < 5:
                logger.warning(f"⚠️ Invalid client_id in row: {client_id}")
                return None
            
            if not refresh_token or not isinstance(refresh_token, str) or len(refresh_token.strip()) < 10:
                logger.warning(f"⚠️ Invalid refresh_token in row (length: {len(refresh_token) if refresh_token else 0})")
                return None
            
            # Validate client secret from settings
            client_secret = getattr(settings, 'ZOHO_CLIENT_SECRET', None)
            if not client_secret:
                logger.error("❌ ZOHO_CLIENT_SECRET not configured in settings")
                return None
            
            # Sanitize and validate redirect URL
            if redirect_url:
                redirect_url = str(redirect_url).strip()
                if not (redirect_url.startswith('http://') or redirect_url.startswith('https://')):
                    logger.warning(f"⚠️ Invalid redirect_url format: {redirect_url}")
                    redirect_url = getattr(settings, 'ZOHO_REDIRECT_URI', 'http://localhost:8000/auth/callback')
            else:
                redirect_url = getattr(settings, 'ZOHO_REDIRECT_URI', 'http://localhost:8000/auth/callback')
            
            # Create the token with validated data
            try:
                token = OAuthToken(
                    client_id=client_id.strip(),
                    client_secret=client_secret,
                    refresh_token=refresh_token.strip(),
                    access_token=access_token.strip() if access_token else None,
                    redirect_url=redirect_url
                )
                
                # Set additional attributes safely
                if expiry_time:
                    try:
                        # Validate expiry time format
                        if isinstance(expiry_time, str) and expiry_time.isdigit():
                            setattr(token, 'expiry_time', expiry_time)
                        elif isinstance(expiry_time, (int, float)):
                            setattr(token, 'expiry_time', str(int(expiry_time)))
                        else:
                            logger.warning(f"⚠️ Invalid expiry_time format: {expiry_time}")
                    except Exception as e:
                        logger.warning(f"⚠️ Error setting expiry_time: {e}")
                
                # Set grant token if available
                if grant_token and isinstance(grant_token, str) and grant_token.strip():
                    try:
                        setattr(token, 'grant_token', grant_token.strip())
                    except Exception as e:
                        logger.warning(f"⚠️ Error setting grant_token: {e}")
                
                # Set user mail if available
                if user_mail and isinstance(user_mail, str) and user_mail.strip():
                    try:
                        setattr(token, 'user_mail', user_mail.strip())
                    except Exception as e:
                        logger.warning(f"⚠️ Error setting user_mail: {e}")
                
                # Set API domain if available
                if api_domain and isinstance(api_domain, str) and api_domain.strip():
                    try:
                        setattr(token, 'api_domain', api_domain.strip())
                    except Exception as e:
                        logger.warning(f"⚠️ Error setting api_domain: {e}")
                
                logger.debug(f"✅ Successfully created OAuthToken for user: {user_mail}")
                return token
                
            except Exception as e:
                logger.error(f"❌ Error instantiating OAuthToken: {e}")
                return None
            
        except Exception as e:
            logger.error(f"❌ Unexpected error creating OAuthToken from row: {e}")
            logger.error(f"❌ Row data: {row}")
            return None
    
    def _is_token_expired(self, expiry_time: str) -> bool:
        """Check if token is expired with comprehensive error handling"""
        try:
            # Handle None or empty values
            if not expiry_time:
                logger.debug("🔍 Token expiry time is None or empty, considering expired")
                return True
            
            # Handle different input types
            if isinstance(expiry_time, str):
                # Remove whitespace and validate
                expiry_time = expiry_time.strip()
                if not expiry_time:
                    logger.debug("🔍 Token expiry time is empty string, considering expired")
                    return True
                
                # Check if it's a valid numeric string
                if not expiry_time.isdigit() and not expiry_time.replace('.', '').isdigit():
                    logger.warning(f"⚠️ Invalid expiry time format: {expiry_time}")
                    return True
                
                try:
                    expiry_timestamp = int(float(expiry_time))
                except (ValueError, TypeError) as e:
                    logger.warning(f"⚠️ Cannot convert expiry time to int: {expiry_time} - {e}")
                    return True
                    
            elif isinstance(expiry_time, (int, float)):
                expiry_timestamp = int(expiry_time)
            else:
                logger.warning(f"⚠️ Unexpected expiry time type: {type(expiry_time).__name__}")
                return True
            
            # Validate timestamp is reasonable
            if expiry_timestamp <= 0:
                logger.warning(f"⚠️ Invalid expiry timestamp: {expiry_timestamp}")
                return True
            
            # Get current timestamp
            current_timestamp = int(datetime.now().timestamp())
            
            # Handle both seconds and milliseconds
            if expiry_timestamp > 9999999999:  # More than 10 digits = milliseconds
                expiry_timestamp = expiry_timestamp // 1000
                logger.debug(f"🔍 Converted milliseconds to seconds: {expiry_timestamp}")
            
            # Validate the timestamp is not too far in the future (max 1 year)
            max_future_timestamp = current_timestamp + (365 * 24 * 60 * 60)
            if expiry_timestamp > max_future_timestamp:
                logger.warning(f"⚠️ Expiry timestamp seems too far in future: {expiry_timestamp}")
                return True
            
            # Add 5 minute buffer for refresh (300 seconds)
            buffer_seconds = 300
            is_expired = current_timestamp >= (expiry_timestamp - buffer_seconds)
            
            if is_expired:
                time_since_expiry = current_timestamp - expiry_timestamp
                logger.debug(f"🔍 Token expired {time_since_expiry} seconds ago")
            else:
                time_until_expiry = expiry_timestamp - current_timestamp
                logger.debug(f"🔍 Token expires in {time_until_expiry} seconds")
            
            return is_expired
            
        except Exception as e:
            logger.error(f"❌ Unexpected error checking token expiry: {e}")
            logger.error(f"❌ Expiry time value: {expiry_time} (type: {type(expiry_time).__name__})")
            # In case of any error, consider the token expired for safety
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