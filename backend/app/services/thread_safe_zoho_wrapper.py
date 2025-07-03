"""
Thread-Safe Zoho SDK Wrapper
Implements proper multi-threading using Initializer.switch_user() pattern
"""

import threading
import asyncio
import logging
from concurrent.futures import ThreadPoolExecutor
from typing import Dict, Any, List, Optional, Callable
from functools import wraps
import time
from contextlib import contextmanager

# Zoho SDK imports (official pattern)
try:
    from zohocrmsdk.src.com.zoho.api.authenticator import OAuthToken
    from zohocrmsdk.src.com.zoho.crm.api import Initializer, HeaderMap, ParameterMap
    from zohocrmsdk.src.com.zoho.crm.api.dc import INDataCenter, USDataCenter, EUDataCenter
    from zohocrmsdk.src.com.zoho.crm.api.record import RecordOperations, BodyWrapper, Record, ActionWrapper, SuccessResponse, APIException
    from zohocrmsdk.src.com.zoho.crm.api.sdk_config import SDKConfig
    from zohocrmsdk.src.com.zoho.crm.api.exception import SDKException
    SDK_AVAILABLE = True
except ImportError as e:
    SDK_AVAILABLE = False
    SDKException = Exception
    logging.warning(f"Zoho SDK not available: {e}")

from app.core.config import settings

logger = logging.getLogger(__name__)


class ThreadSafeZohoWrapperError(Exception):
    """Custom exception for thread-safe wrapper errors"""
    pass


class ZohoUserContext:
    """Represents a Zoho user context for thread-safe operations"""
    
    def __init__(
        self,
        user_id: str,
        client_id: str,
        client_secret: str,
        refresh_token: str,
        data_center: str = "IN",
        environment: str = "PRODUCTION"
    ):
        self.user_id = user_id
        self.client_id = client_id
        self.client_secret = client_secret
        self.refresh_token = refresh_token
        self.data_center = data_center
        self.environment = environment
        
        # Create OAuth token
        self.oauth_token = OAuthToken(
            client_id=client_id,
            client_secret=client_secret,
            refresh_token=refresh_token
        )
        
        # Create data center instance
        if data_center == "US":
            self.dc_instance = USDataCenter.PRODUCTION()
        elif data_center == "EU":
            self.dc_instance = EUDataCenter.PRODUCTION()
        elif data_center == "IN":
            self.dc_instance = INDataCenter.PRODUCTION()
        else:
            self.dc_instance = INDataCenter.PRODUCTION()  # Default
        
        # Create SDK config
        self.sdk_config = SDKConfig(
            auto_refresh_fields=True,
            pick_list_validation=False
        )


