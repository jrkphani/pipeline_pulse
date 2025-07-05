#!/usr/bin/env python3
"""
Script to generate a new Zoho CRM refresh token.
Run this script and follow the instructions to get a new refresh token.
"""

import requests
import urllib.parse

# Your Zoho app credentials
CLIENT_ID = "1000.JKDZ5EYYE175QA1WGK5UVGM2R37KAY"
CLIENT_SECRET = "47b3ac5c29d2168b8d5c529fc2aa1f9c93da5c1be7"
REDIRECT_URI = "http://localhost:8000/api/v1/auth/zoho/callback"
SCOPE = "ZohoCRM.modules.ALL,ZohoCRM.settings.ALL,ZohoCRM.users.ALL,ZohoCRM.org.ALL,ZohoCRM.bulk.ALL"

def generate_authorization_url():
    """Generate the authorization URL to get an authorization code."""
    base_url = "https://accounts.zoho.in/oauth/v2/auth"
    params = {
        "scope": SCOPE,
        "client_id": CLIENT_ID,
        "response_type": "code",
        "access_type": "offline",
        "redirect_uri": REDIRECT_URI,
    }
    
    auth_url = f"{base_url}?{urllib.parse.urlencode(params)}"
    return auth_url

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
        print(f"Error: {response.status_code}")
        print(response.text)
        return None

def main():
    print("🔑 Zoho CRM Token Generator")
    print("=" * 50)
    
    # Step 1: Generate authorization URL
    auth_url = generate_authorization_url()
    print(f"\n1. Visit this URL to authorize the application:")
    print(f"\n{auth_url}\n")
    
    print("2. After authorization, you'll be redirected to a URL that looks like:")
    print("   http://localhost:8000/api/v1/auth/zoho/callback?code=1000.xxxx&location=in&...")
    print("\n3. Copy the 'code' parameter from the URL and paste it below.")
    
    # Step 2: Get authorization code from user
    auth_code = input("\nEnter the authorization code: ").strip()
    
    if not auth_code:
        print("❌ No authorization code provided. Exiting.")
        return
    
    # Step 3: Exchange code for tokens
    print("\n🔄 Exchanging authorization code for tokens...")
    tokens = exchange_code_for_tokens(auth_code)
    
    if tokens:
        print("\n✅ Successfully generated tokens!")
        print("=" * 50)
        print(f"Access Token:  {tokens.get('access_token', 'N/A')}")
        print(f"Refresh Token: {tokens.get('refresh_token', 'N/A')}")
        print(f"Expires In:    {tokens.get('expires_in', 'N/A')} seconds")
        print(f"Scope:         {tokens.get('scope', 'N/A')}")
        
        if 'refresh_token' in tokens:
            print(f"\n🔧 Update your config.py with this refresh token:")
            print(f"zoho_refresh_token: str = Field(\"{tokens['refresh_token']}\", env=\"ZOHO_REFRESH_TOKEN\")")
        else:
            print("\n⚠️  No refresh token in response. Make sure access_type=offline was used.")
    else:
        print("\n❌ Failed to generate tokens. Check the error above.")

if __name__ == "__main__":
    main()