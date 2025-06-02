"""
Service for fetching and managing Zoho CRM field metadata
"""

import httpx
import asyncio
from typing import List, Dict, Any, Optional
from app.services.zoho_service import ZohoService
import logging

logger = logging.getLogger(__name__)


class ZohoFieldService:
    """Service for managing Zoho CRM field metadata and validation"""
    
    def __init__(self):
        self.zoho_service = ZohoService()
        self._field_cache: Dict[str, List[Dict[str, Any]]] = {}
        self._cache_ttl = 3600  # 1 hour cache
        
    async def get_module_fields(self, module: str = "Deals") -> List[Dict[str, Any]]:
        """
        Get all fields for a Zoho CRM module with caching
        """
        try:
            # Check cache first
            cache_key = f"{module}_fields"
            if cache_key in self._field_cache:
                logger.debug(f"Returning cached fields for module: {module}")
                return self._field_cache[cache_key]
            
            # Ensure we have a valid access token
            if not self.zoho_service.access_token:
                await self.zoho_service.get_access_token()
            
            headers = {
                "Authorization": f"Zoho-oauthtoken {self.zoho_service.access_token}",
                "Content-Type": "application/json"
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.zoho_service.base_url}/settings/fields?module={module}",
                    headers=headers
                )
                
                if response.status_code == 200:
                    data = response.json()
                    fields = data.get("fields", [])
                    
                    # Process and normalize field data
                    processed_fields = []
                    for field in fields:
                        processed_field = self._process_field_metadata(field)
                        processed_fields.append(processed_field)
                    
                    # Cache the results
                    self._field_cache[cache_key] = processed_fields
                    logger.info(f"Fetched and cached {len(processed_fields)} fields for module: {module}")
                    
                    return processed_fields
                else:
                    logger.error(f"Failed to fetch fields for module {module}: {response.text}")
                    raise Exception(f"Failed to fetch fields: {response.text}")
                    
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
        Get available values for a specific field (useful for picklists)
        """
        try:
            fields = await self.get_module_fields(module)
            field = next((f for f in fields if f["api_name"] == field_name), None)
            
            if not field:
                raise Exception(f"Field '{field_name}' not found in module '{module}'")
            
            if not field.get("has_picklist"):
                return []
            
            return field.get("picklist_values", [])
            
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
        Force refresh fields from Zoho CRM (bypass cache)
        """
        self.clear_cache(module)
        return await self.get_module_fields(module)
