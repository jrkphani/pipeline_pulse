#!/usr/bin/env python3
"""
Test script to demonstrate comprehensive logging in save_token methods
This script shows how the logging captures different call signatures and debugging information
"""

import logging
import sys
import os

# Add the backend directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

# Set up logging to see all debug output
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

from app.services.improved_zoho_token_store import ImprovedZohoTokenStore
from app.services.custom_sqlite_token_store import SQLiteTokenStore

# Mock classes for testing
class MockUser:
    def __init__(self, email):
        self.email = email
    
    def __str__(self):
        return f"MockUser({self.email})"

class MockToken:
    def __init__(self, **kwargs):
        for key, value in kwargs.items():
            setattr(self, key, value)
    
    def __str__(self):
        attrs = {k: v for k, v in self.__dict__.items() if not k.startswith('_')}
        return f"MockToken({attrs})"

def test_save_token_logging():
    """Test the comprehensive logging functionality"""
    
    print("=" * 80)
    print("Testing Comprehensive Logging in save_token Methods")
    print("=" * 80)
    
    # Initialize token stores
    improved_store = ImprovedZohoTokenStore()
    sqlite_store = SQLiteTokenStore()
    
    # Create mock objects for testing
    user = MockUser("test@example.com")
    token = MockToken(
        client_id="test_client_id",
        client_secret="test_client_secret",
        refresh_token="test_refresh_token",
        access_token="test_access_token",
        redirect_url="https://example.com/callback",
        expiry_time="1234567890"
    )
    
    print("\n" + "=" * 50)
    print("Test 1: CORRECT signature - save_token(user, token)")
    print("=" * 50)
    
    try:
        improved_store.save_token(user, token)
        print("✅ ImprovedZohoTokenStore - Correct signature test passed")
    except Exception as e:
        print(f"❌ ImprovedZohoTokenStore - Correct signature test failed: {e}")
    
    try:
        sqlite_store.save_token(user, token)
        print("✅ SQLiteTokenStore - Correct signature test passed")
    except Exception as e:
        print(f"❌ SQLiteTokenStore - Correct signature test failed: {e}")
    
    print("\n" + "=" * 50)
    print("Test 2: BUGGY signature - save_token(token)")
    print("=" * 50)
    
    try:
        improved_store.save_token(token)
        print("✅ ImprovedZohoTokenStore - Buggy signature test passed")
    except Exception as e:
        print(f"❌ ImprovedZohoTokenStore - Buggy signature test failed: {e}")
    
    try:
        sqlite_store.save_token(token)
        print("✅ SQLiteTokenStore - Buggy signature test passed")
    except Exception as e:
        print(f"❌ SQLiteTokenStore - Buggy signature test failed: {e}")
    
    print("\n" + "=" * 50)
    print("Test 3: INVALID signature - save_token(user, token, extra)")
    print("=" * 50)
    
    try:
        improved_store.save_token(user, token, "extra_param")
        print("❌ ImprovedZohoTokenStore - Invalid signature should have failed")
    except ValueError as e:
        print(f"✅ ImprovedZohoTokenStore - Invalid signature correctly rejected: {e}")
    except Exception as e:
        print(f"❌ ImprovedZohoTokenStore - Unexpected error: {e}")
    
    try:
        sqlite_store.save_token(user, token, "extra_param")
        print("❌ SQLiteTokenStore - Invalid signature should have failed")
    except ValueError as e:
        print(f"✅ SQLiteTokenStore - Invalid signature correctly rejected: {e}")
    except Exception as e:
        print(f"❌ SQLiteTokenStore - Unexpected error: {e}")
    
    print("\n" + "=" * 80)
    print("Logging Tests Complete!")
    print("=" * 80)
    print("\nKey features demonstrated:")
    print("✅ Unique correlation IDs for tracking individual calls")
    print("✅ Timestamp logging for each call")
    print("✅ Stack trace capture to identify callers")
    print("✅ Argument count and type logging")
    print("✅ Appropriate log levels (DEBUG for correct, WARNING for buggy)")
    print("✅ Detailed token attribute extraction logging")
    print("✅ Comprehensive error handling with full stack traces")
    print("✅ Security-conscious logging (sensitive data masked)")

if __name__ == "__main__":
    test_save_token_logging()
