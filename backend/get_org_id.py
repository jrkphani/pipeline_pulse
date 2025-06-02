#!/usr/bin/env python3
"""
Get Zoho Organization ID
"""

import asyncio
import sys
from pathlib import Path

# Add the backend path to sys.path for imports
backend_path = Path(__file__).parent
sys.path.append(str(backend_path))

from app.services.zoho_service import ZohoService

async def get_org_info():
    """Get organization information from Zoho"""
    
    print("🔍 Fetching Zoho Organization Information...")
    
    try:
        zoho_service = ZohoService()
        
        # Get access token
        access_token = await zoho_service.get_access_token()
        
        import httpx
        
        headers = {
            "Authorization": f"Zoho-oauthtoken {access_token}",
            "Content-Type": "application/json"
        }
        
        # Get organization info
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{zoho_service.base_url}/org",
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                org_info = data.get("org", [])
                
                if org_info:
                    org = org_info[0]
                    print("✅ Organization Information:")
                    print(f"   Organization ID: {org.get('id', 'N/A')}")
                    print(f"   Company Name: {org.get('company_name', 'N/A')}")
                    print(f"   Primary Email: {org.get('primary_email', 'N/A')}")
                    print(f"   Country: {org.get('country', 'N/A')}")
                    print(f"   Time Zone: {org.get('time_zone', 'N/A')}")
                    
                    return org.get('id')
                else:
                    print("❌ No organization data found")
                    return None
            else:
                print(f"❌ Failed to fetch org info: {response.status_code}")
                print(f"Response: {response.text}")
                return None
                
    except Exception as e:
        print(f"❌ Error fetching org info: {str(e)}")
        return None

if __name__ == "__main__":
    asyncio.run(get_org_info())
