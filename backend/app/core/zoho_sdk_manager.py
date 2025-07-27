"""
Unified Zoho SDK Manager
Combines the best of both implementations with configurable token stores
"""

import logging
from typing import Optional, Dict, Any
from pathlib import Path
from enum import Enum

from zohocrmsdk.src.com.zoho.api.authenticator.oauth_token import OAuthToken
from zohocrmsdk.src.com.zoho.crm.api.user_signature import UserSignature
from zohocrmsdk.src.com.zoho.crm.api.dc import USDataCenter, EUDataCenter, INDataCenter, AUDataCenter, CNDataCenter
from zohocrmsdk.src.com.zoho.crm.api.initializer import Initializer
from zohocrmsdk.src.com.zoho.api.logger import Logger as ZohoLogger
from zohocrmsdk.src.com.zoho.crm.api.sdk_config import SDKConfig
from zohocrmsdk.src.com.zoho.api.authenticator.store.db_store import DBStore
from zohocrmsdk.src.com.zoho.api.authenticator.store.file_store import FileStore

from ..core.config import settings
from .zoho_db_store import ZohoPostgresDBStore

logger = logging.getLogger(__name__)


class TokenStoreType(Enum):
    """Token store types"""
    POSTGRES = "POSTGRES"  # PostgreSQL (default for this project)
    MYSQL = "MYSQL"        # MySQL (SDK default DB store)
    FILE = "FILE"          # File-based storage
    CUSTOM = "CUSTOM"      # Custom implementation


