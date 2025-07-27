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
    Updated Zoho SDK Manager that delegates to ImprovedZohoSDKManager
    Maintains backward compatibility while using official Zoho patterns
    """
    
    def __init__(self):
        # Import improved implementation
        from app.services.improved_zoho_sdk_manager import get_improved_sdk_manager
        self._improved_manager = get_improved_sdk_manager()
    
    def is_initialized(self) -> bool:
        """Check if SDK is initialized"""
        return self._improved_manager.is_initialized()
    
    def get_data_center(self, region: str):
        """Get the appropriate Zoho data center based on region"""
        return self._improved_manager.get_data_center(region)
    
    def setup_token_store(self, store_type: str = None):
        """
        Setup the token store based on configuration
        Delegates to improved manager
        """
        return self._improved_manager._setup_token_store()
    
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
        Delegates to improved manager's initialize method
        """
        return await self._improved_manager.initialize(
            client_id=client_id,
            client_secret=client_secret,
            redirect_uri=redirect_uri,
            refresh_token=refresh_token,
            user_email=user_email
        )
    
    def get_token_store(self):
        """Get the current token store instance"""
        return self._improved_manager.get_token_store()
    
    async def switch_user(self, user_email: str) -> bool:
        """
        Switch SDK context to a different user
        Delegates to improved manager
        """
        return await self._improved_manager.switch_user(user_email)


# Global instance
zoho_sdk_manager = ZohoSDKManager()