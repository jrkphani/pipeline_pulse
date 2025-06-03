#!/usr/bin/env python3
"""
Quick test script to verify Pipeline Pulse starts correctly after auth removal
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_imports():
    """Test that all imports work correctly"""
    print("🧪 Testing imports...")
    
    try:
        # Test main app imports
        from app.api.routes import api_router
        print("  ✅ API router imports successful")
        
        from app.core.config import settings
        print("  ✅ Settings imports successful")
        
        from app.models.analysis import Analysis
        print("  ✅ Analysis model imports successful")
        
        # Test that auth imports fail as expected
        try:
            from app.auth.saml_auth import saml_auth_service
            print("  ❌ Auth imports should have failed!")
            return False
        except ImportError:
            print("  ✅ Auth imports correctly removed")
        
        try:
            from app.api.endpoints.auth import router
            print("  ❌ Auth endpoint imports should have failed!")
            return False
        except ImportError:
            print("  ✅ Auth endpoint imports correctly removed")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Import test failed: {e}")
        return False

def test_config():
    """Test configuration is clean"""
    print("🔧 Testing configuration...")
    
    try:
        from app.core.config import settings
        
        # Check that auth settings are gone
        auth_settings = [
            'SAML_ENTITY_ID', 'SAML_ACS_URL', 'SAML_SLS_URL',
            'ZOHO_SAML_ENTITY_ID', 'ZOHO_SAML_SSO_URL', 'JWT_SECRET'
        ]
        
        for setting in auth_settings:
            if hasattr(settings, setting):
                print(f"  ⚠️  Warning: {setting} still exists in config")
        
        # Check that CRM settings remain
        if settings.ZOHO_CLIENT_ID:
            print("  ✅ Zoho CRM settings preserved")
        else:
            print("  ⚠️  Warning: Zoho CRM settings missing")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Config test failed: {e}")
        return False

def test_app_creation():
    """Test that FastAPI app can be created"""
    print("🚀 Testing app creation...")
    
    try:
        from main import app
        print(f"  ✅ FastAPI app created successfully")
        print(f"  ✅ App title: {app.title}")
        print(f"  ✅ Routes registered: {len(app.routes)}")
        return True
        
    except Exception as e:
        print(f"  ❌ App creation failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🧪 Pipeline Pulse Auth Removal Verification")
    print("=" * 50)
    
    tests = [
        ("Import Tests", test_imports),
        ("Configuration Tests", test_config),
        ("App Creation Tests", test_app_creation)
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n{test_name}:")
        if test_func():
            passed += 1
            print(f"  ✅ {test_name} PASSED")
        else:
            print(f"  ❌ {test_name} FAILED")
    
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Auth removal successful.")
        print("\n🚀 Ready to deploy Pipeline Pulse in direct access mode!")
    else:
        print("⚠️  Some tests failed. Please review the output above.")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
