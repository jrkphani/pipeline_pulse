"""
Zoho CRM API Client Abstraction Layer
Supports multiple API versions with a unified interface
"""

import asyncio
import logging
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)

class ZohoAPIError(Exception):
    """Custom exception for Zoho API errors"""
    def __init__(self, message: str, status_code: int = None, response_data: dict = None):
        super().__init__(message)
        self.status_code = status_code
        self.response_data = response_data or {}

class ZohoRateLimitError(ZohoAPIError):
    """Exception for rate limit exceeded"""
    pass

class ZohoAuthenticationError(ZohoAPIError):
    """Exception for authentication failures"""
    pass

class BaseZohoAPIClient(ABC):
    """Abstract base class for Zoho CRM API clients"""
    
    def __init__(self, api_version: str):
        self.api_version = api_version
        self.base_url = f"https://www.zohoapis.com/crm/{api_version}"
        self.accounts_url = "https://accounts.zoho.com"
        self.access_token = None
        self.token_expires_at = None
        self.rate_limit_calls = 0
        self.rate_limit_reset = datetime.now()
        
        # Health monitoring
        self.connection_health = {
            "status": "unknown",
            "last_success": None,
            "error_count": 0,
            "consecutive_failures": 0,
            "api_version": api_version
        }
    
    @abstractmethod
    async def authenticate(self) -> bool:
        """Authenticate with Zoho CRM"""
        pass
    
    @abstractmethod
    async def get_deals(self, **kwargs) -> List[Dict[str, Any]]:
        """Get deals from CRM"""
        pass
    
    @abstractmethod
    async def search_deals(self, criteria: str, **kwargs) -> List[Dict[str, Any]]:
        """Search deals with criteria"""
        pass
    
    @abstractmethod
    async def update_deal(self, deal_id: str, data: Dict[str, Any]) -> bool:
        """Update a deal"""
        pass
    
    @abstractmethod
    async def get_custom_fields(self) -> List[Dict[str, Any]]:
        """Get custom fields configuration"""
        pass
    
    async def _make_request(
        self, 
        method: str, 
        endpoint: str, 
        params: Dict[str, Any] = None,
        data: Dict[str, Any] = None,
        retries: int = 3
    ) -> Tuple[int, Dict[str, Any]]:
        """
        Make authenticated HTTP request with retry logic
        """
        if not await self._ensure_authenticated():
            raise ZohoAuthenticationError("Failed to authenticate")
        
        await self._rate_limit_check()
        
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        headers = {
            "Authorization": f"Zoho-oauthtoken {self.access_token}",
            "Content-Type": "application/json"
        }
        
        for attempt in range(retries + 1):
            try:
                async with httpx.AsyncClient(timeout=60.0) as client:
                    if method.upper() == "GET":
                        response = await client.get(url, params=params, headers=headers)
                    elif method.upper() == "POST":
                        response = await client.post(url, json=data, headers=headers)
                    elif method.upper() == "PUT":
                        response = await client.put(url, json=data, headers=headers)
                    elif method.upper() == "DELETE":
                        response = await client.delete(url, headers=headers)
                    else:
                        raise ValueError(f"Unsupported HTTP method: {method}")
                
                self._track_rate_limit()
                
                # Handle response
                if response.status_code == 200:
                    self._update_health_success()
                    return response.status_code, response.json()
                elif response.status_code == 204:
                    self._update_health_success()
                    return response.status_code, {}
                elif response.status_code == 401:
                    # Token expired, try to re-authenticate
                    if attempt < retries:
                        logger.warning("Token expired, attempting re-authentication...")
                        if await self.authenticate():
                            headers["Authorization"] = f"Zoho-oauthtoken {self.access_token}"
                            continue
                    raise ZohoAuthenticationError("Authentication failed", response.status_code)
                elif response.status_code == 429:
                    # Rate limit exceeded
                    if attempt < retries:
                        wait_time = 60  # Wait 1 minute
                        logger.warning(f"Rate limit exceeded, waiting {wait_time} seconds...")
                        await asyncio.sleep(wait_time)
                        continue
                    raise ZohoRateLimitError("Rate limit exceeded", response.status_code)
                else:
                    error_msg = f"API request failed: {response.status_code}"
                    try:
                        error_data = response.json()
                        error_msg = f"{error_msg} - {error_data}"
                    except:
                        error_msg = f"{error_msg} - {response.text}"
                    
                    if attempt < retries:
                        logger.warning(f"Request failed (attempt {attempt + 1}/{retries + 1}): {error_msg}")
                        await asyncio.sleep(2 ** attempt)  # Exponential backoff
                        continue
                    
                    self._update_health_error(error_msg)
                    raise ZohoAPIError(error_msg, response.status_code, error_data if 'error_data' in locals() else {})
                    
            except httpx.RequestError as e:
                if attempt < retries:
                    logger.warning(f"Network error (attempt {attempt + 1}/{retries + 1}): {e}")
                    await asyncio.sleep(2 ** attempt)
                    continue
                
                self._update_health_error(str(e))
                raise ZohoAPIError(f"Network error: {e}")
        
        raise ZohoAPIError("Max retries exceeded")
    
    async def _ensure_authenticated(self) -> bool:
        """Ensure we have a valid access token"""
        if not self.access_token or (self.token_expires_at and datetime.now() >= self.token_expires_at):
            return await self.authenticate()
        return True
    
    async def _rate_limit_check(self):
        """Check and enforce Zoho API rate limits (100 calls per minute)"""
        now = datetime.now()
        
        # Reset counter every minute
        if now >= self.rate_limit_reset:
            self.rate_limit_calls = 0
            self.rate_limit_reset = now + timedelta(minutes=1)
        
        # If we're approaching the limit, wait
        if self.rate_limit_calls >= 90:  # Leave buffer of 10 calls
            sleep_time = (self.rate_limit_reset - now).total_seconds()
            if sleep_time > 0:
                logger.info(f"Rate limit approached, waiting {sleep_time:.1f} seconds...")
                await asyncio.sleep(sleep_time)
                self.rate_limit_calls = 0
                self.rate_limit_reset = datetime.now() + timedelta(minutes=1)
    
    def _track_rate_limit(self):
        """Track API call for rate limiting"""
        self.rate_limit_calls += 1
    
    def _update_health_success(self):
        """Update connection health on successful request"""
        self.connection_health.update({
            "status": "healthy",
            "last_success": datetime.now(),
            "consecutive_failures": 0
        })
    
    def _update_health_error(self, error_msg: str):
        """Update connection health on failed request"""
        self.connection_health.update({
            "status": "error",
            "error_count": self.connection_health["error_count"] + 1,
            "consecutive_failures": self.connection_health["consecutive_failures"] + 1,
            "last_error": error_msg
        })
    
    async def get_health_status(self) -> Dict[str, Any]:
        """Get detailed health status"""
        try:
            # Test connection with a simple org call
            status_code, data = await self._make_request("GET", "/org")
            
            if status_code == 200:
                org_info = data.get("org", [{}])[0] if data.get("org") else {}
                return {
                    **self.connection_health,
                    "status": "healthy",
                    "org_name": org_info.get("company_name", "Unknown"),
                    "rate_limit_remaining": 100 - self.rate_limit_calls,
                    "token_expires_at": self.token_expires_at.isoformat() if self.token_expires_at else None,
                    "last_check": datetime.now().isoformat()
                }
        except Exception as e:
            self._update_health_error(str(e))
        
        return {
            **self.connection_health,
            "last_check": datetime.now().isoformat()
        }


