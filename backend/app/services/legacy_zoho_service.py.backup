"""
Zoho CRM Service - SDK-based implementation for Pipeline Pulse
Enhanced with official Zoho SDK integration and backward compatibility
"""

from typing import Dict, Any, Optional, List
import logging
import asyncio
from datetime import datetime
from app.services.zoho_sdk_manager import get_sdk_manager
from app.services.async_zoho_wrapper import AsyncZohoWrapper, AsyncZohoWrapperError
from app.services.thread_safe_zoho_wrapper import ThreadSafeZohoWrapper, ZohoUserContext
from app.core.config import settings

logger = logging.getLogger(__name__)


class ZohoService:
    """
    Enhanced Zoho CRM Service using official SDK
    Provides backward compatibility while leveraging SDK features
    """
    
    def __init__(self):
        """Initialize the service with SDK integration"""
        self.base_url = settings.ZOHO_BASE_URL
        self.sdk_manager = get_sdk_manager()
        self._initialized = False
        logger.info("ZohoService initialized with SDK integration")
    
    async def _ensure_sdk_initialized(self) -> bool:
        """Ensure SDK is initialized before operations"""
        if not self._initialized:
            try:
                if not self.sdk_manager.is_initialized():
                    # Initialize SDK with current settings
                    success = self.sdk_manager.initialize_sdk()
                    if success:
                        self._initialized = True
                        logger.info("SDK initialized successfully")
                    else:
                        logger.error("Failed to initialize SDK")
                        return False
                else:
                    self._initialized = True
                    logger.info("SDK already initialized")
                return True
            except Exception as e:
                logger.error(f"SDK initialization error: {e}")
                return False
        return True
    
    async def update_deal(self, deal_id: str, deal_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update a deal in Zoho CRM using SDK
        
        Args:
            deal_id: The Zoho deal ID
            deal_data: Dictionary containing the fields to update
            
        Returns:
            Dictionary with update result
        """
        logger.info(f"ZohoService.update_deal called for deal {deal_id} with data: {deal_data}")
        
        try:
            # Ensure SDK is initialized
            if not await self._ensure_sdk_initialized():
                return {
                    "status": "error",
                    "error": "SDK not initialized",
                    "deal_id": deal_id
                }
            
            # Prepare data for SDK
            records_data = [{
                "id": deal_id,
                **deal_data
            }]
            
            # Use async wrapper for SDK operations
            async with AsyncZohoWrapper() as wrapper:
                result = await wrapper.update_records("Deals", records_data)
                
                if result.get("status") == "success":
                    return {
                        "status": "success",
                        "deal_id": deal_id,
                        "updated_fields": list(deal_data.keys()),
                        "message": "Deal updated successfully via SDK",
                        "sdk_result": result
                    }
                else:
                    return {
                        "status": "error",
                        "error": result.get("message", "Unknown error"),
                        "deal_id": deal_id
                    }
                    
        except AsyncZohoWrapperError as e:
            logger.error(f"SDK wrapper error updating deal {deal_id}: {e}")
            return {
                "status": "error",
                "error": str(e),
                "deal_id": deal_id
            }
        except Exception as e:
            logger.error(f"Unexpected error updating deal {deal_id}: {e}")
            return {
                "status": "error",
                "error": str(e),
                "deal_id": deal_id
            }
    
    async def get_deal(self, deal_id: str, fields: Optional[List[str]] = None) -> Optional[Dict[str, Any]]:
        """
        Get a deal from Zoho CRM using SDK
        
        Args:
            deal_id: The Zoho deal ID
            fields: Optional list of fields to retrieve
            
        Returns:
            Dictionary with deal data or None if not found
        """
        logger.info(f"ZohoService.get_deal called for deal {deal_id}")
        
        try:
            # Ensure SDK is initialized
            if not await self._ensure_sdk_initialized():
                logger.error("SDK not initialized")
                return None
            
            # Use async wrapper for SDK operations
            async with AsyncZohoWrapper() as wrapper:
                result = await wrapper.get_record("Deals", deal_id, fields)
                
                if result.get("status") == "success":
                    return result.get("data")
                else:
                    logger.warning(f"Failed to get deal {deal_id}: {result.get('message')}")
                    return None
                    
        except AsyncZohoWrapperError as e:
            logger.error(f"SDK wrapper error getting deal {deal_id}: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error getting deal {deal_id}: {e}")
            return None
    
    async def create_deal(self, deal_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new deal in Zoho CRM using SDK
        
        Args:
            deal_data: Dictionary containing the deal fields
            
        Returns:
            Dictionary with creation result
        """
        logger.info(f"ZohoService.create_deal called with data: {deal_data}")
        
        try:
            # Ensure SDK is initialized
            if not await self._ensure_sdk_initialized():
                return {
                    "status": "error",
                    "error": "SDK not initialized"
                }
            
            # Use async wrapper for SDK operations
            async with AsyncZohoWrapper() as wrapper:
                result = await wrapper.create_records("Deals", [deal_data])
                
                if result.get("status") == "success":
                    sdk_results = result.get("data", [])
                    if sdk_results and len(sdk_results) > 0:
                        first_result = sdk_results[0]
                        if first_result.get("status") == "success":
                            return {
                                "status": "success",
                                "deal_id": first_result.get("details", {}).get("id"),
                                "message": "Deal created successfully via SDK",
                                "sdk_result": first_result
                            }
                    
                    return {
                        "status": "error",
                        "error": "No successful results from SDK",
                        "sdk_result": result
                    }
                else:
                    return {
                        "status": "error",
                        "error": result.get("message", "Unknown error"),
                        "sdk_result": result
                    }
                    
        except AsyncZohoWrapperError as e:
            logger.error(f"SDK wrapper error creating deal: {e}")
            return {
                "status": "error",
                "error": str(e)
            }
        except Exception as e:
            logger.error(f"Unexpected error creating deal: {e}")
            return {
                "status": "error",
                "error": str(e)
            }
    
    async def get_deals_thread_safe(
        self, 
        fields: Optional[List[str]] = None, 
        page: int = 1, 
        per_page: int = 200,
        user_context: Optional[ZohoUserContext] = None
    ) -> List[Dict[str, Any]]:
        """
        Get deals from Zoho CRM using thread-safe SDK wrapper
        
        Args:
            fields: Optional list of fields to retrieve
            page: Page number for pagination
            per_page: Records per page
            user_context: Optional user context for multi-user scenarios
            
        Returns:
            List of deal dictionaries
        """
        logger.info(f"ZohoService.get_deals_thread_safe called (page {page}, per_page {per_page})")
        
        try:
            async with ThreadSafeZohoWrapper() as wrapper:
                response = await wrapper.get_records(
                    module_name="Deals",
                    page=page,
                    per_page=per_page,
                    fields=fields,
                    user_context=user_context
                )
                
                if response.get("status") == "success":
                    deals = response.get("data", [])
                    logger.info(f"✅ Retrieved {len(deals)} deals via thread-safe SDK")
                    return deals
                else:
                    logger.error(f"Thread-safe get_deals failed: {response.get('message')}")
                    return []
                    
        except Exception as e:
            logger.error(f"Error in thread-safe get_deals: {str(e)}")
            # Fallback to original method
            logger.info("Falling back to original get_deals method")
            return await self.get_deals(fields, page, per_page)
    
    async def get_deals(self, fields: Optional[List[str]] = None, page: int = 1, per_page: int = 200) -> List[Dict[str, Any]]:
        """
        Get deals from Zoho CRM using SDK
        
        Args:
            fields: Optional list of fields to retrieve
            page: Page number for pagination
            per_page: Records per page
            
        Returns:
            List of deal dictionaries
        """
        logger.info(f"ZohoService.get_deals called (page {page}, per_page {per_page})")
        
        try:
            # Ensure SDK is initialized
            if not await self._ensure_sdk_initialized():
                logger.error("SDK not initialized")
                return []
            
            # Use async wrapper for SDK operations
            async with AsyncZohoWrapper() as wrapper:
                result = await wrapper.get_records("Deals", page, per_page, fields)
                
                if result.get("status") == "success":
                    return result.get("data", [])
                else:
                    logger.warning(f"Failed to get deals: {result.get('message')}")
                    return []
                    
        except AsyncZohoWrapperError as e:
            logger.error(f"SDK wrapper error getting deals: {e}")
            return []
        except Exception as e:
            logger.error(f"Unexpected error getting deals: {e}")
            return []
    
    def validate_field(self, field_name: str, field_value: Any, module: str = "Deals") -> Dict[str, Any]:
        """
        Validate a field value for Zoho CRM
        
        Args:
            field_name: Name of the field to validate
            field_value: Value to validate
            module: Zoho module name (default: Deals)
            
        Returns:
            Dictionary with validation result
        """
        logger.info(f"ZohoService.validate_field called for {field_name} in {module}")
        
        # Basic validation logic
        validation_result = {
            "valid": True,
            "field_name": field_name,
            "field_value": field_value,
            "module": module,
            "message": "Field validation passed"
        }
        
        # Add basic field validation rules
        if field_name == "Amount" and field_value:
            try:
                float(field_value)
            except (ValueError, TypeError):
                validation_result["valid"] = False
                validation_result["message"] = "Amount must be a valid number"
        
        elif field_name == "Probability" and field_value:
            try:
                prob = int(field_value)
                if prob < 0 or prob > 100:
                    validation_result["valid"] = False
                    validation_result["message"] = "Probability must be between 0 and 100"
            except (ValueError, TypeError):
                validation_result["valid"] = False
                validation_result["message"] = "Probability must be a valid integer"
        
        elif field_name in ["Closing_Date", "Proposal_Date", "PO_Date", "Kickoff_Date", "Invoice_Date", "Payment_Date", "Revenue_Date"]:
            if field_value:
                try:
                    # Try to parse as date
                    from datetime import datetime
                    if isinstance(field_value, str):
                        datetime.fromisoformat(field_value.replace('Z', '+00:00'))
                except (ValueError, TypeError):
                    validation_result["valid"] = False
                    validation_result["message"] = f"{field_name} must be a valid date"
        
        return validation_result
    
    async def get_connection_status(self) -> Dict[str, Any]:
        """
        Get current connection status with SDK
        
        Returns:
            Dictionary with connection status information
        """
        try:
            sdk_status = self.sdk_manager.validate_initialization()
            
            return {
                "status": "healthy" if sdk_status["initialized"] else "unhealthy",
                "sdk_available": sdk_status["sdk_available"],
                "sdk_initialized": sdk_status["initialized"],
                "message": sdk_status["message"],
                "base_url": self.base_url,
                "last_check": datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Error checking connection status: {e}")
            return {
                "status": "error",
                "error": str(e),
                "base_url": self.base_url,
                "last_check": datetime.now().isoformat()
            }