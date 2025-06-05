#!/usr/bin/env python3
"""
CRUD Operations Tests
Test read operations, bulk operations, and metadata operations
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


async def test_read_operations():
    """Test all read operations comprehensively"""
    try:
        from app.services.zoho_crm.core.api_client import ZohoAPIClient
        
        api_client = ZohoAPIClient()
        
        # Test get all deals
        response = await api_client.get("Deals", params={
            "per_page": 20,
            "fields": "Deal_Name,Amount,Stage,Account_Name"
        })
        
        deals = response.get("data", []) if isinstance(response, dict) else []
        
        # Test get deal by ID if we have deals
        deal_by_id = None
        if deals:
            first_deal_id = deals[0].get("id")
            if first_deal_id:
                deal_response = await api_client.get(f"Deals/{first_deal_id}", params={
                    "fields": "Deal_Name,Amount,Stage"
                })
                deal_by_id = deal_response.get("data", [{}])[0] if isinstance(deal_response, dict) else {}
        
        return {
            "passed": len(deals) > 0 and bool(deal_by_id),
            "details": {
                "total_deals_retrieved": len(deals),
                "deal_by_id_successful": bool(deal_by_id),
                "sample_deal": deals[0] if deals else {},
                "retrieved_deal": deal_by_id or {}
            },
            "warnings": [] if len(deals) > 10 else ["Low number of deals retrieved"]
        }
        
    except Exception as e:
        return {
            "passed": False,
            "details": {"error": str(e)},
            "warnings": []
        }


async def test_metadata_operations():
    """Test metadata and settings retrieval"""
    try:
        from app.services.zoho_crm.core.api_client import ZohoAPIClient
        
        api_client = ZohoAPIClient()
        
        # Test module list
        modules_response = await api_client.get("settings/modules")
        modules = modules_response.get("modules", []) if isinstance(modules_response, dict) else []
        
        # Test deal fields metadata
        fields_response = await api_client.get("settings/fields", params={"module": "Deals"})
        fields = fields_response.get("fields", []) if isinstance(fields_response, dict) else []
        
        return {
            "passed": len(modules) > 0 and len(fields) > 0,
            "details": {
                "modules_count": len(modules),
                "deal_fields_count": len(fields),
                "sample_modules": [m.get("api_name") for m in modules[:5]] if modules else [],
                "sample_fields": [f.get("api_name") for f in fields[:5]] if fields else []
            },
            "warnings": []
        }
        
    except Exception as e:
        return {
            "passed": False,
            "details": {"error": str(e)},
            "warnings": []
        }


async def run_crud_operations_tests(test_suite):
    """Run all CRUD operations tests"""
    
    tests = [
        (test_read_operations, "Read Operations", "crud_operations"),
        (test_metadata_operations, "Metadata Operations", "crud_operations")
    ]
    
    for test_func, test_name, category in tests:
        await test_suite.run_test(test_func, test_name, category)


async def main():
    from run_comprehensive_tests import TestSuite
    suite = TestSuite(verbose=True)
    await run_crud_operations_tests(suite)
    suite.print_summary()


if __name__ == "__main__":
    asyncio.run(main())
