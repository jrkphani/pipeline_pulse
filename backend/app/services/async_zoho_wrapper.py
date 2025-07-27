"""
Async Zoho Wrapper - Bridge between sync Zoho SDK and async FastAPI
Provides async methods that wrap synchronous SDK calls using thread executors.
"""

import asyncio
import logging
from concurrent.futures import ThreadPoolExecutor
from functools import partial
from typing import List, Dict, Any, Optional, Callable

from zohocrmsdk.src.com.zoho.crm.api.record import RecordOperations, GetRecordsParam
from zohocrmsdk.src.com.zoho.crm.api.parameter_map import ParameterMap
from zohocrmsdk.src.com.zoho.crm.api.header_map import HeaderMap
# APIResponse is returned from SDK operations, no need to import separately
from zohocrmsdk.src.com.zoho.crm.api.exception import SDKException

from .improved_zoho_sdk_manager import get_improved_sdk_manager
from ..core.config import settings

logger = logging.getLogger(__name__)


class AsyncZohoWrapper:
    """
    Async wrapper for Zoho SDK operations
    Converts synchronous SDK calls to async using thread executor
    """
    
    def __init__(self, max_workers: int = 10):
        """
        Initialize async wrapper
        
        Args:
            max_workers: Maximum number of worker threads
        """
        self._executor = ThreadPoolExecutor(max_workers=max_workers)
        self._sdk_manager = get_improved_sdk_manager()
        self._initialized = False
    
    async def initialize(self, **kwargs) -> bool:
        """
        Initialize SDK asynchronously
        
        Returns:
            bool: True if initialization successful
        """
        if self._initialized:
            return True
        
        result = await self._run_in_executor(
            self._sdk_manager.initialize,
            **kwargs
        )
        
        if result:
            self._initialized = True
        
        return result
    
    async def _run_in_executor(self, func: Callable, *args, **kwargs):
        """
        Run a synchronous function in the thread executor
        
        Args:
            func: Function to run
            *args: Positional arguments
            **kwargs: Keyword arguments
            
        Returns:
            Function result
        """
        loop = asyncio.get_event_loop()
        partial_func = partial(func, *args, **kwargs)
        return await loop.run_in_executor(self._executor, partial_func)
    
    async def get_records(
        self,
        module_name: str,
        fields: List[str] = None,
        page: int = 1,
        per_page: int = 200,
        sort_by: str = None,
        sort_order: str = 'asc'
    ) -> Dict[str, Any]:
        """
        Get records from a module asynchronously
        
        Args:
            module_name: CRM module name (e.g., 'Leads', 'Contacts')
            fields: List of fields to retrieve
            page: Page number (1-based)
            per_page: Records per page (max 200)
            sort_by: Field to sort by
            sort_order: Sort order ('asc' or 'desc')
            
        Returns:
            Dict containing records and metadata
        """
        def _get_records():
            try:
                record_ops = RecordOperations(module_name)
                param_instance = ParameterMap()
                
                # Add parameters
                param_instance.add(GetRecordsParam.page, page)
                param_instance.add(GetRecordsParam.per_page, per_page)
                
                if fields:
                    param_instance.add(GetRecordsParam.fields, ','.join(fields))
                
                if sort_by:
                    param_instance.add(GetRecordsParam.sort_by, sort_by)
                    param_instance.add(GetRecordsParam.sort_order, sort_order)
                
                # Make API call
                response = record_ops.get_records(param_instance, HeaderMap())
                
                if response is not None:
                    return self._process_response(response)
                else:
                    return {"records": [], "info": {"count": 0}}
                    
            except SDKException as e:
                logger.error(f"SDK error getting records: {e}")
                raise
            except Exception as e:
                logger.error(f"Unexpected error getting records: {e}")
                raise
        
        return await self._run_in_executor(_get_records)
    
    async def search_records(
        self,
        module_name: str,
        criteria: str,
        page: int = 1,
        per_page: int = 200
    ) -> Dict[str, Any]:
        """
        Search records in a module asynchronously
        
        Args:
            module_name: CRM module name
            criteria: Search criteria in Zoho format
            page: Page number
            per_page: Records per page
            
        Returns:
            Dict containing search results
        """
        def _search_records():
            try:
                record_ops = RecordOperations(module_name)
                param_instance = ParameterMap()
                
                param_instance.add(GetRecordsParam.criteria, criteria)
                param_instance.add(GetRecordsParam.page, page)
                param_instance.add(GetRecordsParam.per_page, per_page)
                
                response = record_ops.search_records(param_instance, HeaderMap())
                
                if response is not None:
                    return self._process_response(response)
                else:
                    return {"records": [], "info": {"count": 0}}
                    
            except Exception as e:
                logger.error(f"Error searching records: {e}")
                raise
        
        return await self._run_in_executor(_search_records)
    
    async def get_record_count(self, module_name: str, criteria: str = None) -> int:
        """
        Get count of records in a module
        
        Args:
            module_name: CRM module name
            criteria: Optional filter criteria
            
        Returns:
            Record count
        """
        def _get_count():
            try:
                record_ops = RecordOperations(module_name)
                param_instance = ParameterMap()
                
                if criteria:
                    param_instance.add(GetRecordsParam.criteria, criteria)
                
                response = record_ops.get_record_count(param_instance)
                
                if response is not None and response.is_expected:
                    count_handler = response.get_object()
                    if hasattr(count_handler, 'get_count'):
                        return count_handler.get_count()
                
                return 0
                
            except Exception as e:
                logger.error(f"Error getting record count: {e}")
                raise
        
        return await self._run_in_executor(_get_count)
    
    async def switch_user(self, user_email: str) -> bool:
        """
        Switch SDK context to a different user asynchronously
        
        Args:
            user_email: Email of the user to switch to
            
        Returns:
            bool: True if switch successful
        """
        return await self._run_in_executor(
            self._sdk_manager.switch_user,
            user_email
        )
    
    def _process_response(self, response: Any) -> Dict[str, Any]:
        """
        Process API response and extract data
        
        Args:
            response: Zoho API response
            
        Returns:
            Processed data dictionary
        """
        result = {"records": [], "info": {}}
        
        if response.is_expected:
            response_handler = response.get_object()
            
            if hasattr(response_handler, 'get_data'):
                records = response_handler.get_data()
                if records:
                    result["records"] = [self._record_to_dict(record) for record in records]
            
            if hasattr(response_handler, 'get_info'):
                info = response_handler.get_info()
                if info:
                    result["info"] = {
                        "count": info.get_count() if hasattr(info, 'get_count') else 0,
                        "page": info.get_page() if hasattr(info, 'get_page') else 1,
                        "per_page": info.get_per_page() if hasattr(info, 'get_per_page') else 200,
                        "more_records": info.get_more_records() if hasattr(info, 'get_more_records') else False
                    }
        
        return result
    
    def _record_to_dict(self, record) -> Dict[str, Any]:
        """
        Convert Zoho record object to dictionary
        
        Args:
            record: Zoho record object
            
        Returns:
            Dictionary representation
        """
        record_dict = {}
        
        # Get all fields
        for key, value in record.get_key_values().items():
            if value is not None:
                if hasattr(value, 'get_key_values'):
                    # Nested object
                    record_dict[key] = self._record_to_dict(value)
                elif isinstance(value, list):
                    # List of objects
                    record_dict[key] = [
                        self._record_to_dict(item) if hasattr(item, 'get_key_values') else item
                        for item in value
                    ]
                else:
                    # Simple value
                    record_dict[key] = value
        
        return record_dict
    
    async def close(self):
        """Cleanup resources"""
        self._executor.shutdown(wait=True)


# Factory function to create async wrapper
def get_async_zoho_wrapper(max_workers: int = 10) -> AsyncZohoWrapper:
    """
    Get an instance of AsyncZohoWrapper
    
    Args:
        max_workers: Maximum number of worker threads
        
    Returns:
        AsyncZohoWrapper instance
    """
    return AsyncZohoWrapper(max_workers=max_workers)