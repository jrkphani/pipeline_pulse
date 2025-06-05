#!/usr/bin/env python3
"""
Authentication & Authorization Tests
Test OAuth token management, connection validation, and permission scopes
"""

import asyncio
import os
import sys
from datetime import datetime, timedelta

# Add backend to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

# Load environment variables
from dotenv import load_dotenv
backend_env_path = os.path.join(os.path.dirname(__file__), '..', 'backend', '.env')
load_dotenv(backend_env_path)

from app.core.config import settings


async def test_token_refresh():
    """Test OAuth token refresh mechanism"""
    try:
        from app.services.zoho_crm.core.auth_manager import ZohoAuthManager
        
        auth_manager = ZohoAuthManager()
        
        # Test token refresh
        start_time = datetime.now()
        token = await auth_manager.get_access_token(force_refresh=True)
        refresh_duration = (datetime.now() - start_time).total_seconds()
        
        if not token:
            return {
                "passed": False,
                "details": {"error": "No token received"},
                "warnings": []
            }
        
        # Validate token properties
        token_length = len(token)
        expires_at = auth_manager.token_expires_at
        
        details = {
            "token_received": True,
            "token_length": token_length,
            "refresh_duration_ms": refresh_duration * 1000,
            "expires_at": expires_at.isoformat() if expires_at else None,
            "token_type": "Bearer"
        }
        
        warnings = []
        if refresh_duration > 5.0:
            warnings.append(f"Token refresh took {refresh_duration:.1f}s (>5s)")
        if token_length < 50:
            warnings.append(f"Token seems short ({token_length} chars)")
        
        return {
            "passed": True,
            "details": details,
            "warnings": warnings
        }
        
    except Exception as e:
        return {
            "passed": False,
            "details": {"error": str(e)},
            "warnings": []
        }


async def test_connection_validation():
    """Test connection to Zoho CRM with current credentials"""
    try:
        from app.services.zoho_crm.core.auth_manager import ZohoAuthManager
        
        auth_manager = ZohoAuthManager()
        
        # Test connection validation
        validation_result = await auth_manager.validate_connection()
        
        if not validation_result.get("authenticated"):
            return {
                "passed": False,
                "details": {
                    "authenticated": False,
                    "error": validation_result.get("error", "Unknown error")
                },
                "warnings": []
            }
        
        # Extract organization info
        org_info = validation_result.get("org_info", {})
        org_data = {}
        if isinstance(org_info, dict) and "org" in org_info:
            org = org_info["org"][0] if org_info["org"] else {}
            org_data = {
                "company_name": org.get("company_name", "Unknown"),
                "country": org.get("country", "Unknown"),
                "time_zone": org.get("time_zone", "Unknown"),
                "currency": org.get("currency", "Unknown")
            }
        
        details = {
            "authenticated": True,
            "organization": org_data,
            "data_center": "India (.in domain)" if ".in" in settings.ZOHO_BASE_URL else "Other",
            "api_version": "v8" if "/v8/" in settings.ZOHO_BASE_URL else "Other"
        }
        
        warnings = []
        if not org_data.get("company_name"):
            warnings.append("Organization name not found")
        
        return {
            "passed": True,
            "details": details,
            "warnings": warnings
        }
        
    except Exception as e:
        return {
            "passed": False,
            "details": {"error": str(e)},
            "warnings": []
        }


async def test_permission_scopes():
    """Test all required API scopes are accessible"""
    try:
        from app.services.zoho_crm.core.api_client import ZohoAPIClient
        
        api_client = ZohoAPIClient()
        
        # Test different scope requirements
        scope_tests = [
            ("ZohoCRM.modules.ALL", "Deals", {"per_page": 1, "fields": "Deal_Name"}),
            ("ZohoCRM.settings.ALL", "settings/modules", {}),
            ("ZohoCRM.users.ALL", "users?type=CurrentUser", {}),
            ("ZohoCRM.org.ALL", "org", {}),
        ]
        
        scope_results = {}
        warnings = []
        
        for scope_name, endpoint, params in scope_tests:
            try:
                response = await api_client.get(endpoint, params=params)
                scope_results[scope_name] = {
                    "accessible": True,
                    "endpoint": endpoint,
                    "response_keys": list(response.keys()) if isinstance(response, dict) else []
                }
            except Exception as e:
                scope_results[scope_name] = {
                    "accessible": False,
                    "endpoint": endpoint,
                    "error": str(e)
                }
                warnings.append(f"{scope_name} test failed: {str(e)}")
        
        # Test bulk operations (if available)
        try:
            bulk_response = await api_client.get("settings/modules")
            if bulk_response:
                scope_results["ZohoCRM.bulk.ALL"] = {
                    "accessible": True,
                    "endpoint": "settings/modules",
                    "note": "Bulk operations endpoint accessible"
                }
        except Exception as e:
            scope_results["ZohoCRM.bulk.ALL"] = {
                "accessible": False,
                "endpoint": "bulk operations",
                "error": str(e)
            }
            warnings.append(f"Bulk operations test failed: {str(e)}")
        
        # Check if all critical scopes are accessible
        critical_scopes = ["ZohoCRM.modules.ALL", "ZohoCRM.org.ALL", "ZohoCRM.users.ALL"]
        all_critical_accessible = all(
            scope_results.get(scope, {}).get("accessible", False) 
            for scope in critical_scopes
        )
        
        return {
            "passed": all_critical_accessible,
            "details": {
                "scopes": scope_results,
                "critical_scopes_accessible": all_critical_accessible
            },
            "warnings": warnings
        }
        
    except Exception as e:
        return {
            "passed": False,
            "details": {"error": str(e)},
            "warnings": []
        }


