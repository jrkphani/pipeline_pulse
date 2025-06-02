#!/usr/bin/env python3
"""
Zoho CRM Authentication Setup Script
This script exchanges the authorization code for access and refresh tokens
"""

import requests
import json
import sys
from pathlib import Path

def exchange_code_for_tokens(client_id, client_secret, code, redirect_uri="http://localhost:8000/auth/callback"):
    """
    Exchange authorization code for access and refresh tokens
    """
    
    token_url = "https://accounts.zoho.com/oauth/v2/token"
    
    data = {
        "grant_type": "authorization_code",
        "client_id": client_id,
        "client_secret": client_secret,
        "code": code,
        "redirect_uri": redirect_uri
    }
    
    print("🔄 Exchanging authorization code for tokens...")
    print(f"Client ID: {client_id}")
    print(f"Code: {code[:20]}...")
    
    try:
        response = requests.post(token_url, data=data)
        
        if response.status_code == 200:
            token_data = response.json()
            print("✅ Successfully obtained tokens!")
            print(f"Full response: {json.dumps(token_data, indent=2)}")

            access_token = token_data.get('access_token', 'N/A')
            refresh_token = token_data.get('refresh_token', 'N/A')

            print(f"Access Token: {access_token[:20] if access_token != 'N/A' else 'N/A'}...")
            print(f"Refresh Token: {refresh_token[:20] if refresh_token != 'N/A' else 'N/A'}...")
            print(f"Expires In: {token_data.get('expires_in', 'N/A')} seconds")
            print(f"Token Type: {token_data.get('token_type', 'N/A')}")

            return token_data
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Exception occurred: {str(e)}")
        return None

def update_env_file(client_id, client_secret, refresh_token):
    """
    Update the .env file with Zoho credentials
    """
    
    env_path = Path(__file__).parent / ".env"
    
    if not env_path.exists():
        print("❌ .env file not found!")
        return False
    
    # Read current .env content
    with open(env_path, 'r') as f:
        lines = f.readlines()
    
    # Update Zoho credentials
    updated_lines = []
    for line in lines:
        if line.startswith('ZOHO_CLIENT_ID='):
            updated_lines.append(f'ZOHO_CLIENT_ID={client_id}\n')
        elif line.startswith('ZOHO_CLIENT_SECRET='):
            updated_lines.append(f'ZOHO_CLIENT_SECRET={client_secret}\n')
        elif line.startswith('ZOHO_REFRESH_TOKEN='):
            updated_lines.append(f'ZOHO_REFRESH_TOKEN={refresh_token}\n')
        else:
            updated_lines.append(line)
    
    # Write updated content
    with open(env_path, 'w') as f:
        f.writelines(updated_lines)
    
    print("✅ Updated .env file with Zoho credentials")
    return True

def test_zoho_connection(client_id, client_secret, refresh_token):
    """
    Test the Zoho connection by getting an access token
    """
    
    token_url = "https://accounts.zoho.com/oauth/v2/token"
    
    data = {
        "refresh_token": refresh_token,
        "client_id": client_id,
        "client_secret": client_secret,
        "grant_type": "refresh_token"
    }
    
    print("🔄 Testing Zoho connection...")
    
    try:
        response = requests.post(token_url, data=data)
        
        if response.status_code == 200:
            token_data = response.json()
            access_token = token_data.get("access_token")
            
            # Test API call
            api_url = "https://www.zohoapis.com/crm/v2/Deals"
            headers = {
                "Authorization": f"Zoho-oauthtoken {access_token}",
                "Content-Type": "application/json"
            }
            
            api_response = requests.get(f"{api_url}?per_page=1", headers=headers)
            
            if api_response.status_code == 200:
                data = api_response.json()
                deals_count = len(data.get("data", []))
                print(f"✅ Successfully connected to Zoho CRM!")
                print(f"📊 Found {deals_count} deal(s) in first page")
                return True
            else:
                print(f"❌ API test failed: {api_response.status_code}")
                print(f"Response: {api_response.text}")
                return False
                
        else:
            print(f"❌ Token refresh failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Connection test failed: {str(e)}")
        return False

def main():
    """
    Main setup function
    """

    print("🚀 Zoho CRM Authentication Setup")
    print("=" * 40)

    # Your provided credentials (updated with fresh code)
    credentials = {
        "client_id": "1000.5D3QB5PNVW1G3TIM26OX73VX34GRMH",
        "client_secret": "c1fe544d4217d145016d2b03ee78afa084498e04f4",
        "code": "1000.4bed70f57f955c7e2d6b02cf278dad51.ff0648da3371480afcdacc3f3167a80f"
    }

    print("⚠️  Note: Authorization codes expire quickly (usually within 10 minutes)")
    print("If this fails, you may need to generate a new authorization code.")
    
    # Step 1: Exchange code for tokens
    token_data = exchange_code_for_tokens(
        credentials["client_id"],
        credentials["client_secret"],
        credentials["code"]
    )
    
    if not token_data:
        print("❌ Failed to get tokens. Exiting.")
        sys.exit(1)
    
    refresh_token = token_data.get("refresh_token")
    if not refresh_token:
        print("❌ No refresh token received. Exiting.")
        sys.exit(1)
    
    # Step 2: Update .env file
    success = update_env_file(
        credentials["client_id"],
        credentials["client_secret"],
        refresh_token
    )
    
    if not success:
        print("❌ Failed to update .env file. Exiting.")
        sys.exit(1)
    
    # Step 3: Test connection
    test_success = test_zoho_connection(
        credentials["client_id"],
        credentials["client_secret"],
        refresh_token
    )
    
    if test_success:
        print("\n🎉 Zoho CRM integration setup completed successfully!")
        print("You can now use the CRM sync features in Pipeline Pulse.")
    else:
        print("\n⚠️  Setup completed but connection test failed.")
        print("Please check your credentials and try again.")

if __name__ == "__main__":
    main()
