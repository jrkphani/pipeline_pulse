#!/usr/bin/env python3
"""
Script to exchange authorization code for refresh token.
Usage: python exchange_token.py <authorization_code>
"""

import sys
import requests

# Your Zoho app credentials
CLIENT_ID = "1000.JKDZ5EYYE175QA1WGK5UVGM2R37KAY"
CLIENT_SECRET = "47b3ac5c29d2168b8d5c529fc2aa1f9c93da5c1be7"
REDIRECT_URI = "http://localhost:8000/api/v1/auth/zoho/callback"

def exchange_code_for_tokens(authorization_code):
    """Exchange authorization code for access and refresh tokens."""
    token_url = "https://accounts.zoho.in/oauth/v2/token"
    
    data = {
        "grant_type": "authorization_code",
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "redirect_uri": REDIRECT_URI,
        "code": authorization_code,
    }
    
    response = requests.post(token_url, data=data)
    
    if response.status_code == 200:
        return response.json()
    else:
        print(f"❌ Error: {response.status_code}")
        print(f"Response: {response.text}")
        return None

def main():
    if len(sys.argv) != 2:
        print("Usage: python exchange_token.py <authorization_code>")
        print("\nFirst visit this URL to get an authorization code:")
        print("https://accounts.zoho.in/oauth/v2/auth?scope=ZohoCRM.modules.ALL%2CZohoCRM.settings.ALL%2CZohoCRM.users.ALL%2CZohoCRM.org.ALL%2CZohoCRM.bulk.ALL&client_id=1000.JKDZ5EYYE175QA1WGK5UVGM2R37KAY&response_type=code&access_type=offline&redirect_uri=http%3A%2F%2Flocalhost%3A8000%2Fapi%2Fv1%2Fauth%2Fzoho%2Fcallback")
        return
    
    auth_code = sys.argv[1]
    print(f"🔄 Exchanging authorization code for tokens...")
    
    tokens = exchange_code_for_tokens(auth_code)
    
    if tokens:
        print("\n✅ Successfully generated tokens!")
        print("=" * 60)
        print(f"Access Token:  {tokens.get('access_token', 'N/A')}")
        print(f"Refresh Token: {tokens.get('refresh_token', 'N/A')}")
        print(f"Expires In:    {tokens.get('expires_in', 'N/A')} seconds")
        print(f"Scope:         {tokens.get('scope', 'N/A')}")
        
        if 'refresh_token' in tokens:
            print(f"\n🔧 Update your config.py with this refresh token:")
            print(f"zoho_refresh_token: str = Field(\"{tokens['refresh_token']}\", env=\"ZOHO_REFRESH_TOKEN\")")
            
            # Also print environment variable format
            print(f"\nOr set environment variable:")
            print(f"export ZOHO_REFRESH_TOKEN=\"{tokens['refresh_token']}\"")
        else:
            print("\n⚠️  No refresh token in response. Make sure access_type=offline was used.")
    else:
        print("\n❌ Failed to generate tokens. Check the error above.")

if __name__ == "__main__":
    main()