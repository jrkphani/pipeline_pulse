#!/usr/bin/env python3
"""
Zoho CRM Setup for India Data Center
"""

import requests
import json
import sys
from pathlib import Path

def get_refresh_token():
    """Get refresh token from authorization code using India endpoints"""
    
    # Your credentials (updated with fresh code)
    client_id = "1000.5D3QB5PNVW1G3TIM26OX73VX34GRMH"
    client_secret = "c1fe544d4217d145016d2b03ee78afa084498e04f4"
    code = "1000.0646dfd795b795c77f83c4364b80553b.050d28502bc7f953c8b317a6f41efa89"
    
    print("🇮🇳 Setting up Zoho CRM for India Data Center...")
    print(f"Using India endpoints: accounts.zoho.in")
    
    # Use India-specific endpoint
    url = "https://accounts.zoho.in/oauth/v2/token"
    
    data = {
        "grant_type": "authorization_code",
        "client_id": client_id,
        "client_secret": client_secret,
        "code": code
    }
    
    print("🔄 Exchanging authorization code for tokens...")
    
    try:
        response = requests.post(url, data=data, timeout=15)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            token_data = response.json()
            print("✅ Success! Token response:")
            print(json.dumps(token_data, indent=2))
            
            refresh_token = token_data.get("refresh_token")
            access_token = token_data.get("access_token")
            
            if refresh_token:
                print(f"\n🔑 Refresh Token: {refresh_token}")
                
                # Update .env file
                env_path = Path(__file__).parent / ".env"
                
                if env_path.exists():
                    # Read current content
                    with open(env_path, 'r') as f:
                        lines = f.readlines()
                    
                    # Update the refresh token line
                    updated_lines = []
                    for line in lines:
                        if line.startswith("ZOHO_REFRESH_TOKEN="):
                            updated_lines.append(f"ZOHO_REFRESH_TOKEN={refresh_token}\n")
                        else:
                            updated_lines.append(line)
                    
                    # Write back
                    with open(env_path, 'w') as f:
                        f.writelines(updated_lines)
                    
                    print("✅ Updated .env file with refresh token")
                    
                    # Test the connection immediately
                    if access_token:
                        test_api_connection(access_token)
                    
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
            
            # Try to parse error details
            try:
                error_data = response.json()
                if "error" in error_data:
                    print(f"Error details: {error_data['error']}")
                if "error_description" in error_data:
                    print(f"Description: {error_data['error_description']}")
            except:
                pass
            
            return False
            
    except requests.exceptions.Timeout:
        print("❌ Request timed out - check your internet connection")
        return False
    except requests.exceptions.ConnectionError:
        print("❌ Connection error - check your internet connection")
        return False
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

def test_api_connection(access_token):
    """Test API connection with access token"""
    
    print("\n🧪 Testing API connection...")
    
    # Use India-specific API endpoint
    api_url = "https://www.zohoapis.in/crm/v2/Deals"
    
    headers = {
        "Authorization": f"Zoho-oauthtoken {access_token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(f"{api_url}?per_page=1", headers=headers, timeout=15)
        
        print(f"API Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            deals = data.get("data", [])
            print(f"✅ API connection successful!")
            print(f"📊 Found {len(deals)} deal(s) in response")
            
            if deals:
                first_deal = deals[0]
                print(f"Sample deal: {first_deal.get('Deal_Name', 'N/A')}")
            
            return True
        else:
            print(f"❌ API test failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ API test error: {str(e)}")
        return False

def test_refresh_token():
    """Test refresh token functionality"""
    
    print("\n🔄 Testing refresh token...")
    
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
    
    print(f"Using refresh token: {refresh_token[:20]}...")
    
    # Get new access token using refresh token
    client_id = "1000.5D3QB5PNVW1G3TIM26OX73VX34GRMH"
    client_secret = "c1fe544d4217d145016d2b03ee78afa084498e04f4"
    
    url = "https://accounts.zoho.in/oauth/v2/token"
    
    data = {
        "refresh_token": refresh_token,
        "client_id": client_id,
        "client_secret": client_secret,
        "grant_type": "refresh_token"
    }
    
    try:
        response = requests.post(url, data=data, timeout=15)
        
        if response.status_code == 200:
            token_data = response.json()
            access_token = token_data.get("access_token")
            
            if access_token:
                print(f"✅ Got new access token: {access_token[:20]}...")
                
                # Test API with new token
                return test_api_connection(access_token)
            else:
                print("❌ No access token received")
                return False
        else:
            print(f"❌ Token refresh failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Refresh token test failed: {str(e)}")
        return False

if __name__ == "__main__":
    print("🚀 Zoho CRM Setup for India")
    print("=" * 40)
    
    # Step 1: Get refresh token
    if get_refresh_token():
        print("\n" + "=" * 40)
        print("🧪 Testing refresh token functionality...")
        
        # Step 2: Test refresh token
        if test_refresh_token():
            print("\n🎉 Zoho CRM integration setup completed successfully!")
            print("✅ All tests passed - you can now use CRM sync features")
        else:
            print("\n⚠️  Setup completed but refresh token test failed.")
    else:
        print("\n❌ Failed to get refresh token.")
        print("💡 The authorization code may have expired. Please generate a new one.")
