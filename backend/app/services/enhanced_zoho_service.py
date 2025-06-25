"""
Enhanced Zoho CRM Service for live data integration (v8)
Uses abstraction layer to support multiple API versions
"""
import asyncio
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from app.core.config import settings
from app.models.analysis import Deal
from app.services.zoho_api_client import create_zoho_client, ZohoAPIError, ZohoRateLimitError, ZohoAuthenticationError

# Configure logging
logger = logging.getLogger(__name__)

class EnhancedZohoService:
    """
    Enhanced Zoho CRM Service with Pipeline Pulse specific functionality
    Uses the abstraction layer for API version flexibility
    """
    
    def __init__(self, api_version: str = None):
        # Use configured API version or override
        self.api_version = api_version or getattr(settings, 'ZOHO_API_VERSION', 'v8')
        self.client = create_zoho_client(self.api_version)
        
        # Pipeline Pulse specific configuration
        self.pipeline_fields = self._get_pipeline_fields()
        self.o2r_milestone_fields = self._get_o2r_milestone_fields()
        
        logger.info(f"🚀 Enhanced Zoho Service initialized with API {self.api_version}")
    
    def _get_pipeline_fields(self) -> List[str]:
        """Get comprehensive field list for Pipeline Pulse"""
        return [
            # Core CRM fields (standard Zoho fields)
            "id", "Deal_Name", "Account_Name", "Amount", "Currency", 
            "Probability", "Stage", "Closing_Date", "Owner", "Created_Time",
            "Modified_Time", "Country", "Type", "Description",
            
            # Enhanced tracking fields (custom fields in Zoho CRM)
            "Territory", "Service_Line", "Strategic_Account", "AWS_Funded", 
            "Alliance_Motion", "Market_Segment", "Lead_Source",
            
            # Additional business fields
            "Campaign_Source", "Partner_Referral", "Competition",
            "Deal_Source", "Sales_Process", "Next_Step"
        ]
    
    def _get_o2r_milestone_fields(self) -> List[str]:
        """Get O2R milestone fields for opportunity tracking"""
        return [
            # O2R milestone fields (custom date fields in Zoho CRM)
            "Proposal_Date", "SOW_Date", "PO_Date", "Kickoff_Date", 
            "Invoice_Date", "Payment_Date", "Revenue_Date",
            
            # O2R tracking metadata (custom fields for O2R status)
            "O2R_Health_Signal", "O2R_Current_Phase", "O2R_Last_Updated",
            "O2R_Action_Items", "O2R_Risk_Level", "O2R_Next_Milestone"
        ]
    
    async def authenticate(self) -> bool:
        """Authenticate with Zoho CRM using abstraction layer"""
        try:
            success = await self.client.authenticate()
            if success:
                logger.info(f"✅ Zoho CRM API {self.api_version} authentication successful")
            else:
                logger.error(f"❌ Zoho CRM API {self.api_version} authentication failed")
            return success
        except Exception as e:
            logger.error(f"❌ Authentication error: {e}")
            return False
    
    async def get_all_deals(self, fields: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """
        Fetch all deals from Zoho CRM with intelligent pagination
        """
        try:
            all_deals = []
            page = 1
            per_page = 200  # Max allowed by Zoho
            
            # Use comprehensive field list
            required_fields = fields or (self.pipeline_fields + self.o2r_milestone_fields)
            
            logger.info(f"🔄 Fetching all deals from Zoho CRM API {self.api_version}...")
            
            while True:
                try:
                    deals = await self.client.get_deals(
                        fields=required_fields,
                        page=page,
                        per_page=per_page,
                        sort_by="Modified_Time",
                        sort_order="desc"
                    )
                    
                    if not deals:
                        break
                    
                    all_deals.extend(deals)
                    logger.info(f"📄 Fetched page {page}: {len(deals)} deals (Total: {len(all_deals)})")
                    
                    # Check if we got less than requested (last page)
                    if len(deals) < per_page:
                        break
                    
                    page += 1
                    
                except ZohoRateLimitError:
                    logger.warning("⚠️ Rate limit exceeded, waiting...")
                    await asyncio.sleep(60)
                    continue
                except ZohoAPIError as e:
                    if e.status_code == 204:  # No content
                        break
                    logger.error(f"❌ API error on page {page}: {e}")
                    break
                except Exception as e:
                    logger.error(f"❌ Unexpected error on page {page}: {e}")
                    break
            
            logger.info(f"✅ Successfully fetched {len(all_deals)} deals from Zoho CRM")
            return all_deals
            
        except Exception as e:
            logger.error(f"❌ Failed to fetch deals: {e}")
            raise Exception(f"Failed to fetch deals from Zoho CRM: {e}")
    
    async def get_deals_modified_since(self, since_time: datetime) -> List[Dict[str, Any]]:
        """
        Get deals modified since specific time (for delta sync)
        """
        try:
            # Format datetime for Zoho API
            since_str = since_time.strftime("%Y-%m-%dT%H:%M:%S+00:00")
            criteria = f"Modified_Time:greater_than:{since_str}"
            
            deals = await self.client.search_deals(
                criteria=criteria,
                fields=self.pipeline_fields + self.o2r_milestone_fields,
                per_page=200
            )
            
            logger.info(f"🔄 Found {len(deals)} deals modified since {since_str}")
            return deals
            
        except ZohoAPIError as e:
            if e.status_code == 204:  # No content
                logger.info("✅ No deals modified since last sync")
                return []
            logger.error(f"❌ Error fetching modified deals: {e}")
            return []
        except Exception as e:
            logger.error(f"❌ Error fetching modified deals: {e}")
            return []
    
    async def update_deal(self, deal_id: str, update_data: Dict[str, Any]) -> bool:
        """
        Update a deal in Zoho CRM
        """
        try:
            success = await self.client.update_deal(deal_id, update_data)
            
            if success:
                logger.info(f"✅ Successfully updated deal {deal_id}")
            else:
                logger.error(f"❌ Failed to update deal {deal_id}")
                
            return success
            
        except Exception as e:
            logger.error(f"❌ Error updating deal {deal_id}: {e}")
            return False
    
    async def setup_webhooks(self) -> bool:
        """
        Configure Zoho webhooks for real-time updates
        """
        try:
            webhook_url = f"{settings.APP_BASE_URL}/api/zoho/webhook"
            events = ["Deals.create", "Deals.edit", "Deals.delete"]
            
            if hasattr(self.client, 'setup_webhooks'):
                success = await self.client.setup_webhooks(webhook_url, events)
                
                if success:
                    logger.info("✅ Webhooks configured successfully")
                else:
                    logger.error("❌ Failed to setup webhooks")
                    
                return success
            else:
                logger.warning("⚠️ Webhook setup not available for this API version")
                return False
                
        except Exception as e:
            logger.error(f"❌ Error setting up webhooks: {e}")
            return False
    
    async def get_connection_status(self) -> Dict[str, Any]:
        """
        Check Zoho CRM connection status
        """
        try:
            health_status = await self.client.get_health_status()
            
            return {
                **health_status,
                "api_version": self.api_version,
                "pipeline_fields_count": len(self.pipeline_fields),
                "o2r_fields_count": len(self.o2r_milestone_fields)
            }
            
        except Exception as e:
            logger.error(f"❌ Error checking connection status: {e}")
            return {
                "status": "error",
                "error": str(e),
                "api_version": self.api_version,
                "last_check": datetime.now().isoformat()
            }
    
    def transform_zoho_deal_to_pipeline_deal(self, zoho_deal: Dict[str, Any]) -> Dict[str, Any]:
        """
        Transform Zoho CRM deal format to Pipeline Pulse format
        Enhanced for v8 with better field handling
        """
        # Helper function to safely extract owner name
        def get_owner_name(owner_field):
            if isinstance(owner_field, dict):
                return owner_field.get("name", "Unknown")
            elif isinstance(owner_field, str):
                return owner_field
            else:
                return "Unknown"
        
        # Helper function to safely get date fields
        def get_date_field(date_str):
            if date_str and date_str != "" and date_str != "null":
                return date_str
            return None
        
        # Helper function to safely get boolean fields
        def get_boolean_field(bool_field):
            if isinstance(bool_field, bool):
                return bool_field
            elif isinstance(bool_field, str):
                return bool_field.lower() in ('true', '1', 'yes', 'on')
            else:
                return False
        
        transformed_deal = {
            # Core CRM fields
            "record_id": zoho_deal.get("id"),
            "opportunity_name": zoho_deal.get("Deal_Name", ""),
            "account_name": zoho_deal.get("Account_Name", ""),
            "amount": float(zoho_deal.get("Amount", 0)),
            "currency": zoho_deal.get("Currency", "SGD"),
            "probability": int(zoho_deal.get("Probability", 0)),
            "stage": zoho_deal.get("Stage", ""),
            "closing_date": get_date_field(zoho_deal.get("Closing_Date")),
            "owner": get_owner_name(zoho_deal.get("Owner")),
            "created_time": zoho_deal.get("Created_Time"),
            "modified_time": zoho_deal.get("Modified_Time"),
            "country": zoho_deal.get("Country", ""),
            "deal_type": zoho_deal.get("Type", ""),
            "description": zoho_deal.get("Description", ""),
            
            # Enhanced tracking fields
            "territory": zoho_deal.get("Territory"),
            "service_line": zoho_deal.get("Service_Line"),
            "strategic_account": get_boolean_field(zoho_deal.get("Strategic_Account")),
            "aws_funded": get_boolean_field(zoho_deal.get("AWS_Funded")),
            "alliance_motion": zoho_deal.get("Alliance_Motion"),
            "market_segment": zoho_deal.get("Market_Segment"),
            "lead_source": zoho_deal.get("Lead_Source"),
            
            # Additional business fields
            "campaign_source": zoho_deal.get("Campaign_Source"),
            "partner_referral": zoho_deal.get("Partner_Referral"),
            "competition": zoho_deal.get("Competition"),
            "deal_source": zoho_deal.get("Deal_Source"),
            "sales_process": zoho_deal.get("Sales_Process"),
            "next_step": zoho_deal.get("Next_Step"),
            
            # O2R milestone fields
            "proposal_date": get_date_field(zoho_deal.get("Proposal_Date")),
            "sow_date": get_date_field(zoho_deal.get("SOW_Date")),
            "po_date": get_date_field(zoho_deal.get("PO_Date")),
            "kickoff_date": get_date_field(zoho_deal.get("Kickoff_Date")),
            "invoice_date": get_date_field(zoho_deal.get("Invoice_Date")),
            "payment_date": get_date_field(zoho_deal.get("Payment_Date")),
            "revenue_date": get_date_field(zoho_deal.get("Revenue_Date")),
            
            # O2R tracking metadata
            "o2r_health_signal": zoho_deal.get("O2R_Health_Signal"),
            "o2r_current_phase": zoho_deal.get("O2R_Current_Phase"),
            "o2r_last_updated": get_date_field(zoho_deal.get("O2R_Last_Updated")),
            "o2r_action_items": zoho_deal.get("O2R_Action_Items"),
            "o2r_risk_level": zoho_deal.get("O2R_Risk_Level"),
            "o2r_next_milestone": zoho_deal.get("O2R_Next_Milestone"),
            
            # Metadata
            "data_source": f"zoho_crm_live_{self.api_version}",
            "sync_timestamp": datetime.now().isoformat()
        }
        
        return transformed_deal
    
    async def get_custom_fields(self) -> List[Dict[str, Any]]:
        """
        Get custom fields configuration for deals module
        """
        try:
            fields = await self.client.get_custom_fields()
            
            # Filter for Pipeline Pulse relevant fields
            relevant_fields = []
            relevant_keywords = [
                "Territory", "Service", "Strategic", "AWS", "Proposal", "PO", 
                "Kickoff", "Invoice", "Payment", "Revenue", "O2R", "Alliance",
                "Market", "Lead", "Campaign", "Partner", "Competition"
            ]
            
            for field in fields:
                api_name = field.get("api_name", "")
                if any(keyword in api_name for keyword in relevant_keywords):
                    relevant_fields.append({
                        "api_name": api_name,
                        "display_label": field.get("display_label", ""),
                        "data_type": field.get("data_type", ""),
                        "is_custom": field.get("custom_field", False),
                        "required": field.get("required", False),
                        "picklist_values": field.get("pick_list_values", []) if field.get("data_type") == "picklist" else []
                    })
            
            logger.info(f"📋 Found {len(relevant_fields)} relevant custom fields")
            return relevant_fields
            
        except Exception as e:
            logger.error(f"❌ Error fetching custom fields: {e}")
            return []
    
    async def validate_custom_fields(self) -> Dict[str, Any]:
        """
        Validate that required custom fields exist for Pipeline Pulse functionality
        """
        required_fields = [
            "Territory", "Service_Line", "Strategic_Account", "AWS_Funded",
            "Proposal_Date", "PO_Date", "Kickoff_Date", "Invoice_Date", 
            "Payment_Date", "Revenue_Date"
        ]
        
        try:
            existing_fields = await self.get_custom_fields()
            existing_field_names = [f["api_name"] for f in existing_fields]
            
            missing_fields = []
            present_fields = []
            
            for field in required_fields:
                if field in existing_field_names:
                    present_fields.append(field)
                else:
                    missing_fields.append(field)
            
            validation_passed = len(missing_fields) == 0
            
            return {
                "validation_passed": validation_passed,
                "api_version": self.api_version,
                "required_fields": required_fields,
                "present_fields": present_fields,
                "missing_fields": missing_fields,
                "field_coverage": f"{len(present_fields)}/{len(required_fields)}",
                "coverage_percentage": (len(present_fields) / len(required_fields)) * 100,
                "recommendations": self._get_field_setup_recommendations(missing_fields)
            }
            
        except Exception as e:
            return {
                "validation_passed": False,
                "api_version": self.api_version,
                "error": str(e),
                "recommendations": ["Check Zoho CRM connection and permissions"]
            }
    
    def _get_field_setup_recommendations(self, missing_fields: List[str]) -> List[str]:
        """Generate recommendations for setting up missing custom fields"""
        if not missing_fields:
            return ["✅ All required custom fields are configured!"]
        
        recommendations = [
            f"⚠️ Missing {len(missing_fields)} custom fields. Please create the following in Zoho CRM:"
        ]
        
        field_configs = {
            "Territory": "Picklist with values: APAC, Americas, EMEA, India",
            "Service_Line": "Picklist with values: MSP Services, Gen AI, Cloud Migration, Security",
            "Strategic_Account": "Boolean/Checkbox field",
            "AWS_Funded": "Boolean/Checkbox field",
            "Proposal_Date": "Date field",
            "PO_Date": "Date field", 
            "Kickoff_Date": "Date field",
            "Invoice_Date": "Date field",
            "Payment_Date": "Date field",
            "Revenue_Date": "Date field"
        }
        
        for field in missing_fields:
            if field in field_configs:
                recommendations.append(f"  • {field}: {field_configs[field]}")
        
        recommendations.extend([
            f"📚 Setup Guide: Use Zoho CRM Setup → Customization → Modules and Fields → Deals",
            f"🔗 API Console: https://api-console.zoho.com/ for API configuration",
            f"📖 Refer to Pipeline Pulse documentation for detailed setup instructions"
        ])
        
        return recommendations
    
    async def test_api_connectivity(self) -> Dict[str, Any]:
        """
        Comprehensive test of API connectivity and features
        """
        test_results = {
            "api_version": self.api_version,
            "timestamp": datetime.now().isoformat(),
            "tests": {}
        }
        
        # Test 1: Authentication
        try:
            auth_success = await self.authenticate()
            test_results["tests"]["authentication"] = {
                "status": "pass" if auth_success else "fail",
                "message": "Authentication successful" if auth_success else "Authentication failed"
            }
        except Exception as e:
            test_results["tests"]["authentication"] = {
                "status": "error",
                "message": str(e)
            }
        
        # Test 2: Connection Health
        try:
            health = await self.get_connection_status()
            test_results["tests"]["connection_health"] = {
                "status": "pass" if health.get("status") == "healthy" else "fail",
                "message": f"Connection status: {health.get('status')}",
                "details": health
            }
        except Exception as e:
            test_results["tests"]["connection_health"] = {
                "status": "error",
                "message": str(e)
            }
        
        # Test 3: Field Validation
        try:
            validation = await self.validate_custom_fields()
            test_results["tests"]["field_validation"] = {
                "status": "pass" if validation.get("validation_passed") else "warning",
                "message": f"Field coverage: {validation.get('field_coverage')}",
                "details": validation
            }
        except Exception as e:
            test_results["tests"]["field_validation"] = {
                "status": "error",
                "message": str(e)
            }
        
        # Test 4: Sample Deal Fetch
        try:
            deals = await self.client.get_deals(per_page=1)
            test_results["tests"]["data_access"] = {
                "status": "pass" if deals else "warning",
                "message": f"Sample data fetch: {len(deals)} record(s)",
                "sample_deal_id": deals[0].get("id") if deals else None
            }
        except Exception as e:
            test_results["tests"]["data_access"] = {
                "status": "error", 
                "message": str(e)
            }
        
        # Overall status
        test_statuses = [test["status"] for test in test_results["tests"].values()]
        if "error" in test_statuses:
            test_results["overall_status"] = "error"
        elif "fail" in test_statuses:
            test_results["overall_status"] = "fail"
        elif "warning" in test_statuses:
            test_results["overall_status"] = "warning"
        else:
            test_results["overall_status"] = "pass"
        
        return test_results

# Backward compatibility alias
EnhancedZohoServiceV8 = EnhancedZohoService