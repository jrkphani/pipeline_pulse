#!/usr/bin/env python3
"""
Zoho API Connectivity Diagnostic Script
Comprehensive testing of Zoho CRM API connectivity, authentication, and rate limiting
"""

import asyncio
import httpx
import json
import os
import sys
import time
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

# Add backend to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app.core.config import settings
from app.services.zoho_crm.core.auth_manager import ZohoAuthManager
from app.services.zoho_crm.core.api_client import ZohoAPIClient
from app.services.zoho_crm.core.exceptions import ZohoAPIError, ZohoAuthError, ZohoRateLimitError


class ZohoDiagnostics:
    """Comprehensive Zoho API diagnostics"""
    
    def __init__(self):
        self.auth_manager = ZohoAuthManager()
        self.api_client = ZohoAPIClient()
        self.results = {
            "timestamp": datetime.now().isoformat(),
            "environment": settings.ENVIRONMENT,
            "tests": {}
        }
    
    async def run_all_tests(self):
        """Run all diagnostic tests"""
        print("🔍 Starting Zoho API Connectivity Diagnostics...")
        print(f"Environment: {settings.ENVIRONMENT}")
        print(f"Base URL: {self.auth_manager.base_url}")
        print(f"Accounts URL: {self.auth_manager.accounts_url}")
        print("-" * 60)
        
        # Test 1: Environment Configuration
        await self.test_environment_config()
        
        # Test 2: Network Connectivity
        await self.test_network_connectivity()
        
        # Test 3: Authentication Token Refresh
        await self.test_token_refresh()
        
        # Test 4: Basic API Calls
        await self.test_basic_api_calls()
        
        # Test 5: Rate Limiting
        await self.test_rate_limiting()
        
        # Test 6: Error Handling
        await self.test_error_handling()
        
        # Generate Report
        self.generate_report()
    
    async def test_environment_config(self):
        """Test environment configuration"""
        print("1️⃣ Testing Environment Configuration...")
        
        test_result = {
            "status": "pass",
            "details": {},
            "issues": []
        }
        
        # Check required environment variables
        required_vars = {
            "ZOHO_CLIENT_ID": settings.ZOHO_CLIENT_ID,
            "ZOHO_REFRESH_TOKEN": settings.ZOHO_REFRESH_TOKEN,
            "ZOHO_BASE_URL": settings.ZOHO_BASE_URL,
            "ZOHO_ACCOUNTS_URL": settings.ZOHO_ACCOUNTS_URL
        }
        
        for var_name, var_value in required_vars.items():
            if not var_value:
                test_result["issues"].append(f"Missing {var_name}")
                test_result["status"] = "fail"
            else:
                test_result["details"][var_name] = "✓ Set" if var_name != "ZOHO_REFRESH_TOKEN" else "✓ Set (hidden)"
        
        # Check client secret (production vs development)
        try:
            client_secret = settings.ZOHO_CLIENT_SECRET
            if client_secret:
                test_result["details"]["ZOHO_CLIENT_SECRET"] = "✓ Set (hidden)"
            else:
                test_result["issues"].append("Missing ZOHO_CLIENT_SECRET")
                test_result["status"] = "fail"
        except Exception as e:
            test_result["issues"].append(f"Error getting client secret: {str(e)}")
            test_result["status"] = "fail"
        
        self.results["tests"]["environment_config"] = test_result
        print(f"   Status: {test_result['status'].upper()}")
        if test_result["issues"]:
            for issue in test_result["issues"]:
                print(f"   ❌ {issue}")
        print()
    
    async def test_network_connectivity(self):
        """Test network connectivity to Zoho endpoints"""
        print("2️⃣ Testing Network Connectivity...")
        
        test_result = {
            "status": "pass",
            "details": {},
            "issues": []
        }
        
        endpoints_to_test = [
            ("Accounts API", f"{self.auth_manager.accounts_url}/oauth/v2/token"),
            ("CRM API", f"{self.auth_manager.base_url}/org"),
            ("CRM Deals", f"{self.auth_manager.base_url}/Deals")
        ]
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            for name, url in endpoints_to_test:
                try:
                    start_time = time.time()
                    response = await client.get(url)
                    response_time = (time.time() - start_time) * 1000
                    
                    test_result["details"][name] = {
                        "url": url,
                        "status_code": response.status_code,
                        "response_time_ms": round(response_time, 2),
                        "reachable": True
                    }
                    
                    print(f"   ✓ {name}: {response.status_code} ({response_time:.0f}ms)")
                    
                except httpx.TimeoutException:
                    test_result["issues"].append(f"{name}: Timeout")
                    test_result["status"] = "fail"
                    print(f"   ❌ {name}: Timeout")
                    
                except httpx.RequestError as e:
                    test_result["issues"].append(f"{name}: {str(e)}")
                    test_result["status"] = "fail"
                    print(f"   ❌ {name}: {str(e)}")
        
        self.results["tests"]["network_connectivity"] = test_result
        print(f"   Status: {test_result['status'].upper()}")
        print()
    
    async def test_token_refresh(self):
        """Test authentication token refresh"""
        print("3️⃣ Testing Authentication Token Refresh...")
        
        test_result = {
            "status": "pass",
            "details": {},
            "issues": []
        }
        
        try:
            start_time = time.time()
            token = await self.auth_manager.get_access_token(force_refresh=True)
            refresh_time = (time.time() - start_time) * 1000
            
            if token:
                test_result["details"]["token_refresh"] = {
                    "success": True,
                    "refresh_time_ms": round(refresh_time, 2),
                    "token_length": len(token),
                    "expires_at": self.auth_manager.token_expires_at.isoformat() if self.auth_manager.token_expires_at else None
                }
                print(f"   ✓ Token refreshed successfully ({refresh_time:.0f}ms)")
                print(f"   ✓ Token length: {len(token)} characters")
                
                # Test token validation
                validation_result = await self.auth_manager.validate_connection()
                test_result["details"]["token_validation"] = validation_result
                
                if validation_result.get("authenticated"):
                    print(f"   ✓ Token validation successful")
                    if "org_info" in validation_result:
                        org_info = validation_result["org_info"]
                        if isinstance(org_info, dict) and "org" in org_info:
                            org_data = org_info["org"][0] if org_info["org"] else {}
                            print(f"   ✓ Organization: {org_data.get('company_name', 'Unknown')}")
                else:
                    test_result["issues"].append("Token validation failed")
                    test_result["status"] = "fail"
                    print(f"   ❌ Token validation failed: {validation_result.get('error', 'Unknown error')}")
            else:
                test_result["issues"].append("No token received")
                test_result["status"] = "fail"
                print(f"   ❌ No token received")
                
        except ZohoAuthError as e:
            test_result["issues"].append(f"Authentication error: {str(e)}")
            test_result["status"] = "fail"
            print(f"   ❌ Authentication error: {str(e)}")
            
        except Exception as e:
            test_result["issues"].append(f"Unexpected error: {str(e)}")
            test_result["status"] = "fail"
            print(f"   ❌ Unexpected error: {str(e)}")
        
        self.results["tests"]["token_refresh"] = test_result
        print(f"   Status: {test_result['status'].upper()}")
        print()
    
    async def test_basic_api_calls(self):
        """Test basic API calls"""
        print("4️⃣ Testing Basic API Calls...")
        
        test_result = {
            "status": "pass",
            "details": {},
            "issues": []
        }
        
        api_calls = [
            ("Organization Info", "org"),
            ("Current User", "users?type=CurrentUser"),
            ("Deals (Limited)", "Deals?per_page=1"),
            ("Deal Fields", "settings/fields?module=Deals")
        ]
        
        for call_name, endpoint in api_calls:
            try:
                start_time = time.time()
                response = await self.api_client.get(endpoint)
                call_time = (time.time() - start_time) * 1000
                
                test_result["details"][call_name] = {
                    "endpoint": endpoint,
                    "success": True,
                    "response_time_ms": round(call_time, 2),
                    "data_keys": list(response.keys()) if isinstance(response, dict) else []
                }
                
                print(f"   ✓ {call_name}: Success ({call_time:.0f}ms)")
                
                # Show some response details
                if isinstance(response, dict):
                    if "org" in response and response["org"]:
                        org = response["org"][0]
                        print(f"     Organization: {org.get('company_name', 'Unknown')}")
                    elif "users" in response and response["users"]:
                        user = response["users"][0]
                        print(f"     User: {user.get('full_name', 'Unknown')}")
                    elif "data" in response:
                        print(f"     Records returned: {len(response['data'])}")
                    elif "fields" in response:
                        print(f"     Fields returned: {len(response['fields'])}")
                
            except ZohoRateLimitError as e:
                test_result["issues"].append(f"{call_name}: Rate limited (retry after {e.retry_after}s)")
                test_result["status"] = "warning"
                print(f"   ⚠️ {call_name}: Rate limited (retry after {e.retry_after}s)")
                
            except ZohoAPIError as e:
                test_result["issues"].append(f"{call_name}: API error - {str(e)}")
                test_result["status"] = "fail"
                print(f"   ❌ {call_name}: API error - {str(e)}")
                
            except Exception as e:
                test_result["issues"].append(f"{call_name}: Unexpected error - {str(e)}")
                test_result["status"] = "fail"
                print(f"   ❌ {call_name}: Unexpected error - {str(e)}")
        
        self.results["tests"]["basic_api_calls"] = test_result
        print(f"   Status: {test_result['status'].upper()}")
        print()
    
    async def test_rate_limiting(self):
        """Test rate limiting behavior"""
        print("5️⃣ Testing Rate Limiting...")
        
        test_result = {
            "status": "pass",
            "details": {},
            "issues": []
        }
        
        # Make several rapid API calls to test rate limiting
        call_count = 5
        successful_calls = 0
        rate_limited_calls = 0
        
        print(f"   Making {call_count} rapid API calls...")
        
        for i in range(call_count):
            try:
                start_time = time.time()
                response = await self.api_client.get("org")
                call_time = (time.time() - start_time) * 1000
                successful_calls += 1
                print(f"   ✓ Call {i+1}: Success ({call_time:.0f}ms)")
                
            except ZohoRateLimitError as e:
                rate_limited_calls += 1
                print(f"   ⚠️ Call {i+1}: Rate limited (retry after {e.retry_after}s)")
                
            except Exception as e:
                test_result["issues"].append(f"Call {i+1}: {str(e)}")
                print(f"   ❌ Call {i+1}: {str(e)}")
        
        test_result["details"]["rate_limiting"] = {
            "total_calls": call_count,
            "successful_calls": successful_calls,
            "rate_limited_calls": rate_limited_calls,
            "rate_limit_info": {
                "remaining": self.api_client._rate_limit_remaining,
                "reset_time": self.api_client._rate_limit_reset.isoformat() if self.api_client._rate_limit_reset else None
            }
        }
        
        if rate_limited_calls > 0:
            test_result["status"] = "warning"
            print(f"   ⚠️ Rate limiting detected: {rate_limited_calls}/{call_count} calls limited")
        else:
            print(f"   ✓ No rate limiting detected in {call_count} calls")
        
        self.results["tests"]["rate_limiting"] = test_result
        print(f"   Status: {test_result['status'].upper()}")
        print()
    
    async def test_error_handling(self):
        """Test error handling for various scenarios"""
        print("6️⃣ Testing Error Handling...")
        
        test_result = {
            "status": "pass",
            "details": {},
            "issues": []
        }
        
        # Test invalid endpoint
        try:
            await self.api_client.get("invalid_endpoint_12345")
            test_result["issues"].append("Invalid endpoint should have failed")
            test_result["status"] = "fail"
        except ZohoAPIError:
            test_result["details"]["invalid_endpoint"] = "✓ Properly handled"
            print("   ✓ Invalid endpoint error properly handled")
        except Exception as e:
            test_result["issues"].append(f"Unexpected error for invalid endpoint: {str(e)}")
            test_result["status"] = "fail"
        
        self.results["tests"]["error_handling"] = test_result
        print(f"   Status: {test_result['status'].upper()}")
        print()
    
    def generate_report(self):
        """Generate comprehensive diagnostic report"""
        print("📊 DIAGNOSTIC REPORT")
        print("=" * 60)
        
        overall_status = "PASS"
        total_tests = len(self.results["tests"])
        passed_tests = 0
        warning_tests = 0
        failed_tests = 0
        
        for test_name, test_result in self.results["tests"].items():
            status = test_result["status"]
            if status == "pass":
                passed_tests += 1
            elif status == "warning":
                warning_tests += 1
            else:
                failed_tests += 1
                overall_status = "FAIL"
        
        if warning_tests > 0 and overall_status == "PASS":
            overall_status = "WARNING"
        
        print(f"Overall Status: {overall_status}")
        print(f"Tests: {passed_tests} passed, {warning_tests} warnings, {failed_tests} failed")
        print()
        
        # Detailed results
        for test_name, test_result in self.results["tests"].items():
            status_icon = "✅" if test_result["status"] == "pass" else "⚠️" if test_result["status"] == "warning" else "❌"
            print(f"{status_icon} {test_name.replace('_', ' ').title()}: {test_result['status'].upper()}")
            
            if test_result["issues"]:
                for issue in test_result["issues"]:
                    print(f"   • {issue}")
        
        print()
        print("💡 RECOMMENDATIONS:")
        
        if failed_tests > 0:
            print("   • Check environment variables and network connectivity")
            print("   • Verify Zoho API credentials and refresh token")
            print("   • Ensure correct data center endpoints (India: .in)")
        
        if warning_tests > 0:
            print("   • Monitor rate limiting - consider implementing backoff strategies")
            print("   • Review API usage patterns to optimize performance")
        
        if overall_status == "PASS":
            print("   • Zoho API integration is working correctly!")
            print("   • Consider implementing monitoring for production use")
        
        # Save detailed results to file
        report_file = f"zoho_diagnostics_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_file, 'w') as f:
            json.dump(self.results, f, indent=2, default=str)
        
        print(f"\n📄 Detailed report saved to: {report_file}")


async def main():
    """Main diagnostic function"""
    diagnostics = ZohoDiagnostics()
    await diagnostics.run_all_tests()


if __name__ == "__main__":
    asyncio.run(main())
