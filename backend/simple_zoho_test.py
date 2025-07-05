#!/usr/bin/env python3
"""
Simple test to verify Zoho SDK setup.
"""
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

try:
    from zcrmsdk.src.com.zoho.crm.api import Initializer
    from zcrmsdk.src.com.zoho.crm.api.dc import INDataCenter
    from zcrmsdk.src.com.zoho.api.authenticator.oauth_token import OAuthToken
    from zcrmsdk.src.com.zoho.api.authenticator.store import FileStore
    print("✅ Zoho SDK imports successful")
except ImportError as e:
    print(f"❌ Import error: {e}")
    exit(1)

# Get credentials
client_id = os.getenv("ZOHO_CLIENT_ID")
client_secret = os.getenv("ZOHO_CLIENT_SECRET") 
refresh_token = os.getenv("ZOHO_REFRESH_TOKEN")

print(f"Client ID: {client_id[:20]}...")
print(f"Client Secret: {client_secret[:20]}...")
print(f"Refresh Token: {refresh_token[:20]}...")

# Try basic token initialization without type specification
try:
    # Let's see what parameters the OAuthToken expects
    print("Testing basic OAuthToken initialization...")
    
    # Try the simplest possible initialization
    token = OAuthToken(client_id, client_secret, refresh_token)
    print("✅ Token initialized successfully!")
    
    # Try to initialize SDK
    environment = INDataCenter.PRODUCTION()
    store = FileStore(file_path="./simple_test_tokens.txt")
    
    Initializer.initialize(
        user_email="test@pipelinepulse.com",
        environment=environment,
        token=token,
        store=store
    )
    print("✅ SDK initialized successfully!")
    
    # Cleanup
    if os.path.exists("./simple_test_tokens.txt"):
        os.remove("./simple_test_tokens.txt")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()