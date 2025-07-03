"""
Async Zoho Wrapper - Bridge between sync Zoho SDK and async FastAPI
Provides async methods that wrap synchronous SDK calls using thread executors.
"""

import asyncio
import logging
from concurrent.futures import ThreadPoolExecutor
from typing import Dict, Any, List, Optional, Union, Callable
from functools import wraps
import time

# Zoho SDK imports (official pattern)
try:
    from zohocrmsdk.src.com.zoho.crm.api.record import RecordOperations, BodyWrapper, Record, ActionWrapper, SuccessResponse, APIException
    from zohocrmsdk.src.com.zoho.crm.api import HeaderMap, ParameterMap
    from zohocrmsdk.src.com.zoho.crm.api.exception import SDKException
    SDK_AVAILABLE = True
except ImportError as e:
    SDK_AVAILABLE = False
    SDKException = Exception
    logging.warning(f"Zoho SDK not available: {e}")
    # Try alternative SDK package
    try:
        from zohocrmsdk8_0.src.com.zoho.crm.api.record import RecordOperations, BodyWrapper, Record, ActionWrapper, SuccessResponse, APIException
        from zohocrmsdk8_0.src.com.zoho.crm.api import HeaderMap, ParameterMap
        from zohocrmsdk8_0.src.com.zoho.crm.api.exception import SDKException
        SDK_AVAILABLE = True
        logging.info("Using zohocrmsdk8_0 package for async wrapper")
    except ImportError:
        logging.error("Neither zohocrmsdk nor zohocrmsdk8_0 packages available for async wrapper")

from app.services.zoho_sdk_manager import get_sdk_manager, ZohoSDKManagerError

logger = logging.getLogger(__name__)


class AsyncZohoWrapperError(Exception):
    """Custom exception for async wrapper errors"""
    pass


def async_sdk_call(func: Callable) -> Callable:
    """
    Decorator to convert sync SDK calls to async.
    Handles thread execution and error management.
    """
    @wraps(func)
    async def wrapper(*args, **kwargs):
        try:
            # Get the event loop
            loop = asyncio.get_event_loop()
            
            # Execute the sync function in a thread executor
            with ThreadPoolExecutor(max_workers=4) as executor:
                result = await loop.run_in_executor(executor, func, *args, **kwargs)
                return result
                
        except Exception as e:
            logger.error(f"Async SDK call failed: {str(e)}")
            raise AsyncZohoWrapperError(f"SDK operation failed: {str(e)}") from e
    
    return wrapper


