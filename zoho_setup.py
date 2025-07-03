#!/usr/bin/env python3
"""
Generate Zoho authorization URL for Pipeline Pulse
"""

import urllib.parse

def generate_auth_url():
    client_id = "1000.JKDZ5EYYE175QA1WGK5UVGM2R37KAY"
    
    # Authorization parameters
    auth_url = "https://accounts.zoho.in/oauth/v2/auth"
    redirect_uri = "http://localhost:8000/api/oauth/callback"
    scope = "ZohoCRM.modules.ALL,ZohoCRM.settings.ALL,ZohoCRM.org.ALL"
    
    params = {
        "scope": scope,
        "client_id": client_id,
        "response_type": "code",
        "access_type": "offline",
        "redirect_uri": redirect_uri
    }
    
    authorization_url = f"{auth_url}?{urllib.parse.urlencode(params)}"
    
    print("🔑 Zoho CRM OAuth Setup for Pipeline Pulse")
    print("=" * 60)
    print(f"Client ID: {client_id}")
    print(f"Redirect URI: {redirect_uri}")
    print(f"Scope: {scope}")
    print()
    print("📋 STEP 1: Open this URL in your browser:")
    print("-" * 60)
    print(authorization_url)
    print("-" * 60)
    print()
    print("📋 STEP 2: After clicking 'Accept', you'll be redirected to:")
    print("   http://localhost:8000/api/oauth/callback?code=AUTHORIZATION_CODE")
    print()
    print("📋 STEP 3: Copy the 'code' parameter from the redirected URL")
    print("   (It will be a long string after 'code=')")
    print()
    print("📋 STEP 4: Come back here and provide the authorization code")

if __name__ == "__main__":
    generate_auth_url()