class ThreadSafeZohoWrapper:
    """
    Thread-safe Zoho SDK wrapper using official multi-threading patterns
    """
    
    def __init__(self, max_workers: int = 4):
        self.max_workers = max_workers
        self.executor = None
        self._thread_local = threading.local()
        self._initialized = False
        
        # Default user context (from settings)
        self.default_context = ZohoUserContext(
            user_id=settings.ZOHO_USER_EMAIL,
            client_id=settings.ZOHO_CLIENT_ID,
            client_secret=settings.ZOHO_CLIENT_SECRET,
            refresh_token=settings.ZOHO_REFRESH_TOKEN,
            data_center=settings.ZOHO_SDK_DATA_CENTER,
            environment=settings.ZOHO_SDK_ENVIRONMENT
        )
        
        logger.info("ThreadSafeZohoWrapper initialized")
    
    async def __aenter__(self):
        """Async context manager entry"""
        self.executor = ThreadPoolExecutor(max_workers=self.max_workers)
        
        # Initialize the SDK with default context
        if not self._initialized:
            await self._initialize_default_context()
            self._initialized = True
        
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.executor:
            self.executor.shutdown(wait=True)
    
    async def _initialize_default_context(self):
        """Initialize SDK with default user context"""
        try:
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(
                self.executor,
                self._sync_initialize_context,
                self.default_context
            )
            logger.info("✅ Default SDK context initialized")
        except Exception as e:
            logger.error(f"❌ Failed to initialize default context: {e}")
            raise ThreadSafeZohoWrapperError(f"Default context initialization failed: {e}")
    
    def _sync_initialize_context(self, context: ZohoUserContext):
        """Synchronously initialize SDK context (runs in thread)"""
        try:
            # Use official multi-threading pattern: Initializer.switch_user()
            Initializer.switch_user(
                environment=context.dc_instance,
                token=context.oauth_token,
                sdk_config=context.sdk_config
            )
            logger.debug(f"Switched to user context: {context.user_id}")
        except Exception as e:
            logger.error(f"Failed to switch user context: {e}")
            raise
    
    @contextmanager
    def _thread_context(self, user_context: Optional[ZohoUserContext] = None):
        """Context manager for thread-safe SDK operations"""
        context = user_context or self.default_context
        
        try:
            # Switch to user context for this thread
            self._sync_initialize_context(context)
            yield context
        except Exception as e:
            logger.error(f"Thread context error: {e}")
            raise ThreadSafeZohoWrapperError(f"Thread context failed: {e}")
    
    def _thread_safe_sdk_call(self, func: Callable) -> Callable:
        """Decorator for thread-safe SDK calls"""
        @wraps(func)
        async def wrapper(*args, **kwargs):
            try:
                # Extract user context if provided
                user_context = kwargs.pop('user_context', None)
                
                # Execute in thread executor with proper context switching
                loop = asyncio.get_event_loop()
                result = await loop.run_in_executor(
                    self.executor,
                    self._execute_with_context,
                    func,
                    user_context,
                    args,
                    kwargs
                )
                return result
                
            except Exception as e:
                logger.error(f"Thread-safe SDK call failed: {str(e)}")
                raise ThreadSafeZohoWrapperError(f"SDK operation failed: {str(e)}") from e
        
        return wrapper
    
    def _execute_with_context(self, func, user_context, args, kwargs):
        """Execute function with proper user context switching"""
        with self._thread_context(user_context):
            return func(*args, **kwargs)
    
    def _sync_get_records(
        self, 
        module_name: str, 
        page: int = 1, 
        per_page: int = 200,
        fields: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Thread-safe sync method to get records"""
        try:
            # Create record operations (official pattern)
            record_operations = RecordOperations(module_name)
            
            # Set up parameters and headers
            param_instance = ParameterMap()
            header_instance = HeaderMap()
            
            # Add fields if specified
            if fields:
                from zohocrmsdk.src.com.zoho.crm.api.record import GetRecordsParam
                param_instance.add(GetRecordsParam.fields, ",".join(fields))
            
            # Make API call
            response = record_operations.get_records(param_instance, header_instance)
            
            return self._process_response(response)
            
        except SDKException as e:
            logger.error(f"SDK error getting records: {str(e)}")
            raise ThreadSafeZohoWrapperError(f"Failed to get records: {str(e)}") from e
    
    def _sync_update_records(self, module_name: str, records_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Thread-safe sync method to update records"""
        try:
            record_operations = RecordOperations(module_name)
            
            # Convert data to Zoho Record objects
            records = []
            for record_data in records_data:
                record = Record()
                
                # Set record ID if provided
                if 'id' in record_data:
                    record.set_id(record_data['id'])
                
                # Set field values
                for field, value in record_data.items():
                    if field != 'id':
                        record.add_field_value(field, value)
                
                records.append(record)
            
            # Create request body
            body_wrapper = BodyWrapper()
            body_wrapper.set_data(records)
            
            # Make API call
            header_instance = HeaderMap()
            response = record_operations.update_records(body_wrapper, header_instance)
            
            return self._process_response(response)
            
        except SDKException as e:
            logger.error(f"SDK error updating records: {str(e)}")
            raise ThreadSafeZohoWrapperError(f"Failed to update records: {str(e)}") from e
    
    def _process_response(self, response) -> Dict[str, Any]:
        """Process SDK response and convert to standard format"""
        try:
            if response is None:
                return {"status": "error", "message": "No response received"}
            
            # Handle different response types
            if hasattr(response, 'get_object'):
                response_object = response.get_object()
                
                if response_object is None:
                    return {"status": "success", "data": []}
                
                # Handle ResponseWrapper (for get operations)
                if hasattr(response_object, 'get_data'):
                    data = response_object.get_data()
                    if data:
                        processed_data = []
                        for item in data:
                            if hasattr(item, 'get_key_values'):
                                processed_data.append(self._record_to_dict(item))
                            else:
                                processed_data.append(item)
                        return {"status": "success", "data": processed_data}
                
                # Handle ActionWrapper (for create/update operations)
                if isinstance(response_object, ActionWrapper):
                    action_responses = response_object.get_data()
                    results = []
                    
                    for action_response in action_responses:
                        if isinstance(action_response, SuccessResponse):
                            results.append({
                                "status": "success",
                                "code": action_response.get_code().get_value(),
                                "details": action_response.get_details(),
                                "message": action_response.get_message().get_value()
                            })
                        elif isinstance(action_response, APIException):
                            results.append({
                                "status": "error",
                                "code": action_response.get_code().get_value(),
                                "details": action_response.get_details(),
                                "message": action_response.get_message().get_value()
                            })
                    
                    return {"status": "success", "data": results}
            
            return {"status": "success", "data": None}
            
        except Exception as e:
            logger.error(f"Error processing response: {str(e)}")
            return {"status": "error", "message": f"Response processing failed: {str(e)}"}
    
    def _record_to_dict(self, record) -> Dict[str, Any]:
        """Convert Zoho Record object to dictionary"""
        try:
            if hasattr(record, 'get_key_values'):
                key_values = record.get_key_values()
                result = {}
                
                for key, value in key_values.items():
                    if hasattr(value, 'get_value'):
                        result[key] = value.get_value()
                    else:
                        result[key] = value
                
                return result
            else:
                return record
                
        except Exception as e:
            logger.error(f"Error converting record to dict: {str(e)}")
            return {"error": f"Conversion failed: {str(e)}"}
    
    # Public async methods with thread safety
    
    async def get_records(
        self, 
        module_name: str, 
        page: int = 1, 
        per_page: int = 200,
        fields: Optional[List[str]] = None,
        user_context: Optional[ZohoUserContext] = None
    ) -> Dict[str, Any]:
        """
        Get records from Zoho CRM with thread safety.
        
        Args:
            module_name: Zoho module name (e.g., "Deals", "Contacts")
            page: Page number for pagination
            per_page: Records per page (max 200)
            fields: List of fields to retrieve
            user_context: Optional user context for multi-user scenarios
            
        Returns:
            Dict with status and data
        """
        try:
            # Extract user context if provided
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                self.executor,
                self._execute_with_context,
                self._sync_get_records,
                user_context,
                (module_name, page, per_page, fields),
                {}
            )
            return result
        except Exception as e:
            logger.error(f"Thread-safe get_records failed: {str(e)}")
            raise ThreadSafeZohoWrapperError(f"Get records operation failed: {str(e)}") from e
    
    async def update_records(
        self, 
        module_name: str, 
        records_data: List[Dict[str, Any]],
        user_context: Optional[ZohoUserContext] = None
    ) -> Dict[str, Any]:
        """
        Update records in Zoho CRM with thread safety.
        
        Args:
            module_name: Zoho module name
            records_data: List of record data dictionaries with IDs
            user_context: Optional user context for multi-user scenarios
            
        Returns:
            Dict with status and results
        """
        try:
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                self.executor,
                self._execute_with_context,
                self._sync_update_records,
                user_context,
                (module_name, records_data),
                {}
            )
            return result
        except Exception as e:
            logger.error(f"Thread-safe update_records failed: {str(e)}")
            raise ThreadSafeZohoWrapperError(f"Update records operation failed: {str(e)}") from e


