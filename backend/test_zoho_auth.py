#!/usr/bin/env python3
"""
Test script to verify Zoho CRM authentication with provided credentials.
Run this to test if your Zoho credentials are working correctly.
"""
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add the app directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

try:
    from zcrmsdk.src.com.zoho.crm.api import Initializer
    from zcrmsdk.src.com.zoho.crm.api.dc import INDataCenter
    from zcrmsdk.src.com.zoho.crm.api.user_signature import UserSignature
    from zcrmsdk.src.com.zoho.api.authenticator.oauth_token import OAuthToken, TokenType
    from zcrmsdk.src.com.zoho.api.authenticator.store import FileStore
    from zcrmsdk.src.com.zoho.crm.api.record import RecordOperations, GetRecordsParam
    from zcrmsdk.src.com.zoho.crm.api.parameter_map import ParameterMap
    from zcrmsdk.src.com.zoho.api.logger import Logger
    from zcrmsdk.src.com.zoho.crm.api.sdk_config import SDKConfig
    print("✅ Zoho SDK imports successful")
except ImportError as e:
    print(f"❌ Import error: {e}")
    sys.exit(1)

def test_zoho_authentication():
    """Test Zoho CRM authentication and basic API call."""
    
    print("🔐 Testing Zoho CRM Authentication...")
    
    # Get credentials from environment
    client_id = os.getenv("ZOHO_CLIENT_ID")
    client_secret = os.getenv("ZOHO_CLIENT_SECRET") 
    refresh_token = os.getenv("ZOHO_REFRESH_TOKEN")
    
    print(f"Client ID: {client_id[:20]}...")
    print(f"Client Secret: {client_secret[:20]}...")
    print(f"Refresh Token: {refresh_token[:20]}...")
    
    if not all([client_id, client_secret, refresh_token]):
        print("❌ Missing Zoho credentials in environment variables")
        return False
    
    try:
        # Initialize SDK
        print("📡 Initializing Zoho SDK with India data center...")
        
        # Setup environment (India data center)
        environment = INDataCenter.PRODUCTION()
        
        # Setup OAuth token with refresh token
        token = OAuthToken(
            client_id=client_id,
            client_secret=client_secret,
            token=refresh_token,
            token_type=TokenType.REFRESH
        )
        
        # Setup file store for token persistence
        store = FileStore(file_path="./zoho_tokens.txt")
        
        # Setup SDK config
        sdk_config = SDKConfig(
            auto_refresh_fields=False,
            pick_list_validation=False
        )
        
        # Setup logger
        logger = Logger.get_instance(
            level=Logger.Levels.INFO,
            file_path="./zoho_sdk.log"
        )
        
        # Create user signature
        user = UserSignature("admin@pipelinepulse.com")
        
        # Initialize the SDK
        Initializer.initialize(
            user=user,
            environment=environment,
            token=token,
            store=store,
            sdk_config=sdk_config,
            logger=logger,
            resource_path="./zoho_resources"
        )
        
        print("✅ Zoho SDK initialized successfully")
        
        # Test API call - Get Leads
        print("📋 Testing API call - fetching Leads...")
        
        record_operations = RecordOperations()
        param_instance = ParameterMap()
        param_instance.add(GetRecordsParam.fields, "id,First_Name,Last_Name,Email")
        param_instance.add(GetRecordsParam.per_page, 5)  # Get only 5 records
        
        response = record_operations.get_records("Leads", param_instance)
        
        if response is not None:
            print(f"📡 API Response Status Code: {response.get_status_code()}")
            
            if response.get_status_code() in [200, 204]:
                response_object = response.get_object()
                
                if hasattr(response_object, 'get_data'):
                    records = response_object.get_data()
                    if records:
                        print(f"✅ Successfully fetched {len(records)} lead records:")
                        for i, record in enumerate(records[:3], 1):  # Show first 3
                            key_values = record.get_key_values()
                            print(f"  Record {i}:")
                            for key, value in key_values.items():
                                if key in ['id', 'First_Name', 'Last_Name', 'Email']:
                                    print(f"    {key}: {value}")
                        print("✅ Zoho CRM authentication and API access working!")
                        return True
                    else:
                        print("📋 No lead records found (this is normal for a new CRM)")
                        print("✅ Zoho CRM authentication working!")
                        return True
                elif hasattr(response_object, 'get_status'):
                    # This might be an API exception
                    print(f"⚠️  API Status: {response_object.get_status().get_value()}")
                    print(f"Code: {response_object.get_code().get_value()}")
                    print(f"Message: {response_object.get_message().get_value()}")
                    return False
                else:
                    print("📋 No data returned (this might be normal)")
                    print("✅ Zoho CRM authentication appears to be working!")
                    return True
            else:
                print(f"❌ API call failed with status code: {response.get_status_code()}")
                return False
        else:
            print("❌ No response received from API")
            return False
            
    except Exception as e:
        print(f"❌ Error during authentication test: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("🚀 Pipeline Pulse - Zoho CRM Authentication Test")
    print("=" * 50)
    
    success = test_zoho_authentication()
    
    print("\n" + "=" * 50)
    if success:
        print("✅ ZOHO AUTHENTICATION TEST PASSED!")
        print("Your Zoho CRM credentials are working correctly.")
        print("You can now start the backend server.")
    else:
        print("❌ ZOHO AUTHENTICATION TEST FAILED!")
        print("Please check your credentials and try again.")
        
    # Cleanup
    try:
        if os.path.exists("./zoho_tokens.txt"):
            os.remove("./zoho_tokens.txt")
        if os.path.exists("./zoho_sdk.log"):
            os.remove("./zoho_sdk.log")
    except:
        pass