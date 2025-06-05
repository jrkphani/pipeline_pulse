#!/usr/bin/env python3
"""
Quick Test Runner for Pipeline Pulse Zoho Integration
Simplified test execution with immediate results
"""

import asyncio
import os
import sys
import time
from datetime import datetime

# Add backend to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

# Load environment variables
from dotenv import load_dotenv
backend_env_path = os.path.join(os.path.dirname(__file__), '..', 'backend', '.env')
load_dotenv(backend_env_path)


async def test_authentication():
    """Test authentication and token management"""
    print("🔐 Testing Authentication...")
    
    try:
        from app.services.zoho_crm.core.auth_manager import ZohoAuthManager
        
        auth_manager = ZohoAuthManager()
        
        # Test token refresh
        token = await auth_manager.get_access_token(force_refresh=True)
        
        if not token:
            print("   ❌ Token refresh failed")
            return False
        
        print(f"   ✅ Token refresh successful (length: {len(token)})")
        
        # Test connection validation
        validation = await auth_manager.validate_connection()
        
        if validation.get("authenticated"):
            org_info = validation.get("org_info", {})
            if isinstance(org_info, dict) and "org" in org_info:
                org = org_info["org"][0] if org_info["org"] else {}
                company_name = org.get("company_name", "Unknown")
                print(f"   ✅ Connection validated - Organization: {company_name}")
            else:
                print("   ✅ Connection validated")
            return True
        else:
            print(f"   ❌ Connection validation failed: {validation.get('error', 'Unknown')}")
            return False
            
    except Exception as e:
        print(f"   ❌ Authentication test failed: {str(e)}")
        return False


async def test_api_connectivity():
    """Test API connectivity and endpoints"""
    print("\n🌐 Testing API Connectivity...")
    
    try:
        from app.services.zoho_crm.core.api_client import ZohoAPIClient
        
        api_client = ZohoAPIClient()
        
        # Test organization endpoint
        start_time = time.time()
        org_response = await api_client.get("org")
        org_time = (time.time() - start_time) * 1000
        
        if isinstance(org_response, dict) and "org" in org_response:
            print(f"   ✅ Organization endpoint working ({org_time:.0f}ms)")
        else:
            print("   ❌ Organization endpoint failed")
            return False
        
        # Test user endpoint
        start_time = time.time()
        user_response = await api_client.get("users?type=CurrentUser")
        user_time = (time.time() - start_time) * 1000
        
        if isinstance(user_response, dict) and "users" in user_response:
            user = user_response["users"][0] if user_response["users"] else {}
            print(f"   ✅ User endpoint working ({user_time:.0f}ms) - User: {user.get('full_name', 'Unknown')}")
        else:
            print("   ❌ User endpoint failed")
            return False
        
        return True
        
    except Exception as e:
        print(f"   ❌ API connectivity test failed: {str(e)}")
        return False


async def test_data_retrieval():
    """Test data retrieval with v8 API requirements"""
    print("\n📊 Testing Data Retrieval...")
    
    try:
        from app.services.zoho_crm.core.api_client import ZohoAPIClient
        
        api_client = ZohoAPIClient()
        
        # Test deals retrieval with fields parameter
        fields = ["Deal_Name", "Amount", "Stage", "Closing_Date", "Account_Name"]
        start_time = time.time()
        deals_response = await api_client.get("Deals", params={
            "per_page": 10,
            "fields": ",".join(fields)
        })
        deals_time = (time.time() - start_time) * 1000
        
        if isinstance(deals_response, dict) and "data" in deals_response:
            deals = deals_response["data"]
            print(f"   ✅ Deals retrieval working ({deals_time:.0f}ms) - {len(deals)} deals retrieved")
            
            if deals:
                sample_deal = deals[0]
                deal_name = sample_deal.get("Deal_Name", "Unknown")
                amount = sample_deal.get("Amount", 0)
                stage = sample_deal.get("Stage", "Unknown")
                print(f"   📝 Sample deal: {deal_name} - ${amount:,.2f} ({stage})")
            
            return True
        else:
            print("   ❌ Deals retrieval failed - invalid response format")
            return False
        
    except Exception as e:
        print(f"   ❌ Data retrieval test failed: {str(e)}")
        return False


