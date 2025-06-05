#!/usr/bin/env python3
"""
Error Handling & Edge Cases Tests
Test various error scenarios and edge cases
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


async def test_invalid_endpoints():
    """Test invalid endpoint handling"""
    try:
        from app.services.zoho_crm.core.api_client import ZohoAPIClient
        
        api_client = ZohoAPIClient()
        
        # Test invalid endpoint
        try:
            await api_client.get("invalid_endpoint_12345")
            return {
                "passed": False,
                "details": {"error": "Invalid endpoint should have failed"},
                "warnings": []
            }
        except Exception as e:
            error_str = str(e)
            if "INVALID_URL_PATTERN" in error_str or "NOT_FOUND" in error_str:
                return {
                    "passed": True,
                    "details": {
                        "error_properly_handled": True,
                        "error_type": "INVALID_URL_PATTERN" if "INVALID_URL_PATTERN" in error_str else "NOT_FOUND"
                    },
                    "warnings": []
                }
            else:
                return {
                    "passed": True,
                    "details": {
                        "error_properly_handled": True,
                        "error_type": "OTHER",
                        "error_message": error_str
                    },
                    "warnings": [f"Unexpected error format: {error_str}"]
                }
        
    except Exception as e:
        return {
            "passed": False,
            "details": {"error": str(e)},
            "warnings": []
        }


async def test_malformed_requests():
    """Test malformed request handling"""
    try:
        from app.services.zoho_crm.core.api_client import ZohoAPIClient
        
        api_client = ZohoAPIClient()
        
        # Test request without required fields parameter
        try:
            await api_client.get("Deals", params={"per_page": 1})
            return {
                "passed": False,
                "details": {"error": "Request without fields should have failed"},
                "warnings": []
            }
        except Exception as e:
            error_str = str(e)
            if "REQUIRED_PARAM_MISSING" in error_str or "fields" in error_str.lower():
                return {
                    "passed": True,
                    "details": {
                        "error_properly_handled": True,
                        "error_type": "REQUIRED_PARAM_MISSING"
                    },
                    "warnings": []
                }
            else:
                return {
                    "passed": True,
                    "details": {
                        "error_properly_handled": True,
                        "error_type": "OTHER",
                        "error_message": error_str
                    },
                    "warnings": [f"Unexpected error format: {error_str}"]
                }
        
    except Exception as e:
        return {
            "passed": False,
            "details": {"error": str(e)},
            "warnings": []
        }


async def run_error_handling_tests(test_suite):
    """Run all error handling tests"""
    
    tests = [
        (test_invalid_endpoints, "Invalid Endpoints", "error_handling"),
        (test_malformed_requests, "Malformed Requests", "error_handling")
    ]
    
    for test_func, test_name, category in tests:
        await test_suite.run_test(test_func, test_name, category)


async def main():
    from run_comprehensive_tests import TestSuite
    suite = TestSuite(verbose=True)
    await run_error_handling_tests(suite)
    suite.print_summary()


if __name__ == "__main__":
    asyncio.run(main())
