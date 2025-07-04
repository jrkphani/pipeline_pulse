"""
Improved Zoho SDK Manager
Following official Zoho documentation with production reliability
Uses official zcrmsdk with proper UserSignature and initialization patterns
"""

import logging
from typing import Optional, Dict, Any
from pathlib import Path
from app.core.config import settings

try:
    # Official zcrmsdk imports
    from zcrmsdk.src.com.zoho.api.authenticator.oauth_token import OAuthToken
    from zcrmsdk.src.com.zoho.api.authenticator.user_signature import UserSignature
    from zcrmsdk.src.com.zoho.api.dc import USDataCenter, EUDataCenter, INDataCenter, AUDataCenter
    from zcrmsdk.src.com.zoho.api.initializer import Initializer
    from zcrmsdk.src.com.zoho.api.logger import Logger, Level
    from zcrmsdk.src.com.zoho.api.authenticator.store import DBStore, FileStore
    SDK_VERSION = "official_zcrmsdk"
    logger = logging.getLogger(__name__)
    logger.info("✅ Using official zcrmsdk package")
except ImportError:
    try:
        # Fallback to alternative SDK package
        from zohocrmsdk.src.com.zoho.api.authenticator.oauth_token import OAuthToken
        from zohocrmsdk.src.com.zoho.crm.api.dc import USDataCenter, EUDataCenter, INDataCenter, AUDataCenter
        from zohocrmsdk.src.com.zoho.crm.api.initializer import Initializer
        from zohocrmsdk.src.com.zoho.api.logger.logger import Logger
        from zohocrmsdk.src.com.zoho.api.authenticator.store.file_store import FileStore
        from zohocrmsdk.src.com.zoho.api.authenticator.store.db_store import DBStore
        
        # Create UserSignature mock for fallback SDK
        class UserSignature:
            def __init__(self, email: str):
                self.email = email
            
            def get_email(self):
                return self.email
        
        # Level mock for logger
        class Level:
            INFO = "INFO"
            DEBUG = "DEBUG"
            WARNING = "WARNING"
            ERROR = "ERROR"
        
        SDK_VERSION = "fallback_zohocrmsdk"
        logger = logging.getLogger(__name__)
        logger.warning("⚠️ Using fallback zohocrmsdk package")
    except ImportError:
        SDK_VERSION = "none"
        logger = logging.getLogger(__name__)
        logger.error("❌ No Zoho SDK available")
        raise ImportError("No Zoho SDK package available. Please install zcrmsdk: pip install zcrmsdk")


class ImprovedZohoSDKManagerError(Exception):
    """Custom exception for improved SDK manager errors"""
    pass


