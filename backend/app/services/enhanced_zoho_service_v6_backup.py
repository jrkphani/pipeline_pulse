"""
Enhanced Zoho CRM Service for live data integration
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
logging.basicConfig(level=logging.INFO)

class EnhancedZohoService:
    """
    Enhanced Zoho CRM Service with Pipeline Pulse specific functionality
    Uses the abstraction layer for API version flexibility
    """
    
    def __init__(self, api_version: str = None):
        # Use configured API version or override
        self.api_version = api_version or settings.ZOHO_API_VERSION
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
        """Authenticate with Zoho CRM using refresh token"""
        try:
            auth_url = "https://accounts.zoho.com/oauth/v2/token"
            payload = {
                "refresh_token": settings.ZOHO_REFRESH_TOKEN,
                "client_id": settings.ZOHO_CLIENT_ID,
                "client_secret": settings.ZOHO_CLIENT_SECRET,
                "grant_type": "refresh_token"
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(auth_url, data=payload)
                
            if response.status_code == 200:
                data = response.json()
                self.access_token = data["access_token"]
                self.token_expires_at = datetime.now() + timedelta(seconds=data["expires_in"])
                return True
                
        except Exception as e:
            print(f"Authentication failed: {e}")
        
        return False
    
    async def get_all_deals(self, fields: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """
        Fetch all deals from Zoho CRM with pagination
        """
        if not await self._ensure_authenticated():
            raise Exception("Failed to authenticate with Zoho CRM")
        
        all_deals = []
        page = 1
        per_page = 200  # Max allowed by Zoho
        
        # Define required fields for Pipeline Pulse
        required_fields = fields or [
            "id", "Deal_Name", "Account_Name", "Amount", "Currency", 
            "Probability", "Stage", "Closing_Date", "Owner", "Created_Time",
            "Country", "Territory", "Service_Line", "Strategic_Account",
            "AWS_Funded", "Alliance_Motion", "Proposal_Date", "SOW_Date",
            "PO_Date", "Kickoff_Date", "Invoice_Date", "Payment_Date", "Revenue_Date"
        ]
        
        while True:
            try:
                url = f"{self.base_url}/Deals"
                params = {
                    "fields": ",".join(required_fields),
                    "page": page,
                    "per_page": per_page,
                    "sort_by": "Modified_Time",
                    "sort_order": "desc"
                }
                
                headers = {
                    "Authorization": f"Zoho-oauthtoken {self.access_token}",
                    "Content-Type": "application/json"
                }
                
                async with httpx.AsyncClient(timeout=30.0) as client:
                    response = await client.get(url, params=params, headers=headers)
                
                if response.status_code == 200:
                    data = response.json()
                    deals = data.get("data", [])
                    
                    if not deals:
                        break
                    
                    all_deals.extend(deals)
                    
                    # Check if more pages exist
                    info = data.get("info", {})
                    if not info.get("more_records", False):
                        break
                    
                    page += 1
                    
                    # Rate limiting - Zoho allows 100 calls per minute
                    await asyncio.sleep(0.6)
                    
                else:
                    print(f"Error fetching deals page {page}: {response.status_code}")
                    break
                    
            except Exception as e:
                print(f"Error on page {page}: {e}")
                break
        
        return all_deals
    
    async def get_deals_modified_since(self, since_time: datetime) -> List[Dict[str, Any]]:
        """
        Get deals modified since specific time (for delta sync)
        """
        if not await self._ensure_authenticated():
            raise Exception("Failed to authenticate with Zoho CRM")
        
        try:
            url = f"{self.base_url}/Deals/search"
            
            # Format datetime for Zoho API
            since_str = since_time.strftime("%Y-%m-%dT%H:%M:%S+00:00")
            
            params = {
                "criteria": f"Modified_Time:greater_than:{since_str}",
                "fields": "id,Deal_Name,Account_Name,Amount,Currency,Probability,Stage,Closing_Date,Owner,Modified_Time,Territory,Service_Line",
                "per_page": 200
            }
            
            headers = {
                "Authorization": f"Zoho-oauthtoken {self.access_token}",
                "Content-Type": "application/json"
            }
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(url, params=params, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                return data.get("data", [])
            
        except Exception as e:
            print(f"Error fetching modified deals: {e}")
        
        return []
    
    async def update_deal(self, deal_id: str, update_data: Dict[str, Any]) -> bool:
        """
        Update a deal in Zoho CRM
        """
        if not await self._ensure_authenticated():
            return False
        
        try:
            url = f"{self.base_url}/Deals/{deal_id}"
            
            payload = {
                "data": [update_data]
            }
            
            headers = {
                "Authorization": f"Zoho-oauthtoken {self.access_token}",
                "Content-Type": "application/json"
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.put(url, json=payload, headers=headers)
            
            return response.status_code == 200
            
        except Exception as e:
            print(f"Error updating deal {deal_id}: {e}")
            return False
    
    async def setup_webhooks(self) -> bool:
        """
        Configure Zoho webhooks for real-time updates
        """
        if not await self._ensure_authenticated():
            return False
        
        try:
            webhook_url = f"{settings.APP_BASE_URL}/api/zoho/webhook"
            
            webhook_config = {
                "watch": [
                    {
                        "channel_id": "pipeline_pulse_deals",
                        "events": [
                            "Deals.create",
                            "Deals.edit", 
                            "Deals.delete"
                        ],
                        "channel_type": "web",
                        "channel_details": {
                            "url": webhook_url,
                            "method": "POST"
                        },
                        "token": settings.WEBHOOK_TOKEN
                    }
                ]
            }
            
            url = f"{self.base_url}/actions/watch"
            headers = {
                "Authorization": f"Zoho-oauthtoken {self.access_token}",
                "Content-Type": "application/json"
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=webhook_config, headers=headers)
            
            return response.status_code == 200
            
        except Exception as e:
            print(f"Error setting up webhooks: {e}")
            return False
    
    async def _ensure_authenticated(self) -> bool:
        """Ensure we have a valid access token"""
        if not self.access_token or (self.token_expires_at and datetime.now() >= self.token_expires_at):
            return await self.authenticate()
        return True

    def transform_zoho_deal_to_pipeline_deal(self, zoho_deal: Dict[str, Any]) -> Dict[str, Any]:
        """
        Transform Zoho CRM deal format to Pipeline Pulse format
        """
        return {
            "record_id": zoho_deal.get("id"),
            "opportunity_name": zoho_deal.get("Deal_Name"),
            "account_name": zoho_deal.get("Account_Name"),
            "amount": zoho_deal.get("Amount", 0),
            "currency": zoho_deal.get("Currency", "SGD"),
            "probability": zoho_deal.get("Probability", 0),
            "stage": zoho_deal.get("Stage"),
            "closing_date": zoho_deal.get("Closing_Date"),
            "owner": zoho_deal.get("Owner", {}).get("name") if isinstance(zoho_deal.get("Owner"), dict) else zoho_deal.get("Owner"),
            "created_time": zoho_deal.get("Created_Time"),
            "country": zoho_deal.get("Country"),
            "territory": zoho_deal.get("Territory"),
            "service_line": zoho_deal.get("Service_Line"),
            "strategic_account": zoho_deal.get("Strategic_Account", False),
            "aws_funded": zoho_deal.get("AWS_Funded", False),
            "alliance_motion": zoho_deal.get("Alliance_Motion"),
            # O2R milestone fields
            "proposal_date": zoho_deal.get("Proposal_Date"),
            "sow_date": zoho_deal.get("SOW_Date"),
            "po_date": zoho_deal.get("PO_Date"),
            "kickoff_date": zoho_deal.get("Kickoff_Date"),
            "invoice_date": zoho_deal.get("Invoice_Date"),
            "payment_date": zoho_deal.get("Payment_Date"),
            "revenue_date": zoho_deal.get("Revenue_Date")
        }