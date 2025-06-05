#!/usr/bin/env python3
"""
Zoho Token Refresh Helper
Generate new authorization URL and exchange code for fresh tokens
"""

import asyncio
import httpx
import os
import sys
import urllib.parse
from datetime import datetime

# Add backend to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

# Load environment variables from backend/.env
from dotenv import load_dotenv
backend_env_path = os.path.join(os.path.dirname(__file__), '..', 'backend', '.env')
load_dotenv(backend_env_path)

from app.core.config import settings


def generate_authorization_url():
    """Generate Zoho authorization URL"""
    
    print("🔗 Generating Zoho Authorization URL")
    print("=" * 50)
    
    client_id = settings.ZOHO_CLIENT_ID
    accounts_url = settings.ZOHO_ACCOUNTS_URL
    
    # Use localhost for development
    redirect_uri = "http://localhost:8000/api/zoho/auth/callback"
    
    # Required scopes for Pipeline Pulse
    scopes = [
        "ZohoCRM.modules.ALL",
        "ZohoCRM.settings.ALL", 
        "ZohoCRM.users.ALL",
        "ZohoCRM.org.ALL",
        "ZohoCRM.bulk.ALL"
    ]
    
    scope_string = ",".join(scopes)
    
    # Build authorization URL
    auth_params = {
        "scope": scope_string,
        "client_id": client_id,
        "response_type": "code",
        "access_type": "offline",
        "redirect_uri": redirect_uri
    }
    
    auth_url = f"{accounts_url}/oauth/v2/auth?" + urllib.parse.urlencode(auth_params)
    
    print(f"Client ID: {client_id}")
    print(f"Redirect URI: {redirect_uri}")
    print(f"Scopes: {scope_string}")
    print()
    print("🌐 Authorization URL:")
    print(auth_url)
    print()
    
    print("📋 Instructions:")
    print("1. Copy the URL above and open it in your browser")
    print("2. Log in to your Zoho account")
    print("3. Grant permissions to the application")
    print("4. You'll be redirected to localhost (which will fail)")
    print("5. Copy the 'code' parameter from the URL")
    print("6. Run this script again with the code: python scripts/refresh-zoho-tokens.py <code>")
    print()
    
    return auth_url


async def exchange_code_for_tokens(authorization_code: str):
    """Exchange authorization code for access and refresh tokens"""
    
    print("🔄 Exchanging Authorization Code for Tokens")
    print("=" * 50)
    
    client_id = settings.ZOHO_CLIENT_ID
    client_secret = settings.ZOHO_CLIENT_SECRET
    accounts_url = settings.ZOHO_ACCOUNTS_URL
    
    redirect_uri = "http://localhost:8000/api/zoho/auth/callback"
    token_url = f"{accounts_url}/oauth/v2/token"
    
    data = {
        "grant_type": "authorization_code",
        "client_id": client_id,
        "client_secret": client_secret,
        "redirect_uri": redirect_uri,
        "code": authorization_code
    }
    
    print(f"🌐 Making request to: {token_url}")
    print(f"📤 Authorization Code: {authorization_code[:20]}...")
    print()
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(token_url, data=data)
            
            print(f"📥 Response Status: {response.status_code}")
            print(f"📥 Response Body:")
            response_text = response.text
            print(response_text)
            print()
            
            if response.status_code == 200:
                try:
                    token_data = response.json()
                    
                    access_token = token_data.get("access_token")
                    refresh_token = token_data.get("refresh_token")
                    expires_in = token_data.get("expires_in")
                    
                    if access_token and refresh_token:
                        print("✅ Token exchange successful!")
                        print(f"   Access Token: {access_token[:20]}...")
                        print(f"   Refresh Token: {refresh_token[:20]}...")
                        print(f"   Expires In: {expires_in} seconds")
                        print()
                        
                        # Update .env file
                        await update_env_file(refresh_token)
                        
                        # Test the new tokens
                        await test_new_tokens(access_token)
                        
                        return True
                    else:
                        print("❌ Missing tokens in response")
                        return False
                        
                except Exception as json_error:
                    print(f"❌ Error parsing JSON response: {str(json_error)}")
                    return False
            else:
                print(f"❌ Token exchange failed with status {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Raw error: {response.text}")
                return False
                
    except Exception as e:
        print(f"❌ Token exchange error: {str(e)}")
        return False


async def update_env_file(new_refresh_token: str):
    """Update the .env file with new refresh token"""
    
    print("📝 Updating .env file with new refresh token...")
    
    env_file_path = os.path.join(os.path.dirname(__file__), '..', 'backend', '.env')
    
    try:
        # Read current .env file
        with open(env_file_path, 'r') as f:
            lines = f.readlines()
        
        # Update refresh token line
        updated_lines = []
        token_updated = False
        
        for line in lines:
            if line.startswith('ZOHO_REFRESH_TOKEN='):
                updated_lines.append(f'ZOHO_REFRESH_TOKEN={new_refresh_token}\n')
                token_updated = True
            else:
                updated_lines.append(line)
        
        # If token line wasn't found, add it
        if not token_updated:
            updated_lines.append(f'ZOHO_REFRESH_TOKEN={new_refresh_token}\n')
        
        # Write updated .env file
        with open(env_file_path, 'w') as f:
            f.writelines(updated_lines)
        
        print(f"✅ Updated {env_file_path}")
        print("   New refresh token saved to .env file")
        
    except Exception as e:
        print(f"❌ Error updating .env file: {str(e)}")
        print(f"   Please manually update ZOHO_REFRESH_TOKEN in {env_file_path}")
        print(f"   New token: {new_refresh_token}")


async def test_new_tokens(access_token: str):
    """Test the new access token"""
    
    print("\n🧪 Testing New Access Token")
    print("-" * 40)
    
    base_url = settings.ZOHO_BASE_URL
    org_url = f"{base_url}/org"
    
    headers = {
        "Authorization": f"Zoho-oauthtoken {access_token}",
        "Content-Type": "application/json"
    }
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(org_url, headers=headers)
            
            if response.status_code == 200:
                org_data = response.json()
                print("✅ New token is working!")
                
                if "org" in org_data and org_data["org"]:
                    org = org_data["org"][0]
                    print(f"   Organization: {org.get('company_name', 'Unknown')}")
                    print(f"   Country: {org.get('country', 'Unknown')}")
                
                return True
            else:
                print(f"❌ Token test failed: {response.status_code}")
                print(f"   Response: {response.text}")
                return False
                
    except Exception as e:
        print(f"❌ Token test error: {str(e)}")
        return False


async def main():
    """Main function"""
    
    print(f"🚀 Zoho Token Refresh Helper - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Check if authorization code was provided
    if len(sys.argv) > 1:
        authorization_code = sys.argv[1]
        print(f"📥 Received authorization code: {authorization_code[:20]}...")
        print()
        
        success = await exchange_code_for_tokens(authorization_code)
        
        if success:
            print("\n🎉 Token refresh completed successfully!")
            print("✅ You can now run the Zoho API tests again.")
        else:
            print("\n❌ Token refresh failed.")
            print("💡 Please check the authorization code and try again.")
    else:
        # Generate authorization URL
        auth_url = generate_authorization_url()
        
        print("⚠️ Current refresh token is invalid/expired.")
        print("🔄 Please follow the instructions above to get a new token.")
    
    print(f"\n🕒 Completed at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")


if __name__ == "__main__":
    asyncio.run(main())
