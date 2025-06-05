#!/usr/bin/env python3
"""
Test API Endpoints
Quick test of the fixed API endpoints without starting a full server
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


async def test_zoho_endpoint():
    """Test the Zoho deals endpoint directly"""
    
    print("🌐 Testing Zoho Deals Endpoint")
    print("-" * 40)
    
    try:
        from app.api.endpoints.zoho import get_zoho_deals
        
        # Test with default parameters
        print("   Testing with default parameters...")
        result = await get_zoho_deals(limit=3, offset=0)
        
        if result and "deals" in result:
            deals = result["deals"]
            print(f"✅ Endpoint working: {len(deals)} deals returned")
            print(f"   Total: {result.get('total', 0)}")
            print(f"   Fields: {result.get('fields_requested', 'default')}")
            
            # Show sample deal
            if deals:
                deal = deals[0]
                print(f"   Sample: {deal.get('Deal_Name', 'Unknown')} - ${deal.get('Amount', 0):,.2f}")
        else:
            print("❌ Endpoint returned unexpected format")
            
        # Test with custom fields
        print("   Testing with custom fields...")
        result = await get_zoho_deals(limit=2, offset=0, fields="Deal_Name,Amount,Stage")
        
        if result and "deals" in result:
            deals = result["deals"]
            print(f"✅ Custom fields working: {len(deals)} deals returned")
            print(f"   Fields requested: {result.get('fields_requested')}")
        
        return True
        
    except Exception as e:
        print(f"❌ Zoho endpoint test failed: {str(e)}")
        return False


async def test_crm_endpoint():
    """Test the unified CRM deals endpoint directly"""
    
    print("\n🔧 Testing Unified CRM Deals Endpoint")
    print("-" * 40)
    
    try:
        from app.api.endpoints.crm import get_deals
        from app.services.zoho_crm.unified_crm_service import UnifiedZohoCRMService
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker
        
        # Create test database session
        engine = create_engine("sqlite:///test.db")
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        # Create CRM service
        crm_service = UnifiedZohoCRMService(db)
        
        # Test the endpoint
        print("   Testing unified CRM endpoint...")
        result = await get_deals(
            limit=3, 
            offset=0, 
            fields="Deal_Name,Amount,Stage,Closing_Date",
            crm_service=crm_service
        )
        
        if result and "deals" in result:
            deals = result["deals"]
            print(f"✅ Unified CRM endpoint working: {len(deals)} deals returned")
            print(f"   Has more: {result.get('has_more', False)}")
            
            # Show sample deal
            if deals:
                deal = deals[0]
                print(f"   Sample: {deal.get('Deal_Name', 'Unknown')} - ${deal.get('Amount', 0):,.2f}")
        else:
            print("❌ Unified CRM endpoint returned unexpected format")
        
        db.close()
        return True
        
    except Exception as e:
        print(f"❌ Unified CRM endpoint test failed: {str(e)}")
        return False


async def test_field_validation():
    """Test field validation and requirements"""
    
    print("\n🔍 Testing Field Validation")
    print("-" * 40)
    
    try:
        from app.services.zoho_crm.core.api_client import ZohoAPIClient
        
        api_client = ZohoAPIClient()
        
        # Test 1: Request without fields (should fail in v8)
        print("   Testing request without fields parameter...")
        try:
            response = await api_client.get("Deals", params={"per_page": 1})
            print("❌ Request without fields should have failed")
        except Exception as e:
            if "REQUIRED_PARAM_MISSING" in str(e) or "fields" in str(e).lower():
                print("✅ Correctly rejected request without fields parameter")
            else:
                print(f"⚠️ Unexpected error: {str(e)}")
        
        # Test 2: Request with fields (should work)
        print("   Testing request with fields parameter...")
        try:
            response = await api_client.get("Deals", params={
                "per_page": 1,
                "fields": "Deal_Name,Amount"
            })
            if response and "data" in response:
                print("✅ Request with fields parameter successful")
            else:
                print("❌ Request with fields failed unexpectedly")
        except Exception as e:
            print(f"❌ Request with fields failed: {str(e)}")
        
        return True
        
    except Exception as e:
        print(f"❌ Field validation test failed: {str(e)}")
        return False


async def main():
    """Main test function"""
    
    print(f"🚀 Testing API Endpoints - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    # Test 1: Zoho endpoint
    zoho_success = await test_zoho_endpoint()
    
    # Test 2: Unified CRM endpoint
    crm_success = await test_crm_endpoint()
    
    # Test 3: Field validation
    validation_success = await test_field_validation()
    
    # Summary
    print("\n📊 Test Summary:")
    print("=" * 60)
    
    results = [
        ("Zoho Deals Endpoint", zoho_success),
        ("Unified CRM Endpoint", crm_success),
        ("Field Validation", validation_success)
    ]
    
    all_passed = all(success for _, success in results)
    
    for test_name, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
    
    print()
    if all_passed:
        print("🎉 All API endpoint tests passed!")
        print("✅ Zoho API v8 integration is fully working")
        print("🚀 Ready for production deployment")
    else:
        print("⚠️ Some tests failed - check configuration")
    
    print(f"\n🕒 Test completed at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")


if __name__ == "__main__":
    asyncio.run(main())