# Convenience functions for thread-safe operations

async def get_deals_thread_safe(
    page: int = 1, 
    per_page: int = 200, 
    fields: Optional[List[str]] = None,
    user_context: Optional[ZohoUserContext] = None
) -> Dict[str, Any]:
    """Get deals from Zoho CRM with thread safety"""
    async with ThreadSafeZohoWrapper() as wrapper:
        return await wrapper.get_records("Deals", page, per_page, fields, user_context=user_context)


async def update_deals_thread_safe(
    deals_data: List[Dict[str, Any]],
    user_context: Optional[ZohoUserContext] = None
) -> Dict[str, Any]:
    """Update deals in Zoho CRM with thread safety"""
    async with ThreadSafeZohoWrapper() as wrapper:
        return await wrapper.update_records("Deals", deals_data, user_context=user_context)


# Multi-user context factory
def create_user_context(
    user_email: str,
    client_id: Optional[str] = None,
    client_secret: Optional[str] = None,
    refresh_token: Optional[str] = None
) -> ZohoUserContext:
    """
    Create a user context for multi-user scenarios.
    Falls back to default credentials if not provided.
    """
    return ZohoUserContext(
        user_id=user_email,
        client_id=client_id or settings.ZOHO_CLIENT_ID,
        client_secret=client_secret or settings.ZOHO_CLIENT_SECRET,
        refresh_token=refresh_token or settings.ZOHO_REFRESH_TOKEN,
        data_center=settings.ZOHO_SDK_DATA_CENTER,
        environment=settings.ZOHO_SDK_ENVIRONMENT
    )