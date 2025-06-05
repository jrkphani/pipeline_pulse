#!/usr/bin/env python3
"""
Production Readiness Tests
Test environment configuration, security, and monitoring readiness
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

from app.core.config import settings


async def test_environment_configuration():
    """Test environment configuration completeness"""
    try:
        # Check all required environment variables
        required_vars = {
            "ZOHO_CLIENT_ID": settings.ZOHO_CLIENT_ID,
            "ZOHO_CLIENT_SECRET": settings.ZOHO_CLIENT_SECRET,
            "ZOHO_REFRESH_TOKEN": settings.ZOHO_REFRESH_TOKEN,
            "ZOHO_BASE_URL": settings.ZOHO_BASE_URL,
            "ZOHO_ACCOUNTS_URL": settings.ZOHO_ACCOUNTS_URL
        }
        
        missing_vars = [var for var, value in required_vars.items() if not value]
        
        # Check URL configurations
        url_checks = {
            "base_url_https": settings.ZOHO_BASE_URL.startswith("https://") if settings.ZOHO_BASE_URL else False,
            "accounts_url_https": settings.ZOHO_ACCOUNTS_URL.startswith("https://") if settings.ZOHO_ACCOUNTS_URL else False,
            "api_version_v8": "/v8/" in settings.ZOHO_BASE_URL if settings.ZOHO_BASE_URL else False,
            "india_data_center": ".in" in settings.ZOHO_BASE_URL if settings.ZOHO_BASE_URL else False
        }
        
        warnings = []
        if missing_vars:
            warnings.extend([f"Missing {var}" for var in missing_vars])
        if not url_checks["api_version_v8"]:
            warnings.append("Not using API v8")
        
        return {
            "passed": len(missing_vars) == 0 and url_checks["api_version_v8"],
            "details": {
                "required_vars_configured": len(required_vars) - len(missing_vars),
                "total_required_vars": len(required_vars),
                "missing_vars": missing_vars,
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


async def test_security_configuration():
    """Test security configuration"""
    try:
        # Check HTTPS usage
        https_check = {
            "base_url_secure": settings.ZOHO_BASE_URL.startswith("https://") if settings.ZOHO_BASE_URL else False,
            "accounts_url_secure": settings.ZOHO_ACCOUNTS_URL.startswith("https://") if settings.ZOHO_ACCOUNTS_URL else False
        }
        
        # Check token security (basic validation)
        token_security = {
            "refresh_token_length": len(settings.ZOHO_REFRESH_TOKEN) if settings.ZOHO_REFRESH_TOKEN else 0,
            "client_secret_length": len(settings.ZOHO_CLIENT_SECRET) if settings.ZOHO_CLIENT_SECRET else 0,
            "tokens_not_empty": bool(settings.ZOHO_REFRESH_TOKEN and settings.ZOHO_CLIENT_SECRET)
        }
        
        warnings = []
        if not https_check["base_url_secure"]:
            warnings.append("Base URL not using HTTPS")
        if not https_check["accounts_url_secure"]:
            warnings.append("Accounts URL not using HTTPS")
        if token_security["refresh_token_length"] < 50:
            warnings.append("Refresh token seems too short")
        
        return {
            "passed": all(https_check.values()) and token_security["tokens_not_empty"],
            "details": {
                "https_check": https_check,
                "token_security": token_security
            },
            "warnings": warnings
        }
        
    except Exception as e:
        return {
            "passed": False,
            "details": {"error": str(e)},
            "warnings": []
        }


async def test_api_health():
    """Test API health and connectivity"""
    try:
        from app.services.zoho_crm.core.auth_manager import ZohoAuthManager
        
        auth_manager = ZohoAuthManager()
        
        # Test connection
        validation = await auth_manager.validate_connection()
        
        # Test basic API call
        from app.services.zoho_crm.core.api_client import ZohoAPIClient
        api_client = ZohoAPIClient()
        
        response = await api_client.get("org")
        
        return {
            "passed": validation.get("authenticated", False) and isinstance(response, dict),
            "details": {
                "authentication_working": validation.get("authenticated", False),
                "api_responding": isinstance(response, dict),
                "organization": validation.get("org_info", {}).get("org", [{}])[0].get("company_name", "Unknown") if validation.get("org_info") else "Unknown"
            },
            "warnings": []
        }
        
    except Exception as e:
        return {
            "passed": False,
            "details": {"error": str(e)},
            "warnings": []
        }


async def run_production_readiness_tests(test_suite):
    """Run all production readiness tests"""
    
    tests = [
        (test_environment_configuration, "Environment Configuration", "production_readiness"),
        (test_security_configuration, "Security Configuration", "production_readiness"),
        (test_api_health, "API Health", "production_readiness")
    ]
    
    for test_func, test_name, category in tests:
        await test_suite.run_test(test_func, test_name, category)


async def main():
    from run_comprehensive_tests import TestSuite
    suite = TestSuite(verbose=True)
    await run_production_readiness_tests(suite)
    suite.print_summary()


if __name__ == "__main__":
    asyncio.run(main())
