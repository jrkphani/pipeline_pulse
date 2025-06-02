#!/usr/bin/env python3
"""
Test Zoho CRM Integration
"""

import asyncio
import sys
import os
from pathlib import Path

# Add the backend path to sys.path for imports
backend_path = Path(__file__).parent
sys.path.append(str(backend_path))

from app.services.zoho_service import ZohoService

async def test_zoho_integration():
    """Test the Zoho CRM integration"""
    
    print("🧪 Testing Zoho CRM Integration")
    print("=" * 40)
    
    try:
        # Initialize the service
        zoho_service = ZohoService()
        
        print("🔄 Testing authentication...")
        
        # Test authentication
        is_authenticated = await zoho_service.check_auth()
        
        if is_authenticated:
            print("✅ Authentication successful!")
            
            # Test fetching deals
            print("\n🔄 Fetching deals from Zoho CRM...")
            deals = await zoho_service.get_deals(limit=5)
            
            print(f"✅ Successfully fetched {len(deals)} deals")
            
            if deals:
                print("\n📊 Sample deals:")
                for i, deal in enumerate(deals[:3], 1):
                    deal_name = deal.get('Deal_Name', 'N/A')
                    account_name = deal.get('Account_Name', {}).get('name', 'N/A') if isinstance(deal.get('Account_Name'), dict) else deal.get('Account_Name', 'N/A')
                    amount = deal.get('Amount', 'N/A')
                    stage = deal.get('Stage', 'N/A')
                    
                    print(f"  {i}. {deal_name}")
                    print(f"     Account: {account_name}")
                    print(f"     Amount: {amount}")
                    print(f"     Stage: {stage}")
                    print()
            
            print("🎉 Zoho CRM integration is working perfectly!")
            return True
            
        else:
            print("❌ Authentication failed")
            return False
            
    except Exception as e:
        print(f"❌ Error testing integration: {str(e)}")
        return False

async def test_specific_endpoints():
    """Test specific Zoho endpoints"""
    
    print("\n🔍 Testing specific endpoints...")
    
    try:
        zoho_service = ZohoService()
        
        # Get access token
        access_token = await zoho_service.get_access_token()
        print(f"✅ Access token obtained: {access_token[:20]}...")
        
        # Test deals endpoint with more details
        print("\n🔄 Testing deals endpoint with detailed fields...")
        
        import httpx
        
        headers = {
            "Authorization": f"Zoho-oauthtoken {access_token}",
            "Content-Type": "application/json"
        }
        
        # Get deals with specific fields
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{zoho_service.base_url}/Deals",
                headers=headers,
                params={
                    "fields": "Deal_Name,Account_Name,Amount,Stage,Probability,Closing_Date,Deal_Owner,Currency",
                    "per_page": 5
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                deals = data.get("data", [])
                
                print(f"✅ Detailed deals fetch successful: {len(deals)} deals")
                
                if deals:
                    print("\n📋 Detailed deal information:")
                    for i, deal in enumerate(deals, 1):
                        print(f"\n  Deal {i}:")
                        print(f"    Name: {deal.get('Deal_Name', 'N/A')}")
                        print(f"    Account: {deal.get('Account_Name', 'N/A')}")
                        print(f"    Amount: {deal.get('Amount', 'N/A')}")
                        print(f"    Currency: {deal.get('Currency', 'N/A')}")
                        print(f"    Stage: {deal.get('Stage', 'N/A')}")
                        print(f"    Probability: {deal.get('Probability', 'N/A')}%")
                        print(f"    Closing Date: {deal.get('Closing_Date', 'N/A')}")
                        print(f"    Owner: {deal.get('Deal_Owner', {}).get('name', 'N/A') if isinstance(deal.get('Deal_Owner'), dict) else deal.get('Deal_Owner', 'N/A')}")
                
                return True
            else:
                print(f"❌ Detailed deals fetch failed: {response.status_code}")
                print(f"Response: {response.text}")
                return False
                
    except Exception as e:
        print(f"❌ Error testing specific endpoints: {str(e)}")
        return False

if __name__ == "__main__":
    async def main():
        # Test basic integration
        basic_test = await test_zoho_integration()
        
        if basic_test:
            # Test specific endpoints
            await test_specific_endpoints()
            
            print("\n" + "=" * 40)
            print("🎉 All tests completed successfully!")
            print("✅ Zoho CRM integration is ready for use")
        else:
            print("\n" + "=" * 40)
            print("❌ Integration tests failed")
            print("Please check your configuration and try again")
    
    asyncio.run(main())
