"""
Zoho SDK Manager - Foundation layer for Zoho CRM SDK integration
Handles SDK initialization, configuration, and lifecycle management.
"""

import logging
from typing import Optional, Dict, Any
from pathlib import Path
import json
import os

# Zoho SDK imports (official pattern)
try:
    from zohocrmsdk.src.com.zoho.api.authenticator import OAuthToken
    from zohocrmsdk.src.com.zoho.crm.api import Initializer
    from zohocrmsdk.src.com.zoho.crm.api.dc import USDataCenter, EUDataCenter, INDataCenter, AUDataCenter
    from zohocrmsdk.src.com.zoho.crm.api.exception import SDKException
    # Optional imports for advanced features
    from zohocrmsdk.src.com.zoho.api.authenticator.store.file_store import FileStore
    from zohocrmsdk.src.com.zoho.api.authenticator.store.db_store import DBStore
    from zohocrmsdk.src.com.zoho.crm.api.sdk_config import SDKConfig
    from zohocrmsdk.src.com.zoho.api.logger.logger import Logger
    SDK_AVAILABLE = True
except ImportError as e:
    SDK_AVAILABLE = False
    SDKException = Exception
    logging.warning(f"Zoho SDK not available: {e}")
    # Try alternative SDK package
    try:
        from zohocrmsdk8_0.src.com.zoho.api.authenticator import OAuthToken
        from zohocrmsdk8_0.src.com.zoho.crm.api import Initializer
        from zohocrmsdk8_0.src.com.zoho.crm.api.dc import USDataCenter, EUDataCenter, INDataCenter, AUDataCenter
        SDK_AVAILABLE = True
        logging.info("Using zohocrmsdk8_0 package")
    except ImportError:
        logging.error("Neither zohocrmsdk nor zohocrmsdk8_0 packages available")

from app.core.config import settings

logger = logging.getLogger(__name__)


class ZohoSDKManagerError(Exception):
    """Custom exception for SDK Manager errors"""
    pass