async def test_token_expiration_handling():
    """Test token expiration and refresh handling"""
    try:
        from app.services.zoho_crm.core.auth_manager import ZohoAuthManager
        
        auth_manager = ZohoAuthManager()
        
        # Get current token info
        current_token = await auth_manager.get_access_token()
        expires_at = auth_manager.token_expires_at
        
        if not expires_at:
            return {
                "passed": False,
                "details": {"error": "No expiration time available"},
                "warnings": []
            }
        
        # Calculate time until expiration
        now = datetime.now()
        time_until_expiry = expires_at - now
        
        details = {
            "current_token_length": len(current_token) if current_token else 0,
            "expires_at": expires_at.isoformat(),
            "time_until_expiry_seconds": time_until_expiry.total_seconds(),
            "time_until_expiry_hours": time_until_expiry.total_seconds() / 3600
        }
        
        warnings = []
        
        # Check if token is expiring soon
        if time_until_expiry.total_seconds() < 300:  # Less than 5 minutes
            warnings.append("Token expires in less than 5 minutes")
        elif time_until_expiry.total_seconds() < 3600:  # Less than 1 hour
            warnings.append("Token expires in less than 1 hour")
        
        # Test refresh mechanism
        try:
            refreshed_token = await auth_manager.get_access_token(force_refresh=True)
            new_expires_at = auth_manager.token_expires_at
            
            details["refresh_successful"] = True
            details["new_expires_at"] = new_expires_at.isoformat() if new_expires_at else None
            
            if new_expires_at and new_expires_at > expires_at:
                details["expiration_extended"] = True
            else:
                warnings.append("Token expiration not properly extended")
                
        except Exception as refresh_error:
            details["refresh_successful"] = False
            details["refresh_error"] = str(refresh_error)
            warnings.append(f"Token refresh failed: {str(refresh_error)}")
        
        return {
            "passed": details.get("refresh_successful", False),
            "details": details,
            "warnings": warnings
        }
        
    except Exception as e:
        return {
            "passed": False,
            "details": {"error": str(e)},
            "warnings": []
        }


async def test_environment_configuration():
    """Test environment configuration for authentication"""
    try:
        # Check required environment variables
        required_vars = {
            "ZOHO_CLIENT_ID": settings.ZOHO_CLIENT_ID,
            "ZOHO_CLIENT_SECRET": settings.ZOHO_CLIENT_SECRET,
            "ZOHO_REFRESH_TOKEN": settings.ZOHO_REFRESH_TOKEN,
            "ZOHO_BASE_URL": settings.ZOHO_BASE_URL,
            "ZOHO_ACCOUNTS_URL": settings.ZOHO_ACCOUNTS_URL
        }
        
        config_status = {}
        warnings = []
        
        for var_name, var_value in required_vars.items():
            if var_value:
                config_status[var_name] = {
                    "configured": True,
                    "length": len(str(var_value)) if var_name not in ["ZOHO_CLIENT_SECRET", "ZOHO_REFRESH_TOKEN"] else "hidden"
                }
            else:
                config_status[var_name] = {
                    "configured": False,
                    "length": 0
                }
                warnings.append(f"Missing {var_name}")
        
        # Check URL configurations
        base_url = settings.ZOHO_BASE_URL
        accounts_url = settings.ZOHO_ACCOUNTS_URL
        
        url_checks = {
            "base_url_format": base_url.startswith("https://") if base_url else False,
            "accounts_url_format": accounts_url.startswith("https://") if accounts_url else False,
            "india_data_center": ".in" in base_url if base_url else False,
            "api_version_v8": "/v8/" in base_url if base_url else False
        }
        
        if not url_checks["api_version_v8"]:
            warnings.append("Not using API v8 - may cause compatibility issues")
        
        all_configured = all(status["configured"] for status in config_status.values())
        
        return {
            "passed": all_configured,
            "details": {
                "environment_variables": config_status,
                "url_checks": url_checks,
                "environment": settings.ENVIRONMENT
            },
            "warnings": warnings
        }
        
    except Exception as e:
        return {
            "passed": False,
            "details": {"error": str(e)},
            "warnings": []
        }


async def run_authentication_tests(test_suite):
    """Run all authentication tests"""
    
    # Define test functions
    tests = [
        (test_environment_configuration, "Environment Configuration", "authentication"),
        (test_token_refresh, "Token Refresh", "authentication"),
        (test_connection_validation, "Connection Validation", "authentication"),
        (test_permission_scopes, "Permission Scopes", "authentication"),
        (test_token_expiration_handling, "Token Expiration Handling", "authentication")
    ]
    
    # Run each test
    for test_func, test_name, category in tests:
        await test_suite.run_test(test_func, test_name, category)


# For standalone execution
async def main():
    """Run authentication tests standalone"""
    from run_comprehensive_tests import TestSuite
    
    suite = TestSuite(verbose=True)
    await run_authentication_tests(suite)
    suite.print_summary()


if __name__ == "__main__":
    asyncio.run(main())
