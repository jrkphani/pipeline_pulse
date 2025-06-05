#!/usr/bin/env python3
"""
API Connectivity & Network Tests
Test endpoint accessibility, API version compatibility, and network resilience
"""

import asyncio
import httpx
import time
import os
import sys
from datetime import datetime

# Add backend to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

# Load environment variables
from dotenv import load_dotenv
backend_env_path = os.path.join(os.path.dirname(__file__), '..', 'backend', '.env')
load_dotenv(backend_env_path)

from app.core.config import settings


async def test_endpoint_accessibility():
    """Test all critical Zoho API endpoints"""
    try:
        from app.services.zoho_crm.core.api_client import ZohoAPIClient
        
        api_client = ZohoAPIClient()
        
        # Define critical endpoints to test
        endpoints = [
            ("org", {}, "Organization Info"),
            ("users?type=CurrentUser", {}, "Current User"),
            ("Deals", {"per_page": 1, "fields": "Deal_Name"}, "Deals Module"),
            ("Accounts", {"per_page": 1, "fields": "Account_Name"}, "Accounts Module"),
            ("settings/modules", {}, "Module Settings"),
            ("settings/fields?module=Deals", {}, "Deal Fields")
        ]
        
        endpoint_results = {}
        total_response_time = 0
        successful_endpoints = 0
        warnings = []
        
        for endpoint, params, description in endpoints:
            try:
                start_time = time.time()
                response = await api_client.get(endpoint, params=params)
                response_time = (time.time() - start_time) * 1000  # Convert to ms
                
                endpoint_results[endpoint] = {
                    "accessible": True,
                    "description": description,
                    "response_time_ms": round(response_time, 2),
                    "response_keys": list(response.keys()) if isinstance(response, dict) else [],
                    "status": "success"
                }
                
                total_response_time += response_time
                successful_endpoints += 1
                
                # Check for slow responses
                if response_time > 1000:  # > 1 second
                    warnings.append(f"{description} slow response: {response_time:.0f}ms")
                
            except Exception as e:
                endpoint_results[endpoint] = {
                    "accessible": False,
                    "description": description,
                    "error": str(e),
                    "status": "failed"
                }
                warnings.append(f"{description} failed: {str(e)}")
        
        average_response_time = total_response_time / successful_endpoints if successful_endpoints > 0 else 0
        
        return {
            "passed": successful_endpoints >= len(endpoints) * 0.8,  # 80% success rate
            "details": {
                "endpoints": endpoint_results,
                "successful_endpoints": successful_endpoints,
                "total_endpoints": len(endpoints),
                "average_response_time_ms": round(average_response_time, 2),
                "success_rate": (successful_endpoints / len(endpoints)) * 100
            },
            "warnings": warnings
        }
        
    except Exception as e:
        return {
            "passed": False,
            "details": {"error": str(e)},
            "warnings": []
        }