class ZohoSDKManager:
    """
    Unified Zoho SDK Manager supporting multiple token stores
    """
    
    _instance = None
    _initialized = False
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        """Initialize the SDK manager (singleton pattern)"""
        if not hasattr(self, '_config_initialized'):
            self._config_initialized = True
            self._sdk_initialized = False
            self._token_store = None
            self._environment = None
            self._logger = None
    
    def is_initialized(self) -> bool:
        """Check if SDK is initialized"""
        return self._sdk_initialized
    
    def get_data_center(self, region: str):
        """Get the appropriate Zoho data center based on region"""
        region_map = {
            'US': USDataCenter.PRODUCTION(),
            'EU': EUDataCenter.PRODUCTION(),
            'IN': INDataCenter.PRODUCTION(),
            'AU': AUDataCenter.PRODUCTION(),
            'CN': CNDataCenter.PRODUCTION(),
        }
        return region_map.get(region, INDataCenter.PRODUCTION())
    
    def setup_token_store(self, store_type: str = None):
        """
        Setup the token store based on configuration
        
        Args:
            store_type: Type of token store (POSTGRES, MYSQL, FILE, CUSTOM)
                       If None, uses environment variable or defaults to POSTGRES
        """
        if store_type is None:
            store_type = getattr(settings, 'zoho_token_store_type', 'POSTGRES')
        
        store_type = store_type.upper()
        
        if store_type == TokenStoreType.POSTGRES.value:
            # Use PostgreSQL store (default for this project)
            logger.info("Using PostgreSQL token store")
            return ZohoPostgresDBStore()
            
        elif store_type == TokenStoreType.MYSQL.value:
            # Use SDK's default MySQL store
            logger.info("Using MySQL token store (SDK default)")
            return DBStore()
            
        elif store_type == TokenStoreType.FILE.value:
            # Use file-based store
            file_path = getattr(settings, 'zoho_token_store_path', './zoho_tokens.txt')
            logger.info(f"Using file token store: {file_path}")
            return FileStore(file_path=file_path)
            
        elif store_type == TokenStoreType.CUSTOM.value:
            # Import custom implementation if needed
            try:
                from ..services.improved_zoho_token_store import ImprovedZohoTokenStore
                logger.info("Using custom token store")
                return ImprovedZohoTokenStore()
            except ImportError:
                logger.warning("Custom token store not available, falling back to PostgreSQL")
                return ZohoPostgresDBStore()
        
        else:
            logger.warning(f"Unknown token store type: {store_type}, using PostgreSQL")
            return ZohoPostgresDBStore()
    
    async def initialize_sdk(
        self,
        client_id: str = None,
        client_secret: str = None,
        redirect_uri: str = None,
        refresh_token: str = None,
        data_center: str = None,
        token_store_type: str = None,
        user_email: str = None
    ) -> bool:
        """
        Initialize the Zoho SDK with configurable token store
        
        Args:
            client_id: Zoho client ID (uses settings if not provided)
            client_secret: Zoho client secret (uses settings if not provided)
            redirect_uri: OAuth redirect URI (uses settings if not provided)
            refresh_token: Optional refresh token for initial setup
            data_center: Data center region (uses settings if not provided)
            token_store_type: Type of token store to use
            user_email: User email for multi-user setup
            
        Returns:
            bool: True if initialization successful
        """
        try:
            if self._sdk_initialized:
                logger.info("Zoho SDK already initialized")
                return True
            
            # Use settings if parameters not provided
            client_id = client_id or settings.zoho_client_id
            client_secret = client_secret or settings.zoho_client_secret
            redirect_uri = redirect_uri or settings.zoho_redirect_uri
            data_center = data_center or settings.zoho_region
            
            if not all([client_id, client_secret, redirect_uri]):
                logger.error("Missing required Zoho configuration")
                return False
            
            # Setup logger
            self._logger = ZohoLogger.get_instance(
                level=ZohoLogger.Levels.ERROR,
                file_path=f"/tmp/zoho_sdk_{settings.app_env}.log"
            )
            
            # Setup token store
            self._token_store = self.setup_token_store(token_store_type)
            
            # Get environment
            self._environment = self.get_data_center(data_center)
            
            # Configure SDK
            sdk_config = SDKConfig(
                auto_refresh_fields=True,
                pick_list_validation=True,
                connect_timeout=30.0,
                read_timeout=60.0
            )
            
            # Create initial token if refresh token provided
            initial_token = None
            if refresh_token and refresh_token.strip():
                logger.info("Using refresh token for SDK initialization")
                initial_token = OAuthToken(
                    client_id=client_id,
                    client_secret=client_secret,
                    redirect_url=redirect_uri,
                    refresh_token=refresh_token,
                    id=user_email or "pipeline_pulse_app"
                )
                initial_token.set_user_signature(
                    UserSignature(name=user_email or "pipeline_pulse_app")
                )
            
            # Initialize SDK
            try:
                if initial_token:
                    Initializer.initialize(
                        environment=self._environment,
                        token=initial_token,
                        store=self._token_store,
                        sdk_config=sdk_config,
                        logger=self._logger
                    )
                else:
                    # Initialize without token - create a dummy token
                    dummy_token = OAuthToken(
                        client_id=client_id,
                        client_secret=client_secret,
                        redirect_url=redirect_uri,
                        id="dummy_initialization_token"
                    )
                    dummy_token.set_user_signature(UserSignature(name="dummy_initialization_user"))
                    
                    Initializer.initialize(
                        environment=self._environment,
                        token=dummy_token,
                        store=self._token_store,
                        sdk_config=sdk_config,
                        logger=self._logger
                    )
                
                self._sdk_initialized = True
                logger.info(f"Zoho SDK initialized successfully with {type(self._token_store).__name__}")
                return True
                
            except Exception as init_error:
                # Handle initialization errors gracefully
                if "MERGE_OBJECT" in str(init_error):
                    # This is a known issue with the SDK, but doesn't prevent usage
                    logger.warning(f"SDK initialization warning: {init_error}")
                    self._sdk_initialized = True
                    return True
                else:
                    logger.error(f"Failed to initialize SDK: {init_error}")
                    return False
                    
        except Exception as e:
            logger.error(f"Unexpected error during SDK initialization: {e}", exc_info=True)
            return False
    
    def get_token_store(self):
        """Get the current token store instance"""
        return self._token_store
    
    async def switch_user(self, user_email: str) -> bool:
        """
        Switch SDK context to a different user
        
        Args:
            user_email: Email of the user to switch to
            
        Returns:
            bool: True if switch successful
        """
        if not self._sdk_initialized:
            logger.error("Cannot switch user: SDK not initialized")
            return False
        
        try:
            user_token = OAuthToken(id=user_email)
            user_token.set_user_signature(UserSignature(name=user_email))
            
            Initializer.switch_user(user_token)
            logger.info(f"Switched to user: {user_email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to switch user: {e}")
            return False


# Global instance
zoho_sdk_manager = ZohoSDKManager()