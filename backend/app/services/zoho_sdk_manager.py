"""
Zoho SDK Manager - Updated to use improved implementation with official patterns
Now delegates to ImprovedZohoSDKManager for better Zoho compliance
"""

import logging
from typing import Optional, Dict, Any
from app.core.config import settings

logger = logging.getLogger(__name__)


class ZohoSDKManagerError(Exception):
    """Custom exception for SDK Manager errors"""
    pass


class ZohoSDKManager:
    """
    Updated Zoho SDK Manager that delegates to ImprovedZohoSDKManager
    Maintains backward compatibility while using official Zoho patterns
    """
    
    def __init__(self):
        # Import improved implementation
        from app.services.improved_zoho_sdk_manager import get_improved_sdk_manager
        self._improved_manager = get_improved_sdk_manager()
        logger.info("ZohoSDKManager created with improved implementation")
    
    def initialize_sdk(
        self,
        client_id: Optional[str] = None,
        client_secret: Optional[str] = None,
        redirect_uri: Optional[str] = None,
        refresh_token: Optional[str] = None,
        data_center: str = "IN",
        environment: str = "PRODUCTION",
        token_store_type: str = "CUSTOM",
        token_store_path: Optional[str] = None,
        application_name: str = "PipelinePulse",
        user_email: Optional[str] = None,
        log_level: str = "INFO"
    ) -> bool:
        """
        Initialize the Zoho CRM SDK using improved implementation with official patterns.
        Delegates to ImprovedZohoSDKManager for better compliance.
        
        Returns:
            bool: True if initialization successful
            
        Raises:
            ZohoSDKManagerError: If initialization fails
        """
        try:
            # Delegate to improved implementation
            success = self._improved_manager.initialize_sdk(
                client_id=client_id,
                client_secret=client_secret,
                redirect_uri=redirect_uri,
                refresh_token=refresh_token,
                user_email=user_email,
                data_center=data_center,
                environment=environment,
                token_store_type=token_store_type,
                log_level=log_level
            )
            
            logger.info("✅ SDK initialized using improved implementation with official patterns")
            return success
            
        except Exception as e:
            error_msg = f"SDK initialization failed: {str(e)}"
            logger.error(error_msg)
            raise ZohoSDKManagerError(error_msg) from e
    
    # Delegate methods to improved implementation
    
    def get_user_signature(self):
        """Get UserSignature from improved implementation"""
        return self._improved_manager.get_user_signature()
    
    def switch_user(self, user_email: str) -> bool:
        """Switch to different user using improved implementation"""
        return self._improved_manager.switch_user(user_email)
    
    def is_initialized(self) -> bool:
        """Check if SDK is initialized"""
        return self._improved_manager.is_initialized()
    
    def get_config(self) -> Optional[Dict[str, Any]]:
        """Get current SDK configuration"""
        return self._improved_manager.get_config()
    
    def reinitialize(self, **kwargs) -> bool:
        """Reinitialize the SDK with new parameters"""
        logger.info("Reinitializing Zoho SDK using improved implementation")
        return self.initialize_sdk(**kwargs)
    
    def validate_initialization(self) -> Dict[str, Any]:
        """
        Validate SDK initialization and return status.
        Delegates to improved implementation.
        
        Returns:
            Dict with validation results
        """
        return self._improved_manager.validate_initialization()


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