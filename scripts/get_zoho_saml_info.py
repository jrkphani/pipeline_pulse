#!/usr/bin/env python3
"""
Script to fetch Zoho organization information for SAML configuration
"""

import requests
import json
import sys

def get_access_token(client_id, client_secret, code):
    """Exchange authorization code for access token"""
    
    token_url = "https://accounts.zoho.com/oauth/v2/token"
    
    data = {
        "grant_type": "authorization_code",
        "client_id": client_id,
        "client_secret": client_secret,
        "code": code
    }
    
    try:
        response = requests.post(token_url, data=data)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error getting access token: {e}")
        return None

def get_org_info(access_token):
    """Get organization information from Zoho CRM"""
    
    org_url = "https://www.zohoapis.com/crm/v2/org"
    
    headers = {
        "Authorization": f"Zoho-oauthtoken {access_token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(org_url, headers=headers)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error getting org info: {e}")
        return None

def get_user_info(access_token):
    """Get current user information"""
    
    user_url = "https://www.zohoapis.com/crm/v2/users?type=CurrentUser"
    
    headers = {
        "Authorization": f"Zoho-oauthtoken {access_token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(user_url, headers=headers)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error getting user info: {e}")
        return None

def main():
    # Your NEW Server Application OAuth credentials from Zoho API Console
    # Update these with your actual client ID and secret from the "Client Secret" tab
    client_id = "YOUR_NEW_CLIENT_ID_FROM_ZOHO_CONSOLE"
    client_secret = "YOUR_NEW_CLIENT_SECRET_FROM_ZOHO_CONSOLE"

    print("🔑 To get a new authorization code, visit this URL:")
    print(f"https://accounts.zoho.in/oauth/v2/auth?scope=ZohoCRM.modules.ALL,ZohoCRM.settings.ALL,ZohoCRM.users.ALL,ZohoCRM.org.ALL,ZohoCRM.bulk.ALL&client_id={client_id}&response_type=code&access_type=offline&redirect_uri=https://1chsalesreports.com/api/auth/zoho/oauth-callback")
    print("\nAfter authorization, you'll get a code. Update the 'code' variable below and run again.")

    # You'll need to update this with the new authorization code
    code = "UPDATE_WITH_NEW_CODE_FROM_AUTHORIZATION_URL"

    if code == "UPDATE_WITH_NEW_CODE_FROM_AUTHORIZATION_URL":
        print("\n❌ Please update the authorization code and run again.")
        return
    
    print("🔍 Fetching Zoho organization information for SAML configuration...")
    print("=" * 70)
    
    # Step 1: Get access token
    print("1. Getting access token...")
    token_response = get_access_token(client_id, client_secret, code)
    
    if not token_response or 'access_token' not in token_response:
        print("❌ Failed to get access token")
        if token_response:
            print(f"Response: {json.dumps(token_response, indent=2)}")
        sys.exit(1)
    
    access_token = token_response['access_token']
    print("✅ Access token obtained successfully")
    
    # Step 2: Get organization info
    print("\n2. Getting organization information...")
    org_info = get_org_info(access_token)
    
    if not org_info:
        print("❌ Failed to get organization info")
        sys.exit(1)
    
    # Step 3: Get user info
    print("\n3. Getting user information...")
    user_info = get_user_info(access_token)
    
    if not user_info:
        print("❌ Failed to get user info")
        sys.exit(1)
    
    # Extract relevant information
    org_data = org_info.get('org', [{}])[0] if org_info.get('org') else {}
    user_data = user_info.get('users', [{}])[0] if user_info.get('users') else {}
    
    print("\n" + "=" * 70)
    print("📋 ZOHO ORGANIZATION INFORMATION FOR SAML")
    print("=" * 70)
    
    # Organization details
    org_id = org_data.get('id', 'N/A')
    org_name = org_data.get('company_name', 'N/A')
    domain = org_data.get('primary_email', '').split('@')[-1] if org_data.get('primary_email') else 'N/A'
    
    print(f"Organization ID: {org_id}")
    print(f"Organization Name: {org_name}")
    print(f"Primary Domain: {domain}")
    print(f"Zoho Domain: {org_data.get('zgid', 'N/A')}")
    print(f"Country: {org_data.get('country', 'N/A')}")
    print(f"Time Zone: {org_data.get('time_zone', 'N/A')}")
    
    # User details
    print(f"\nCurrent User: {user_data.get('full_name', 'N/A')}")
    print(f"User Email: {user_data.get('email', 'N/A')}")
    print(f"User ID: {user_data.get('id', 'N/A')}")
    
    # Generate SAML URLs
    zgid = org_data.get('zgid', org_id)
    
    print("\n" + "=" * 70)
    print("🔐 SAML CONFIGURATION URLS")
    print("=" * 70)
    
    print(f"SAML Entity ID: https://accounts.zoho.com")
    print(f"SAML SSO URL: https://accounts.zoho.com/samlauthrequest/{zgid}")
    print(f"SAML Metadata URL: https://accounts.zoho.com/samlresponse/{zgid}")
    print(f"SAML Logout URL: https://accounts.zoho.com/samllogout/{zgid}")
    
    print("\n" + "=" * 70)
    print("📝 ENVIRONMENT VARIABLES FOR PIPELINE PULSE")
    print("=" * 70)
    
    print("# Add these to your .env file:")
    print(f"ZOHO_SAML_ENTITY_ID=https://accounts.zoho.com")
    print(f"ZOHO_SAML_SSO_URL=https://accounts.zoho.com/samlauthrequest/{zgid}")
    print(f"ZOHO_SAML_METADATA_URL=https://accounts.zoho.com/samlresponse/{zgid}")
    print(f"ZOHO_SAML_SLS_URL=https://accounts.zoho.com/samllogout/{zgid}")
    
    # Save to file for reference
    config_data = {
        "organization": {
            "id": org_id,
            "name": org_name,
            "domain": domain,
            "zgid": zgid,
            "country": org_data.get('country'),
            "timezone": org_data.get('time_zone')
        },
        "saml_urls": {
            "entity_id": "https://accounts.zoho.com",
            "sso_url": f"https://accounts.zoho.com/samlauthrequest/{zgid}",
            "metadata_url": f"https://accounts.zoho.com/samlresponse/{zgid}",
            "logout_url": f"https://accounts.zoho.com/samllogout/{zgid}"
        },
        "user": {
            "name": user_data.get('full_name'),
            "email": user_data.get('email'),
            "id": user_data.get('id')
        }
    }
    
    with open('zoho_saml_config.json', 'w') as f:
        json.dump(config_data, f, indent=2)
    
    print(f"\n💾 Configuration saved to: zoho_saml_config.json")
    print("\n✅ Zoho SAML information extraction complete!")

if __name__ == "__main__":
    main()
