"""
Unified Field Management Module
Consolidates field metadata, validation, and caching functionality
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from ..core.api_client import ZohoAPIClient
from ..core.exceptions import ZohoFieldError, ZohoValidationError
import logging

logger = logging.getLogger(__name__)


class ZohoFieldManager:
    """
    Unified field manager with enhanced caching and validation
    Replaces functionality from zoho_field_service.py
    """
    
    def __init__(self):
        self.api_client = ZohoAPIClient()
        self._field_cache: Dict[str, Dict[str, Any]] = {}
        self._cache_ttl = 3600  # 1 hour cache
    
    async def get_module_fields(
        self, 
        module: str = "Deals", 
        force_refresh: bool = False
    ) -> List[Dict[str, Any]]:
        """
        Get field metadata for a Zoho CRM module with intelligent caching
        """
        
        cache_key = f"{module}_fields"
        
        # Check cache first
        if not force_refresh and self._is_cache_valid(cache_key):
            logger.debug(f"Returning cached fields for module: {module}")
            return self._field_cache[cache_key]["data"]
        
        try:
            response = await self.api_client.get(f"settings/fields?module={module}")
            fields = response.get("fields", [])
            
            # Process and normalize field data
            processed_fields = []
            for field in fields:
                processed_field = self._process_field_metadata(field)
                processed_fields.append(processed_field)
            
            # Cache the results
            self._field_cache[cache_key] = {
                "data": processed_fields,
                "cached_at": datetime.now(),
                "ttl": self._cache_ttl
            }
            
            logger.info(f"Fetched and cached {len(processed_fields)} fields for module: {module}")
            return processed_fields
            
        except Exception as e:
            logger.error(f"Failed to fetch fields for module {module}: {str(e)}")
            raise ZohoFieldError(f"Failed to fetch fields: {str(e)}")
    
    def _process_field_metadata(self, field: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process and normalize field metadata from Zoho CRM
        Enhanced with additional validation rules and metadata
        """
        
        processed = {
            "api_name": field.get("api_name", ""),
            "display_label": field.get("display_label", ""),
            "field_label": field.get("field_label", ""),
            "data_type": field.get("data_type", "text"),
            "is_custom": field.get("custom_field", False),
            "is_read_only": field.get("read_only", False),
            "is_required": field.get("required", False),
            "is_system_field": field.get("system_mandatory", False),
            "is_visible": field.get("visible", True),
            "max_length": field.get("length"),
            "precision": field.get("precision"),
            "scale": field.get("scale"),
            "tooltip": field.get("tooltip", ""),
            "default_value": field.get("default_value"),
            
            # Picklist handling
            "has_picklist": field.get("data_type") == "picklist",
            "picklist_values": self._extract_picklist_values(field),
            
            # Validation rules
            "validation_rules": self._extract_validation_rules(field),
            
            # Lookup/reference field handling
            "is_lookup": field.get("data_type") == "lookup",
            "lookup_module": field.get("lookup", {}).get("module") if field.get("lookup") else None,
            
            # Formula field handling
            "is_formula": field.get("formula", {}).get("return_type") is not None,
            "formula_return_type": field.get("formula", {}).get("return_type"),
            
            # Currency field handling
            "is_currency": field.get("data_type") == "currency",
            "currency_precision": field.get("precision") if field.get("data_type") == "currency" else None,
            
            # Date/DateTime handling
            "is_date": field.get("data_type") in ["date", "datetime"],
            "date_format": field.get("format") if field.get("data_type") in ["date", "datetime"] else None,
            
            # Additional metadata
            "sequence_number": field.get("sequence_number"),
            "field_read_only": field.get("field_read_only", False),
            "businesscard_supported": field.get("businesscard_supported", False),
            
            # Conflict resolution metadata
            "is_zoho_authoritative": self._is_zoho_authoritative_field(field.get("api_name", "")),
            "is_local_analytical": self._is_local_analytical_field(field.get("api_name", "")),
        }
        
        return processed
    
    def _extract_picklist_values(self, field: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extract and normalize picklist values"""
        
        if field.get("data_type") != "picklist":
            return []
        
        pick_list_values = field.get("pick_list_values", [])
        processed_values = []
        
        for value in pick_list_values:
            processed_values.append({
                "display_value": value.get("display_value", ""),
                "actual_value": value.get("actual_value", ""),
                "sequence_number": value.get("sequence_number", 0),
                "maps": value.get("maps", [])
            })
        
        return processed_values
    
    def _extract_validation_rules(self, field: Dict[str, Any]) -> Dict[str, Any]:
        """Extract validation rules from field metadata"""
        
        rules = {}
        
        # Basic validation
        if field.get("required"):
            rules["required"] = True
        
        # Length validation
        if field.get("length"):
            rules["max_length"] = field.get("length")
        
        # Numeric validation
        if field.get("data_type") in ["number", "currency", "percent"]:
            if field.get("precision"):
                rules["precision"] = field.get("precision")
            if field.get("scale"):
                rules["scale"] = field.get("scale")
        
        # Date validation
        if field.get("data_type") in ["date", "datetime"]:
            rules["date_format"] = field.get("format", "yyyy-MM-dd")
        
        # Custom validation from field metadata
        validation = field.get("validation", {})
        if validation:
            rules.update(validation)
        
        return rules
    
    def _is_zoho_authoritative_field(self, field_name: str) -> bool:
        """Check if field is managed by Zoho CRM (authoritative)"""
        zoho_fields = {
            'deal_name', 'account_name', 'amount', 'currency', 'stage', 
            'probability', 'closing_date', 'owner', 'territory', 'service_type',
            'created_date', 'modified_date', 'deal_id', 'record_id', 'id'
        }
        return field_name.lower() in zoho_fields
    
    def _is_local_analytical_field(self, field_name: str) -> bool:
        """Check if field is a local analytical extension"""
        local_fields = {
            'health_signal', 'health_reason', 'current_phase', 'action_items',
            'requires_attention', 'updated_this_week', 'last_health_check',
            'pipeline_analysis_id', 'local_notes', 'custom_tags', 'risk_factors'
        }
        return field_name.lower() in local_fields
    
    def _is_cache_valid(self, cache_key: str) -> bool:
        """Check if cached data is still valid"""
        
        if cache_key not in self._field_cache:
            return False
        
        cache_entry = self._field_cache[cache_key]
        cached_at = cache_entry.get("cached_at")
        ttl = cache_entry.get("ttl", self._cache_ttl)
        
        if not cached_at:
            return False
        
        expiry_time = cached_at + timedelta(seconds=ttl)
        return datetime.now() < expiry_time
    
    async def validate_field_value(
        self, 
        field_name: str, 
        value: Any, 
        module: str = "Deals"
    ) -> Dict[str, Any]:
        """
        Enhanced field value validation against Zoho CRM constraints
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
            if field.get("is_read_only") or field.get("field_read_only"):
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
            
            # Validate based on data type
            validation_result = self._validate_by_data_type(field, value)
            if not validation_result["valid"]:
                return validation_result
            
            # Validate against picklist values
            if field.get("has_picklist"):
                validation_result = self._validate_picklist_value(field, value)
                if not validation_result["valid"]:
                    return validation_result
            
            # Validate against custom validation rules
            validation_rules = field.get("validation_rules", {})
            if validation_rules:
                validation_result = self._validate_custom_rules(validation_rules, value)
                if not validation_result["valid"]:
                    return validation_result
            
            return {
                "valid": True,
                "message": f"Field '{field_name}' validation passed"
            }
            
        except Exception as e:
            logger.error(f"Error validating field {field_name}: {str(e)}")
            return {
                "valid": False,
                "error": f"Validation error: {str(e)}"
            }
    
    def _validate_by_data_type(self, field: Dict[str, Any], value: Any) -> Dict[str, Any]:
        """Validate value based on field data type"""
        
        data_type = field.get("data_type", "text")
        
        if value is None:
            if field.get("is_required"):
                return {"valid": False, "error": f"Field is required but value is null"}
            return {"valid": True}
        
        # String/Text validation
        if data_type in ["text", "textarea", "email", "phone", "website"]:
            if not isinstance(value, str):
                return {"valid": False, "error": f"Expected string value for {data_type} field"}
            
            max_length = field.get("max_length")
            if max_length and len(value) > max_length:
                return {"valid": False, "error": f"Value exceeds maximum length of {max_length}"}
        
        # Numeric validation
        elif data_type in ["number", "currency", "percent"]:
            if not isinstance(value, (int, float)):
                try:
                    float(value)
                except (ValueError, TypeError):
                    return {"valid": False, "error": f"Expected numeric value for {data_type} field"}
        
        # Boolean validation
        elif data_type == "boolean":
            if not isinstance(value, bool):
                return {"valid": False, "error": "Expected boolean value"}
        
        # Date validation
        elif data_type in ["date", "datetime"]:
            if isinstance(value, str):
                try:
                    datetime.fromisoformat(value.replace('Z', '+00:00'))
                except ValueError:
                    return {"valid": False, "error": "Invalid date format"}
        
        return {"valid": True}
    
    def _validate_picklist_value(self, field: Dict[str, Any], value: Any) -> Dict[str, Any]:
        """Validate value against picklist options"""
        
        picklist_values = field.get("picklist_values", [])
        valid_values = [pv.get("actual_value") for pv in picklist_values]
        
        if value not in valid_values:
            return {
                "valid": False,
                "error": f"Value '{value}' is not a valid option. Valid options: {valid_values}"
            }
        
        return {"valid": True}
    
    def _validate_custom_rules(self, rules: Dict[str, Any], value: Any) -> Dict[str, Any]:
        """Validate against custom validation rules"""
        
        # This is a simplified implementation
        # In practice, you would implement specific validation logic based on the rules
        
        if rules.get("required") and not value:
            return {"valid": False, "error": "Field is required"}
        
        return {"valid": True}
    
    def clear_cache(self, module: Optional[str] = None):
        """Clear field cache for specific module or all modules"""
        
        if module:
            cache_key = f"{module}_fields"
            if cache_key in self._field_cache:
                del self._field_cache[cache_key]
                logger.info(f"Cleared field cache for module: {module}")
        else:
            self._field_cache.clear()
            logger.info("Cleared all field cache")
    
    async def refresh_fields(self, module: str = "Deals") -> List[Dict[str, Any]]:
        """Force refresh fields from Zoho CRM (bypass cache)"""
        
        self.clear_cache(module)
        return await self.get_module_fields(module)