class AsyncZohoWrapper:
    """
    Async wrapper for Zoho CRM SDK operations.
    Converts synchronous SDK calls to async methods for FastAPI compatibility.
    """
    
    def __init__(self, max_workers: int = 4):
        self.max_workers = max_workers
        self.executor = None
        self.sdk_manager = get_sdk_manager()
        logger.info("AsyncZohoWrapper initialized")
    
    async def __aenter__(self):
        """Async context manager entry"""
        self.executor = ThreadPoolExecutor(max_workers=self.max_workers)
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.executor:
            self.executor.shutdown(wait=True)
    
    def _ensure_sdk_initialized(self):
        """Ensure SDK is initialized before operations"""
        if not SDK_AVAILABLE:
            raise AsyncZohoWrapperError("Zoho SDK is not available")
        
        if not self.sdk_manager.is_initialized():
            raise AsyncZohoWrapperError("SDK not initialized. Call initialize_sdk first.")
    
    @async_sdk_call
    def _sync_get_records(
        self, 
        module_name: str, 
        page: int = 1, 
        per_page: int = 200,
        fields: Optional[List[str]] = None,
        sort_by: Optional[str] = None,
        sort_order: Optional[str] = None,
        modified_since: Optional[str] = None
    ) -> Dict[str, Any]:
        """Sync method to get records from Zoho CRM using official pattern"""
        self._ensure_sdk_initialized()
        
        try:
            logger.info(f"🔄 Getting records from {module_name} (page {page}, per_page {per_page})")
            
            # Create record operations instance (official pattern)
            record_operations = RecordOperations(module_name)
            
            # Set up parameters and headers (official pattern)
            param_instance = ParameterMap()
            header_instance = HeaderMap()
            
            # Add parameters using official SDK parameter objects
            from zohocrmsdk.src.com.zoho.crm.api.record import GetRecordsParam
            
            # Add pagination parameters (using proper parameter objects)
            if page > 1:
                param_instance.add(GetRecordsParam.page, page)
            if per_page != 200:
                param_instance.add(GetRecordsParam.per_page, per_page)
            
            # Add field filtering (required by Zoho API - if not specified, get common fields)
            if fields:
                param_instance.add(GetRecordsParam.fields, ",".join(fields))
                logger.debug(f"Requesting specific fields: {fields}")
            else:
                # Get all commonly available fields for full structure analysis
                all_fields = [
                    "id", "Deal_Name", "Account_Name", "Amount", "Stage", "Closing_Date",
                    "Created_Time", "Modified_Time", "Owner", "Description", "Pipeline", 
                    "Probability", "Contact_Name", "Currency", "Record_Image", "Lead_Source",
                    "Next_Step", "Type", "Expected_Revenue", "Campaign_Source", 
                    "Territory", "Service_Line", "Strategic_Account", "AWS_Funded", 
                    "Alliance_Motion", "Proposal_Date", "SOW_Date", "PO_Date", 
                    "Kickoff_Date", "Invoice_Date", "Payment_Date", "Revenue_Date"
                ]
                param_instance.add(GetRecordsParam.fields, ",".join(all_fields))
                logger.debug("Getting comprehensive field set for analysis")
            
            # Add sorting if specified
            if sort_by:
                param_instance.add(GetRecordsParam.sort_by, sort_by)
                if sort_order:
                    param_instance.add(GetRecordsParam.sort_order, sort_order)
            
            # Add modified since filter if specified (using ISO format)
            if modified_since:
                # Convert to proper datetime format if needed
                param_instance.add(GetRecordsParam.modified_since, modified_since)
                logger.debug(f"Filtering by modified_since: {modified_since}")
            
            logger.debug(f"Making API call to get {module_name} records...")
            
            # Make the API call (official pattern)
            response = record_operations.get_records(param_instance, header_instance)
            
            logger.debug(f"Received response: {type(response)}")
            
            return self._process_response(response)
            
        except SDKException as e:
            logger.error(f"SDK error getting records from {module_name}: {str(e)}")
            raise AsyncZohoWrapperError(f"Failed to get {module_name} records: {str(e)}") from e
    
    @async_sdk_call
    def _sync_get_record(self, module_name: str, record_id: str, fields: Optional[List[str]] = None) -> Dict[str, Any]:
        """Sync method to get a single record from Zoho CRM"""
        self._ensure_sdk_initialized()
        
        try:
            record_operations = RecordOperations()
            
            # Set up parameters
            param_instance = ParameterMap()
            if fields:
                param_instance.add(GetRecordParam.fields, ",".join(fields))
            
            header_instance = HeaderMap()
            
            # Make the API call
            response = record_operations.get_record(
                record_id=record_id,
                module_api_name=module_name,
                param_instance=param_instance,
                header_instance=header_instance
            )
            
            return self._process_response(response)
            
        except SDKException as e:
            logger.error(f"SDK error getting record {record_id}: {str(e)}")
            raise AsyncZohoWrapperError(f"Failed to get record: {str(e)}") from e
    
    @async_sdk_call
    def _sync_create_records(self, module_name: str, records_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Sync method to create records in Zoho CRM"""
        self._ensure_sdk_initialized()
        
        try:
            record_operations = RecordOperations()
            
            # Convert data to Zoho Record objects
            records = []
            for record_data in records_data:
                record = ZohoRecord()
                for field, value in record_data.items():
                    record.add_field_value(field, value)
                records.append(record)
            
            # Create request body
            body_wrapper = RecordBodyWrapper()
            body_wrapper.set_data(records)
            
            # Make the API call
            response = record_operations.create_records(
                module_api_name=module_name,
                request=body_wrapper
            )
            
            return self._process_response(response)
            
        except SDKException as e:
            logger.error(f"SDK error creating records: {str(e)}")
            raise AsyncZohoWrapperError(f"Failed to create records: {str(e)}") from e
    
    @async_sdk_call
    def _sync_update_records(self, module_name: str, records_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Sync method to update records in Zoho CRM"""
        self._ensure_sdk_initialized()
        
        try:
            record_operations = RecordOperations()
            
            # Convert data to Zoho Record objects
            records = []
            for record_data in records_data:
                record = ZohoRecord()
                
                # Set record ID if provided
                if 'id' in record_data:
                    record.set_id(record_data['id'])
                
                # Set field values
                for field, value in record_data.items():
                    if field != 'id':  # Skip ID field
                        record.add_field_value(field, value)
                
                records.append(record)
            
            # Create request body
            body_wrapper = RecordBodyWrapper()
            body_wrapper.set_data(records)
            
            # Make the API call
            response = record_operations.update_records(
                module_api_name=module_name,
                request=body_wrapper
            )
            
            return self._process_response(response)
            
        except SDKException as e:
            logger.error(f"SDK error updating records: {str(e)}")
            raise AsyncZohoWrapperError(f"Failed to update records: {str(e)}") from e
    
    @async_sdk_call
    def _sync_delete_records(self, module_name: str, record_ids: List[str]) -> Dict[str, Any]:
        """Sync method to delete records in Zoho CRM"""
        self._ensure_sdk_initialized()
        
        try:
            record_operations = RecordOperations()
            
            # Create parameter map with record IDs
            param_instance = ParameterMap()
            param_instance.add("ids", ",".join(record_ids))
            
            # Make the API call
            response = record_operations.delete_records(
                module_api_name=module_name,
                param_instance=param_instance
            )
            
            return self._process_response(response)
            
        except SDKException as e:
            logger.error(f"SDK error deleting records: {str(e)}")
            raise AsyncZohoWrapperError(f"Failed to delete records: {str(e)}") from e
    
    def _process_response(self, response) -> Dict[str, Any]:
        """Process SDK response and convert to standard format"""
        try:
            if response is None:
                return {"status": "error", "message": "No response received"}
            
            logger.debug(f"Processing response type: {type(response)}")
            
            # Handle APIResponse wrapper
            if hasattr(response, 'get_object'):
                response_object = response.get_object()
                logger.debug(f"Response object type: {type(response_object)}")
                
                if response_object is None:
                    return {"status": "success", "data": []}
                
                # Handle ResponseWrapper (for GET operations)
                if hasattr(response_object, 'get_data'):
                    data = response_object.get_data()
                    logger.debug(f"Response data type: {type(data)}, data: {data}")
                    
                    if data:
                        processed_data = []
                        for item in data:
                            if hasattr(item, 'get_key_values'):
                                processed_data.append(self._record_to_dict(item))
                            else:
                                processed_data.append(item)
                        logger.info(f"✅ Processed {len(processed_data)} records from SDK response")
                        return {"status": "success", "data": processed_data}
                    else:
                        logger.info("📭 No data found in response")
                        return {"status": "success", "data": []}
                
                # Handle ActionWrapper (for create/update operations)
                if hasattr(response_object, 'get_data'):
                    action_responses = response_object.get_data()
                    if action_responses:
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
                
                # Handle APIException
                if hasattr(response_object, 'get_status'):
                    return {
                        "status": "error",
                        "code": response_object.get_code().get_value() if hasattr(response_object, 'get_code') else "UNKNOWN",
                        "message": response_object.get_message().get_value() if hasattr(response_object, 'get_message') else "Unknown error",
                        "details": response_object.get_details() if hasattr(response_object, 'get_details') else {}
                    }
            
            # Fallback: try to extract data directly
            if hasattr(response, 'get_data'):
                data = response.get_data()
                if data:
                    processed_data = []
                    for item in data:
                        if hasattr(item, 'get_key_values'):
                            processed_data.append(self._record_to_dict(item))
                        else:
                            processed_data.append(item)
                    return {"status": "success", "data": processed_data}
            
            logger.warning(f"⚠️ Unhandled response structure: {type(response)}")
            return {"status": "success", "data": []}
            
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
                    # Handle different value types
                    if hasattr(value, 'get_value'):
                        result[key] = value.get_value()
                    elif hasattr(value, 'get_key_values'):
                        # Handle nested Record objects (like Account_Name)
                        nested_values = value.get_key_values()
                        if 'name' in nested_values:
                            result[key] = nested_values['name']
                        elif 'id' in nested_values:
                            result[key] = nested_values['id']
                        else:
                            result[key] = str(value)
                    elif hasattr(value, '__dict__'):
                        # Handle other complex objects
                        result[key] = str(value)
                    else:
                        result[key] = value
                
                return result
            else:
                return record
                
        except Exception as e:
            logger.error(f"Error converting record to dict: {str(e)}")
            return {"error": f"Conversion failed: {str(e)}"}

    # Public async methods
    
    async def get_records(
        self, 
        module_name: str, 
        page: int = 1, 
        per_page: int = 200,
        fields: Optional[List[str]] = None,
        sort_by: Optional[str] = None,
        sort_order: Optional[str] = None,
        modified_since: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get records from Zoho CRM asynchronously.
        
        Args:
            module_name: Zoho module name (e.g., "Deals", "Contacts")
            page: Page number for pagination
            per_page: Records per page (max 200)
            fields: List of fields to retrieve
            sort_by: Field to sort by
            sort_order: Sort order ("asc" or "desc")
            modified_since: ISO datetime string for delta sync
            
        Returns:
            Dict with status and data
        """
        return await self._sync_get_records(
            module_name, page, per_page, fields, sort_by, sort_order, modified_since
        )
    
    async def get_record(
        self, 
        module_name: str, 
        record_id: str, 
        fields: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Get a single record from Zoho CRM asynchronously.
        
        Args:
            module_name: Zoho module name
            record_id: Record ID to retrieve
            fields: List of fields to retrieve
            
        Returns:
            Dict with status and data
        """
        return await self._sync_get_record(module_name, record_id, fields)
    
    async def create_records(
        self, 
        module_name: str, 
        records_data: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Create records in Zoho CRM asynchronously.
        
        Args:
            module_name: Zoho module name
            records_data: List of record data dictionaries
            
        Returns:
            Dict with status and results
        """
        return await self._sync_create_records(module_name, records_data)
    
    async def update_records(
        self, 
        module_name: str, 
        records_data: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Update records in Zoho CRM asynchronously.
        
        Args:
            module_name: Zoho module name
            records_data: List of record data dictionaries with IDs
            
        Returns:
            Dict with status and results
        """
        return await self._sync_update_records(module_name, records_data)
    
    async def delete_records(
        self, 
        module_name: str, 
        record_ids: List[str]
    ) -> Dict[str, Any]:
        """
        Delete records in Zoho CRM asynchronously.
        
        Args:
            module_name: Zoho module name
            record_ids: List of record IDs to delete
            
        Returns:
            Dict with status and results
        """
        return await self._sync_delete_records(module_name, record_ids)
    
    async def get_fields_metadata(self, module_name: str) -> Dict[str, Any]:
        """
        Get field metadata for a module using Zoho CRM API v8.
        
        Args:
            module_name: Zoho module name (e.g., "Deals", "Contacts")
            
        Returns:
            Dict with status and field metadata
        """
        return await self._sync_get_fields_metadata(module_name)
    
    @async_sdk_call
    def _sync_get_fields_metadata(self, module_name: str) -> Dict[str, Any]:
        """Sync method to get field metadata from Zoho CRM"""
        self._ensure_sdk_initialized()
        
        try:
            logger.info(f"📋 Getting fields metadata for {module_name} module")
            
            # Import the Fields API
            from zohocrmsdk.src.com.zoho.crm.api.fields import FieldsOperations
            from zohocrmsdk.src.com.zoho.crm.api.fields import GetFieldsParam
            
            # Get fields API instance
            fields_operations = FieldsOperations()
            
            # Set up parameters
            param_instance = ParameterMap()
            param_instance.add(GetFieldsParam.module, module_name)
            
            # Make the API call
            response = fields_operations.get_fields(param_instance)
            
            return self._process_fields_response(response)
            
        except SDKException as e:
            logger.error(f"SDK error getting fields metadata: {str(e)}")
            raise AsyncZohoWrapperError(f"Failed to get fields metadata: {str(e)}") from e
    
    def _process_fields_response(self, response) -> Dict[str, Any]:
        """Process fields metadata response from Zoho SDK"""
        try:
            if response is None:
                return {"status": "error", "message": "No response received"}
            
            logger.debug(f"Processing fields response type: {type(response)}")
            
            # Handle APIResponse wrapper
            if hasattr(response, 'get_object'):
                response_object = response.get_object()
                logger.debug(f"Fields response object type: {type(response_object)}")
                
                if response_object is None:
                    return {"status": "success", "data": []}
                
                # Handle FieldsResponseWrapper
                if hasattr(response_object, 'get_fields'):
                    fields = response_object.get_fields()
                    logger.debug(f"Fields data type: {type(fields)}, count: {len(fields) if fields else 0}")
                    
                    if fields:
                        processed_fields = []
                        for field in fields:
                            field_dict = self._field_to_dict(field)
                            processed_fields.append(field_dict)
                        
                        logger.info(f"✅ Processed {len(processed_fields)} field definitions")
                        return {"status": "success", "data": processed_fields}
                    else:
                        logger.info("📭 No fields found in response")
                        return {"status": "success", "data": []}
                
                # Handle APIException
                if hasattr(response_object, 'get_status'):
                    return {
                        "status": "error",
                        "code": response_object.get_code().get_value() if hasattr(response_object, 'get_code') else "UNKNOWN",
                        "message": response_object.get_message().get_value() if hasattr(response_object, 'get_message') else "Unknown error",
                        "details": response_object.get_details() if hasattr(response_object, 'get_details') else {}
                    }
            
            logger.warning(f"⚠️ Unhandled fields response structure: {type(response)}")
            return {"status": "success", "data": []}
            
        except Exception as e:
            logger.error(f"Error processing fields response: {str(e)}")
            return {"status": "error", "message": f"Fields response processing failed: {str(e)}"}
    
    def _field_to_dict(self, field) -> Dict[str, Any]:
        """Convert Zoho field object to dictionary"""
        try:
            result = {}
            
            # Get field attributes
            if hasattr(field, 'get_api_name'):
                result["api_name"] = field.get_api_name()
            
            if hasattr(field, 'get_display_label'):
                result["display_label"] = field.get_display_label()
            
            if hasattr(field, 'get_data_type'):
                data_type = field.get_data_type()
                result["data_type"] = data_type.get_value() if hasattr(data_type, 'get_value') else str(data_type)
            
            if hasattr(field, 'get_custom_field'):
                result["custom_field"] = field.get_custom_field()
            
            if hasattr(field, 'get_length'):
                result["length"] = field.get_length()
            
            if hasattr(field, 'get_mandatory'):
                result["mandatory"] = field.get_mandatory()
            
            if hasattr(field, 'get_created_source'):
                result["created_source"] = field.get_created_source()
            
            if hasattr(field, 'get_system_mandatory'):
                result["system_mandatory"] = field.get_system_mandatory()
            
            if hasattr(field, 'get_field_read_only'):
                result["field_read_only"] = field.get_field_read_only()
            
            if hasattr(field, 'get_visible'):
                result["visible"] = field.get_visible()
            
            if hasattr(field, 'get_blueprint_supported'):
                result["blueprint_supported"] = field.get_blueprint_supported()
            
            return result
            
        except Exception as e:
            logger.warning(f"⚠️ Error converting field to dict: {e}")
            return {"api_name": "unknown", "error": str(e)}


# Convenience functions for common operations

async def get_deals(
    page: int = 1, 
    per_page: int = 200, 
    fields: Optional[List[str]] = None
) -> Dict[str, Any]:
    """Get deals from Zoho CRM"""
    async with AsyncZohoWrapper() as wrapper:
        return await wrapper.get_records("Deals", page, per_page, fields)


async def get_deal(deal_id: str, fields: Optional[List[str]] = None) -> Dict[str, Any]:
    """Get a single deal from Zoho CRM"""
    async with AsyncZohoWrapper() as wrapper:
        return await wrapper.get_record("Deals", deal_id, fields)


async def update_deals(deals_data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Update deals in Zoho CRM"""
    async with AsyncZohoWrapper() as wrapper:
        return await wrapper.update_records("Deals", deals_data)