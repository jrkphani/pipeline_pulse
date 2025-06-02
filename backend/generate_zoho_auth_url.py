#!/usr/bin/env python3
"""
Generate Zoho OAuth Authorization URL for India Data Center
"""

import urllib.parse

def generate_auth_url():
    """Generate the authorization URL for Zoho CRM"""
    
    # Your app credentials
    client_id = "1000.5D3QB5PNVW1G3TIM26OX73VX34GRMH"
    
    # Scopes for CRM access
    scopes = [
        "ZohoCRM.modules.ALL",
        "ZohoCRM.settings.ALL", 
        "ZohoCRM.users.ALL",
        "ZohoCRM.org.ALL",
        "ZohoCRM.bulk.ALL"
    ]
    
    # Parameters for authorization URL
    params = {
        "scope": ",".join(scopes),
        "client_id": client_id,
        "response_type": "code",
        "access_type": "offline",
        "redirect_uri": "http://localhost:8000/auth/callback"
    }
    
    # Base URL for India data center
    base_url = "https://accounts.zoho.in/oauth/v2/auth"
    
    # Build the complete URL
    auth_url = f"{base_url}?" + urllib.parse.urlencode(params)
    
    return auth_url

def main():
    """Main function"""
    
    print("🇮🇳 Zoho CRM Authorization URL Generator (India Data Center)")
    print("=" * 60)
    
    auth_url = generate_auth_url()
    
    print("📋 INSTRUCTIONS:")
    print("1. Copy the URL below and paste it in your browser")
    print("2. Log in to your Zoho account")
    print("3. Grant permissions to the app")
    print("4. Copy the authorization code from the callback URL")
    print("5. Update the setup script with the new code")
    print()
    print("🔗 AUTHORIZATION URL:")
    print(auth_url)
    print()
    print("📝 After authorization, you'll be redirected to:")
    print("http://localhost:8000/auth/callback?code=YOUR_CODE_HERE")
    print()
    print("💡 Copy the 'code' parameter value and use it in the setup script")
    print()
    print("⚠️  Note: Authorization codes expire in ~10 minutes, so use it quickly!")

if __name__ == "__main__":
    main()
