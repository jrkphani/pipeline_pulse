#!/usr/bin/env python3
"""
Test Zoho ID Conversion Functions
"""

import asyncio
import sys
from pathlib import Path

# Add the backend path to sys.path for imports
backend_path = Path(__file__).parent
sys.path.append(str(backend_path))

from app.services.zoho_service import ZohoService

async def test_id_conversion():
    """Test the ID conversion functions"""
    
    print("🧪 Testing Zoho ID Conversion Functions")
    print("=" * 50)
    
    zoho_service = ZohoService()
    
    # Test cases
    test_cases = [
        {
            "csv_id": "zcrm_495490000010864021",
            "api_id": "495490000010864021",
            "description": "Standard CSV Record ID"
        },
        {
            "csv_id": "zcrm_495490000014553469",
            "api_id": "495490000014553469", 
            "description": "Another CSV Record ID"
        },
        {
            "csv_id": "495490000010864021",
            "api_id": "495490000010864021",
            "description": "Already API format"
        }
    ]
    
    print("📋 Testing normalize_deal_id (CSV -> API):")
    for i, test in enumerate(test_cases, 1):
        result = zoho_service.normalize_deal_id(test["csv_id"])
        status = "✅" if result == test["api_id"] else "❌"
        print(f"  {i}. {test['description']}")
        print(f"     Input:    {test['csv_id']}")
        print(f"     Expected: {test['api_id']}")
        print(f"     Result:   {result} {status}")
        print()
    
    print("📋 Testing format_csv_id (API -> CSV):")
    for i, test in enumerate(test_cases, 1):
        result = zoho_service.format_csv_id(test["api_id"])
        expected = test["csv_id"] if test["csv_id"].startswith("zcrm_") else f"zcrm_{test['csv_id']}"
        status = "✅" if result == expected else "❌"
        print(f"  {i}. {test['description']}")
        print(f"     Input:    {test['api_id']}")
        print(f"     Expected: {expected}")
        print(f"     Result:   {result} {status}")
        print()

async def test_live_deals_with_ids():
    """Test fetching live deals with both ID formats"""
    
    print("🔄 Testing Live Deals with ID Conversion")
    print("=" * 50)
    
    try:
        zoho_service = ZohoService()
        
        # Fetch deals with ID conversion
        deals = await zoho_service.get_deals(limit=3)
        
        print(f"✅ Fetched {len(deals)} deals with ID conversion")
        
        for i, deal in enumerate(deals, 1):
            print(f"\n--- Deal {i}: {deal.get('Deal_Name', 'N/A')} ---")
            print(f"  API ID (id):        {deal.get('id', 'N/A')}")
            print(f"  CSV ID (Record Id): {deal.get('Record Id', 'N/A')}")
            print(f"  Reference ID:       {deal.get('zoho_api_id', 'N/A')}")
            
            # Verify conversion
            if 'id' in deal and 'Record Id' in deal:
                expected_csv = f"zcrm_{deal['id']}"
                actual_csv = deal['Record Id']
                conversion_ok = expected_csv == actual_csv
                print(f"  Conversion Check:   {'✅' if conversion_ok else '❌'}")
        
        return deals
        
    except Exception as e:
        print(f"❌ Error testing live deals: {str(e)}")
        return []

async def test_update_deal_with_csv_id():
    """Test updating a deal using CSV Record ID"""
    
    print("\n🔄 Testing Deal Update with CSV Record ID")
    print("=" * 50)
    
    try:
        zoho_service = ZohoService()
        
        # Get a deal first
        deals = await zoho_service.get_deals(limit=1)
        
        if not deals:
            print("❌ No deals found to test update")
            return
        
        deal = deals[0]
        csv_record_id = deal.get('Record Id')
        api_id = deal.get('id')
        
        print(f"📝 Testing update for deal: {deal.get('Deal_Name', 'N/A')}")
        print(f"   CSV Record ID: {csv_record_id}")
        print(f"   API ID:        {api_id}")
        
        # Test ID conversion
        converted_id = zoho_service.normalize_deal_id(csv_record_id)
        conversion_ok = converted_id == api_id
        
        print(f"   Conversion:    {csv_record_id} -> {converted_id}")
        print(f"   Status:        {'✅ Correct' if conversion_ok else '❌ Failed'}")
        
        # Note: We won't actually update the deal to avoid modifying real data
        print("   💡 Update test skipped to avoid modifying real data")
        
    except Exception as e:
        print(f"❌ Error testing deal update: {str(e)}")

async def main():
    """Main test function"""
    
    # Test ID conversion functions
    await test_id_conversion()
    
    # Test live deals with ID conversion
    await test_live_deals_with_ids()
    
    # Test update functionality (without actually updating)
    await test_update_deal_with_csv_id()
    
    print("\n" + "=" * 50)
    print("✅ All ID conversion tests completed!")
    print("\n💡 Summary:")
    print("   - CSV Record IDs have 'zcrm_' prefix")
    print("   - API IDs are the numeric part only")
    print("   - Conversion functions handle both formats")
    print("   - Live deals now include both ID formats")

if __name__ == "__main__":
    asyncio.run(main())