async def test_api_version_compatibility():
    """Test v8 API specific requirements"""
    try:
        from app.services.zoho_crm.core.api_client import ZohoAPIClient
        
        api_client = ZohoAPIClient()
        
        compatibility_results = {}
        warnings = []
        
        # Test 1: v8 endpoint accessibility
        try:
            response = await api_client.get("org")
            compatibility_results["v8_endpoint_accessible"] = True
        except Exception as e:
            compatibility_results["v8_endpoint_accessible"] = False
            warnings.append(f"v8 endpoint not accessible: {str(e)}")
        
        # Test 2: Fields parameter requirement
        try:
            # This should fail without fields parameter
            await api_client.get("Deals", params={"per_page": 1})
            compatibility_results["fields_parameter_enforced"] = False
            warnings.append("Fields parameter not enforced - unexpected")
        except Exception as e:
            if "REQUIRED_PARAM_MISSING" in str(e) or "fields" in str(e).lower():
                compatibility_results["fields_parameter_enforced"] = True
            else:
                compatibility_results["fields_parameter_enforced"] = False
                warnings.append(f"Unexpected error without fields: {str(e)}")
        
        # Test 3: Fields parameter working
        try:
            response = await api_client.get("Deals", params={
                "per_page": 1,
                "fields": "Deal_Name,Amount"
            })
            compatibility_results["fields_parameter_working"] = True
            compatibility_results["sample_response_keys"] = list(response.keys()) if isinstance(response, dict) else []
        except Exception as e:
            compatibility_results["fields_parameter_working"] = False
            warnings.append(f"Fields parameter not working: {str(e)}")
        
        # Test 4: Response format validation
        try:
            response = await api_client.get("org")
            if isinstance(response, dict) and "org" in response:
                compatibility_results["response_format_v8"] = True
            else:
                compatibility_results["response_format_v8"] = False
                warnings.append("Response format not v8 compatible")
        except Exception as e:
            compatibility_results["response_format_v8"] = False
            warnings.append(f"Response format test failed: {str(e)}")
        
        # Test 5: Error message format
        try:
            await api_client.get("invalid_endpoint_12345")
            compatibility_results["error_messages_v8"] = False
        except Exception as e:
            error_str = str(e)
            if "INVALID_URL_PATTERN" in error_str or "NOT_FOUND" in error_str:
                compatibility_results["error_messages_v8"] = True
            else:
                compatibility_results["error_messages_v8"] = False
                warnings.append(f"Unexpected error format: {error_str}")
        
        # Check API URL configuration
        base_url = settings.ZOHO_BASE_URL
        compatibility_results["api_url_v8"] = "/v8/" in base_url if base_url else False
        
        if not compatibility_results["api_url_v8"]:
            warnings.append("API URL not configured for v8")
        
        # Overall compatibility score
        compatibility_checks = [
            "v8_endpoint_accessible",
            "fields_parameter_enforced", 
            "fields_parameter_working",
            "response_format_v8",
            "api_url_v8"
        ]
        
        passed_checks = sum(1 for check in compatibility_checks if compatibility_results.get(check, False))
        compatibility_score = (passed_checks / len(compatibility_checks)) * 100
        
        return {
            "passed": compatibility_score >= 80,  # 80% compatibility required
            "details": {
                "compatibility_results": compatibility_results,
                "compatibility_score": compatibility_score,
                "passed_checks": passed_checks,
                "total_checks": len(compatibility_checks)
            },
            "warnings": warnings
        }
        
    except Exception as e:
        return {
            "passed": False,
            "details": {"error": str(e)},
            "warnings": []
        }


async def test_network_resilience():
    """Test network timeout and retry mechanisms"""
    try:
        base_url = settings.ZOHO_BASE_URL
        accounts_url = settings.ZOHO_ACCOUNTS_URL
        
        resilience_results = {}
        warnings = []
        
        # Test 1: Normal request timing
        try:
            start_time = time.time()
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(f"{base_url}/org")
            normal_response_time = (time.time() - start_time) * 1000
            
            resilience_results["normal_request"] = {
                "successful": response.status_code == 200,
                "response_time_ms": round(normal_response_time, 2),
                "status_code": response.status_code
            }
            
        except Exception as e:
            resilience_results["normal_request"] = {
                "successful": False,
                "error": str(e)
            }
            warnings.append(f"Normal request failed: {str(e)}")
        
        # Test 2: DNS resolution
        try:
            import socket
            
            # Test base URL domain
            base_domain = base_url.replace("https://", "").replace("http://", "").split("/")[0]
            socket.gethostbyname(base_domain)
            
            # Test accounts URL domain  
            accounts_domain = accounts_url.replace("https://", "").replace("http://", "").split("/")[0]
            socket.gethostbyname(accounts_domain)
            
            resilience_results["dns_resolution"] = {
                "base_domain_resolved": True,
                "accounts_domain_resolved": True,
                "base_domain": base_domain,
                "accounts_domain": accounts_domain
            }
            
        except Exception as e:
            resilience_results["dns_resolution"] = {
                "base_domain_resolved": False,
                "accounts_domain_resolved": False,
                "error": str(e)
            }
            warnings.append(f"DNS resolution failed: {str(e)}")
        
        # Test 3: SSL certificate validation
        try:
            import ssl
            import socket
            
            context = ssl.create_default_context()
            
            # Check base URL SSL
            base_domain = base_url.replace("https://", "").replace("http://", "").split("/")[0]
            with socket.create_connection((base_domain, 443), timeout=10) as sock:
                with context.wrap_socket(sock, server_hostname=base_domain) as ssock:
                    cert = ssock.getpeercert()
                    
            resilience_results["ssl_certificate"] = {
                "valid": True,
                "subject": dict(x[0] for x in cert['subject']),
                "issuer": dict(x[0] for x in cert['issuer']),
                "not_after": cert['notAfter']
            }
            
        except Exception as e:
            resilience_results["ssl_certificate"] = {
                "valid": False,
                "error": str(e)
            }
            warnings.append(f"SSL certificate check failed: {str(e)}")
        
        # Test 4: Timeout handling
        try:
            start_time = time.time()
            async with httpx.AsyncClient(timeout=1.0) as client:  # Very short timeout
                try:
                    response = await client.get(f"{base_url}/org")
                    timeout_test_time = (time.time() - start_time) * 1000
                    
                    resilience_results["timeout_handling"] = {
                        "timeout_occurred": False,
                        "response_time_ms": round(timeout_test_time, 2),
                        "note": "Request completed within timeout"
                    }
                except httpx.TimeoutException:
                    resilience_results["timeout_handling"] = {
                        "timeout_occurred": True,
                        "timeout_duration_ms": 1000,
                        "note": "Timeout properly detected"
                    }
                    
        except Exception as e:
            resilience_results["timeout_handling"] = {
                "timeout_occurred": False,
                "error": str(e)
            }
        
        # Calculate overall resilience score
        resilience_checks = [
            resilience_results.get("normal_request", {}).get("successful", False),
            resilience_results.get("dns_resolution", {}).get("base_domain_resolved", False),
            resilience_results.get("ssl_certificate", {}).get("valid", False)
        ]
        
        resilience_score = (sum(resilience_checks) / len(resilience_checks)) * 100
        
        return {
            "passed": resilience_score >= 75,  # 75% resilience required
            "details": {
                "resilience_results": resilience_results,
                "resilience_score": resilience_score,
                "passed_checks": sum(resilience_checks),
                "total_checks": len(resilience_checks)
            },
            "warnings": warnings
        }
        
    except Exception as e:
        return {
            "passed": False,
            "details": {"error": str(e)},
            "warnings": []
        }


