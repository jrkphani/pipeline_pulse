#!/usr/bin/env python3
"""
Integration & End-to-End Tests
Test integration with Pipeline Pulse features
"""

import asyncio
import os
import sys

# Add backend to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

# Load environment variables
from dotenv import load_dotenv
backend_env_path = os.path.join(os.path.dirname(__file__), '..', 'backend', '.env')
load_dotenv(backend_env_path)


async def test_unified_crm_service():
    """Test unified CRM service integration"""
    try:
        # Create a mock database session for testing
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker
        
        engine = create_engine("sqlite:///test_integration.db")
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        from app.services.zoho_crm.unified_crm_service import UnifiedZohoCRMService
        
        crm_service = UnifiedZohoCRMService(db)
        
        # Test connection validation
        validation = await crm_service.validate_connection()
        
        # Test deal fetching
        deals = await crm_service.get_deals(limit=5, fields=["Deal_Name", "Amount", "Stage"])
        
        db.close()
        
        return {
            "passed": validation.get("authenticated", False) and len(deals) > 0,
            "details": {
                "connection_validated": validation.get("authenticated", False),
                "deals_retrieved": len(deals),
                "organization": validation.get("org_info", {}).get("org", [{}])[0].get("company_name", "Unknown") if validation.get("org_info") else "Unknown"
            },
            "warnings": [] if len(deals) > 0 else ["No deals retrieved"]
        }
        
    except Exception as e:
        return {
            "passed": False,
            "details": {"error": str(e)},
            "warnings": []
        }


async def test_api_endpoints():
    """Test API endpoint integration"""
    try:
        from app.api.endpoints.zoho import get_zoho_deals
        
        # Test Zoho deals endpoint
        result = await get_zoho_deals(limit=3, offset=0, fields="Deal_Name,Amount,Stage")
        
        return {
            "passed": "deals" in result and len(result["deals"]) > 0,
            "details": {
                "endpoint_working": "deals" in result,
                "deals_returned": len(result.get("deals", [])),
                "fields_requested": result.get("fields_requested", "unknown")
            },
            "warnings": [] if len(result.get("deals", [])) > 0 else ["No deals returned from endpoint"]
        }
        
    except Exception as e:
        return {
            "passed": False,
            "details": {"error": str(e)},
            "warnings": []
        }


async def run_integration_tests(test_suite):
    """Run all integration tests"""
    
    tests = [
        (test_unified_crm_service, "Unified CRM Service", "integration"),
        (test_api_endpoints, "API Endpoints", "integration")
    ]
    
    for test_func, test_name, category in tests:
        await test_suite.run_test(test_func, test_name, category)


async def main():
    from run_comprehensive_tests import TestSuite
    suite = TestSuite(verbose=True)
    await run_integration_tests(suite)
    suite.print_summary()


if __name__ == "__main__":
    asyncio.run(main())
