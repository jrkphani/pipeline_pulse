#!/usr/bin/env python3
"""
Local Zoho API Testing Script
Simple test for local development environment using .env file
"""

import asyncio
import os
import sys
from datetime import datetime

# Add backend to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

# Load environment variables from backend/.env
from dotenv import load_dotenv
backend_env_path = os.path.join(os.path.dirname(__file__), '..', 'backend', '.env')
load_dotenv(backend_env_path)

print(f"Loading environment from: {backend_env_path}")
print(f"Environment file exists: {os.path.exists(backend_env_path)}")

# Import after loading environment
from app.core.config import settings


async def test_zoho_connectivity():
    """Test Zoho API connectivity with local environment"""
    
    print("🧪 Local Zoho API Testing")
    print("=" * 50)
    print(f"Environment: {settings.ENVIRONMENT}")
    print(f"Zoho Base URL: {settings.ZOHO_BASE_URL}")
    print(f"Zoho Accounts URL: {settings.ZOHO_ACCOUNTS_URL}")
    print()
    
    # Check environment variables
    print("📋 Environment Variables Check:")
    env_vars = {
        "ZOHO_CLIENT_ID": settings.ZOHO_CLIENT_ID,
        "ZOHO_REFRESH_TOKEN": settings.ZOHO_REFRESH_TOKEN,
        "ZOHO_CLIENT_SECRET": settings.ZOHO_CLIENT_SECRET,
        "ZOHO_BASE_URL": settings.ZOHO_BASE_URL,
        "ZOHO_ACCOUNTS_URL": settings.ZOHO_ACCOUNTS_URL
    }
    
    all_configured = True
    for var_name, var_value in env_vars.items():
        if var_value:
            if var_name in ["ZOHO_REFRESH_TOKEN", "ZOHO_CLIENT_SECRET"]:
                print(f"✅ {var_name}: {'*' * 20} (hidden)")
            else:
                print(f"✅ {var_name}: {var_value}")
        else:
            print(f"❌ {var_name}: Not set")
            all_configured = False
    
    print()
    
    if not all_configured:
        print("❌ Missing required environment variables. Please check backend/.env file.")
        return False
    
    # Test authentication
    print("🔐 Testing Authentication:")
    try:
        from app.services.zoho_crm.core.auth_manager import ZohoAuthManager
        
        auth_manager = ZohoAuthManager()
        
        # Test token refresh
        print("   Refreshing access token...")
        try:
            token = await auth_manager.get_access_token(force_refresh=True)

            if token:
                print(f"✅ Token refresh successful (length: {len(token)})")

                # Test connection validation
                print("   Validating connection...")
                validation = await auth_manager.validate_connection()

                if validation.get("authenticated"):
                    print("✅ Connection validation successful")

                    # Show organization info if available
                    org_info = validation.get("org_info", {})
                    if isinstance(org_info, dict) and "org" in org_info:
                        org_data = org_info["org"][0] if org_info["org"] else {}
                        company_name = org_data.get("company_name", "Unknown")
                        print(f"   Organization: {company_name}")

                    return True
                else:
                    print(f"❌ Connection validation failed: {validation.get('error', 'Unknown error')}")
                    return False
            else:
                print("❌ Token refresh failed - no token received")
                return False
        except Exception as token_error:
            print(f"❌ Token refresh error: {str(token_error)}")
            return False
            
    except Exception as e:
        print(f"❌ Authentication test failed: {str(e)}")
        return False


async def test_basic_api_calls():
    """Test basic API calls"""
    
    print("\n🔍 Testing Basic API Calls:")
    try:
        from app.services.zoho_crm.core.api_client import ZohoAPIClient
        
        api_client = ZohoAPIClient()
        
        # Test organization info
        print("   Fetching organization info...")
        org_response = await api_client.get("org")
        
        if isinstance(org_response, dict) and "org" in org_response:
            org = org_response["org"][0] if org_response["org"] else {}
            print(f"✅ Organization: {org.get('company_name', 'Unknown')}")
            print(f"   Time Zone: {org.get('time_zone', 'Unknown')}")
            print(f"   Country: {org.get('country', 'Unknown')}")
        
        # Test current user
        print("   Fetching current user...")
        user_response = await api_client.get("users?type=CurrentUser")
        
        if isinstance(user_response, dict) and "users" in user_response:
            user = user_response["users"][0] if user_response["users"] else {}
            print(f"✅ Current User: {user.get('full_name', 'Unknown')}")
            print(f"   Email: {user.get('email', 'Unknown')}")
            print(f"   Role: {user.get('role', {}).get('name', 'Unknown')}")
        
        # Test deals (limited)
        print("   Fetching sample deals...")
        deals_response = await api_client.get("Deals?per_page=3")
        
        if isinstance(deals_response, dict) and "data" in deals_response:
            deals = deals_response["data"]
            print(f"✅ Sample Deals: {len(deals)} records fetched")
            
            for i, deal in enumerate(deals[:2], 1):
                deal_name = deal.get("Deal_Name", "Unknown")
                amount = deal.get("Amount", 0)
                stage = deal.get("Stage", "Unknown")
                print(f"   Deal {i}: {deal_name} - ${amount:,.2f} ({stage})")
        
        return True
        
    except Exception as e:
        print(f"❌ API calls test failed: {str(e)}")
        return False


async def main():
    """Main test function"""
    
    print(f"🚀 Starting Local Zoho API Tests - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Test 1: Connectivity
    auth_success = await test_zoho_connectivity()
    
    if not auth_success:
        print("\n❌ Authentication failed. Cannot proceed with API tests.")
        return
    
    # Test 2: Basic API calls
    api_success = await test_basic_api_calls()
    
    # Summary
    print("\n📊 Test Summary:")
    print("=" * 50)
    
    if auth_success and api_success:
        print("✅ All tests passed! Zoho API integration is working correctly.")
        print("🎉 Ready for local development and testing.")
    elif auth_success:
        print("⚠️ Authentication works but API calls failed.")
        print("💡 Check API permissions and endpoint configurations.")
    else:
        print("❌ Tests failed. Check environment configuration.")
        print("💡 Verify credentials in backend/.env file.")
    
    print(f"\n🕒 Test completed at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")


if __name__ == "__main__":
    asyncio.run(main())
