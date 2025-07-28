"""
Improved Zoho SDK Manager
Following official Zoho documentation with production reliability
Uses official zcrmsdk with proper UserSignature and initialization patterns
"""

import logging
import asyncio
from typing import Optional, Dict, Any, List
from functools import lru_cache
from datetime import datetime
import threading

from zohocrmsdk.src.com.zoho.api.authenticator.oauth_token import OAuthToken
from zohocrmsdk.src.com.zoho.crm.api.user_signature import UserSignature
from zohocrmsdk.src.com.zoho.crm.api.dc import USDataCenter, EUDataCenter, INDataCenter, AUDataCenter
from zohocrmsdk.src.com.zoho.crm.api.initializer import Initializer
from zohocrmsdk.src.com.zoho.api.logger import Logger
from zohocrmsdk.src.com.zoho.crm.api.sdk_config import SDKConfig
from zohocrmsdk.src.com.zoho.api.authenticator.store.db_store import DBStore
from zohocrmsdk.src.com.zoho.api.authenticator.store.file_store import FileStore
from zohocrmsdk.src.com.zoho.crm.api.record import RecordOperations, GetRecordsParam
from zohocrmsdk.src.com.zoho.crm.api.parameter_map import ParameterMap
from zohocrmsdk.src.com.zoho.crm.api.header_map import HeaderMap
from zohocrmsdk.src.com.zoho.crm.api.exception import SDKException

from ..core.config import settings
from ..core.zoho_db_store import ZohoPostgresDBStore

logger = logging.getLogger(__name__)