class ZohoAPIClientV6(BaseZohoAPIClient):
    """Zoho CRM API v6 client implementation"""
    
    def __init__(self):
        super().__init__("v6")
    
    async def authenticate(self) -> bool:
        """Authenticate with Zoho CRM using refresh token"""
        try:
            auth_url = f"{self.accounts_url}/oauth/v2/token"
            payload = {
                "refresh_token": settings.ZOHO_REFRESH_TOKEN,
                "client_id": settings.ZOHO_CLIENT_ID,
                "client_secret": settings.ZOHO_CLIENT_SECRET,
                "grant_type": "refresh_token"
            }
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(auth_url, data=payload)
                
            if response.status_code == 200:
                data = response.json()
                self.access_token = data["access_token"]
                self.token_expires_at = datetime.now() + timedelta(seconds=data["expires_in"] - 300)
                logger.info("✅ Zoho CRM v6 authentication successful")
                self._update_health_success()
                return True
            else:
                error_msg = f"Authentication failed: {response.status_code} - {response.text}"
                logger.error(f"❌ {error_msg}")
                self._update_health_error(error_msg)
                
        except Exception as e:
            error_msg = f"Authentication error: {e}"
            logger.error(f"❌ {error_msg}")
            self._update_health_error(error_msg)
        
        return False
    
    async def get_deals(self, **kwargs) -> List[Dict[str, Any]]:
        """Get deals from CRM v6"""
        fields = kwargs.get("fields")
        page = kwargs.get("page", 1)
        per_page = kwargs.get("per_page", 200)
        sort_by = kwargs.get("sort_by", "Modified_Time")
        sort_order = kwargs.get("sort_order", "desc")
        
        params = {
            "page": page,
            "per_page": per_page,
            "sort_by": sort_by,
            "sort_order": sort_order
        }
        
        if fields:
            params["fields"] = ",".join(fields) if isinstance(fields, list) else fields
        
        status_code, data = await self._make_request("GET", "/Deals", params=params)
        return data.get("data", [])
    
    async def search_deals(self, criteria: str, **kwargs) -> List[Dict[str, Any]]:
        """Search deals with criteria v6"""
        params = {
            "criteria": criteria,
            "per_page": kwargs.get("per_page", 200)
        }
        
        if kwargs.get("fields"):
            params["fields"] = ",".join(kwargs["fields"]) if isinstance(kwargs["fields"], list) else kwargs["fields"]
        
        status_code, data = await self._make_request("GET", "/Deals/search", params=params)
        return data.get("data", [])
    
    async def update_deal(self, deal_id: str, data: Dict[str, Any]) -> bool:
        """Update a deal v6"""
        payload = {"data": [data]}
        status_code, response_data = await self._make_request("PUT", f"/Deals/{deal_id}", data=payload)
        
        if status_code == 200:
            result = response_data.get("data", [{}])[0]
            return result.get("status") == "success"
        
        return False
    
    async def get_custom_fields(self) -> List[Dict[str, Any]]:
        """Get custom fields configuration v6"""
        status_code, data = await self._make_request("GET", "/settings/fields?module=Deals")
        return data.get("fields", [])


