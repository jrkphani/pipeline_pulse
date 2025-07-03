#!/usr/bin/env python3
"""
Test Zoho SDK with official pattern from sample code
"""

import os
import sys
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Test official SDK pattern
def test_official_sdk_pattern():
    """Test SDK initialization using the official pattern"""
    try:
        # Official imports from sample code
        from zohocrmsdk.src.com.zoho.api.authenticator import OAuthToken
        from zohocrmsdk.src.com.zoho.crm.api import Initializer
        from zohocrmsdk.src.com.zoho.crm.api.dc import INDataCenter
        
        print("✅ Official SDK imports successful")
        
        # Get credentials from environment
        client_id = os.getenv("ZOHO_CLIENT_ID")
        client_secret = os.getenv("ZOHO_CLIENT_SECRET")
        refresh_token = os.getenv("ZOHO_REFRESH_TOKEN")
        
        if not all([client_id, client_secret, refresh_token]):
            print("❌ Missing credentials in environment variables")
            return False
        
        print("✅ Credentials loaded from environment")
        
        # Initialize using official pattern
        environment = INDataCenter.PRODUCTION()
        
        # Create token with refresh token (production pattern)
        token = OAuthToken(
            client_id=client_id, 
            client_secret=client_secret, 
            refresh_token=refresh_token
        )
        
        print("✅ OAuth token created")
        
        # Initialize SDK (official minimal pattern)
        Initializer.initialize(environment, token)
        print("✅ SDK initialized successfully with official pattern!")
        
        # Test a simple API call
        from zohocrmsdk.src.com.zoho.crm.api.record import RecordOperations
        
        record_operations = RecordOperations("Deals")
        print("✅ Record operations created")
        
        return True
        
    except Exception as e:
        print(f"❌ SDK test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("🧪 Testing Zoho SDK with official pattern...")
    print("=" * 50)
    
    success = test_official_sdk_pattern()
    
    print("=" * 50)
    if success:
        print("🎉 Official SDK pattern test PASSED!")
    else:
        print("💥 Official SDK pattern test FAILED!")
        
    print("\nNext steps:")
    print("- If successful: Update main SDK manager to use official pattern")
    print("- If failed: Debug the specific error and fix imports/credentials")