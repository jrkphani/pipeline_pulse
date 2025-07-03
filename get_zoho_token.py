#!/usr/bin/env python3
"""
Zoho OAuth Token Generator for Pipeline Pulse
Generates refresh token for Zoho CRM API access
"""

import requests
import urllib.parse
from urllib.parse import parse_qs

def get_zoho_refresh_token():
    """Interactive script to get Zoho refresh token"""
    
    print("🔑 Zoho CRM OAuth Setup for Pipeline Pulse")
    print("=" * 50)
    
    # Get credentials from user
    client_id = input("Enter your Zoho Client ID: ").strip()
    client_secret = input("Enter your Zoho Client Secret: ").strip()
    
    if not client_id or not client_secret:
        print("❌ Client ID and Secret are required!")
        return
    
    # Step 1: Generate authorization URL
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
    
    print(f"\n🌐 Step 1: Open this URL in your browser:")
    print(f"   {authorization_url}")
    print(f"\n📋 Step 2: After authorization, you'll be redirected to:")
    print(f"   {redirect_uri}?code=AUTHORIZATION_CODE")
    print(f"\n🔍 Step 3: Copy the 'code' parameter from the URL")
    
    # Get authorization code from user
    auth_code = input("\nEnter the authorization code: ").strip()
    
    if not auth_code:
        print("❌ Authorization code is required!")
        return
    
    # Step 2: Exchange code for tokens
    token_url = "https://accounts.zoho.in/oauth/v2/token"
    
    token_data = {
        "grant_type": "authorization_code",
        "client_id": client_id,
        "client_secret": client_secret,
        "redirect_uri": redirect_uri,
        "code": auth_code
    }
    
    print(f"\n🔄 Exchanging authorization code for tokens...")
    
    try:
        response = requests.post(token_url, data=token_data)
        
        if response.status_code == 200:
            tokens = response.json()
            
            print(f"\n✅ Success! Here are your tokens:")
            print(f"=" * 50)
            print(f"Access Token: {tokens.get('access_token', 'N/A')}")
            print(f"Refresh Token: {tokens.get('refresh_token', 'N/A')}")
            print(f"Expires In: {tokens.get('expires_in', 'N/A')} seconds")
            
            # Save to .env file
            refresh_token = tokens.get('refresh_token')
            if refresh_token:
                print(f"\n💾 Setting up your .env file...")
                env_content = f"""# Zoho CRM Configuration
ZOHO_CLIENT_ID={client_id}
ZOHO_CLIENT_SECRET={client_secret}
ZOHO_REFRESH_TOKEN={refresh_token}

# Additional settings
ZOHO_API_VERSION=v8
ZOHO_BASE_URL=https://www.zohoapis.in/crm/v8
ZOHO_ACCOUNTS_URL=https://accounts.zoho.in
"""
                
                with open('.env', 'w') as f:
                    f.write(env_content)
                
                print(f"✅ Saved credentials to .env file")
                print(f"\n🚀 Next steps:")
                print(f"1. Restart your backend server")
                print(f"2. The authentication error should be resolved")
                print(f"3. Your app will now sync with Zoho CRM!")
                
        else:
            print(f"\n❌ Error getting tokens:")
            print(f"Status: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")

if __name__ == "__main__":
    get_zoho_refresh_token()