async def test_field_validation():
    """Test v8 API field requirements"""
    print("\n🔍 Testing Field Validation...")
    
    try:
        from app.services.zoho_crm.core.api_client import ZohoAPIClient
        
        api_client = ZohoAPIClient()
        
        # Test 1: Request without fields (should fail)
        try:
            await api_client.get("Deals", params={"per_page": 1})
            print("   ❌ Request without fields should have failed")
            return False
        except Exception as e:
            if "REQUIRED_PARAM_MISSING" in str(e) or "fields" in str(e).lower():
                print("   ✅ Correctly rejected request without fields parameter")
            else:
                print(f"   ⚠️ Unexpected error without fields: {str(e)}")
        
        # Test 2: Request with fields (should work)
        try:
            response = await api_client.get("Deals", params={
                "per_page": 1,
                "fields": "Deal_Name,Amount"
            })
            if response and "data" in response:
                print("   ✅ Request with fields parameter successful")
                return True
            else:
                print("   ❌ Request with fields failed unexpectedly")
                return False
        except Exception as e:
            print(f"   ❌ Request with fields failed: {str(e)}")
            return False
        
    except Exception as e:
        print(f"   ❌ Field validation test failed: {str(e)}")
        return False


async def test_unified_service():
    """Test unified CRM service"""
    print("\n🔧 Testing Unified CRM Service...")
    
    try:
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker
        from app.services.zoho_crm.unified_crm_service import UnifiedZohoCRMService
        
        # Create test database session
        engine = create_engine("sqlite:///test_quick.db")
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        crm_service = UnifiedZohoCRMService(db)
        
        # Test connection validation
        validation = await crm_service.validate_connection()
        
        if not validation.get("authenticated"):
            print(f"   ❌ Service connection validation failed: {validation.get('error', 'Unknown')}")
            db.close()
            return False
        
        print("   ✅ Service connection validation successful")
        
        # Test deal fetching
        deals = await crm_service.get_deals(limit=5, fields=["Deal_Name", "Amount", "Stage"])
        
        if deals:
            print(f"   ✅ Service deal fetching working - {len(deals)} deals retrieved")
            db.close()
            return True
        else:
            print("   ⚠️ Service deal fetching returned no deals")
            db.close()
            return True  # Still pass if no deals but no error
        
    except Exception as e:
        print(f"   ❌ Unified service test failed: {str(e)}")
        return False


async def test_api_endpoints():
    """Test API endpoints"""
    print("\n🌐 Testing API Endpoints...")
    
    try:
        from app.api.endpoints.zoho import get_zoho_deals
        
        # Test Zoho deals endpoint
        result = await get_zoho_deals(limit=3, offset=0, fields="Deal_Name,Amount,Stage")
        
        if "deals" in result and isinstance(result["deals"], list):
            deals_count = len(result["deals"])
            print(f"   ✅ Zoho deals endpoint working - {deals_count} deals returned")
            print(f"   📊 Fields requested: {result.get('fields_requested', 'unknown')}")
            return True
        else:
            print("   ❌ Zoho deals endpoint failed - invalid response format")
            return False
        
    except Exception as e:
        print(f"   ❌ API endpoints test failed: {str(e)}")
        return False


async def main():
    """Run all quick tests"""
    
    print(f"🚀 Starting Quick Test Suite - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Environment: local-testing branch")
    print("=" * 70)
    
    # Run tests
    tests = [
        ("Authentication", test_authentication),
        ("API Connectivity", test_api_connectivity),
        ("Data Retrieval", test_data_retrieval),
        ("Field Validation", test_field_validation),
        ("Unified Service", test_unified_service),
        ("API Endpoints", test_api_endpoints)
    ]
    
    results = []
    start_time = time.time()
    
    for test_name, test_func in tests:
        try:
            result = await test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"   ❌ {test_name} test crashed: {str(e)}")
            results.append((test_name, False))
    
    total_time = time.time() - start_time
    
    # Print summary
    print("\n" + "=" * 70)
    print("📊 QUICK TEST RESULTS SUMMARY")
    print("=" * 70)
    
    passed_tests = sum(1 for _, result in results if result)
    total_tests = len(results)
    pass_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
    
    print(f"Total Tests: {total_tests}")
    print(f"Passed: {passed_tests}")
    print(f"Failed: {total_tests - passed_tests}")
    print(f"Pass Rate: {pass_rate:.1f}%")
    print(f"Total Time: {total_time:.2f}s")
    print()
    
    print("📋 Individual Results:")
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"   {status} {test_name}")
    
    print()
    
    # Overall status
    if pass_rate == 100:
        print("🎉 STATUS: ✅ EXCELLENT - All tests passed!")
        print("🚀 Zoho API v8 integration is fully functional")
        print("✅ Ready for development and production deployment")
    elif pass_rate >= 80:
        print("🎯 STATUS: ⚠️ GOOD - Most tests passed")
        print("💡 Minor issues to address before production")
    else:
        print("🚨 STATUS: ❌ NEEDS ATTENTION - Multiple test failures")
        print("🔧 Significant issues require resolution")
    
    print("=" * 70)
    print(f"🕒 Test completed at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")


if __name__ == "__main__":
    asyncio.run(main())
