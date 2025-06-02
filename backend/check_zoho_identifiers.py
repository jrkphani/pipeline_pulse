#!/usr/bin/env python3
"""
Check Zoho CRM Deal Identifiers and Database Mapping
"""

import asyncio
import sys
import json
import sqlite3
from pathlib import Path

# Add the backend path to sys.path for imports
backend_path = Path(__file__).parent
sys.path.append(str(backend_path))

from app.services.zoho_service import ZohoService

async def check_zoho_identifiers():
    """Check Zoho CRM deal identifiers"""
    
    print("🔍 Checking Zoho CRM Deal Identifiers")
    print("=" * 50)
    
    try:
        zoho_service = ZohoService()
        
        # Get deals with all ID-related fields
        import httpx
        
        access_token = await zoho_service.get_access_token()
        
        headers = {
            "Authorization": f"Zoho-oauthtoken {access_token}",
            "Content-Type": "application/json"
        }
        
        # Get deals with specific fields including all possible ID fields
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{zoho_service.base_url}/Deals",
                headers=headers,
                params={
                    "fields": "id,Deal_Name,Account_Name,Amount,Stage,Probability,Closing_Date,Deal_Owner,Currency,Record_Id,Created_Time,Modified_Time",
                    "per_page": 3
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                deals = data.get("data", [])
                
                print(f"✅ Found {len(deals)} deals from Zoho CRM")
                print("\n📋 Deal Identifier Analysis:")
                
                for i, deal in enumerate(deals, 1):
                    print(f"\n--- Deal {i}: {deal.get('Deal_Name', 'N/A')} ---")
                    
                    # Check all possible ID fields
                    id_fields = ['id', 'Record_Id', 'Deal_Id']
                    
                    for field in id_fields:
                        value = deal.get(field, 'NOT_FOUND')
                        print(f"  {field}: {value}")
                    
                    # Show all keys that contain 'id' (case insensitive)
                    id_related_keys = [key for key in deal.keys() if 'id' in key.lower()]
                    if id_related_keys:
                        print(f"  ID-related fields found: {id_related_keys}")
                        for key in id_related_keys:
                            print(f"    {key}: {deal[key]}")
                    
                    # Show timestamps
                    print(f"  Created_Time: {deal.get('Created_Time', 'N/A')}")
                    print(f"  Modified_Time: {deal.get('Modified_Time', 'N/A')}")
                
                return deals
            else:
                print(f"❌ Failed to fetch deals: {response.status_code}")
                print(f"Response: {response.text}")
                return []
                
    except Exception as e:
        print(f"❌ Error checking Zoho identifiers: {str(e)}")
        return []

def check_database_identifiers():
    """Check what identifiers we're storing in our database"""
    
    print("\n" + "=" * 50)
    print("🗄️  Checking Database Deal Identifiers")
    print("=" * 50)
    
    try:
        # Connect to database
        conn = sqlite3.connect('pipeline_pulse.db')
        cursor = conn.cursor()
        
        # Check if analyses table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='analyses'")
        if not cursor.fetchone():
            print("❌ No analyses table found in database")
            return
        
        # Get latest analysis
        cursor.execute('SELECT data FROM analyses WHERE is_latest = 1')
        result = cursor.fetchone()
        
        if result:
            deals_data = json.loads(result[0])
            print(f"✅ Found {len(deals_data)} deals in database")
            
            if deals_data:
                print("\n📋 Database Deal Identifier Analysis:")
                
                # Check first few deals
                for i, deal in enumerate(deals_data[:3], 1):
                    print(f"\n--- Deal {i}: {deal.get('Opportunity Name', deal.get('opportunity_name', 'N/A'))} ---")
                    
                    # Check all possible ID fields in our data
                    id_fields = ['Record Id', 'record_id', 'id', 'deal_id', 'opportunity_id']
                    
                    for field in id_fields:
                        value = deal.get(field, 'NOT_FOUND')
                        if value != 'NOT_FOUND':
                            print(f"  {field}: {value}")
                    
                    # Show all keys that contain 'id' (case insensitive)
                    id_related_keys = [key for key in deal.keys() if 'id' in key.lower()]
                    if id_related_keys:
                        print(f"  ID-related fields found: {id_related_keys}")
                        for key in id_related_keys:
                            print(f"    {key}: {deal[key]}")
                    
                    # Show some other identifying fields
                    print(f"  Opportunity Name: {deal.get('Opportunity Name', deal.get('opportunity_name', 'N/A'))}")
                    print(f"  Account Name: {deal.get('Account Name', deal.get('account_name', 'N/A'))}")
        else:
            print("❌ No analysis data found in database")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ Error checking database: {str(e)}")

def compare_identifiers(zoho_deals):
    """Compare Zoho and database identifiers"""
    
    print("\n" + "=" * 50)
    print("🔄 Identifier Mapping Analysis")
    print("=" * 50)
    
    if not zoho_deals:
        print("❌ No Zoho deals to compare")
        return
    
    print("📊 Zoho CRM Identifier Structure:")
    print("  - Primary ID: 'id' field (e.g., '495490000012345678')")
    print("  - This is the unique record identifier in Zoho")
    print("  - Format: Usually 18-digit number as string")
    print("  - Used for: API calls, updates, references")
    
    print("\n📊 Recommended Mapping Strategy:")
    print("  1. Use Zoho 'id' field as primary identifier")
    print("  2. Store it in our database as 'zoho_deal_id' or 'record_id'")
    print("  3. Create mapping table if needed for CSV imports")
    print("  4. Use this ID for sync operations between systems")
    
    print("\n💡 Implementation Recommendations:")
    print("  - Add 'zoho_deal_id' column to store Zoho's 'id' field")
    print("  - Keep existing 'Record Id' for CSV compatibility")
    print("  - Create unique constraint on zoho_deal_id")
    print("  - Use zoho_deal_id for API sync operations")

async def main():
    """Main function"""
    
    # Check Zoho identifiers
    zoho_deals = await check_zoho_identifiers()
    
    # Check database identifiers
    check_database_identifiers()
    
    # Compare and provide recommendations
    compare_identifiers(zoho_deals)
    
    print("\n" + "=" * 50)
    print("✅ Identifier analysis complete!")

if __name__ == "__main__":
    asyncio.run(main())
