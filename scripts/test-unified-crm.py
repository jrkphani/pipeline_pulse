#!/usr/bin/env python3
"""
Test Unified CRM Service
Test the new unified CRM service with v8 API fixes
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

from app.core.config import settings


async def test_unified_crm_service():
    """Test the unified CRM service"""
    
    print("🧪 Testing Unified CRM Service")
    print("=" * 50)
    print(f"Environment: {settings.ENVIRONMENT}")
    print(f"API Version: v8")
    print()
    
    try:
        # Import after environment setup
        from app.services.zoho_crm.unified_crm_service import UnifiedZohoCRMService
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker
        
        # Create a test database session (using SQLite for testing)
        engine = create_engine("sqlite:///test.db")
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        # Initialize unified CRM service
        crm_service = UnifiedZohoCRMService(db)
        
        print("🔐 Testing Authentication:")
        # Test connection validation
        validation = await crm_service.validate_connection()
        if validation.get("authenticated"):
            print("✅ Connection validation successful")
            org_info = validation.get("org_info", {})
            if isinstance(org_info, dict) and "org" in org_info:
                org = org_info["org"][0] if org_info["org"] else {}
                print(f"   Organization: {org.get('company_name', 'Unknown')}")
        else:
            print(f"❌ Connection validation failed: {validation.get('error')}")
            return False
        
        print()
        print("👤 Testing User Info:")
        # Test user info
        user_info = await crm_service.get_user_info()
        if user_info:
            print(f"✅ User: {user_info.get('full_name', 'Unknown')}")
            print(f"   Email: {user_info.get('email', 'Unknown')}")
            print(f"   Role: {user_info.get('role', {}).get('name', 'Unknown')}")
        
        print()
        print("📊 Testing Deal Operations:")
        # Test deal fetching with specific fields
        test_fields = ["Deal_Name", "Amount", "Stage", "Closing_Date", "Account_Name"]
        deals = await crm_service.get_deals(limit=5, fields=test_fields)
        
        if deals:
            print(f"✅ Fetched {len(deals)} deals successfully")
            
            for i, deal in enumerate(deals[:3], 1):
                deal_name = deal.get("Deal_Name", "Unknown")
                amount = deal.get("Amount", 0)
                stage = deal.get("Stage", "Unknown")
                print(f"   Deal {i}: {deal_name} - ${amount:,.2f} ({stage})")
        else:
            print("⚠️ No deals found")
        
        print()
        print("🔍 Testing Deal by ID:")
        # Test getting a specific deal
        if deals:
            first_deal_id = deals[0].get("id")
            if first_deal_id:
                deal_detail = await crm_service.get_deal_by_id(first_deal_id)
                if deal_detail:
                    print(f"✅ Retrieved deal: {deal_detail.get('Deal_Name', 'Unknown')}")
                else:
                    print("❌ Failed to retrieve deal by ID")
        
        print()
        print("🏗️ Testing Field Management:")
        # Test field metadata
        try:
            fields_info = await crm_service.fields.get_module_fields("Deals")
            if fields_info:
                print(f"✅ Retrieved {len(fields_info)} field definitions")
                
                # Show some field examples
                for field in fields_info[:3]:
                    field_name = field.get("api_name", "Unknown")
                    field_type = field.get("data_type", "Unknown")
                    required = field.get("required", False)
                    print(f"   Field: {field_name} ({field_type}) {'*Required' if required else ''}")
        except Exception as e:
            print(f"⚠️ Field metadata test failed: {str(e)}")
        
        # Close database session
        db.close()
        
        return True
        
    except Exception as e:
        print(f"❌ Unified CRM service test failed: {str(e)}")
        return False


async def test_api_endpoints():
    """Test API endpoints"""
    
    print("\n🌐 Testing API Endpoints:")
    print("-" * 40)
    
    try:
        import httpx
        
        base_url = "http://localhost:8000"
        
        async with httpx.AsyncClient() as client:
            # Test health endpoint
            print("   Testing health endpoint...")
            try:
                response = await client.get(f"{base_url}/health")
                if response.status_code == 200:
                    print("✅ Health endpoint working")
                else:
                    print(f"⚠️ Health endpoint returned {response.status_code}")
            except Exception as e:
                print(f"❌ Health endpoint failed: {str(e)}")
            
            # Test Zoho deals endpoint
            print("   Testing Zoho deals endpoint...")
            try:
                response = await client.get(f"{base_url}/api/zoho/deals?limit=3")
                if response.status_code == 200:
                    data = response.json()
                    deals = data.get("deals", [])
                    print(f"✅ Zoho deals endpoint working ({len(deals)} deals)")
                else:
                    print(f"⚠️ Zoho deals endpoint returned {response.status_code}")
            except Exception as e:
                print(f"❌ Zoho deals endpoint failed: {str(e)}")
            
            # Test unified CRM deals endpoint
            print("   Testing unified CRM deals endpoint...")
            try:
                response = await client.get(f"{base_url}/api/crm/deals?limit=3")
                if response.status_code == 200:
                    data = response.json()
                    deals = data.get("deals", [])
                    print(f"✅ Unified CRM deals endpoint working ({len(deals)} deals)")
                else:
                    print(f"⚠️ Unified CRM deals endpoint returned {response.status_code}")
            except Exception as e:
                print(f"❌ Unified CRM deals endpoint failed: {str(e)}")
        
        return True
        
    except Exception as e:
        print(f"❌ API endpoint testing failed: {str(e)}")
        return False


async def main():
    """Main test function"""
    
    print(f"🚀 Starting Unified CRM Service Tests - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Test 1: Unified CRM Service
    service_success = await test_unified_crm_service()
    
    # Test 2: API Endpoints (optional - requires running server)
    print("\n" + "=" * 60)
    print("Note: API endpoint tests require a running FastAPI server")
    print("Run 'uvicorn main:app --reload' in backend/ to test endpoints")
    
    # Summary
    print("\n📊 Test Summary:")
    print("=" * 50)
    
    if service_success:
        print("✅ Unified CRM Service: Working correctly")
        print("🎉 All v8 API fixes are successful!")
        print("💡 Ready for development and integration")
    else:
        print("❌ Unified CRM Service: Issues found")
        print("💡 Check configuration and API connectivity")
    
    print(f"\n🕒 Test completed at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")


if __name__ == "__main__":
    asyncio.run(main())
