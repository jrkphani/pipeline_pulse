#!/usr/bin/env python3
"""
Test Zoho API Endpoints
Test different endpoints and parameters to understand API requirements
"""

import asyncio
import httpx
import os
import sys
from datetime import datetime

# Add backend to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

# Load environment variables from backend/.env
from dotenv import load_dotenv
backend_env_path = os.path.join(os.path.dirname(__file__), '..', 'backend', '.env')
load_dotenv(backend_env_path)

from app.core.config import settings


async def test_endpoint(endpoint: str, params: dict = None, description: str = ""):
    """Test a specific endpoint with parameters"""
    
    print(f"\n🔍 Testing: {description or endpoint}")
    print("-" * 50)
    
    # Get fresh access token
    client_id = settings.ZOHO_CLIENT_ID
    client_secret = settings.ZOHO_CLIENT_SECRET
    refresh_token = settings.ZOHO_REFRESH_TOKEN
    accounts_url = settings.ZOHO_ACCOUNTS_URL
    base_url = settings.ZOHO_BASE_URL
    
    # Refresh token first
    token_data = {
        "refresh_token": refresh_token,
        "client_id": client_id,
        "client_secret": client_secret,
        "grant_type": "refresh_token"
    }
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Get access token
            token_response = await client.post(f"{accounts_url}/oauth/v2/token", data=token_data)
            
            if token_response.status_code != 200:
                print(f"❌ Token refresh failed: {token_response.text}")
                return False
            
            token_info = token_response.json()
            access_token = token_info.get("access_token")
            
            if not access_token:
                print("❌ No access token received")
                return False
            
            # Test the endpoint
            headers = {
                "Authorization": f"Zoho-oauthtoken {access_token}",
                "Content-Type": "application/json"
            }
            
            url = f"{base_url}/{endpoint}"
            print(f"🌐 URL: {url}")
            if params:
                print(f"📤 Params: {params}")
            
            response = await client.get(url, headers=headers, params=params)
            
            print(f"📥 Status: {response.status_code}")
            
            # Show rate limit headers
            rate_headers = {k: v for k, v in response.headers.items() if 'ratelimit' in k.lower()}
            if rate_headers:
                print(f"📊 Rate Limits: {rate_headers}")
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    print("✅ Success!")
                    
                    # Show data structure
                    if isinstance(data, dict):
                        print(f"📋 Response keys: {list(data.keys())}")
                        
                        # Show specific data based on endpoint
                        if "data" in data:
                            records = data["data"]
                            print(f"📊 Records count: {len(records)}")
                            
                            if records and isinstance(records[0], dict):
                                print(f"📝 Sample record keys: {list(records[0].keys())[:10]}...")
                                
                                # Show first record details for deals
                                if "Deal_Name" in records[0]:
                                    deal = records[0]
                                    print(f"   Deal: {deal.get('Deal_Name', 'Unknown')}")
                                    print(f"   Amount: {deal.get('Amount', 0)}")
                                    print(f"   Stage: {deal.get('Stage', 'Unknown')}")
                        
                        elif "org" in data:
                            org = data["org"][0] if data["org"] else {}
                            print(f"   Organization: {org.get('company_name', 'Unknown')}")
                        
                        elif "users" in data:
                            user = data["users"][0] if data["users"] else {}
                            print(f"   User: {user.get('full_name', 'Unknown')}")
                        
                        elif "fields" in data:
                            fields = data["fields"]
                            print(f"   Fields count: {len(fields)}")
                    
                    return True
                    
                except Exception as json_error:
                    print(f"❌ JSON parse error: {str(json_error)}")
                    print(f"   Raw response: {response.text[:200]}...")
                    return False
            else:
                print(f"❌ Failed with status {response.status_code}")
                print(f"   Response: {response.text}")
                return False
                
    except Exception as e:
        print(f"❌ Request error: {str(e)}")
        return False


async def main():
    """Test various Zoho API endpoints"""
    
    print(f"🚀 Zoho API Endpoints Testing - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)
    
    # Test different endpoints and parameter combinations
    test_cases = [
        # Basic endpoints
        ("org", None, "Organization Info"),
        ("users?type=CurrentUser", None, "Current User"),
        
        # Deals with different parameters
        ("Deals", None, "Deals - No Parameters"),
        ("Deals", {"per_page": 5}, "Deals - With per_page"),
        ("Deals", {"page": 1, "per_page": 3}, "Deals - With pagination"),
        ("Deals", {"fields": "Deal_Name,Amount,Stage"}, "Deals - Specific fields"),
        ("Deals", {"per_page": 3, "fields": "Deal_Name,Amount,Stage,Closing_Date"}, "Deals - Combined params"),
        
        # Settings and metadata
        ("settings/modules", None, "Available Modules"),
        ("settings/fields?module=Deals", None, "Deal Fields Metadata"),
        
        # Users and roles
        ("users", {"type": "AllUsers", "per_page": 5}, "All Users"),
        ("roles", None, "User Roles"),
        
        # Other modules
        ("Accounts", {"per_page": 3}, "Accounts"),
        ("Contacts", {"per_page": 3}, "Contacts"),
    ]
    
    results = []
    
    for endpoint, params, description in test_cases:
        try:
            success = await test_endpoint(endpoint, params, description)
            results.append((description, success))
            
            # Small delay between requests to avoid rate limiting
            await asyncio.sleep(1)
            
        except Exception as e:
            print(f"❌ Test failed: {str(e)}")
            results.append((description, False))
    
    # Summary
    print("\n📊 Test Results Summary:")
    print("=" * 70)
    
    passed = sum(1 for _, success in results if success)
    total = len(results)
    
    print(f"Overall: {passed}/{total} tests passed")
    print()
    
    for description, success in results:
        status = "✅" if success else "❌"
        print(f"{status} {description}")
    
    if passed == total:
        print("\n🎉 All tests passed! Zoho API is fully functional.")
    elif passed > 0:
        print(f"\n⚠️ Partial success: {passed}/{total} endpoints working.")
        print("💡 Some endpoints may require different parameters or permissions.")
    else:
        print("\n❌ All tests failed. Check API configuration and permissions.")
    
    print(f"\n🕒 Testing completed at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")


if __name__ == "__main__":
    asyncio.run(main())