class ZohoSDKManager:
    """
    Manages Zoho CRM SDK initialization and configuration.
    Provides a centralized way to initialize the SDK with proper settings.
    """
    
    def __init__(self):
        self._initialized = False
        self._config = None
        self._data_center = None
        self._environment = None
        logger.info("ZohoSDKManager created")
    
    def initialize_sdk(
        self,
        client_id: Optional[str] = None,
        client_secret: Optional[str] = None,
        redirect_uri: Optional[str] = None,
        refresh_token: Optional[str] = None,
        data_center: str = "US",
        environment: str = "PRODUCTION",
        token_store_type: str = "FILE",
        token_store_path: Optional[str] = None,
        application_name: str = "PipelinePulse",
        user_email: Optional[str] = None,
        log_level: str = "INFO"
    ) -> bool:
        """
        Initialize the Zoho CRM SDK with configuration.
        
        Args:
            client_id: Zoho OAuth client ID
            client_secret: Zoho OAuth client secret
            redirect_uri: OAuth redirect URI
            refresh_token: OAuth refresh token
            data_center: Data center ("US", "EU", "IN", "AU")
            environment: Environment ("PRODUCTION", "SANDBOX")
            token_store_type: Token storage type ("FILE", "DB")
            token_store_path: Path for token storage
            application_name: Application name for SDK
            user_email: User email for token storage
            log_level: Logging level
            
        Returns:
            bool: True if initialization successful
            
        Raises:
            ZohoSDKManagerError: If initialization fails
        """
        if not SDK_AVAILABLE:
            raise ZohoSDKManagerError("Zoho SDK is not available. Please install zohocrmsdk8_0")
        
        try:
            # Use provided values or fall back to settings
            client_id = client_id or getattr(settings, 'ZOHO_CLIENT_ID', None)
            client_secret = client_secret or getattr(settings, 'ZOHO_CLIENT_SECRET', None)
            redirect_uri = redirect_uri or getattr(settings, 'ZOHO_REDIRECT_URI', None)
            refresh_token = refresh_token or getattr(settings, 'ZOHO_REFRESH_TOKEN', None)
            user_email = user_email or getattr(settings, 'ZOHO_USER_EMAIL', 'admin@1cloudhub.com')
            
            # Validate required parameters
            if not all([client_id, client_secret, redirect_uri]):
                raise ZohoSDKManagerError(
                    "Missing required OAuth parameters: client_id, client_secret, redirect_uri"
                )
            
            # For SDK initialization, we need at least a refresh token
            if not refresh_token:
                logger.info("No refresh token available - SDK will use fallback mode")
                # Set up a fallback configuration - don't attempt SDK initialization
                self._initialized = False
                self._config = {
                    'client_id': client_id,
                    'data_center': data_center,
                    'environment': environment,
                    'token_store_type': token_store_type,
                    'application_name': application_name,
                    'user_email': user_email,
                    'status': 'fallback_mode'
                }
                logger.info("✅ SDK manager ready in fallback mode (using HTTP client)")
                return True  # Return True to indicate manager is ready, just not SDK-enabled
            
            # Set up data center
            self._data_center = self._get_data_center(data_center)
            self._environment = environment
            
            # Create OAuth token using complete official pattern
            oauth_token = OAuthToken(
                client_id=client_id,
                client_secret=client_secret,
                refresh_token=refresh_token,
                redirect_url=redirect_uri,
                id=user_email  # User identifier for token storage
            )
            
            # Configure token store (official pattern)
            token_store = self._setup_token_store(
                token_store_type, 
                token_store_path, 
                user_email
            )
            
            # Configure SDK settings (official pattern)
            sdk_config = SDKConfig(
                auto_refresh_fields=True,  # Auto-refresh module fields every hour
                pick_list_validation=False,  # Skip input validation for pick lists
                connect_timeout=None,  # Use default connection timeout
                read_timeout=None  # Use default read timeout
            )
            
            # Configure logger (official pattern)
            logger_instance = Logger.get_instance(
                level=getattr(Logger.Levels, log_level, Logger.Levels.INFO),
                file_path="./zoho_sdk.log"
            )
            
            # Set resource path for SDK files
            resource_path = getattr(settings, 'ZOHO_SDK_RESOURCE_PATH', "./zoho_sdk_resources")
            Path(resource_path).mkdir(parents=True, exist_ok=True)
            
            # Configure proxy if provided (official pattern)
            request_proxy = None
            if hasattr(settings, 'PROXY_HOST') and settings.PROXY_HOST:
                try:
                    from zohocrmsdk.src.com.zoho.crm.api.request_proxy import RequestProxy
                    request_proxy = RequestProxy(
                        host=settings.PROXY_HOST,
                        port=settings.PROXY_PORT or 8080,
                        user=settings.PROXY_USER,
                        password=settings.PROXY_PASSWORD or ""
                    )
                    logger.info(f"🌐 Proxy configured: {settings.PROXY_HOST}:{settings.PROXY_PORT}")
                except ImportError:
                    logger.warning("RequestProxy not available, proceeding without proxy")
            
            # Initialize SDK using complete official pattern
            Initializer.initialize(
                environment=self._data_center,
                token=oauth_token,
                store=token_store,
                sdk_config=sdk_config,
                resource_path=resource_path,
                logger=logger_instance,
                proxy=request_proxy
            )
            
            # Pre-populate token store if needed
            self._ensure_token_store_populated(
                token_store, 
                oauth_token, 
                user_email, 
                client_id, 
                client_secret, 
                redirect_uri, 
                refresh_token
            )
            
            logger.info("🚀 Zoho SDK initialized successfully using complete official pattern")
            logger.info(f"📊 Data Center: {data_center} (INDataCenter for India)")
            logger.info(f"🌍 Environment: {environment}")
            logger.info(f"👤 User: {user_email}")
            logger.info(f"📁 Resource Path: {resource_path}")
            logger.info(f"💾 Token Store: {token_store_type}")
            
            self._initialized = True
            self._config = {
                'client_id': client_id,
                'data_center': data_center,
                'environment': environment,
                'token_store_type': token_store_type,
                'application_name': application_name,
                'user_email': user_email
            }
            
            logger.info(f"🚀 Zoho SDK initialized successfully")
            logger.info(f"📊 Data Center: {data_center}")
            logger.info(f"🌍 Environment: {environment}")
            logger.info(f"💾 Token Store: {token_store_type}")
            
            return True
            
        except SDKException as e:
            error_msg = f"SDK initialization failed: {str(e)}"
            logger.error(error_msg)
            raise ZohoSDKManagerError(error_msg) from e
        except Exception as e:
            error_msg = f"Unexpected error during SDK initialization: {str(e)}"
            logger.error(error_msg)
            raise ZohoSDKManagerError(error_msg) from e
    
    def _get_data_center(self, data_center: str):
        """Get the appropriate data center instance"""
        data_centers = {
            "US": USDataCenter.PRODUCTION(),
            "EU": EUDataCenter.PRODUCTION(),
            "IN": INDataCenter.PRODUCTION(),
            "AU": AUDataCenter.PRODUCTION()
        }
        
        if data_center not in data_centers:
            raise ZohoSDKManagerError(f"Unsupported data center: {data_center}")
        
        return data_centers[data_center]
    
    def _setup_token_store(
        self, 
        store_type: str, 
        store_path: Optional[str], 
        user_email: str
    ):
        """Set up token store based on configuration"""
        if store_type.upper() == "DB":
            # Use database token storage
            return self._setup_database_token_store()
        
        elif store_type.upper() == "FILE":
            # Use file-based token storage
            if not store_path:
                store_path = "./zoho_tokens.txt"
            
            # Ensure directory exists
            Path(store_path).parent.mkdir(parents=True, exist_ok=True)
            
            return FileStore(file_path=store_path)
        
        else:
            raise ZohoSDKManagerError(f"Unsupported token store type: {store_type}")
    
    def _setup_database_token_store(self):
        """Set up database-based token storage using PostgreSQL"""
        from app.core.config import settings
        from sqlalchemy import create_engine, text
        
        try:
            # Parse database URL for connection details
            db_url = settings.DATABASE_URL
            
            if db_url.startswith("sqlite"):
                logger.warning("SQLite not supported for token store, falling back to file storage")
                return FileStore(file_path="./zoho_tokens.txt")
            
            # For PostgreSQL database
            if db_url.startswith("postgresql"):
                # Extract connection details from URL
                # Format: postgresql://user:password@host:port/database
                import re
                pattern = r"postgresql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)"
                match = re.match(pattern, db_url)
                
                if match:
                    user, password, host, port, database = match.groups()
                    
                    # Create database token store
                    db_store = DBStore(
                        host=host,
                        database_name=database,
                        user_name=user,
                        password=password,
                        port_number=int(port),
                        table_name="zoho_oauth_tokens"
                    )
                    
                    # Ensure token table exists
                    self._ensure_token_table_exists(db_url)
                    
                    logger.info("✅ Database token store configured")
                    return db_store
                else:
                    logger.error("Could not parse database URL for token store")
                    raise ZohoSDKManagerError("Invalid database URL format")
            
            else:
                logger.warning(f"Unsupported database type for token store: {db_url}")
                return FileStore(file_path="./zoho_tokens.txt")
                
        except Exception as e:
            logger.error(f"Failed to setup database token store: {e}")
            logger.info("Falling back to file-based token storage")
            return FileStore(file_path="./zoho_tokens.txt")
    
    def _ensure_token_table_exists(self, db_url: str):
        """Ensure the OAuth token table exists in the database"""
        try:
            from sqlalchemy import create_engine, text
            
            engine = create_engine(db_url)
            
            # Create token table if it doesn't exist
            create_table_sql = """
            CREATE TABLE IF NOT EXISTS zoho_oauth_tokens (
                id VARCHAR(255) PRIMARY KEY,
                user_name VARCHAR(255),
                client_id VARCHAR(255),
                client_secret VARCHAR(255),
                refresh_token TEXT,
                access_token TEXT,
                grant_token TEXT,
                expiry_time VARCHAR(50),
                redirect_uri VARCHAR(500),
                api_domain VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE INDEX IF NOT EXISTS idx_zoho_tokens_user ON zoho_oauth_tokens(user_name);
            CREATE INDEX IF NOT EXISTS idx_zoho_tokens_client ON zoho_oauth_tokens(client_id);
            """
            
            with engine.connect() as conn:
                conn.execute(text(create_table_sql))
                conn.commit()
            
            logger.info("✅ OAuth token table created/verified")
            
        except Exception as e:
            logger.error(f"Failed to create token table: {e}")
            raise
    
    def _ensure_token_store_populated(
        self, 
        token_store, 
        oauth_token, 
        user_email: str, 
        client_id: str, 
        client_secret: str, 
        redirect_uri: str, 
        refresh_token: str
    ):
        """Ensure token store has the necessary token information"""
        try:
            if isinstance(token_store, FileStore):
                self._populate_file_store(user_email, client_id, client_secret, redirect_uri, refresh_token)
            
            elif isinstance(token_store, DBStore):
                self._populate_database_store(user_email, client_id, client_secret, redirect_uri, refresh_token)
                
        except Exception as e:
            logger.warning(f"Could not pre-populate token store: {e}")
            # Don't fail initialization over this
    
    def _populate_file_store(self, user_email: str, client_id: str, client_secret: str, redirect_uri: str, refresh_token: str):
        """Populate file-based token store"""
        file_path = "./zoho_tokens.txt"
        
        # Read the current file content
        if os.path.exists(file_path):
            with open(file_path, 'r') as f:
                content = f.read().strip()
            
            # If file only has headers or is empty, add token entry
            lines = content.split('\n')
            if len(lines) <= 1 or (len(lines) == 2 and lines[1].strip() == ''):
                logger.info("Populating empty file token store with refresh token...")
                
                # Add a token entry with the refresh token
                token_entry = f"admin@1cloudhub.com,{user_email},{client_id},{client_secret},{refresh_token},,,,{redirect_uri},https://www.zohoapis.in"
                
                with open(file_path, 'a') as f:
                    f.write(token_entry + '\n')
                
                logger.info("✅ File token store populated with refresh token")
    
    def _populate_database_store(self, user_email: str, client_id: str, client_secret: str, redirect_uri: str, refresh_token: str):
        """Populate database-based token store"""
        try:
            from app.core.config import settings
            from sqlalchemy import create_engine, text
            
            engine = create_engine(settings.DATABASE_URL)
            
            # Check if token already exists
            check_sql = """
            SELECT COUNT(*) FROM zoho_oauth_tokens 
            WHERE user_name = :user_email AND client_id = :client_id
            """
            
            with engine.connect() as conn:
                result = conn.execute(text(check_sql), {
                    "user_email": user_email,
                    "client_id": client_id
                })
                count = result.scalar()
                
                if count == 0:
                    logger.info("Populating empty database token store with refresh token...")
                    
                    # Insert token record
                    insert_sql = """
                    INSERT INTO zoho_oauth_tokens 
                    (id, user_name, client_id, client_secret, refresh_token, redirect_uri, api_domain)
                    VALUES (:id, :user_name, :client_id, :client_secret, :refresh_token, :redirect_uri, :api_domain)
                    """
                    
                    conn.execute(text(insert_sql), {
                        "id": user_email,
                        "user_name": user_email,
                        "client_id": client_id,
                        "client_secret": client_secret,
                        "refresh_token": refresh_token,
                        "redirect_uri": redirect_uri,
                        "api_domain": "https://www.zohoapis.in"
                    })
                    conn.commit()
                    
                    logger.info("✅ Database token store populated with refresh token")
                else:
                    logger.info("Database token store already contains token entry")
                    
        except Exception as e:
            logger.error(f"Failed to populate database token store: {e}")
            raise
    
    def is_initialized(self) -> bool:
        """Check if SDK is initialized"""
        return self._initialized
    
    def get_config(self) -> Optional[Dict[str, Any]]:
        """Get current SDK configuration"""
        return self._config.copy() if self._config else None
    
    def reinitialize(self, **kwargs) -> bool:
        """Reinitialize the SDK with new parameters"""
        logger.info("Reinitializing Zoho SDK")
        self._initialized = False
        self._config = None
        return self.initialize_sdk(**kwargs)
    
    def validate_initialization(self) -> Dict[str, Any]:
        """
        Validate SDK initialization and return status.
        
        Returns:
            Dict with validation results
        """
        if not SDK_AVAILABLE:
            return {
                "status": "error",
                "message": "Zoho SDK not available",
                "sdk_available": False,
                "initialized": False
            }
        
        if self._config and self._config.get('status') == 'fallback_mode':
            return {
                "status": "fallback_mode",
                "message": "SDK manager ready in fallback mode (using HTTP client)",
                "sdk_available": True,
                "initialized": False,
                "fallback_mode": True,
                "config": self.get_config()
            }
        
        return {
            "status": "success" if self._initialized else "not_initialized",
            "message": "SDK ready" if self._initialized else "SDK not initialized",
            "sdk_available": True,
            "initialized": self._initialized,
            "fallback_mode": False,
            "config": self.get_config()
        }


# Global SDK manager instance
_sdk_manager = None


def get_sdk_manager() -> ZohoSDKManager:
    """Get or create the global SDK manager instance"""
    global _sdk_manager
    if _sdk_manager is None:
        _sdk_manager = ZohoSDKManager()
    return _sdk_manager


def initialize_zoho_sdk(**kwargs) -> bool:
    """
    Convenience function to initialize the SDK.
    
    Args:
        **kwargs: Initialization parameters
        
    Returns:
        bool: True if successful
    """
    manager = get_sdk_manager()
    return manager.initialize_sdk(**kwargs)


def is_sdk_initialized() -> bool:
    """Check if SDK is initialized"""
    manager = get_sdk_manager()
    return manager.is_initialized()


def get_sdk_config() -> Optional[Dict[str, Any]]:
    """Get current SDK configuration"""
    manager = get_sdk_manager()
    return manager.get_config()