import asyncio
import structlog
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
import httpx
from zcrmsdk.src.com.zoho.crm.api import Initializer
from zcrmsdk.src.com.zoho.crm.api.dc import USDataCenter, EUDataCenter, INDataCenter, AUDataCenter, JPDataCenter
from zcrmsdk.src.com.zoho.crm.api.exception import SDKException
from zcrmsdk.src.com.zoho.crm.api.record import RecordOperations, GetRecordsParam, GetRecordsHeader
from zcrmsdk.src.com.zoho.crm.api.query import QueryOperations, GetRecordsParam as QueryParam
from zcrmsdk.src.com.zoho.crm.api.fields import FieldsOperations
from zcrmsdk.src.com.zoho.crm.api.bulk_read import BulkReadOperations, RequestWrapper, JobDetail, Query
from zcrmsdk.src.com.zoho.crm.api.parameter_map import ParameterMap
from zcrmsdk.src.com.zoho.crm.api.header_map import HeaderMap
from zcrmsdk.src.com.zoho.crm.api.util import APIResponse
from ..core.config import settings

logger = structlog.get_logger()


class ZohoCRMService:
    """Service for interacting with Zoho CRM API."""
    
    def __init__(self):
        self._initialized = False
        self._client = None
        self._setup_data_center()
    
    def _setup_data_center(self):
        """Setup Zoho data center based on configuration."""
        data_centers = {
            "US": USDataCenter.PRODUCTION,
            "EU": EUDataCenter.PRODUCTION,
            "IN": INDataCenter.PRODUCTION,
            "AU": AUDataCenter.PRODUCTION,
            "JP": JPDataCenter.PRODUCTION,
        }
        
        self.data_center = data_centers.get(settings.zoho_region, USDataCenter.PRODUCTION)
        logger.info(f"Zoho data center set to: {settings.zoho_region}")
    
    async def _initialize_sdk(self):
        """Initialize Zoho CRM SDK if not already initialized."""
        if self._initialized:
            return
        
        try:
            # Initialize SDK in a separate thread to avoid blocking
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(
                None,
                lambda: Initializer.initialize(
                    user_email="admin@pipelinepulse.com",  # This should be configurable
                    environment=self.data_center,
                    token=None,  # Token will be handled by OAuth flow
                    store=None,  # Using default file store
                    sdk_config=None,  # Using default config
                    logger=None,  # Using default logger
                    request_proxy=None  # No proxy
                )
            )
            self._initialized = True
            logger.info("Zoho CRM SDK initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize Zoho CRM SDK: {e}")
            raise
    
    async def get_records(
        self,
        module_name: str,
        page: int = 1,
        per_page: int = 200,
        fields: Optional[List[str]] = None,
        sort_by: Optional[str] = None,
        sort_order: Optional[str] = None,
        modified_since: Optional[datetime] = None,
        include_child: bool = False
    ) -> Dict[str, Any]:
        """
        Fetch records from a Zoho CRM module.
        
        Args:
            module_name: Name of the Zoho CRM module (e.g., 'Deals', 'Contacts', 'Accounts')
            page: Page number (1-based)
            per_page: Number of records per page (max 200)
            fields: List of fields to retrieve
            sort_by: Field to sort by
            sort_order: Sort order ('asc' or 'desc')
            modified_since: Get records modified since this datetime
            include_child: Whether to include child records
            
        Returns:
            Dictionary containing records and metadata
        """
        await self._initialize_sdk()
        
        try:
            # Setup parameters
            param_instance = ParameterMap()
            param_instance.add(GetRecordsParam.page, page)
            param_instance.add(GetRecordsParam.per_page, min(per_page, 200))
            
            if fields:
                param_instance.add(GetRecordsParam.fields, ",".join(fields))
            
            if sort_by:
                param_instance.add(GetRecordsParam.sort_by, sort_by)
            
            if sort_order:
                param_instance.add(GetRecordsParam.sort_order, sort_order)
            
            if modified_since:
                param_instance.add(GetRecordsParam.modified_since, modified_since)
            
            if include_child:
                param_instance.add(GetRecordsParam.include_child, "true")
            
            # Setup headers
            header_instance = HeaderMap()
            header_instance.add(GetRecordsHeader.if_modified_since, modified_since)
            
            # Get records
            record_operations = RecordOperations()
            loop = asyncio.get_event_loop()
            
            response = await loop.run_in_executor(
                None,
                lambda: record_operations.get_records(
                    module_name, param_instance, header_instance
                )
            )
            
            if response is not None:
                return await self._process_api_response(response, f"get_records_{module_name}")
            else:
                logger.warning(f"No response received for module: {module_name}")
                return {"data": [], "info": {"count": 0, "page": page, "per_page": per_page}}
                
        except SDKException as e:
            logger.error(f"Zoho SDK error getting records for {module_name}: {e}")
            raise
        except Exception as e:
            logger.error(f"Error getting records for {module_name}: {e}")
            raise
    
    async def get_records_by_coql(
        self,
        select_query: str,
        page: int = 1,
        per_page: int = 200
    ) -> Dict[str, Any]:
        """
        Fetch records using COQL (CRM Object Query Language).
        
        Args:
            select_query: COQL SELECT query
            page: Page number (1-based)
            per_page: Number of records per page (max 200)
            
        Returns:
            Dictionary containing records and metadata
        """
        await self._initialize_sdk()
        
        try:
            # Setup parameters
            param_instance = ParameterMap()
            param_instance.add(QueryParam.select_query, select_query)
            param_instance.add(QueryParam.page, page)
            param_instance.add(QueryParam.per_page, min(per_page, 200))
            
            # Execute query
            query_operations = QueryOperations()
            loop = asyncio.get_event_loop()
            
            response = await loop.run_in_executor(
                None,
                lambda: query_operations.get_records(param_instance)
            )
            
            if response is not None:
                return await self._process_api_response(response, f"coql_query")
            else:
                logger.warning(f"No response received for COQL query: {select_query}")
                return {"data": [], "info": {"count": 0, "page": page, "per_page": per_page}}
                
        except SDKException as e:
            logger.error(f"Zoho SDK error executing COQL query: {e}")
            raise
        except Exception as e:
            logger.error(f"Error executing COQL query: {e}")
            raise
    
    async def get_module_fields(self, module_name: str) -> Dict[str, Any]:
        """
        Fetch field metadata for a Zoho CRM module.
        
        Args:
            module_name: Name of the Zoho CRM module
            
        Returns:
            Dictionary containing field metadata
        """
        await self._initialize_sdk()
        
        try:
            # Get fields
            fields_operations = FieldsOperations()
            loop = asyncio.get_event_loop()
            
            response = await loop.run_in_executor(
                None,
                lambda: fields_operations.get_fields(module_name)
            )
            
            if response is not None:
                return await self._process_api_response(response, f"get_fields_{module_name}")
            else:
                logger.warning(f"No response received for module fields: {module_name}")
                return {"fields": []}
                
        except SDKException as e:
            logger.error(f"Zoho SDK error getting fields for {module_name}: {e}")
            raise
        except Exception as e:
            logger.error(f"Error getting fields for {module_name}: {e}")
            raise
    
    async def create_bulk_read_job(
        self,
        module_name: str,
        fields: List[str],
        criteria: Optional[Dict[str, Any]] = None,
        file_type: str = "CSV"
    ) -> Dict[str, Any]:
        """
        Create a bulk read job for exporting large datasets.
        
        Args:
            module_name: Name of the Zoho CRM module
            fields: List of field API names to export
            criteria: Optional criteria for filtering records
            file_type: Export file type ('CSV' or 'ICS')
            
        Returns:
            Dictionary containing job details
        """
        await self._initialize_sdk()
        
        try:
            # Setup query
            query_instance = Query()
            query_instance.set_module(module_name)
            query_instance.set_fields(fields)
            
            if criteria:
                # Convert criteria to Zoho format
                criteria_str = self._build_criteria_string(criteria)
                query_instance.set_criteria(criteria_str)
            
            # Setup job details
            job_detail = JobDetail()
            job_detail.set_operation("read")
            job_detail.set_state("create")
            job_detail.set_query(query_instance)
            job_detail.set_file_type(file_type)
            
            # Create request wrapper
            request_wrapper = RequestWrapper()
            request_wrapper.set_job([job_detail])
            
            # Create bulk read job
            bulk_read_operations = BulkReadOperations()
            loop = asyncio.get_event_loop()
            
            response = await loop.run_in_executor(
                None,
                lambda: bulk_read_operations.create_bulk_read_job(request_wrapper)
            )
            
            if response is not None:
                return await self._process_api_response(response, f"bulk_read_job_{module_name}")
            else:
                logger.warning(f"No response received for bulk read job: {module_name}")
                return {"job": None}
                
        except SDKException as e:
            logger.error(f"Zoho SDK error creating bulk read job for {module_name}: {e}")
            raise
        except Exception as e:
            logger.error(f"Error creating bulk read job for {module_name}: {e}")
            raise
    
    async def get_bulk_read_job_details(self, job_id: str) -> Dict[str, Any]:
        """
        Get details of a bulk read job.
        
        Args:
            job_id: ID of the bulk read job
            
        Returns:
            Dictionary containing job details
        """
        await self._initialize_sdk()
        
        try:
            bulk_read_operations = BulkReadOperations()
            loop = asyncio.get_event_loop()
            
            response = await loop.run_in_executor(
                None,
                lambda: bulk_read_operations.get_bulk_read_job_details(job_id)
            )
            
            if response is not None:
                return await self._process_api_response(response, f"bulk_read_job_details_{job_id}")
            else:
                logger.warning(f"No response received for bulk read job details: {job_id}")
                return {"job": None}
                
        except SDKException as e:
            logger.error(f"Zoho SDK error getting bulk read job details for {job_id}: {e}")
            raise
        except Exception as e:
            logger.error(f"Error getting bulk read job details for {job_id}: {e}")
            raise
    
    async def download_bulk_read_result(self, job_id: str) -> Optional[bytes]:
        """
        Download the result file of a completed bulk read job.
        
        Args:
            job_id: ID of the bulk read job
            
        Returns:
            File content as bytes, or None if not available
        """
        await self._initialize_sdk()
        
        try:
            bulk_read_operations = BulkReadOperations()
            loop = asyncio.get_event_loop()
            
            response = await loop.run_in_executor(
                None,
                lambda: bulk_read_operations.download_result(job_id)
            )
            
            if response is not None and hasattr(response, 'get_object'):
                # The response should contain the file stream
                file_stream = response.get_object()
                if file_stream:
                    return file_stream.read()
            
            logger.warning(f"No file content received for bulk read job: {job_id}")
            return None
                
        except SDKException as e:
            logger.error(f"Zoho SDK error downloading bulk read result for {job_id}: {e}")
            raise
        except Exception as e:
            logger.error(f"Error downloading bulk read result for {job_id}: {e}")
            raise
    
    def _build_criteria_string(self, criteria: Dict[str, Any]) -> str:
        """
        Build criteria string for Zoho CRM queries.
        
        Args:
            criteria: Dictionary containing field conditions
            
        Returns:
            Formatted criteria string
        """
        conditions = []
        
        for field, condition in criteria.items():
            if isinstance(condition, dict):
                operator = condition.get("operator", "equals")
                value = condition.get("value")
                
                if operator == "equals":
                    conditions.append(f"({field}:equals:{value})")
                elif operator == "not_equals":
                    conditions.append(f"({field}:not_equals:{value})")
                elif operator == "in":
                    if isinstance(value, list):
                        value_str = ",".join(str(v) for v in value)
                        conditions.append(f"({field}:in:{value_str})")
                elif operator == "not_in":
                    if isinstance(value, list):
                        value_str = ",".join(str(v) for v in value)
                        conditions.append(f"({field}:not_in:{value_str})")
                elif operator == "greater_than":
                    conditions.append(f"({field}:greater_than:{value})")
                elif operator == "less_than":
                    conditions.append(f"({field}:less_than:{value})")
                elif operator == "between":
                    if isinstance(value, list) and len(value) == 2:
                        conditions.append(f"({field}:between:{value[0]},{value[1]})")
            else:
                # Simple equality condition
                conditions.append(f"({field}:equals:{condition})")
        
        return " and ".join(conditions)
    
    async def _process_api_response(self, response: APIResponse, operation: str) -> Dict[str, Any]:
        """
        Process Zoho API response and extract data.
        
        Args:
            response: APIResponse object from Zoho SDK
            operation: Name of the operation for logging
            
        Returns:
            Processed response data
        """
        try:
            if response.is_expected():
                response_object = response.get_object()
                
                if hasattr(response_object, 'get_data'):
                    data = response_object.get_data()
                    info = {}
                    
                    # Extract metadata if available
                    if hasattr(response_object, 'get_info'):
                        info_obj = response_object.get_info()
                        if info_obj:
                            info = {
                                "count": getattr(info_obj, 'get_count', lambda: 0)(),
                                "page": getattr(info_obj, 'get_page', lambda: 1)(),
                                "per_page": getattr(info_obj, 'get_per_page', lambda: 200)(),
                                "more_records": getattr(info_obj, 'get_more_records', lambda: False)()
                            }
                    
                    # Convert data to dictionary format
                    processed_data = []
                    if data:
                        for record in data:
                            record_dict = {}
                            if hasattr(record, 'get_key_values'):
                                key_values = record.get_key_values()
                                if key_values:
                                    for key, value in key_values.items():
                                        record_dict[key] = value
                            processed_data.append(record_dict)
                    
                    logger.info(f"Successfully processed {operation}: {len(processed_data)} records")
                    return {"data": processed_data, "info": info}
                
                else:
                    # Handle non-data responses (like job creation)
                    result = {}
                    if hasattr(response_object, 'get_details'):
                        details = response_object.get_details()
                        if details:
                            for detail in details:
                                if hasattr(detail, 'get_key_values'):
                                    key_values = detail.get_key_values()
                                    if key_values:
                                        result.update(key_values)
                    
                    logger.info(f"Successfully processed {operation}")
                    return result
            
            else:
                # Handle error response
                error_message = f"API error for {operation}: {response.get_status_code()}"
                logger.error(error_message)
                
                # Try to extract error details
                if hasattr(response, 'get_message'):
                    error_message += f" - {response.get_message()}"
                
                raise Exception(error_message)
                
        except Exception as e:
            logger.error(f"Error processing API response for {operation}: {e}")
            raise
    
    async def test_connection(self) -> Dict[str, Any]:
        """
        Test the connection to Zoho CRM.
        
        Returns:
            Dictionary containing connection status
        """
        try:
            await self._initialize_sdk()
            
            # Try to get organization details as a connection test
            result = await self.get_records("Deals", page=1, per_page=1)
            
            return {
                "status": "success",
                "message": "Successfully connected to Zoho CRM",
                "records_available": result.get("info", {}).get("count", 0) > 0
            }
            
        except Exception as e:
            logger.error(f"Zoho CRM connection test failed: {e}")
            return {
                "status": "error",
                "message": f"Connection failed: {str(e)}"
            }
    
    async def get_available_modules(self) -> List[str]:
        """
        Get list of available CRM modules.
        
        Returns:
            List of module names
        """
        # Common Zoho CRM modules
        # In a real implementation, you would call the modules API
        return [
            "Leads",
            "Contacts",
            "Accounts",
            "Deals",
            "Products",
            "Quotes",
            "Sales_Orders",
            "Purchase_Orders",
            "Invoices",
            "Campaigns",
            "Vendors",
            "Price_Books",
            "Cases",
            "Solutions",
            "Forecasts",
            "Dashboards",
            "Activities",
            "Tasks",
            "Events",
            "Calls"
        ]