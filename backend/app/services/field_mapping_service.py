"""
Field Mapping Service for Zoho CRM to O2R data transformation
"""

from typing import Dict, Any, Optional, List
import logging

logger = logging.getLogger(__name__)

class FieldMappingService:
    """Service to handle field mapping between Zoho CRM and O2R requirements"""
    
    # Standard Zoho field mappings
    STANDARD_FIELD_MAP = {
        # Core fields (confirmed present)
        "id": "record_id",
        "Deal_Name": "opportunity_name", 
        "Account_Name": "account_name",
        "Amount": "amount",
        "Stage": "stage",
        "Pipeline": "pipeline",
        "Currency": "currency",
        "Closing_Date": "closing_date",
        "Created_Time": "created_time",
        "Modified_Time": "modified_time",
        "Probability": "probability",
        "Description": "description",
        "Owner": "owner"
    }
    
    # O2R-specific field mappings (DISCOVERED via Fields Metadata API)
    O2R_FIELD_MAP = {
        # ✅ CONFIRMED MAPPINGS (working in production)
        "Region": "territory",                        # Business Region → Territory
        "Solution_Type": "service_line",              # Solution Type → Service Line
        "Invoice_Date": "invoice_date",               # Invoice Date → Invoice Date
        
        # ✅ DISCOVERED MAPPINGS (high confidence from API analysis)
        "Kick_off_Date": "kickoff_date",              # Kick-off Date → Kickoff Date
        "Proposal_Submission_date": "proposal_date",  # Proposal Submission date → Proposal Date
        "SOW_Work_Start_Date": "sow_date",           # SOW Work Start Date → SOW Date
        "PO_Generation_Date": "po_date",             # PO Generation Date → PO Date
        "OB_Recognition_Date": "revenue_date",       # OB Recognition Date → Revenue Date
        
        # 🔍 CANDIDATE MAPPINGS (medium confidence - need validation)
        "Funding_Programs": "aws_funded",            # Type of Funding → AWS Funded
        "Partner_portal_Opportunity_ID": "alliance_motion_id",  # Partner portal ID → Alliance Motion
        "Distribution_Partner": "alliance_motion",   # Distribution Partner → Alliance Motion
        "Account_Manager": "strategic_account_manager", # Account Manager → Strategic Account
        "Strategic_advantage": "strategic_account_flag", # Strategic advantage → Strategic Account
        "Payment_Terms_in_days1": "payment_terms",   # Payment terms → Payment Date (proxy)
        
        # 📋 LEGACY MAPPINGS (for backward compatibility - likely won't work)
        "Territory": "territory_legacy",             # Fallback mapping
        "Service_Line": "service_line_legacy",       # Fallback mapping
        "Strategic_Account": "strategic_account_legacy", # Fallback mapping
        "AWS_Funded": "aws_funded_legacy",           # Fallback mapping
        "Alliance_Motion": "alliance_motion_legacy", # Fallback mapping
        "Proposal_Date": "proposal_date_legacy",     # Fallback mapping
        "SOW_Date": "sow_date_legacy",              # Fallback mapping
        "PO_Date": "po_date_legacy",                # Fallback mapping
        "Kickoff_Date": "kickoff_date_legacy",      # Fallback mapping
        "Payment_Date": "payment_date_legacy",      # Fallback mapping
        "Revenue_Date": "revenue_date_legacy"       # Fallback mapping
    }
    
    def __init__(self):
        self.field_mappings = {**self.STANDARD_FIELD_MAP, **self.O2R_FIELD_MAP}
    
    def transform_zoho_record(self, zoho_record: Dict[str, Any]) -> Dict[str, Any]:
        """Transform Zoho CRM record to standardized format"""
        transformed = {}
        
        # Map standard fields
        for zoho_field, standard_field in self.field_mappings.items():
            if zoho_field in zoho_record:
                value = zoho_record[zoho_field]
                
                # Handle special transformations
                if zoho_field == "Owner" and hasattr(value, 'get_key_values'):
                    # Extract owner name/id from MinifiedUser object
                    try:
                        owner_data = value.get_key_values()
                        transformed[standard_field] = owner_data.get('name', str(value))
                    except:
                        transformed[standard_field] = str(value)
                elif hasattr(value, 'isoformat'):
                    # Convert datetime objects to ISO strings
                    transformed[standard_field] = value.isoformat()
                else:
                    transformed[standard_field] = value
        
        # Keep all original fields for full data preservation
        transformed['raw_zoho_data'] = zoho_record
        
        return transformed
    
    def get_missing_o2r_fields(self, zoho_record: Dict[str, Any]) -> List[str]:
        """Identify missing O2R fields in Zoho record"""
        missing = []
        
        for zoho_field in self.O2R_FIELD_MAP.keys():
            if zoho_field not in zoho_record or zoho_record[zoho_field] is None:
                missing.append(zoho_field)
        
        return missing
    
    def validate_data_completeness(self, zoho_record: Dict[str, Any]) -> Dict[str, Any]:
        """Validate data completeness for O2R tracking"""
        missing_fields = self.get_missing_o2r_fields(zoho_record)
        
        return {
            "is_complete": len(missing_fields) == 0,
            "missing_fields": missing_fields,
            "completion_percentage": (len(self.O2R_FIELD_MAP) - len(missing_fields)) / len(self.O2R_FIELD_MAP) * 100,
            "recommendations": self._generate_recommendations(missing_fields)
        }
    
    def _generate_recommendations(self, missing_fields: List[str]) -> List[str]:
        """Generate recommendations for missing fields"""
        recommendations = []
        
        if missing_fields:
            recommendations.append(
                f"Create custom fields in Zoho CRM: {', '.join(missing_fields)}"
            )
            
            if "Territory" in missing_fields:
                recommendations.append(
                    "Territory field is critical for O2R analysis - consider mapping to existing field or creating custom field"
                )
            
            if "Service_Line" in missing_fields:
                recommendations.append(
                    "Service_Line field needed for business line analysis - check if this maps to existing 'Type' or 'Category' field"
                )
        
        return recommendations

# Global instance
field_mapper = FieldMappingService()