class ZohoAPIClientV8(BaseZohoAPIClient):
    """Zoho CRM API v8 client implementation"""
    
    def __init__(self):
        super().__init__("v8")
    
    async def authenticate(self) -> bool:
        """Authenticate with Zoho CRM using refresh token (same as v6)"""
        try:
            auth_url = f"{self.accounts_url}/oauth/v2/token"
            payload = {
                "refresh_token": settings.ZOHO_REFRESH_TOKEN,
                "client_id": settings.ZOHO_CLIENT_ID,
                "client_secret": settings.ZOHO_CLIENT_SECRET,
                "grant_type": "refresh_token"
            }
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(auth_url, data=payload)
                
            if response.status_code == 200:
                data = response.json()
                self.access_token = data["access_token"]
                self.token_expires_at = datetime.now() + timedelta(seconds=data["expires_in"] - 300)
                logger.info("✅ Zoho CRM v8 authentication successful")
                self._update_health_success()
                return True
            else:
                error_msg = f"Authentication failed: {response.status_code} - {response.text}"
                logger.error(f"❌ {error_msg}")
                self._update_health_error(error_msg)
                
        except Exception as e:
            error_msg = f"Authentication error: {e}"
            logger.error(f"❌ {error_msg}")
            self._update_health_error(error_msg)
        
        return False
    
    async def get_deals(self, **kwargs) -> List[Dict[str, Any]]:
        """Get deals from CRM v8 (enhanced with better error handling)"""
        fields = kwargs.get("fields")
        page = kwargs.get("page", 1)
        per_page = kwargs.get("per_page", 200)
        sort_by = kwargs.get("sort_by", "Modified_Time")
        sort_order = kwargs.get("sort_order", "desc")
        
        params = {
            "page": page,
            "per_page": per_page,
            "sort_by": sort_by,
            "sort_order": sort_order
        }
        
        if fields:
            params["fields"] = ",".join(fields) if isinstance(fields, list) else fields
        
        status_code, data = await self._make_request("GET", "/Deals", params=params)
        return data.get("data", [])
    
    async def search_deals(self, criteria: str, **kwargs) -> List[Dict[str, Any]]:
        """Search deals with criteria v8 (enhanced criteria support)"""
        params = {
            "criteria": criteria,
            "per_page": kwargs.get("per_page", 200)
        }
        
        if kwargs.get("fields"):
            params["fields"] = ",".join(kwargs["fields"]) if isinstance(kwargs["fields"], list) else kwargs["fields"]
        
        status_code, data = await self._make_request("GET", "/Deals/search", params=params)
        return data.get("data", [])
    
    async def update_deal(self, deal_id: str, data: Dict[str, Any]) -> bool:
        """Update a deal v8"""
        payload = {"data": [data]}
        status_code, response_data = await self._make_request("PUT", f"/Deals/{deal_id}", data=payload)
        
        if status_code == 200:
            result = response_data.get("data", [{}])[0]
            return result.get("status") == "success"
        
        return False
    
    async def get_custom_fields(self) -> List[Dict[str, Any]]:
        """Get custom fields configuration v8 (enhanced metadata)"""
        status_code, data = await self._make_request("GET", "/settings/fields?module=Deals")
        return data.get("fields", [])
    
    async def setup_webhooks(self, webhook_url: str, events: List[str]) -> bool:
        """Setup webhooks v8 (check if endpoint changed)"""
        webhook_config = {
            "watch": [
                {
                    "channel_id": "pipeline_pulse_deals_v8",
                    "events": events,
                    "channel_type": "web",
                    "channel_details": {
                        "url": webhook_url,
                        "method": "POST"
                    },
                    "token": settings.WEBHOOK_TOKEN
                }
            ]
        }
        
        try:
            # Try the v6/v8 compatible endpoint first
            status_code, data = await self._make_request("POST", "/actions/watch", data=webhook_config)
            return status_code == 200
        except Exception as e:
            logger.error(f"Webhook setup failed: {e}")
            return False


# Factory function to create the appropriate client
def create_zoho_client(api_version: str = "v8") -> BaseZohoAPIClient:
    """Factory function to create Zoho API client"""
    if api_version == "v6":
        return ZohoAPIClientV6()
    elif api_version == "v8":
        return ZohoAPIClientV8()
    else:
        raise ValueError(f"Unsupported API version: {api_version}")