#!/usr/bin/env python3
"""
Simple script to get Zoho refresh token
"""

import requests
import json
import sys
from pathlib import Path

def get_refresh_token():
    """Get refresh token from authorization code"""
    
    # Your credentials
    client_id = "1000.5D3QB5PNVW1G3TIM26OX73VX34GRMH"
    client_secret = "c1fe544d4217d145016d2b03ee78afa084498e04f4"
    code = "1000.4bed70f57f955c7e2d6b02cf278dad51.ff0648da3371480afcdacc3f3167a80f"
    
    print("🔄 Getting refresh token from Zoho...")
    
    url = "https://accounts.zoho.com/oauth/v2/token"
    
    data = {
        "grant_type": "authorization_code",
        "client_id": client_id,
        "client_secret": client_secret,
        "code": code
    }
    
    try:
        # Use shorter timeout
        response = requests.post(url, data=data, timeout=10)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            token_data = response.json()
            refresh_token = token_data.get("refresh_token")
            
            if refresh_token:
                print(f"✅ Success! Refresh Token: {refresh_token}")
                
                # Update .env file
                env_path = Path(__file__).parent / ".env"
                
                if env_path.exists():
                    # Read current content
                    with open(env_path, 'r') as f:
                        content = f.read()
                    
                    # Replace the refresh token line
                    updated_content = content.replace(
                        "ZOHO_REFRESH_TOKEN=",
                        f"ZOHO_REFRESH_TOKEN={refresh_token}"
                    )
                    
                    # Write back
                    with open(env_path, 'w') as f:
                        f.write(updated_content)
                    
                    print("✅ Updated .env file with refresh token")
                    return True
                else:
                    print("❌ .env file not found")
                    return False
            else:
                print("❌ No refresh token in response")
                return False
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        print("❌ Request timed out")
        return False
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

def test_connection():
    """Test the Zoho connection"""
    
    # Read refresh token from .env
    env_path = Path(__file__).parent / ".env"
    
    if not env_path.exists():
        print("❌ .env file not found")
        return False
    
    with open(env_path, 'r') as f:
        content = f.read()
    
    # Extract refresh token
    refresh_token = None
    for line in content.split('\n'):
        if line.startswith('ZOHO_REFRESH_TOKEN='):
            refresh_token = line.split('=', 1)[1].strip()
            break
    
    if not refresh_token:
        print("❌ No refresh token found in .env")
        return False
    
    print(f"🔄 Testing connection with refresh token: {refresh_token[:20]}...")
    
    # Get access token
    client_id = "1000.5D3QB5PNVW1G3TIM26OX73VX34GRMH"
    client_secret = "c1fe544d4217d145016d2b03ee78afa084498e04f4"
    
    url = "https://accounts.zoho.com/oauth/v2/token"
    
    data = {
        "refresh_token": refresh_token,
        "client_id": client_id,
        "client_secret": client_secret,
        "grant_type": "refresh_token"
    }
    
    try:
        response = requests.post(url, data=data, timeout=10)
        
        if response.status_code == 200:
            token_data = response.json()
            access_token = token_data.get("access_token")
            
            if access_token:
                print(f"✅ Got access token: {access_token[:20]}...")
                
                # Test API call
                api_url = "https://www.zohoapis.com/crm/v2/Deals"
                headers = {
                    "Authorization": f"Zoho-oauthtoken {access_token}",
                    "Content-Type": "application/json"
                }
                
                api_response = requests.get(f"{api_url}?per_page=1", headers=headers, timeout=10)
                
                if api_response.status_code == 200:
                    data = api_response.json()
                    print(f"✅ API test successful!")
                    print(f"📊 Response: {json.dumps(data, indent=2)}")
                    return True
                else:
                    print(f"❌ API test failed: {api_response.status_code}")
                    print(f"Response: {api_response.text}")
                    return False
            else:
                print("❌ No access token received")
                return False
        else:
            print(f"❌ Token refresh failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Connection test failed: {str(e)}")
        return False

if __name__ == "__main__":
    print("🚀 Zoho CRM Setup")
    print("=" * 30)
    
    # Step 1: Get refresh token
    if get_refresh_token():
        print("\n" + "=" * 30)
        print("🧪 Testing connection...")
        
        # Step 2: Test connection
        if test_connection():
            print("\n🎉 Zoho CRM integration setup completed successfully!")
        else:
            print("\n⚠️  Setup completed but connection test failed.")
    else:
        print("\n❌ Failed to get refresh token.")
