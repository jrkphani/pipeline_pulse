#!/usr/bin/env python3
"""
Test script to generate JWT tokens for testing session management
"""

import json
import time
from datetime import datetime, timedelta
from jose import jwt

# Configuration from the app
SECRET_KEY = "dev-secret-key-change-in-production-please"
ALGORITHM = "HS256"

def create_test_jwt(expires_in_minutes=30, user_data=None):
    """Create a test JWT token with specified expiration"""
    
    if user_data is None:
        user_data = {
            "sub": "test@1cloudhub.com",
            "user_id": "test-user-456",
            "region": "Singapore",
            "name": "Test User",
            "roles": ["admin"]
        }
    
    # Create expiration time
    exp = datetime.utcnow() + timedelta(minutes=expires_in_minutes)
    iat = datetime.utcnow()
    
    # Create JWT payload
    payload = {
        **user_data,
        "exp": exp,
        "iat": iat,
        "iss": "pipeline-pulse-api"
    }
    
    # Create JWT token
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    
    return token, exp

def create_expired_jwt():
    """Create an expired JWT token for testing"""
    return create_test_jwt(expires_in_minutes=-5)  # Expired 5 minutes ago

if __name__ == "__main__":
    # Create a valid token
    valid_token, exp = create_test_jwt(expires_in_minutes=30)
    print("Valid JWT Token (30 minutes):")
    print(valid_token)
    print(f"Expires at: {exp}")
    print()
    
    # Create an expired token
    expired_token, exp = create_expired_jwt()
    print("Expired JWT Token:")
    print(expired_token)
    print(f"Expired at: {exp}")
    print()
    
    # Create a short-lived token for testing
    short_token, exp = create_test_jwt(expires_in_minutes=1)
    print("Short-lived JWT Token (1 minute):")
    print(short_token)
    print(f"Expires at: {exp}")
