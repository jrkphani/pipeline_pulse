"""
Zoho CRM integration service
"""

import httpx
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
import json
import logging
from datetime import datetime, timedelta

from app.core.config import settings
from app.models.analysis import Analysis


class ZohoService:
    """Service for Zoho CRM integration"""

    def __init__(self):
        self.base_url = settings.ZOHO_BASE_URL
        self.accounts_url = getattr(settings, 'ZOHO_ACCOUNTS_URL', 'https://accounts.zoho.in')
        self.client_id = settings.ZOHO_CLIENT_ID
        self.client_secret = settings.ZOHO_CLIENT_SECRET
        self.refresh_token = settings.ZOHO_REFRESH_TOKEN
        self.access_token = None

    @staticmethod
    def normalize_deal_id(deal_id: str) -> str:
        """
        Convert CSV Record ID to API ID format
        CSV: 'zcrm_495490000010864021' -> API: '495490000010864021'
        """
        if deal_id.startswith('zcrm_'):
            return deal_id[5:]  # Remove 'zcrm_' prefix
        return deal_id

    @staticmethod
    def format_csv_id(api_id: str) -> str:
        """
        Convert API ID to CSV Record ID format
        API: '495490000010864021' -> CSV: 'zcrm_495490000010864021'
        """
        if not api_id.startswith('zcrm_'):
            return f'zcrm_{api_id}'
        return api_id
    
    async def get_access_token(self) -> str:
        """
        Get or refresh access token for Zoho API
        """
        
        if not self.refresh_token:
            raise Exception("Zoho refresh token not configured")
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.accounts_url}/oauth/v2/token",
                data={
                    "refresh_token": self.refresh_token,
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "grant_type": "refresh_token"
                }
            )
            
            if response.status_code == 200:
                token_data = response.json()
                self.access_token = token_data.get("access_token")
                return self.access_token
            else:
                raise Exception(f"Failed to get access token: {response.text}")
    
    async def exchange_code_for_tokens(self, code: str, client_id: str, client_secret: str) -> Dict[str, Any]:
        """
        Exchange authorization code for access and refresh tokens
        """
        from app.core.config import settings

        # Use production redirect URI for production, localhost for development
        if settings.ENVIRONMENT == "production":
            redirect_uri = "https://api.1chsalesreports.com/api/zoho/auth/callback"
        else:
            redirect_uri = "http://localhost:8000/api/zoho/auth/callback"

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.accounts_url}/oauth/v2/token",
                data={
                    "grant_type": "authorization_code",
                    "client_id": client_id,
                    "client_secret": client_secret,
                    "redirect_uri": redirect_uri,
                    "code": code
                }
            )

            if response.status_code == 200:
                token_data = response.json()

                # Update refresh token if received
                refresh_token = token_data.get("refresh_token")
                if refresh_token:
                    # Here you would typically save to database or update config
                    # For now, we'll just return the data
                    pass

                return token_data
            else:
                raise Exception(f"Failed to exchange code: {response.text}")

    async def check_auth(self) -> bool:
        """
        Check if Zoho authentication is working
        """

        try:
            await self.get_access_token()
            return True
        except Exception:
            return False
    
    async def get_deals(self, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        """
        Fetch deals from Zoho CRM
        Adds both API ID and CSV-compatible Record ID to each deal
        """

        if not self.access_token:
            await self.get_access_token()

        headers = {
            "Authorization": f"Zoho-oauthtoken {self.access_token}",
            "Content-Type": "application/json"
        }

        params = {
            "per_page": limit,
            "page": offset // limit + 1
        }

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/Deals",
                headers=headers,
                params=params
            )

            if response.status_code == 200:
                data = response.json()
                deals = data.get("data", [])

                # Add CSV-compatible Record ID to each deal
                for deal in deals:
                    if 'id' in deal:
                        deal['Record Id'] = self.format_csv_id(deal['id'])
                        deal['zoho_api_id'] = deal['id']  # Keep original for reference

                return deals
            else:
                raise Exception(f"Failed to fetch deals: {response.text}")
    
    async def update_deal(self, deal_id: str, deal_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update a deal in Zoho CRM
        Automatically converts CSV Record ID to API ID format if needed
        """

        if not self.access_token:
            await self.get_access_token()

        # Convert CSV ID to API ID format if needed
        api_deal_id = self.normalize_deal_id(deal_id)

        headers = {
            "Authorization": f"Zoho-oauthtoken {self.access_token}",
            "Content-Type": "application/json"
        }

        payload = {
            "data": [deal_data]
        }

        async with httpx.AsyncClient() as client:
            response = await client.put(
                f"{self.base_url}/Deals/{api_deal_id}",
                headers=headers,
                json=payload
            )

            if response.status_code == 200:
                return response.json()
            else:
                raise Exception(f"Failed to update deal: {response.text}")
    
    async def sync_analysis_to_crm(self, analysis_id: str, db: Session) -> Dict[str, Any]:
        """
        Sync analysis results back to Zoho CRM
        """
        
        # Get analysis data
        analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
        
        if not analysis:
            raise Exception("Analysis not found")
        
        # Parse analysis data
        data = json.loads(analysis.data)
        
        # This is a placeholder implementation
        # In a real scenario, you would:
        # 1. Match deals in analysis with CRM deals
        # 2. Update relevant fields based on analysis insights
        # 3. Create tasks or notes with recommendations
        
        sync_results = {
            "analysis_id": analysis_id,
            "deals_processed": len(data),
            "updates_made": 0,
            "errors": []
        }
        
        return sync_results

    # ===== USER AND ROLE MANAGEMENT METHODS =====

    async def get_user_profile(self, access_token: Optional[str] = None) -> Dict[str, Any]:
        """
        Get current user's profile from Zoho CRM
        """
        if not access_token:
            access_token = await self.get_access_token()

        headers = {
            "Authorization": f"Zoho-oauthtoken {access_token}",
            "Content-Type": "application/json"
        }

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/users?type=CurrentUser",
                headers=headers
            )

            if response.status_code == 200:
                data = response.json()
                users = data.get("users", [])
                if users:
                    return users[0]  # Current user is first in the list
                else:
                    raise Exception("No user data found")
            else:
                raise Exception(f"Failed to fetch user profile: {response.text}")

    async def get_user_permissions(self, access_token: Optional[str] = None) -> Dict[str, Any]:
        """
        Get current user's module permissions
        """
        if not access_token:
            access_token = await self.get_access_token()

        headers = {
            "Authorization": f"Zoho-oauthtoken {access_token}",
            "Content-Type": "application/json"
        }

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/settings/modules",
                headers=headers
            )

            if response.status_code == 200:
                data = response.json()
                modules = data.get("modules", [])

                # Extract permissions for each module
                permissions = {}
                for module in modules:
                    module_name = module.get("api_name", "")
                    if module_name:
                        permissions[module_name] = {
                            "view": module.get("permissions", {}).get("view", False),
                            "edit": module.get("permissions", {}).get("edit", False),
                            "create": module.get("permissions", {}).get("create", False),
                            "delete": module.get("permissions", {}).get("delete", False),
                            "mass_update": module.get("permissions", {}).get("mass_update", False),
                            "mass_delete": module.get("permissions", {}).get("mass_delete", False)
                        }

                return permissions
            else:
                raise Exception(f"Failed to fetch permissions: {response.text}")

    async def get_territory_assignments(self, user_id: str, access_token: Optional[str] = None) -> List[str]:
        """
        Get territories assigned to user
        """
        if not access_token:
            access_token = await self.get_access_token()

        headers = {
            "Authorization": f"Zoho-oauthtoken {access_token}",
            "Content-Type": "application/json"
        }

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/settings/territories",
                headers=headers
            )

            if response.status_code == 200:
                data = response.json()
                territories = data.get("territories", [])

                # Filter territories assigned to this user
                user_territories = []
                for territory in territories:
                    # Check if user is assigned to this territory
                    territory_users = territory.get("users", [])
                    if any(u.get("id") == user_id for u in territory_users):
                        user_territories.append(territory.get("name", ""))

                return user_territories
            else:
                # If territories endpoint fails, return empty list (not all orgs have territories)
                return []

    async def get_complete_user_info(self, access_token: Optional[str] = None) -> Dict[str, Any]:
        """
        Get complete user information including profile, permissions, and territories
        """
        if not access_token:
            access_token = await self.get_access_token()

        try:
            # Get user profile
            profile = await self.get_user_profile(access_token)
            user_id = profile.get("id")

            # Get permissions
            permissions = await self.get_user_permissions(access_token)

            # Get territories
            territories = await self.get_territory_assignments(user_id, access_token)

            return {
                "profile": profile,
                "permissions": permissions,
                "territories": territories,
                "fetched_at": datetime.now().isoformat()
            }

        except Exception as e:
            logging.error(f"Error fetching complete user info: {str(e)}")
            # Return minimal info if detailed fetch fails
            try:
                profile = await self.get_user_profile(access_token)
                return {
                    "profile": profile,
                    "permissions": {},
                    "territories": [],
                    "fetched_at": datetime.now().isoformat(),
                    "error": str(e)
                }
            except:
                raise Exception(f"Failed to fetch user information: {str(e)}")
