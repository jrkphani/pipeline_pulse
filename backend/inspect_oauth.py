#!/usr/bin/env python3
"""
Inspect OAuthToken class to understand constructor.
"""
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

try:
    from zcrmsdk.src.com.zoho.api.authenticator.oauth_token import OAuthToken
    print("✅ Zoho SDK imports successful")
    
    # Print help for OAuthToken
    print("\n=== OAuthToken class inspection ===")
    print("Constructor signature:")
    print(OAuthToken.__init__.__doc__)
    
    # Try to see what attributes are available
    print("\n=== Available attributes ===")
    attributes = [attr for attr in dir(OAuthToken) if not attr.startswith('_')]
    for attr in attributes:
        print(f"  {attr}")
    
    # Let's also check if there are any constants or enums
    print("\n=== Checking for token types ===")
    if hasattr(OAuthToken, '__dict__'):
        for name, value in OAuthToken.__dict__.items():
            if not name.startswith('_'):
                print(f"  {name}: {value}")
                
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()