class ImprovedZohoSDKManager:
    """
    Improved Zoho SDK Manager following official documentation
    - Uses official zcrmsdk package
    - Implements UserSignature requirement  
    - Follows official initialization pattern
    - Maintains backward compatibility
    - Includes production safety mechanisms
    """
    
    def __init__(self):
        self._initialized = False
        self._config = {}
        self._user_signature = None
        self.logger = logging.getLogger(__name__)
        self.logger.info(f"🚀 Improved SDK Manager initialized (SDK: {SDK_VERSION})")
    
    def initialize_sdk(
        self,
        user_email: str = None,
        client_id: str = None,
        client_secret: str = None,
        redirect_uri: str = None,
        refresh_token: str = None,
        grant_token: str = None,
        access_token: str = None,
        data_center: str = "IN",
        environment: str = "PRODUCTION",
        token_store_type: str = "CUSTOM",
        log_level: str = "INFO",
        resource_path: str = None
    ) -> bool:
        """
        Initialize Zoho SDK following official documentation pattern
        """
        try:
            # Use provided values or fall back to settings
            user_email = user_email or getattr(settings, 'ZOHO_USER_EMAIL', 'admin@1cloudhub.com')
            client_id = client_id or getattr(settings, 'ZOHO_CLIENT_ID', None)
            client_secret = client_secret or getattr(settings, 'ZOHO_CLIENT_SECRET', None)
            redirect_uri = redirect_uri or getattr(settings, 'ZOHO_REDIRECT_URI', None)
            refresh_token = refresh_token or getattr(settings, 'ZOHO_REFRESH_TOKEN', None)
            
            # Validate required parameters
            if not all([client_id, client_secret, redirect_uri, user_email]):
                raise ImprovedZohoSDKManagerError(
                    "Missing required OAuth parameters: client_id, client_secret, redirect_uri, user_email"
                )
            
            # Create UserSignature (official requirement)
            self._user_signature = UserSignature(email=user_email)
            self.logger.info(f"👤 UserSignature created for: {user_email}")
            
            # Configure data center environment (official pattern)
            environment_instance = self._get_data_center_environment(data_center, environment)
            self.logger.info(f"🌍 Environment configured: {data_center}.{environment}")
            
            # Create OAuthToken (official pattern with proper token handling)
            oauth_token = self._create_oauth_token(
                client_id=client_id,
                client_secret=client_secret,
                refresh_token=refresh_token,
                grant_token=grant_token,
                access_token=access_token,
                redirect_uri=redirect_uri
            )
            
            # Configure token store (official + our improved custom store)
            token_store = self._setup_token_store(token_store_type)
            self.logger.info(f"💾 Token store configured: {token_store_type}")
            
            # Configure SDK logger (official pattern)
            sdk_logger = self._setup_sdk_logger(log_level)
            
            # Set resource path for SDK files (official pattern)
            if not resource_path:
                resource_path = getattr(settings, 'ZOHO_SDK_RESOURCE_PATH', "./zoho_sdk_resources")
            Path(resource_path).mkdir(parents=True, exist_ok=True)
            
            # Initialize SDK using official pattern
            self.logger.info("🔧 Initializing SDK with official pattern...")
            
            # Handle different SDK versions with different initialization signatures
            if SDK_VERSION == "official_zcrmsdk":
                try:
                    # Official zcrmsdk pattern
                    Initializer.initialize(
                        user=self._user_signature,
                        environment=environment_instance,
                        token=oauth_token,
                        store=token_store,
                        logger=sdk_logger,
                        resource_path=resource_path
                    )
                except TypeError as e:
                    if "unexpected keyword argument 'user'" in str(e):
                        # Alternative pattern for different zcrmsdk versions
                        Initializer.initialize(
                            environment=environment_instance,
                            token=oauth_token,
                            store=token_store,
                            logger=sdk_logger,
                            resource_path=resource_path
                        )
                        self.logger.warning("⚠️ Using alternative initialization pattern (no user parameter)")
                    else:
                        raise
            else:
                # Fallback SDK pattern
                Initializer.initialize(
                    environment=environment_instance,
                    token=oauth_token,
                    store=token_store,
                    logger=sdk_logger,
                    resource_path=resource_path
                )
            
            self._initialized = True
            self._config = {
                'user_email': user_email,
                'client_id': client_id,
                'data_center': data_center,
                'environment': environment,
                'token_store_type': token_store_type,
                'resource_path': resource_path,
                'sdk_version': SDK_VERSION
            }
            
            self.logger.info("🚀 Improved Zoho SDK initialized successfully")
            self.logger.info(f"📊 Data Center: {data_center}")
            self.logger.info(f"🌍 Environment: {environment}")
            self.logger.info(f"👤 User: {user_email}")
            self.logger.info(f"💾 Token Store: {token_store_type}")
            self.logger.info(f"📁 Resource Path: {resource_path}")
            
            return True
            
        except Exception as e:
            error_msg = f"Improved SDK initialization failed: {str(e)}"
            self.logger.error(error_msg)
            raise ImprovedZohoSDKManagerError(error_msg) from e
    
    def _create_oauth_token(
        self,
        client_id: str,
        client_secret: str,
        refresh_token: str = None,
        grant_token: str = None,
        access_token: str = None,
        redirect_uri: str = None
    ) -> OAuthToken:
        """Create OAuthToken following official patterns"""
        
        # Determine which token to use (priority: refresh > grant > access)
        if refresh_token:
            token = OAuthToken(
                client_id=client_id,
                client_secret=client_secret,
                refresh_token=refresh_token,
                redirect_url=redirect_uri
            )
            self.logger.info("🔑 Created OAuthToken with refresh token")
        elif grant_token:
            token = OAuthToken(
                client_id=client_id,
                client_secret=client_secret,
                grant_token=grant_token,
                redirect_url=redirect_uri
            )
            self.logger.info("🔑 Created OAuthToken with grant token")
        elif access_token:
            token = OAuthToken(
                access_token=access_token
            )
            self.logger.info("🔑 Created OAuthToken with access token")
        else:
            raise ImprovedZohoSDKManagerError("At least one token (refresh, grant, or access) is required")
        
        return token
    
    def _get_data_center_environment(self, data_center: str, environment: str):
        """Get the appropriate data center and environment instance"""
        data_centers = {
            "US": USDataCenter,
            "EU": EUDataCenter,
            "IN": INDataCenter,
            "AU": AUDataCenter
        }
        
        if data_center not in data_centers:
            raise ImprovedZohoSDKManagerError(f"Unsupported data center: {data_center}")
        
        dc_class = data_centers[data_center]
        
        # Get environment method
        if environment.upper() == "PRODUCTION":
            return dc_class.PRODUCTION()
        elif environment.upper() == "SANDBOX":
            return dc_class.SANDBOX()
        elif environment.upper() == "DEVELOPER":
            return dc_class.DEVELOPER()
        else:
            raise ImprovedZohoSDKManagerError(f"Unsupported environment: {environment}")
    
    def _setup_token_store(self, store_type: str):
        """Set up token store based on configuration"""
        if store_type.upper() == "CUSTOM":
            # Use our improved custom token store
            from app.services.improved_zoho_token_store import ImprovedZohoTokenStore
            return ImprovedZohoTokenStore()
        
        elif store_type.upper() == "DB":
            # Use official DBStore (requires MySQL)
            return DBStore()
        
        elif store_type.upper() == "FILE":
            # Use official FileStore
            return FileStore(file_path="./zoho_tokens.txt")
        
        else:
            raise ImprovedZohoSDKManagerError(f"Unsupported token store type: {store_type}")
    
    def _setup_sdk_logger(self, log_level: str):
        """Set up SDK logger following official pattern"""
        try:
            # Skip SDK logger for now to avoid compatibility issues
            self.logger.info("⚠️ Skipping SDK logger to avoid compatibility issues")
            return None
            
            # Commented out problematic logger code
            # level_mapping = {
            #     "DEBUG": Level.DEBUG if hasattr(Level, 'DEBUG') else "DEBUG",
            #     "INFO": Level.INFO if hasattr(Level, 'INFO') else "INFO", 
            #     "WARNING": Level.WARNING if hasattr(Level, 'WARNING') else "WARNING",
            #     "ERROR": Level.ERROR if hasattr(Level, 'ERROR') else "ERROR"
            # }
            # 
            # level = level_mapping.get(log_level.upper(), Level.INFO if hasattr(Level, 'INFO') else "INFO")
            # 
            # if hasattr(Logger, 'get_instance'):
            #     return Logger.get_instance(
            #         level=level,
            #         file_path="./zoho_sdk.log"
            #     )
            # else:
            #     self.logger.warning("⚠️ SDK Logger not available, using None")
            #     return None
                
        except Exception as e:
            self.logger.warning(f"⚠️ Could not configure SDK logger: {e}")
            return None
    
    def is_initialized(self) -> bool:
        """Check if SDK is initialized"""
        return self._initialized
    
    def get_config(self) -> Dict[str, Any]:
        """Get current SDK configuration"""
        return self._config.copy()
    
    def get_user_signature(self) -> Optional[UserSignature]:
        """Get the current UserSignature object"""
        return self._user_signature
    
    def switch_user(self, user_email: str) -> bool:
        """
        Switch to different user using official switch_user pattern
        """
        try:
            if not self._initialized:
                raise ImprovedZohoSDKManagerError("SDK must be initialized before switching users")
            
            # Create new UserSignature
            new_user = UserSignature(email=user_email)
            
            # Use official switch_user method
            Initializer.switch_user(user=new_user)
            
            self._user_signature = new_user
            self._config['user_email'] = user_email
            
            self.logger.info(f"👤 Switched to user: {user_email}")
            return True
            
        except Exception as e:
            error_msg = f"User switch failed: {str(e)}"
            self.logger.error(error_msg)
            raise ImprovedZohoSDKManagerError(error_msg) from e
    
    def validate_initialization(self) -> Dict[str, Any]:
        """Validate SDK initialization status with detailed info"""
        if SDK_VERSION == "none":
            return {
                "status": "error",
                "message": "No SDK available",
                "sdk_available": False,
                "initialized": False,
                "sdk_version": SDK_VERSION
            }
        
        if not self._initialized:
            return {
                "status": "error", 
                "message": "SDK not initialized",
                "sdk_available": True,
                "initialized": False,
                "sdk_version": SDK_VERSION
            }
        
        return {
            "status": "success",
            "message": "Improved SDK ready",
            "sdk_available": True,
            "initialized": True,
            "sdk_version": SDK_VERSION,
            "user_email": self._config.get('user_email'),
            "data_center": self._config.get('data_center'),
            "environment": self._config.get('environment'),
            "config": self._config
        }
    
    def get_token_store_info(self) -> Dict[str, Any]:
        """Get information about the current token store"""
        try:
            from app.services.improved_zoho_token_store import ImprovedZohoTokenStore
            store = ImprovedZohoTokenStore()
            tokens = store.get_tokens()
            
            return {
                "store_type": "improved_custom",
                "total_tokens": len(tokens),
                "store_available": True,
                "schema": "official_oauthtoken"
            }
            
        except Exception as e:
            return {
                "store_type": "unknown",
                "total_tokens": 0,
                "store_available": False,
                "error": str(e)
            }


# Global instance following singleton pattern
_improved_sdk_manager = None

def get_improved_sdk_manager() -> ImprovedZohoSDKManager:
    """Get singleton instance of improved SDK manager"""
    global _improved_sdk_manager
    if _improved_sdk_manager is None:
        _improved_sdk_manager = ImprovedZohoSDKManager()
    return _improved_sdk_manager


def initialize_improved_zoho_sdk(**kwargs) -> bool:
    """Initialize Zoho SDK using improved patterns"""
    manager = get_improved_sdk_manager()
    return manager.initialize_sdk(**kwargs)