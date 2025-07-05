# backend/app/services/zoho_crm_service.py
import asyncio
import structlog
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from zohocrmsdk.src.com.zoho.crm.api.record import RecordOperations, GetRecordsParam, GetRecordsHeader, ResponseWrapper
from zohocrmsdk.src.com.zoho.crm.api.coql import CoqlOperations
from zohocrmsdk.src.com.zoho.crm.api.fields import FieldsOperations
from zohocrmsdk.src.com.zoho.crm.api.bulk_read import BulkReadOperations, BodyWrapper, JobDetail, Query
from zohocrmsdk.src.com.zoho.crm.api.users import UsersOperations, GetUsersParam
from zohocrmsdk.src.com.zoho.crm.api.parameter_map import ParameterMap
from zohocrmsdk.src.com.zoho.crm.api.header_map import HeaderMap
from zohocrmsdk.src.com.zoho.crm.api.util import APIResponse
from zohocrmsdk.src.com.zoho.crm.api.exception import SDKException
from zohocrmsdk.src.com.zoho.api.authenticator.oauth_token import OAuthToken

from ..core.zoho_sdk import switch_zoho_user, is_sdk_initialized
from ..core.config import settings

logger = structlog.get_logger()


class ZohoCRMService:
    """
    Service for interacting with Zoho CRM API with multi-user support.
    
    This service implements the official Zoho SDK multi-user pattern where
    each API call is made on behalf of a specific user by switching the
    SDK context before the operation.
    """
    
    def __init__(self):
        """Initialize the Zoho CRM service."""
        pass
    
    def _ensure_sdk_initialized(self):
        """Ensure the Zoho SDK has been initialized."""
        if not is_sdk_initialized():
            raise RuntimeError(
                "Zoho SDK not initialized. Call initialize_zoho_sdk() during app startup."
            )
    
    async def get_current_zoho_user(self, user_email: str) -> Optional[Dict[str, Any]]:
        """
        Get the current Zoho user information for the specified user.
        
        Args:
            user_email: Email of the user whose Zoho tokens to use
            
        Returns:
            Dictionary containing user information or None if failed
        """
        try:
            self._ensure_sdk_initialized()
            logger.info("Getting current Zoho user info", user_email=user_email)
            
            # Switch to the user's context
            success = await switch_zoho_user(user_email)
            if not success:
                logger.error("Failed to switch to user context", user_email=user_email)
                return None
            
            # Get current user info from Zoho CRM
            users_operations = UsersOperations()
            param_map = ParameterMap()
            param_map.add(GetUsersParam.type, "CurrentUser")
            
            response = users_operations.get_users(param_map)
            
            if response is None or response.get_status_code() != 200:
                logger.error("Failed to get user info from Zoho CRM", 
                           status_code=response.get_status_code() if response else None,
                           user_email=user_email)
                return None
            
            # Parse the response
            response_object = response.get_object()
            if hasattr(response_object, 'get_users'):
                zoho_users = response_object.get_users()
                if not zoho_users or len(zoho_users) == 0:
                    logger.error("No users found in Zoho response", user_email=user_email)
                    return None
                
                zoho_user = zoho_users[0]  # Get current user
                
                # Extract user information
                user_info = {
                    "email": zoho_user.get_email(),
                    "first_name": zoho_user.get_first_name() or "",
                    "last_name": zoho_user.get_last_name() or "",
                    "full_name": zoho_user.get_full_name() or "",
                    "id": str(zoho_user.get_id()) if zoho_user.get_id() else None,
                    "role": zoho_user.get_role().get_name() if zoho_user.get_role() else None,
                    "profile": zoho_user.get_profile().get_name() if zoho_user.get_profile() else None,
                    "status": zoho_user.get_status() or "",
                }
                
                logger.info("Successfully retrieved Zoho user info", 
                           user_email=user_email, 
                           zoho_user_email=user_info.get("email"))
                
                return user_info
            else:
                logger.error("Invalid response structure from Zoho users API", user_email=user_email)
                return None
                
        except Exception as e:
            logger.error("Error getting current Zoho user", 
                        user_email=user_email, 
                        error=str(e), 
                        exc_info=True)
            return None
    
    async def get_deals_for_user(
        self,
        user_email: str,
        page: int = 1,
        per_page: int = 200,
        fields: Optional[List[str]] = None,
        sort_by: Optional[str] = None,
        sort_order: Optional[str] = None,
        modified_since: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Get deals for a specific user from Zoho CRM.
        
        Args:
            user_email: Email of the user to fetch deals for
            page: Page number (1-based)
            per_page: Number of records per page (max 200)
            fields: List of fields to retrieve
            sort_by: Field to sort by
            sort_order: Sort order ('asc' or 'desc')
            modified_since: Get records modified since this datetime
            
        Returns:
            Dictionary containing deals and metadata
        """
        return await self.get_records_for_user(
            user_email=user_email,
            module_name="Deals",
            page=page,
            per_page=per_page,
            fields=fields,
            sort_by=sort_by,
            sort_order=sort_order,
            modified_since=modified_since
        )
    
    async def get_accounts_for_user(
        self,
        user_email: str,
        page: int = 1,
        per_page: int = 200,
        fields: Optional[List[str]] = None,
        modified_since: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Get accounts for a specific user from Zoho CRM.
        
        Args:
            user_email: Email of the user to fetch accounts for
            page: Page number (1-based)
            per_page: Number of records per page (max 200)
            fields: List of fields to retrieve
            modified_since: Get records modified since this datetime
            
        Returns:
            Dictionary containing accounts and metadata
        """
        return await self.get_records_for_user(
            user_email=user_email,
            module_name="Accounts",
            page=page,
            per_page=per_page,
            fields=fields,
            modified_since=modified_since
        )
    
    async def get_contacts_for_user(
        self,
        user_email: str,
        page: int = 1,
        per_page: int = 200,
        fields: Optional[List[str]] = None,
        modified_since: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Get contacts for a specific user from Zoho CRM.
        
        Args:
            user_email: Email of the user to fetch contacts for
            page: Page number (1-based)
            per_page: Number of records per page (max 200)
            fields: List of fields to retrieve
            modified_since: Get records modified since this datetime
            
        Returns:
            Dictionary containing contacts and metadata
        """
        return await self.get_records_for_user(
            user_email=user_email,
            module_name="Contacts",
            page=page,
            per_page=per_page,
            fields=fields,
            modified_since=modified_since
        )
    
    async def get_records_for_user(
        self,
        user_email: str,
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
        Fetch records from a Zoho CRM module on behalf of a specific user.
        
        Args:
            user_email: Email of the user to make the API call for
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
        self._ensure_sdk_initialized()
        
        try:
            logger.info("Fetching records for user", 
                       user_email=user_email, 
                       module=module_name, 
                       page=page)
            
            # 1. Switch the SDK context to the current user
            if not await switch_zoho_user(user_email):
                raise Exception(f"Failed to switch SDK context to user: {user_email}")
            
            # 2. Setup parameters
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
            
            # 3. Setup headers
            header_instance = HeaderMap()
            if modified_since:
                header_instance.add(GetRecordsHeader.if_modified_since, modified_since)
            
            # 4. Perform the API operation using the current user's token
            record_operations = RecordOperations()
            response = record_operations.get_records(module_name, param_instance, header_instance)
            
            # 5. Process the response
            if response is not None:
                result = await self._process_api_response(response, f"get_records_{module_name}")
                logger.info("Successfully fetched records", 
                           user_email=user_email,
                           module=module_name,
                           count=len(result.get("data", [])))
                return result
            else:
                logger.warning("No response received", 
                              user_email=user_email, 
                              module=module_name)
                return {"data": [], "info": {"count": 0, "page": page, "per_page": per_page}}
                
        except SDKException as e:
            logger.error("Zoho SDK error", 
                        user_email=user_email, 
                        module=module_name, 
                        error=str(e),
                        exc_info=True)
            raise
        except Exception as e:
            logger.error("Error fetching records", 
                        user_email=user_email, 
                        module=module_name, 
                        error=str(e),
                        exc_info=True)
            raise
    
    async def execute_coql_for_user(
        self,
        user_email: str,
        select_query: str,
        page: int = 1,
        per_page: int = 200
    ) -> Dict[str, Any]:
        """
        Execute COQL (CRM Object Query Language) query for a specific user.
        
        Args:
            user_email: Email of the user to execute query for
            select_query: COQL SELECT query
            page: Page number (1-based)
            per_page: Number of records per page (max 200)
            
        Returns:
            Dictionary containing query results and metadata
        """
        self._ensure_sdk_initialized()
        
        try:
            logger.info("Executing COQL query for user", 
                       user_email=user_email, 
                       query=select_query[:100])  # Log first 100 chars
            
            # 1. Switch the SDK context to the current user
            if not await switch_zoho_user(user_email):
                raise Exception(f"Failed to switch SDK context to user: {user_email}")
            
            # 2. Setup parameters
            param_instance = ParameterMap()
            param_instance.add("select_query", select_query)
            param_instance.add("page", page)
            param_instance.add("per_page", min(per_page, 200))
            
            # 3. Execute query using the current user's token
            coql_operations = CoqlOperations()
            response = coql_operations.get_records(param_instance)
            
            # 4. Process the response
            if response is not None:
                result = await self._process_api_response(response, "coql_query")
                logger.info("Successfully executed COQL query", 
                           user_email=user_email,
                           count=len(result.get("data", [])))
                return result
            else:
                logger.warning("No response received for COQL query", 
                              user_email=user_email)
                return {"data": [], "info": {"count": 0, "page": page, "per_page": per_page}}
                
        except SDKException as e:
            logger.error("Zoho SDK error executing COQL", 
                        user_email=user_email, 
                        error=str(e),
                        exc_info=True)
            raise
        except Exception as e:
            logger.error("Error executing COQL query", 
                        user_email=user_email, 
                        error=str(e),
                        exc_info=True)
            raise
    
    async def get_module_fields_for_user(
        self, 
        user_email: str, 
        module_name: str
    ) -> Dict[str, Any]:
        """
        Get field metadata for a Zoho CRM module for a specific user.
        
        Args:
            user_email: Email of the user
            module_name: Name of the Zoho CRM module
            
        Returns:
            Dictionary containing field metadata
        """
        self._ensure_sdk_initialized()
        
        try:
            logger.info("Getting module fields for user", 
                       user_email=user_email, 
                       module=module_name)
            
            # 1. Switch the SDK context to the current user
            if not await switch_zoho_user(user_email):
                raise Exception(f"Failed to switch SDK context to user: {user_email}")
            
            # 2. Get fields using the current user's token
            fields_operations = FieldsOperations()
            response = fields_operations.get_fields(module_name)
            
            # 3. Process the response
            if response is not None:
                result = await self._process_api_response(response, f"get_fields_{module_name}")
                logger.info("Successfully retrieved module fields", 
                           user_email=user_email,
                           module=module_name,
                           field_count=len(result.get("fields", [])))
                return result
            else:
                logger.warning("No response received for module fields", 
                              user_email=user_email, 
                              module=module_name)
                return {"fields": []}
                
        except SDKException as e:
            logger.error("Zoho SDK error getting fields", 
                        user_email=user_email, 
                        module=module_name, 
                        error=str(e),
                        exc_info=True)
            raise
        except Exception as e:
            logger.error("Error getting module fields", 
                        user_email=user_email, 
                        module=module_name, 
                        error=str(e),
                        exc_info=True)
            raise
    
    async def test_connection_for_user(self, user_email: str) -> Dict[str, Any]:
        """
        Test the Zoho CRM connection for a specific user.
        
        Args:
            user_email: Email of the user to test connection for
            
        Returns:
            Dictionary containing connection status
        """
        try:
            logger.info("Testing Zoho CRM connection for user", user_email=user_email)
            
            # Try to get a small sample of deals as a connection test
            result = await self.get_deals_for_user(
                user_email=user_email, 
                page=1, 
                per_page=1
            )
            
            return {
                "status": "success",
                "message": "Successfully connected to Zoho CRM",
                "user_email": user_email,
                "records_available": result.get("info", {}).get("count", 0) > 0
            }
            
        except Exception as e:
            logger.error("Zoho CRM connection test failed", 
                        user_email=user_email, 
                        error=str(e),
                        exc_info=True)
            return {
                "status": "error",
                "message": f"Connection failed: {str(e)}",
                "user_email": user_email
            }
    
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
            if response is not None:
                status_code = response.get_status_code()
                
                # Handle successful responses
                if status_code in [200, 201]:
                    response_object = response.get_object()
                    
                    if isinstance(response_object, ResponseWrapper):
                        # Handle record responses
                        data = response_object.get_data() or []
                        info_obj = response_object.get_info()
                        
                        # Extract metadata
                        info = {}
                        if info_obj:
                            info = {
                                "count": getattr(info_obj, 'get_count', lambda: len(data))(),
                                "page": getattr(info_obj, 'get_page', lambda: 1)(),
                                "per_page": getattr(info_obj, 'get_per_page', lambda: 200)(),
                                "more_records": getattr(info_obj, 'get_more_records', lambda: False)()
                            }
                        
                        # Convert records to dictionary format
                        processed_data = []
                        if data:
                            for record in data:
                                record_dict = {}
                                if hasattr(record, 'get_key_values'):
                                    key_values = record.get_key_values()
                                    if key_values:
                                        for key, value in key_values.items():
                                            # Convert Zoho objects to serializable format
                                            record_dict[key] = self._serialize_value(value)
                                processed_data.append(record_dict)
                        
                        logger.info(f"Successfully processed {operation}", 
                                   record_count=len(processed_data))
                        return {"data": processed_data, "info": info}
                    
                    elif hasattr(response_object, 'get_fields'):
                        # Handle fields response
                        fields = response_object.get_fields() or []
                        processed_fields = []
                        
                        for field in fields:
                            field_dict = {}
                            if hasattr(field, 'get_key_values'):
                                key_values = field.get_key_values()
                                if key_values:
                                    for key, value in key_values.items():
                                        field_dict[key] = self._serialize_value(value)
                            processed_fields.append(field_dict)
                        
                        logger.info(f"Successfully processed {operation}", 
                                   field_count=len(processed_fields))
                        return {"fields": processed_fields}
                    
                    else:
                        # Handle other response types
                        result = {}
                        if hasattr(response_object, 'get_details'):
                            details = response_object.get_details()
                            if details:
                                for detail in details:
                                    if hasattr(detail, 'get_key_values'):
                                        key_values = detail.get_key_values()
                                        if key_values:
                                            for key, value in key_values.items():
                                                result[key] = self._serialize_value(value)
                        
                        logger.info(f"Successfully processed {operation}")
                        return result
                
                # Handle no content responses
                elif status_code == 204:
                    logger.info(f"No content for {operation}")
                    return {"data": [], "info": {"count": 0}}
                
                # Handle not modified responses
                elif status_code == 304:
                    logger.info(f"Not modified for {operation}")
                    return {"data": [], "info": {"count": 0, "not_modified": True}}
                
                else:
                    # Handle error responses
                    error_message = f"API error for {operation}: HTTP {status_code}"
                    logger.error(error_message)
                    raise Exception(error_message)
            
            else:
                error_message = f"No response received for {operation}"
                logger.error(error_message)
                raise Exception(error_message)
                
        except Exception as e:
            logger.error(f"Error processing API response for {operation}", error=str(e))
            raise
    
    def _serialize_value(self, value: Any) -> Any:
        """
        Serialize Zoho SDK objects to JSON-serializable format.
        
        Args:
            value: Value to serialize
            
        Returns:
            Serialized value
        """
        if value is None:
            return None
        elif isinstance(value, (str, int, float, bool)):
            return value
        elif isinstance(value, datetime):
            return value.isoformat()
        elif isinstance(value, list):
            return [self._serialize_value(item) for item in value]
        elif isinstance(value, dict):
            return {key: self._serialize_value(val) for key, val in value.items()}
        elif hasattr(value, 'get_key_values'):
            # Handle Zoho SDK objects
            key_values = value.get_key_values()
            if key_values:
                return {key: self._serialize_value(val) for key, val in key_values.items()}
            return str(value)
        else:
            return str(value)
    
    def get_available_modules(self) -> List[str]:
        """
        Get list of available CRM modules that Pipeline Pulse supports.
        
        Returns:
            List of module names
        """
        return [
            "Deals",       # Primary module for Pipeline Pulse
            "Accounts",    # Customer/company records
            "Contacts",    # Individual contact records
            "Leads",       # Lead records
            "Products",    # Product catalog
            "Quotes",      # Quote records
            "Tasks",       # Activity tracking
            "Events",      # Calendar events
            "Calls",       # Call logs
            "Notes",       # Note records
        ]


# Create a singleton instance for the application
zoho_crm_service = ZohoCRMService()