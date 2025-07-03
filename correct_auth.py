#!/usr/bin/env python3
"""
Correct Zoho OAuth with proper redirect URI
"""

import urllib.parse

def generate_correct_auth_url():
    client_id = "1000.JKDZ5EYYE175QA1WGK5UVGM2R37KAY"
    
    # Use the CORRECT redirect URI from your Zoho app
    redirect_uri = "http://localhost:8000/api/zoho/auth/callback"
    scope = "ZohoCRM.modules.ALL,ZohoCRM.settings.ALL,ZohoCRM.org.ALL"
    
    params = {
        "scope": scope,
        "client_id": client_id,
        "response_type": "code",
        "access_type": "offline",
        "redirect_uri": redirect_uri
    }
    
    auth_url = "https://accounts.zoho.in/oauth/v2/auth"
    authorization_url = f"{auth_url}?{urllib.parse.urlencode(params)}"
    
    print("🔑 Correct Zoho OAuth Setup")
    print("=" * 60)
    print(f"✅ Using correct redirect URI: {redirect_uri}")
    print()
    print("📋 STEP 1: Click this URL:")
    print("-" * 60)
    print(authorization_url)
    print("-" * 60)
    print()
    print("📋 STEP 2: After authorization, you'll be redirected to:")
    print(f"   {redirect_uri}?code=AUTHORIZATION_CODE")
    print()
    print("📋 STEP 3: Copy the 'code' parameter and provide it back")

if __name__ == "__main__":
    generate_correct_auth_url()