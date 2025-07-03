"""
Service for fetching and managing Zoho CRM field metadata using SDK
"""

import asyncio
from typing import List, Dict, Any, Optional
from app.services.zoho_sdk_manager import get_sdk_manager
from app.services.zoho_crm.modules.fields import ZohoFieldManager
import logging

logger = logging.getLogger(__name__)


class SDKFieldValidationError(Exception):
    """Exception raised when SDK field validation fails"""
    pass


class ZohoFieldService:
    """Service for managing Zoho CRM field metadata and validation using SDK"""
    
    def __init__(self):
        self.sdk_manager = get_sdk_manager()
        self.fields_module = ZohoFieldManager()
        self._field_cache: Dict[str, List[Dict[str, Any]]] = {}
        self._cache_ttl = 3600  # 1 hour cache
        
    async def get_module_fields(self, module: str = "Deals") -> List[Dict[str, Any]]:
        """
        Get all fields for a Zoho CRM module with caching using SDK
        """
        try:
            # Check cache first
            cache_key = f"{module}_fields"
            if cache_key in self._field_cache:
                logger.debug(f"Returning cached fields for module: {module}")
                return self._field_cache[cache_key]
            
            # Ensure SDK is initialized
            if not self.sdk_manager.is_initialized():
                logger.error("SDK not initialized for field fetching")
                raise Exception("SDK not initialized")
            
            # Use field manager to fetch fields (it handles caching internally)
            processed_fields = await self.fields_module.get_module_fields(module)
            
            # Cache the results in our own cache as well
            self._field_cache[cache_key] = processed_fields
            logger.info(f"Fetched and cached {len(processed_fields)} fields for module: {module} via field manager")
            
            return processed_fields
                    
        except Exception as e:
            logger.error(f"Error fetching fields for module {module}: {str(e)}")
            raise
    
    def _process_field_metadata(self, field: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process and normalize field metadata from Zoho CRM
        """
        return {
            "api_name": field.get("api_name", ""),
            "display_label": field.get("display_label", ""),
            "data_type": field.get("data_type", "text"),
            "is_custom": field.get("custom_field", False),
            "is_read_only": field.get("read_only", False),
            "is_required": field.get("required", False),
            "is_system_field": field.get("system_mandatory", False),
            "has_picklist": field.get("data_type") == "picklist",
            "picklist_values": self._extract_picklist_values(field),
            "max_length": field.get("length"),
            "validation_rules": field.get("validation", {}),
            "field_label": field.get("field_label", ""),
            "tooltip": field.get("tooltip", ""),
            "default_value": field.get("default_value"),
        }
    
    def _extract_picklist_values(self, field: Dict[str, Any]) -> Optional[List[Dict[str, str]]]:
        """
        Extract picklist values from field metadata
        """
        if field.get("data_type") != "picklist":
            return None
            
        pick_list_values = field.get("pick_list_values", [])
        if not pick_list_values:
            return None
            
        return [
            {
                "actual_value": item.get("actual_value", ""),
                "display_value": item.get("display_value", "")
            }
            for item in pick_list_values
        ]
    
    async def get_field_picklist_values(self, field_name: str, module: str = "Deals") -> List[Dict[str, str]]:
        """
        Get available picklist values for a specific field (alias for get_field_values)
        """
        return await self.get_field_values(field_name, module)

    async def get_field_values(self, field_name: str, module: str = "Deals") -> List[Dict[str, str]]:
        """
        Get available values for a specific field (useful for picklists) using SDK
        """
        try:
            # First try to get from cached module fields
            fields = await self.get_module_fields(module)
            field = next((f for f in fields if f["api_name"] == field_name), None)
            
            if not field:
                raise Exception(f"Field '{field_name}' not found in module '{module}'")
            
            if not field.get("has_picklist"):
                return []
            
            # For more detailed picklist values, use SDK's dedicated field API if available
            cached_values = field.get("picklist_values", [])
            
            if cached_values:
                return cached_values
            
            # Return cached values (field manager already provides detailed info)
            return cached_values
            
        except Exception as e:
            logger.error(f"Error fetching values for field {field_name}: {str(e)}")
            raise
    
    async def validate_field_value(self, field_name: str, value: Any, module: str = "Deals") -> Dict[str, Any]:
        """
        Validate a field value against Zoho CRM field constraints
        """
        try:
            fields = await self.get_module_fields(module)
            field = next((f for f in fields if f["api_name"] == field_name), None)
            
            if not field:
                return {
                    "valid": False,
                    "error": f"Field '{field_name}' not found in module '{module}'"
                }
            
            # Check if field is read-only
            if field.get("is_read_only"):
                return {
                    "valid": False,
                    "error": f"Field '{field_name}' is read-only and cannot be updated"
                }
            
            # Check if field is system field
            if field.get("is_system_field"):
                return {
                    "valid": False,
                    "error": f"Field '{field_name}' is a system field and cannot be updated"
                }
            
            # Validate required fields
            if field.get("is_required") and (value is None or value == ""):
                return {
                    "valid": False,
                    "error": f"Field '{field_name}' is required and cannot be empty"
                }
            
            # Validate picklist values
            if field.get("has_picklist") and value is not None:
                picklist_values = field.get("picklist_values", [])
                valid_values = [item["actual_value"] for item in picklist_values]
                
                if str(value) not in valid_values:
                    return {
                        "valid": False,
                        "error": f"Invalid value '{value}' for field '{field_name}'. Valid values: {valid_values}"
                    }
            
            # Validate string length
            if field.get("data_type") in ["text", "textarea"] and field.get("max_length"):
                if value and len(str(value)) > field["max_length"]:
                    return {
                        "valid": False,
                        "error": f"Value too long for field '{field_name}'. Maximum length: {field['max_length']}"
                    }
            
            # Validate numeric fields
            if field.get("data_type") in ["integer", "double", "currency"] and value is not None:
                try:
                    if field["data_type"] == "integer":
                        int(value)
                    else:
                        float(value)
                except (ValueError, TypeError):
                    return {
                        "valid": False,
                        "error": f"Invalid numeric value '{value}' for field '{field_name}'"
                    }
            
            return {
                "valid": True,
                "field_info": field
            }
            
        except Exception as e:
            logger.error(f"Error validating field {field_name}: {str(e)}")
            return {
                "valid": False,
                "error": f"Validation error: {str(e)}"
            }
    
    def clear_cache(self, module: Optional[str] = None):
        """
        Clear field cache for a specific module or all modules
        """
        if module:
            cache_key = f"{module}_fields"
            if cache_key in self._field_cache:
                del self._field_cache[cache_key]
                logger.info(f"Cleared field cache for module: {module}")
        else:
            self._field_cache.clear()
            logger.info("Cleared all field cache")
    
    async def refresh_fields(self, module: str = "Deals") -> List[Dict[str, Any]]:
        """
        Force refresh fields from Zoho CRM via SDK (bypass cache)
        """
        self.clear_cache(module)
        return await self.get_module_fields(module)
    
    async def validate_field_mapping(self, field_mappings: Dict[str, str], module: str = "Deals") -> Dict[str, Any]:
        """
        Validate field mappings against SDK field definitions
        """
        try:
            # Get current fields from SDK
            fields = await self.get_module_fields(module)
            field_lookup = {f["api_name"]: f for f in fields}
            
            validation_results = {
                "valid": True,
                "errors": [],
                "warnings": [],
                "field_info": {}
            }
            
            for pipeline_field, crm_field in field_mappings.items():
                if crm_field not in field_lookup:
                    validation_results["valid"] = False
                    validation_results["errors"].append(f"CRM field '{crm_field}' not found in module '{module}'")
                else:
                    field_info = field_lookup[crm_field]
                    validation_results["field_info"][pipeline_field] = field_info
                    
                    # Check for potential issues
                    if field_info.get("is_read_only"):
                        validation_results["warnings"].append(f"Field '{crm_field}' is read-only")
                    
                    if field_info.get("is_system_field"):
                        validation_results["warnings"].append(f"Field '{crm_field}' is a system field")
            
            return validation_results
            
        except Exception as e:
            logger.error(f"Field mapping validation failed: {e}")
            return {
                "valid": False,
                "errors": [f"Validation failed: {str(e)}"],
                "warnings": [],
                "field_info": {}
            }
    
    async def get_sdk_field_schema(self, module: str = "Deals") -> Dict[str, Any]:
        """
        Get SDK-compatible field schema for the module
        """
        try:
            fields = await self.get_module_fields(module)
            
            schema = {
                "module": module,
                "fields": {},
                "required_fields": [],
                "picklist_fields": {},
                "readonly_fields": [],
                "custom_fields": []
            }
            
            for field in fields:
                api_name = field["api_name"]
                schema["fields"][api_name] = {
                    "display_label": field["display_label"],
                    "data_type": field["data_type"],
                    "is_custom": field["is_custom"],
                    "is_required": field["is_required"],
                    "is_read_only": field["is_read_only"],
                    "max_length": field.get("max_length")
                }
                
                if field["is_required"]:
                    schema["required_fields"].append(api_name)
                
                if field["has_picklist"]:
                    schema["picklist_fields"][api_name] = field.get("picklist_values", [])
                
                if field["is_read_only"]:
                    schema["readonly_fields"].append(api_name)
                
                if field["is_custom"]:
                    schema["custom_fields"].append(api_name)
            
            return schema
            
        except Exception as e:
            logger.error(f"Error generating SDK field schema: {e}")
            raise
