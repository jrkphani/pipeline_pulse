"""
Universal Zoho CRM API Client
Handles all HTTP communications with rate limiting and error handling
"""

import httpx
import asyncio
import json
from typing import Dict, Any, List, Optional, Union
from datetime import datetime, timedelta
from .auth_manager import ZohoAuthManager
from .exceptions import ZohoAPIError, ZohoRateLimitError, ZohoAuthError
import logging

logger = logging.getLogger(__name__)


class ZohoAPIClient:
    """Universal HTTP client for all Zoho CRM operations"""
    
    def __init__(self):
        self.auth_manager = ZohoAuthManager()
        self.base_url = self.auth_manager.base_url
        self._rate_limit_reset = None
        self._rate_limit_remaining = None
        self._request_lock = asyncio.Lock()
    
    async def _make_request(
        self, 
        method: str, 
        endpoint: str, 
        data: Optional[Dict[str, Any]] = None,
        params: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None,
        retry_count: int = 0
    ) -> Dict[str, Any]:
        """Make authenticated request with rate limiting and error handling"""
        
        # Check rate limits
        await self._check_rate_limits()
        
        # Get access token
        try:
            token = await self.auth_manager.get_access_token()
        except Exception as e:
            raise ZohoAuthError(f"Failed to get access token: {str(e)}")
        
        # Prepare headers
        request_headers = {
            "Authorization": f"Zoho-oauthtoken {token}",
            "Content-Type": "application/json"
        }
        if headers:
            request_headers.update(headers)
        
        # Make request
        async with self._request_lock:
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    if method.upper() == "GET":
                        response = await client.get(
                            f"{self.base_url}/{endpoint}",
                            headers=request_headers,
                            params=params
                        )
                    elif method.upper() == "POST":
                        response = await client.post(
                            f"{self.base_url}/{endpoint}",
                            headers=request_headers,
                            json=data,
                            params=params
                        )
                    elif method.upper() == "PUT":
                        response = await client.put(
                            f"{self.base_url}/{endpoint}",
                            headers=request_headers,
                            json=data,
                            params=params
                        )
                    elif method.upper() == "DELETE":
                        response = await client.delete(
                            f"{self.base_url}/{endpoint}",
                            headers=request_headers,
                            params=params
                        )
                    else:
                        raise ZohoAPIError(f"Unsupported HTTP method: {method}")
                
                # Update rate limit info
                self._update_rate_limit_info(response)
                
                # Handle response
                return await self._handle_response(response, method, endpoint, data, params, retry_count)
                
            except httpx.TimeoutException:
                raise ZohoAPIError(f"Request timeout for {method} {endpoint}")
            except httpx.RequestError as e:
                raise ZohoAPIError(f"Network error: {str(e)}")
    
    async def _handle_response(
        self, 
        response: httpx.Response, 
        method: str, 
        endpoint: str, 
        data: Optional[Dict[str, Any]], 
        params: Optional[Dict[str, Any]], 
        retry_count: int
    ) -> Dict[str, Any]:
        """Handle API response with error handling and retries"""
        
        if response.status_code == 200:
            try:
                return response.json()
            except json.JSONDecodeError:
                raise ZohoAPIError(f"Invalid JSON response from {endpoint}")
        
        elif response.status_code == 401:
            # Token expired, retry with fresh token
            if retry_count < 2:
                logger.warning("Access token expired, refreshing and retrying")
                await self.auth_manager.get_access_token(force_refresh=True)
                return await self._make_request(method, endpoint, data, params, retry_count=retry_count + 1)
            else:
                raise ZohoAuthError("Authentication failed after token refresh")
        
        elif response.status_code == 429:
            # Rate limit exceeded
            retry_after = int(response.headers.get("Retry-After", 60))
            raise ZohoRateLimitError(
                f"Rate limit exceeded. Retry after {retry_after} seconds",
                retry_after=retry_after,
                status_code=response.status_code
            )
        
        elif response.status_code in [400, 422]:
            # Validation errors
            try:
                error_data = response.json()
                error_message = error_data.get("message", "Validation error")
                raise ZohoAPIError(
                    error_message,
                    status_code=response.status_code,
                    response_data=error_data
                )
            except json.JSONDecodeError:
                raise ZohoAPIError(f"Validation error: {response.text}")
        
        else:
            # Other errors
            try:
                error_data = response.json()
                error_message = error_data.get("message", f"API error: {response.status_code}")
            except json.JSONDecodeError:
                error_message = f"API error: {response.status_code} - {response.text}"
            
            raise ZohoAPIError(
                error_message,
                status_code=response.status_code,
                response_data=error_data if 'error_data' in locals() else None
            )
    
    def _update_rate_limit_info(self, response: httpx.Response):
        """Update rate limit information from response headers"""
        self._rate_limit_remaining = response.headers.get("X-RateLimit-Remaining")
        reset_time = response.headers.get("X-RateLimit-Reset")
        if reset_time:
            self._rate_limit_reset = datetime.fromtimestamp(int(reset_time))
    
    async def _check_rate_limits(self):
        """Check and handle rate limits"""
        if (self._rate_limit_remaining and 
            int(self._rate_limit_remaining) < 10 and 
            self._rate_limit_reset and 
            datetime.now() < self._rate_limit_reset):
            
            wait_time = (self._rate_limit_reset - datetime.now()).total_seconds()
            if wait_time > 0:
                logger.warning(f"Approaching rate limit, waiting {wait_time} seconds")
                await asyncio.sleep(wait_time)
    
    # Convenience methods for different HTTP verbs
    async def get(self, endpoint: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Make GET request"""
        return await self._make_request("GET", endpoint, params=params)
    
    async def post(self, endpoint: str, data: Optional[Dict[str, Any]] = None, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Make POST request"""
        return await self._make_request("POST", endpoint, data=data, params=params)
    
    async def put(self, endpoint: str, data: Optional[Dict[str, Any]] = None, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Make PUT request"""
        return await self._make_request("PUT", endpoint, data=data, params=params)
    
    async def delete(self, endpoint: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Make DELETE request"""
        return await self._make_request("DELETE", endpoint, params=params)