class ImprovedZohoSDKManager:
    """
    Production-ready Zoho SDK Manager with improved error handling,
    multi-user support, and performance optimizations
    """
    
    _instance = None
    _lock = threading.Lock()
    _initialized = False
    _user_tokens: Dict[str, OAuthToken] = {}
    
    def __new__(cls):
        """Thread-safe singleton implementation"""
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        """Initialize the improved SDK manager"""
        if not hasattr(self, '_config_initialized'):
            self._config_initialized = True
            self._sdk_initialized = False
            self._token_store = None
            self._environment = None
            self._sdk_config = None
            self._current_user = None
            self._logger = None
    
    def is_initialized(self) -> bool:
        """Check if SDK is initialized"""
        return self._sdk_initialized
    
    def get_data_center(self, region: str = None):
        """Get the appropriate Zoho data center"""
        region = region or settings.zoho_region
        
        # Always return a fresh instance
        if region.upper() == 'US':
            return USDataCenter.PRODUCTION()
        elif region.upper() == 'EU':
            return EUDataCenter.PRODUCTION()
        elif region.upper() == 'IN':
            return INDataCenter.PRODUCTION()
        elif region.upper() == 'AU':
            return AUDataCenter.PRODUCTION()
        else:
            return INDataCenter.PRODUCTION()
    
    def _setup_logger(self) -> Logger:
        """Setup Zoho SDK logger"""
        log_level = Logger.Levels.INFO if settings.debug else Logger.Levels.ERROR
        log_path = f"/tmp/zoho_sdk_{settings.app_env}_{datetime.now().strftime('%Y%m%d')}.log"
        
        return Logger.get_instance(level=log_level, file_path=log_path)
    
    def _setup_sdk_config(self) -> SDKConfig:
        """Setup SDK configuration with optimal settings"""
        return SDKConfig(
            auto_refresh_fields=True,
            pick_list_validation=True,
            connect_timeout=30.0,
            read_timeout=60.0
        )
    
    def _setup_token_store(self):
        """Setup token store based on configuration"""
        store_type = getattr(settings, 'zoho_token_store_type', 'POSTGRES')
        
        if store_type == 'POSTGRES':
            logger.info("Using PostgreSQL token store")
            return ZohoPostgresDBStore()
        elif store_type == 'MYSQL':
            logger.info("Using MySQL token store")
            return DBStore()
        elif store_type == 'FILE':
            file_path = getattr(settings, 'zoho_token_store_path', './zoho_tokens.txt')
            logger.info(f"Using file token store: {file_path}")
            return FileStore(file_path=file_path)
        else:
            logger.warning(f"Unknown token store type: {store_type}, using PostgreSQL")
            return ZohoPostgresDBStore()
    
    async def initialize(
        self,
        client_id: str = None,
        client_secret: str = None,
        redirect_uri: str = None,
        refresh_token: str = None,
        user_email: str = None
    ) -> bool:
        """
        Initialize the Zoho SDK with improved error handling
        
        Returns:
            bool: True if initialization successful
        """
        if self._sdk_initialized:
            logger.info("Zoho SDK already initialized")
            return True
        
        try:
            # Use settings if parameters not provided
            client_id = client_id or settings.zoho_client_id
            client_secret = client_secret or settings.zoho_client_secret
            redirect_uri = redirect_uri or settings.zoho_redirect_uri
            user_email = user_email or settings.zoho_api_user_email
            
            if not all([client_id, client_secret, redirect_uri]):
                logger.error("Missing required Zoho configuration")
                return False
            
            # Setup components
            self._logger = self._setup_logger()
            self._token_store = self._setup_token_store()
            self._environment = self.get_data_center()
            self._sdk_config = self._setup_sdk_config()
            
            # Create initial token
            initial_token = OAuthToken(
                client_id=client_id,
                client_secret=client_secret,
                redirect_url=redirect_uri,
                refresh_token=refresh_token if refresh_token else None,
                id=user_email
            )
            initial_token.set_user_signature(UserSignature(name=user_email))
            
            # Store token reference
            self._user_tokens[user_email] = initial_token
            self._current_user = user_email
            
            # Initialize SDK
            try:
                Initializer.initialize(
                    environment=self._environment,
                    token=initial_token,
                    store=self._token_store,
                    sdk_config=self._sdk_config,
                    logger=self._logger
                )
                
                self._sdk_initialized = True
                logger.info(f"Zoho SDK initialized successfully for user: {user_email}")
                return True
                
            except SDKException as sdk_error:
                # Handle known SDK exceptions
                if "MERGE_OBJECT" in str(sdk_error):
                    logger.warning(f"SDK initialization warning (non-fatal): {sdk_error}")
                    self._sdk_initialized = True
                    return True
                else:
                    logger.error(f"SDK initialization failed: {sdk_error}")
                    return False
                    
        except Exception as e:
            logger.error(f"Unexpected error during SDK initialization: {e}", exc_info=True)
            return False
    
    async def add_user(
        self,
        user_email: str,
        refresh_token: str = None,
        client_id: str = None,
        client_secret: str = None
    ) -> bool:
        """
        Add a new user to the SDK manager
        
        Args:
            user_email: Email of the user
            refresh_token: Optional refresh token for the user
            client_id: Optional client ID (uses default if not provided)
            client_secret: Optional client secret (uses default if not provided)
            
        Returns:
            bool: True if user added successfully
        """
        if not self._sdk_initialized:
            logger.error("Cannot add user: SDK not initialized")
            return False
        
        try:
            # Use default credentials if not provided
            client_id = client_id or settings.zoho_client_id
            client_secret = client_secret or settings.zoho_client_secret
            
            # Create user token
            user_token = OAuthToken(
                client_id=client_id,
                client_secret=client_secret,
                redirect_url=settings.zoho_redirect_uri,
                refresh_token=refresh_token if refresh_token else None,
                id=user_email
            )
            user_token.set_user_signature(UserSignature(name=user_email))
            
            # Set the API domain for India data center
            if settings.zoho_region == 'IN':
                user_token.set_api_domain("https://www.zohoapis.in")
            
            # Store token reference
            self._user_tokens[user_email] = user_token
            
            logger.info(f"Added user to SDK manager: {user_email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to add user {user_email}: {e}")
            return False
    
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
        
        logger.info(f"Registered users in SDK manager: {list(self._user_tokens.keys())}")
        
        if user_email not in self._user_tokens:
            logger.error(f"User not found: {user_email}")
            logger.error(f"Available users: {list(self._user_tokens.keys())}")
            return False
        
        try:
            # Check if user exists in our token store
            if user_email not in self._user_tokens:
                logger.error(f"User {user_email} not found in token store. Available users: {list(self._user_tokens.keys())}")
                return False
                
            user_token = self._user_tokens[user_email]
            logger.info(f"Switching to user token - email: {user_email}, has_refresh_token: {bool(user_token.get_refresh_token())}")
            
            # The SDK error indicates it needs environment parameter
            # Let's provide all the parameters it expects
            logger.info(f"Attempting to switch user with token: {user_email}")
            logger.info(f"Token details - has_refresh: {bool(user_token.get_refresh_token())}, has_access: {bool(user_token.get_access_token())}")
            logger.info(f"Token user signature: {user_token.get_user_signature().get_name() if user_token.get_user_signature() else 'None'}")
            
            # Check token internals
            logger.info(f"Token ID: {user_token.get_id()}")
            logger.info(f"Token client ID: {user_token.get_client_id()}")
            
            # Get fresh environment instance
            environment = self.get_data_center()
            logger.info(f"Environment type: {type(environment)}, value: {environment}")
            logger.info(f"SDK Config type: {type(self._sdk_config)}")
            logger.info(f"Token type: {type(user_token)}")
            
            # Call switch_user with named parameters as expected by the SDK
            # The signature is: (environment=None, token=None, sdk_config=None, proxy=None)
            try:
                Initializer.switch_user(
                    environment=environment,
                    token=user_token,
                    sdk_config=self._sdk_config,
                    proxy=None
                )
            except SDKException as e:
                # Handle the MERGE_OBJECT error like we do during initialization
                if "MERGE_OBJECT" in str(e):
                    logger.warning(f"SDK switch_user warning (non-fatal): {e}")
                    # Consider it successful despite the warning
                    self._current_user = user_email
                    logger.info(f"Switched to user (with warning): {user_email}")
                    return True
                else:
                    logger.error(f"SDK Exception details: {e}")
                    logger.error(f"Exception dict: {e.__dict__ if hasattr(e, '__dict__') else 'No dict'}")
                    raise
            
            self._current_user = user_email
            logger.info(f"Switched to user: {user_email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to switch user: {e}")
            logger.error(f"Exception type: {type(e).__name__}")
            return False
    
    def get_current_user(self) -> Optional[str]:
        """Get the current active user"""
        return self._current_user
    
    def list_users(self) -> List[str]:
        """List all registered users"""
        return list(self._user_tokens.keys())
    
    async def remove_user(self, user_email: str) -> bool:
        """
        Remove a user from the SDK manager
        
        Args:
            user_email: Email of the user to remove
            
        Returns:
            bool: True if removal successful
        """
        if user_email in self._user_tokens:
            del self._user_tokens[user_email]
            
            # If this was the current user, switch to another or None
            if self._current_user == user_email:
                if self._user_tokens:
                    # Switch to the first available user
                    await self.switch_user(next(iter(self._user_tokens)))
                else:
                    self._current_user = None
            
            logger.info(f"Removed user: {user_email}")
            return True
        
        return False
    
    def get_record_operations(self, module_name: str) -> RecordOperations:
        """
        Get record operations for a specific module
        
        Args:
            module_name: Name of the CRM module (e.g., 'Leads', 'Contacts')
            
        Returns:
            RecordOperations instance
        """
        if not self._sdk_initialized:
            raise RuntimeError("SDK not initialized")
        
        return RecordOperations(module_name)
    
    async def test_connection(self) -> bool:
        """
        Test the SDK connection by making a simple API call
        
        Returns:
            bool: True if connection successful
        """
        try:
            # Try to fetch one record from Leads module
            record_ops = self.get_record_operations("Leads")
            param_instance = ParameterMap()
            param_instance.add(GetRecordsParam.per_page, 1)
            
            response = record_ops.get_records(param_instance, HeaderMap())
            
            if response is not None:
                logger.info("SDK connection test successful")
                return True
            else:
                logger.warning("SDK connection test returned no response")
                return False
                
        except Exception as e:
            logger.error(f"SDK connection test failed: {e}")
            return False
    
    def get_token_store(self):
        """Get the current token store instance"""
        return self._token_store
    
    def get_environment(self):
        """Get the current environment (data center)"""
        return self._environment
    
    def get_sdk_config(self):
        """Get the current SDK configuration"""
        return self._sdk_config


# Factory function to get the singleton instance
@lru_cache(maxsize=1)
def get_improved_sdk_manager() -> ImprovedZohoSDKManager:
    """Get the singleton ImprovedZohoSDKManager instance"""
    return ImprovedZohoSDKManager()