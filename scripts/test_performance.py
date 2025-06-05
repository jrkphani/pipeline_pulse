#!/usr/bin/env python3
"""
Performance & Rate Limiting Tests
Test API performance, rate limiting behavior, and pagination performance
"""

import asyncio
import time
import os
import sys

# Add backend to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

# Load environment variables
from dotenv import load_dotenv
backend_env_path = os.path.join(os.path.dirname(__file__), '..', 'backend', '.env')
load_dotenv(backend_env_path)


async def test_response_times():
    """Test API response times"""
    try:
        from app.services.zoho_crm.core.api_client import ZohoAPIClient
        
        api_client = ZohoAPIClient()
        
        # Test single deal fetch
        start_time = time.time()
        response = await api_client.get("Deals", params={
            "per_page": 1,
            "fields": "Deal_Name,Amount"
        })
        single_deal_time = (time.time() - start_time) * 1000
        
        # Test multiple deals fetch
        start_time = time.time()
        response = await api_client.get("Deals", params={
            "per_page": 50,
            "fields": "Deal_Name,Amount,Stage"
        })
        multiple_deals_time = (time.time() - start_time) * 1000
        
        warnings = []
        if single_deal_time > 1000:
            warnings.append(f"Single deal fetch slow: {single_deal_time:.0f}ms")
        if multiple_deals_time > 3000:
            warnings.append(f"Multiple deals fetch slow: {multiple_deals_time:.0f}ms")
        
        return {
            "passed": single_deal_time < 2000 and multiple_deals_time < 5000,
            "details": {
                "single_deal_time_ms": round(single_deal_time, 2),
                "multiple_deals_time_ms": round(multiple_deals_time, 2),
                "performance_target_met": single_deal_time < 1000 and multiple_deals_time < 3000
            },
            "warnings": warnings
        }
        
    except Exception as e:
        return {
            "passed": False,
            "details": {"error": str(e)},
            "warnings": []
        }


async def test_rate_limiting():
    """Test rate limiting behavior"""
    try:
        from app.services.zoho_crm.core.api_client import ZohoAPIClient
        
        api_client = ZohoAPIClient()
        
        # Make several requests to test rate limiting
        request_times = []
        successful_requests = 0
        
        for i in range(5):
            try:
                start_time = time.time()
                await api_client.get("org")
                request_time = (time.time() - start_time) * 1000
                request_times.append(request_time)
                successful_requests += 1
            except Exception as e:
                if "rate" in str(e).lower() or "limit" in str(e).lower():
                    break
        
        avg_response_time = sum(request_times) / len(request_times) if request_times else 0
        
        return {
            "passed": successful_requests >= 3,
            "details": {
                "successful_requests": successful_requests,
                "total_attempts": 5,
                "average_response_time_ms": round(avg_response_time, 2),
                "rate_limit_encountered": successful_requests < 5
            },
            "warnings": ["Rate limiting detected" if successful_requests < 5 else ""]
        }
        
    except Exception as e:
        return {
            "passed": False,
            "details": {"error": str(e)},
            "warnings": []
        }


async def run_performance_tests(test_suite):
    """Run all performance tests"""
    
    tests = [
        (test_response_times, "Response Times", "performance"),
        (test_rate_limiting, "Rate Limiting", "performance")
    ]
    
    for test_func, test_name, category in tests:
        await test_suite.run_test(test_func, test_name, category)


async def main():
    from run_comprehensive_tests import TestSuite
    suite = TestSuite(verbose=True)
    await run_performance_tests(suite)
    suite.print_summary()


if __name__ == "__main__":
    asyncio.run(main())
