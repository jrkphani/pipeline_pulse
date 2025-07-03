"""
SDK Response Transformer - Convert SDK responses to Pipeline Pulse format
Transforms Zoho SDK responses to match existing API response formats.
"""

import logging
from typing import Dict, Any, List, Optional, Union
from datetime import datetime, timezone
import json

logger = logging.getLogger(__name__)


class SDKResponseTransformerError(Exception):
    """Custom exception for response transformer errors"""
    pass


class SDKResponseTransformer:
    """
    Transforms Zoho SDK responses to Pipeline Pulse compatible format.
    Ensures backward compatibility with existing API consumers.
    """
    
    def __init__(self):
        # Field mapping from Zoho SDK format to Pipeline Pulse format
        self.field_mappings = {
            # Core deal fields
            'Deal_Name': 'deal_name',
            'Account_Name': 'account_name',
            'Amount': 'amount',
            'Currency': 'currency',
            'Probability': 'probability',
            'Stage': 'stage',
            'Closing_Date': 'closing_date',
            'Owner': 'owner',
            'Created_Time': 'created_time',
            'Modified_Time': 'modified_time',
            'Country': 'country',
            'Type': 'type',
            'Description': 'description',
            
            # Pipeline Pulse specific fields
            'Territory': 'territory',
            'Service_Line': 'service_line',
            'Strategic_Account': 'strategic_account',
            'AWS_Funded': 'aws_funded',
            'Alliance_Motion': 'alliance_motion',
            'Market_Segment': 'market_segment',
            'Lead_Source': 'lead_source',
            'Campaign_Source': 'campaign_source',
            'Partner_Referral': 'partner_referral',
            'Competition': 'competition',
            'Deal_Source': 'deal_source',
            'Sales_Process': 'sales_process',
            'Next_Step': 'next_step',
            
            # O2R Milestone fields
            'Proposal_Date': 'proposal_date',
            'SOW_Date': 'sow_date',
            'PO_Date': 'po_date',
            'Kickoff_Date': 'kickoff_date',
            'Invoice_Date': 'invoice_date',
            'Payment_Date': 'payment_date',
            'Revenue_Date': 'revenue_date'
        }
        
        # Reverse mapping for transforming outbound data
        self.reverse_field_mappings = {v: k for k, v in self.field_mappings.items()}
        
        logger.info("SDKResponseTransformer initialized")
    
    def transform_records_response(self, sdk_response: Dict[str, Any]) -> Dict[str, Any]:
        """
        Transform SDK records response to Pipeline Pulse format.
        
        Args:
            sdk_response: Raw SDK response
            
        Returns:
            Transformed response in Pipeline Pulse format
        """
        try:
            if sdk_response.get("status") != "success":
                return self._transform_error_response(sdk_response)
            
            records_data = sdk_response.get("data", [])
            
            # Handle both single record and multiple records
            if isinstance(records_data, dict):
                # Single record
                transformed_record = self._transform_single_record(records_data)
                return {
                    "status": "success",
                    "data": transformed_record,
                    "count": 1
                }
            elif isinstance(records_data, list):
                # Multiple records
                transformed_records = []
                for record in records_data:
                    transformed_record = self._transform_single_record(record)
                    transformed_records.append(transformed_record)
                
                return {
                    "status": "success",
                    "data": transformed_records,
                    "count": len(transformed_records)
                }
            else:
                logger.warning(f"Unexpected data format: {type(records_data)}")
                return {
                    "status": "success",
                    "data": records_data,
                    "count": 0
                }
                
        except Exception as e:
            logger.error(f"Error transforming records response: {str(e)}")
            return {
                "status": "error",
                "message": f"Response transformation failed: {str(e)}",
                "data": None
            }
    
    def transform_action_response(self, sdk_response: Dict[str, Any]) -> Dict[str, Any]:
        """
        Transform SDK action response (create/update/delete) to Pipeline Pulse format.
        
        Args:
            sdk_response: Raw SDK response from action operations
            
        Returns:
            Transformed response in Pipeline Pulse format
        """
        try:
            if sdk_response.get("status") != "success":
                return self._transform_error_response(sdk_response)
            
            action_data = sdk_response.get("data", [])
            
            if not isinstance(action_data, list):
                action_data = [action_data]
            
            results = []
            success_count = 0
            error_count = 0
            
            for action_result in action_data:
                if isinstance(action_result, dict):
                    if action_result.get("status") == "success":
                        success_count += 1
                        results.append({
                            "status": "success",
                            "id": action_result.get("details", {}).get("id"),
                            "code": action_result.get("code"),
                            "message": action_result.get("message")
                        })
                    else:
                        error_count += 1
                        results.append({
                            "status": "error",
                            "code": action_result.get("code"),
                            "message": action_result.get("message"),
                            "details": action_result.get("details")
                        })
            
            return {
                "status": "success" if error_count == 0 else "partial_success",
                "data": results,
                "summary": {
                    "total": len(results),
                    "success": success_count,
                    "errors": error_count
                }
            }
            
        except Exception as e:
            logger.error(f"Error transforming action response: {str(e)}")
            return {
                "status": "error",
                "message": f"Action response transformation failed: {str(e)}",
                "data": None
            }
    
    def _transform_single_record(self, record: Dict[str, Any]) -> Dict[str, Any]:
        """
        Transform a single record from SDK format to Pipeline Pulse format.
        
        Args:
            record: Single record from SDK
            
        Returns:
            Transformed record
        """
        transformed = {}
        
        for sdk_field, value in record.items():
            # Map field name
            pipeline_field = self.field_mappings.get(sdk_field, sdk_field.lower())
            
            # Transform value
            transformed_value = self._transform_field_value(sdk_field, value)
            transformed[pipeline_field] = transformed_value
        
        # Add calculated fields if needed
        transformed = self._add_calculated_fields(transformed)
        
        return transformed
    
    def _transform_field_value(self, field_name: str, value: Any) -> Any:
        """
        Transform individual field values based on field type.
        
        Args:
            field_name: Name of the field
            value: Field value
            
        Returns:
            Transformed value
        """
        if value is None:
            return None
        
        # Handle date/datetime fields
        date_fields = [
            'Created_Time', 'Modified_Time', 'Closing_Date',
            'Proposal_Date', 'SOW_Date', 'PO_Date', 'Kickoff_Date',
            'Invoice_Date', 'Payment_Date', 'Revenue_Date'
        ]
        
        if field_name in date_fields:
            return self._transform_datetime_value(value)
        
        # Handle amount/currency fields
        if field_name == 'Amount':
            return self._transform_amount_value(value)
        
        # Handle percentage fields
        if field_name == 'Probability':
            return self._transform_percentage_value(value)
        
        # Handle boolean fields
        boolean_fields = ['AWS_Funded', 'Strategic_Account', 'Alliance_Motion']
        if field_name in boolean_fields:
            return self._transform_boolean_value(value)
        
        # Handle owner/user fields
        if field_name == 'Owner':
            return self._transform_user_value(value)
        
        # Default: return as-is
        return value
    
    def _transform_datetime_value(self, value: Any) -> Optional[str]:
        """Transform datetime values to ISO format string"""
        try:
            if isinstance(value, str):
                # Already a string, try to parse and reformat
                if value:
                    dt = datetime.fromisoformat(value.replace('Z', '+00:00'))
                    return dt.isoformat()
                return None
            elif isinstance(value, datetime):
                return value.isoformat()
            else:
                return str(value) if value else None
        except Exception as e:
            logger.warning(f"Failed to transform datetime value {value}: {e}")
            return str(value) if value else None
    
    def _transform_amount_value(self, value: Any) -> Optional[float]:
        """Transform amount values to float"""
        try:
            if value is None:
                return None
            return float(value)
        except (ValueError, TypeError):
            logger.warning(f"Failed to transform amount value {value}")
            return 0.0
    
    def _transform_percentage_value(self, value: Any) -> Optional[float]:
        """Transform percentage values to float"""
        try:
            if value is None:
                return None
            return float(value)
        except (ValueError, TypeError):
            logger.warning(f"Failed to transform percentage value {value}")
            return 0.0
    
    def _transform_boolean_value(self, value: Any) -> bool:
        """Transform boolean values"""
        if isinstance(value, bool):
            return value
        elif isinstance(value, str):
            return value.lower() in ('true', '1', 'yes', 'on')
        elif isinstance(value, (int, float)):
            return bool(value)
        else:
            return False
    
    def _transform_user_value(self, value: Any) -> Dict[str, Any]:
        """Transform user/owner field values"""
        if isinstance(value, dict):
            return {
                "id": value.get("id"),
                "name": value.get("name"),
                "email": value.get("email")
            }
        elif isinstance(value, str):
            return {"name": value}
        else:
            return {"name": str(value) if value else None}
    
    def _add_calculated_fields(self, record: Dict[str, Any]) -> Dict[str, Any]:
        """Add calculated fields for Pipeline Pulse compatibility"""
        # Add health status calculation
        record["health_status"] = self._calculate_health_status(record)
        
        # Add phase information
        record["current_phase"] = self._determine_current_phase(record)
        
        # Add days in stage
        record["days_in_stage"] = self._calculate_days_in_stage(record)
        
        return record
    
    def _calculate_health_status(self, record: Dict[str, Any]) -> str:
        """Calculate health status based on Pipeline Pulse logic"""
        try:
            # This is a simplified health calculation
            # The actual logic should match the existing health calculation
            
            closing_date = record.get("closing_date")
            stage = record.get("stage", "")
            probability = record.get("probability", 0)
            
            if not closing_date:
                return "unknown"
            
            # Parse closing date
            try:
                close_dt = datetime.fromisoformat(closing_date.replace('Z', '+00:00'))
                days_to_close = (close_dt - datetime.now(timezone.utc)).days
                
                # Simple health logic
                if days_to_close < 0:  # Past due
                    return "overdue"
                elif days_to_close < 7 and probability < 90:  # Within 7 days but low probability
                    return "at_risk"
                elif days_to_close < 30:  # Within 30 days
                    return "on_track"
                else:
                    return "healthy"
                    
            except Exception:
                return "unknown"
            
        except Exception as e:
            logger.warning(f"Health status calculation failed: {e}")
            return "unknown"
    
    def _determine_current_phase(self, record: Dict[str, Any]) -> str:
        """Determine current O2R phase"""
        # Check milestone dates to determine phase
        if record.get("revenue_date"):
            return "revenue_realization"
        elif record.get("invoice_date") or record.get("payment_date"):
            return "execution"
        elif record.get("po_date") or record.get("kickoff_date"):
            return "proposal_to_commitment"
        elif record.get("proposal_date") or record.get("sow_date"):
            return "opportunity_to_proposal"
        else:
            return "opportunity"
    
    def _calculate_days_in_stage(self, record: Dict[str, Any]) -> Optional[int]:
        """Calculate days in current stage"""
        try:
            modified_time = record.get("modified_time")
            if modified_time:
                modified_dt = datetime.fromisoformat(modified_time.replace('Z', '+00:00'))
                return (datetime.now(timezone.utc) - modified_dt).days
            return None
        except Exception:
            return None
    
    def _transform_error_response(self, sdk_response: Dict[str, Any]) -> Dict[str, Any]:
        """Transform error responses to Pipeline Pulse format"""
        return {
            "status": "error",
            "message": sdk_response.get("message", "Unknown error"),
            "error_code": sdk_response.get("code"),
            "data": None
        }
    
    def transform_outbound_data(self, pipeline_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Transform Pipeline Pulse format data to SDK format for API calls.
        
        Args:
            pipeline_data: Data in Pipeline Pulse format
            
        Returns:
            Data in SDK/Zoho format
        """
        transformed = {}
        
        for pipeline_field, value in pipeline_data.items():
            # Skip calculated fields
            if pipeline_field in ['health_status', 'current_phase', 'days_in_stage']:
                continue
            
            # Map field name back to Zoho format
            zoho_field = self.reverse_field_mappings.get(pipeline_field, pipeline_field)
            
            # Convert field name to proper case if needed
            if zoho_field == pipeline_field and '_' in pipeline_field:
                zoho_field = ''.join(word.capitalize() for word in pipeline_field.split('_'))
            
            transformed[zoho_field] = value
        
        return transformed


# Global transformer instance
_transformer = None


def get_response_transformer() -> SDKResponseTransformer:
    """Get or create the global response transformer instance"""
    global _transformer
    if _transformer is None:
        _transformer = SDKResponseTransformer()
    return _transformer


def transform_records_response(sdk_response: Dict[str, Any]) -> Dict[str, Any]:
    """Convenience function to transform records response"""
    transformer = get_response_transformer()
    return transformer.transform_records_response(sdk_response)


def transform_action_response(sdk_response: Dict[str, Any]) -> Dict[str, Any]:
    """Convenience function to transform action response"""
    transformer = get_response_transformer()
    return transformer.transform_action_response(sdk_response)


def transform_outbound_data(pipeline_data: Dict[str, Any]) -> Dict[str, Any]:
    """Convenience function to transform outbound data"""
    transformer = get_response_transformer()
    return transformer.transform_outbound_data(pipeline_data)