async def test_rate_limit_headers():
    """Test rate limiting headers and information"""
    try:
        from app.services.zoho_crm.core.api_client import ZohoAPIClient
        
        api_client = ZohoAPIClient()
        
        # Make a request and check rate limit info
        response = await api_client.get("org")
        
        rate_limit_info = {
            "remaining": getattr(api_client, '_rate_limit_remaining', None),
            "reset_time": getattr(api_client, '_rate_limit_reset', None),
            "limit": getattr(api_client, '_rate_limit_limit', None)
        }
        
        # Convert reset time to readable format
        if rate_limit_info["reset_time"]:
            rate_limit_info["reset_time_iso"] = rate_limit_info["reset_time"].isoformat()
        
        warnings = []
        
        # Check rate limit status
        remaining = rate_limit_info.get("remaining")
        if remaining is not None:
            if remaining < 100:
                warnings.append(f"Low rate limit remaining: {remaining}")
            elif remaining < 500:
                warnings.append(f"Moderate rate limit usage: {remaining} remaining")
        
        return {
            "passed": True,
            "details": {
                "rate_limit_info": rate_limit_info,
                "response_received": True,
                "rate_limit_tracking": remaining is not None
            },
            "warnings": warnings
        }
        
    except Exception as e:
        return {
            "passed": False,
            "details": {"error": str(e)},
            "warnings": []
        }


async def run_connectivity_tests(test_suite):
    """Run all connectivity tests"""
    
    # Define test functions
    tests = [
        (test_endpoint_accessibility, "Endpoint Accessibility", "connectivity"),
        (test_api_version_compatibility, "API Version Compatibility", "connectivity"),
        (test_network_resilience, "Network Resilience", "connectivity"),
        (test_rate_limit_headers, "Rate Limit Headers", "connectivity")
    ]
    
    # Run each test
    for test_func, test_name, category in tests:
        await test_suite.run_test(test_func, test_name, category)


# For standalone execution
async def main():
    """Run connectivity tests standalone"""
    from run_comprehensive_tests import TestSuite
    
    suite = TestSuite(verbose=True)
    await run_connectivity_tests(suite)
    suite.print_summary()


if __name__ == "__main__":
    asyncio.run(main())
