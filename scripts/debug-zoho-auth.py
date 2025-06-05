#!/usr/bin/env python3
"""
Debug Zoho Authentication
Direct HTTP test to understand authentication issues
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


async def test_direct_token_refresh():
    """Test token refresh with direct HTTP call"""
    
    print("🔍 Direct Zoho Token Refresh Test")
    print("=" * 50)
    
    # Get credentials
    client_id = settings.ZOHO_CLIENT_ID
    client_secret = settings.ZOHO_CLIENT_SECRET
    refresh_token = settings.ZOHO_REFRESH_TOKEN
    accounts_url = settings.ZOHO_ACCOUNTS_URL
    
    print(f"Client ID: {client_id}")
    print(f"Client Secret: {'*' * 20}")
    print(f"Refresh Token: {'*' * 20}")
    print(f"Accounts URL: {accounts_url}")
    print()
    
    if not all([client_id, client_secret, refresh_token]):
        print("❌ Missing required credentials")
        return False
    
    # Prepare request data
    token_url = f"{accounts_url}/oauth/v2/token"
    data = {
        "refresh_token": refresh_token,
        "client_id": client_id,
        "client_secret": client_secret,
        "grant_type": "refresh_token"
    }
    
    print(f"🌐 Making request to: {token_url}")
    print("📤 Request data:")
    for key, value in data.items():
        if key in ["refresh_token", "client_secret"]:
            print(f"   {key}: {'*' * 20}")
        else:
            print(f"   {key}: {value}")
    print()
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            print("⏳ Sending token refresh request...")
            response = await client.post(token_url, data=data)
            
            print(f"📥 Response Status: {response.status_code}")
            print(f"📥 Response Headers:")
            for header, value in response.headers.items():
                print(f"   {header}: {value}")
            print()
            
            print(f"📥 Response Body:")
            response_text = response.text
            print(response_text)
            print()
            
            if response.status_code == 200:
                try:
                    token_data = response.json()
                    access_token = token_data.get("access_token")
                    
                    if access_token:
                        print(f"✅ Token refresh successful!")
                        print(f"   Access Token Length: {len(access_token)}")
                        print(f"   Token Type: {token_data.get('token_type', 'Unknown')}")
                        print(f"   Expires In: {token_data.get('expires_in', 'Unknown')} seconds")
                        
                        # Test the token with a simple API call
                        await test_token_with_api_call(access_token)
                        return True
                    else:
                        print("❌ No access token in response")
                        return False
                        
                except Exception as json_error:
                    print(f"❌ Error parsing JSON response: {str(json_error)}")
                    return False
            else:
                print(f"❌ Token refresh failed with status {response.status_code}")
                
                # Try to parse error response
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Raw error: {response.text}")
                
                return False
                
    except httpx.TimeoutException:
        print("❌ Request timeout")
        return False
    except httpx.RequestError as e:
        print(f"❌ Network error: {str(e)}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        return False


async def test_token_with_api_call(access_token: str):
    """Test the access token with a simple API call"""
    
    print("\n🔍 Testing Access Token with API Call")
    print("-" * 40)
    
    base_url = settings.ZOHO_BASE_URL
    org_url = f"{base_url}/org"
    
    headers = {
        "Authorization": f"Zoho-oauthtoken {access_token}",
        "Content-Type": "application/json"
    }
    
    print(f"🌐 Making request to: {org_url}")
    print(f"📤 Headers: Authorization: Zoho-oauthtoken {'*' * 20}")
    print()
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(org_url, headers=headers)
            
            print(f"📥 Response Status: {response.status_code}")
            print(f"📥 Response Headers:")
            for header, value in response.headers.items():
                if header.lower().startswith('x-ratelimit'):
                    print(f"   {header}: {value}")
            print()
            
            if response.status_code == 200:
                try:
                    org_data = response.json()
                    print("✅ API call successful!")
                    
                    if "org" in org_data and org_data["org"]:
                        org = org_data["org"][0]
                        print(f"   Organization: {org.get('company_name', 'Unknown')}")
                        print(f"   Country: {org.get('country', 'Unknown')}")
                        print(f"   Time Zone: {org.get('time_zone', 'Unknown')}")
                    
                    return True
                    
                except Exception as json_error:
                    print(f"❌ Error parsing API response: {str(json_error)}")
                    print(f"   Raw response: {response.text[:500]}...")
                    return False
            else:
                print(f"❌ API call failed with status {response.status_code}")
                print(f"   Response: {response.text}")
                return False
                
    except Exception as e:
        print(f"❌ API call error: {str(e)}")
        return False


async def main():
    """Main debug function"""
    
    print(f"🚀 Starting Zoho Authentication Debug - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    success = await test_direct_token_refresh()
    
    print("\n📊 Debug Summary:")
    print("=" * 50)
    
    if success:
        print("✅ Authentication is working correctly!")
        print("🎉 The issue was resolved - Zoho API is accessible.")
    else:
        print("❌ Authentication is still failing.")
        print("💡 Possible issues:")
        print("   • Refresh token may be expired")
        print("   • Client credentials may be incorrect")
        print("   • Data center mismatch (India vs US/EU)")
        print("   • Network connectivity issues")
        print("   • Zoho API service issues")
    
    print(f"\n🕒 Debug completed at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")


if __name__ == "__main__":
    asyncio.run(main())
