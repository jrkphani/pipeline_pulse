#!/usr/bin/env python3
"""
One-time setup script to obtain and save Zoho refresh token.

This script helps you manually exchange a grant token for a refresh token
and save it to your .env file for permanent use.

Usage:
1. Go to Zoho API Console and generate a grant token
2. Run: python setup_zoho_refresh_token.py <grant_token>
3. The refresh token will be saved to .env file
4. Restart your application to use the new refresh token
"""

import asyncio
import sys
from app.core.zoho_token_exchange import exchange_grant_token_for_refresh_token, save_refresh_token_to_config


async def main():
    if len(sys.argv) != 2:
        print("Usage: python setup_zoho_refresh_token.py <grant_token>")
        print("\nTo get a grant token:")
        print("1. Go to https://api-console.zoho.com")
        print("2. Select your OAuth app")
        print("3. Generate a grant token with required scopes")
        print("4. Copy the grant token and use it with this script")
        sys.exit(1)
    
    grant_token = sys.argv[1]
    
    print("🔄 Exchanging grant token for refresh token...")
    token_data = await exchange_grant_token_for_refresh_token(grant_token)
    
    if not token_data:
        print("❌ Failed to exchange grant token. Please check:")
        print("   - Grant token is valid and not expired")
        print("   - Client ID and secret are correct in .env file")
        print("   - Redirect URI matches your Zoho app configuration")
        sys.exit(1)
    
    if not token_data.get("refresh_token"):
        print("❌ No refresh token received. Token data:")
        for key, value in token_data.items():
            print(f"   {key}: {value}")
        print("\nThis might mean your Zoho app is not configured for refresh tokens.")
        sys.exit(1)
    
    print("✅ Token exchange successful!")
    print(f"   Access token: {'Yes' if token_data.get('access_token') else 'No'}")
    print(f"   Refresh token: {'Yes' if token_data.get('refresh_token') else 'No'}")
    print(f"   Expires in: {token_data.get('expires_in')} seconds")
    print(f"   Scope: {token_data.get('scope')}")
    
    print("\n💾 Saving refresh token to .env file...")
    refresh_token = token_data["refresh_token"]
    success = await save_refresh_token_to_config(refresh_token)
    
    if success:
        print("✅ Refresh token saved successfully!")
        print("\n🎉 Setup complete! You can now:")
        print("   1. Restart your backend server")
        print("   2. The Zoho SDK will automatically use the refresh token")
        print("   3. No more OAuth flow needed for API calls")
    else:
        print("❌ Failed to save refresh token to .env file")
        print(f"   Manual step: Add this line to your .env file:")
        print(f"   ZOHO_REFRESH_TOKEN={refresh_token}")


if __name__ == "__main__":
    asyncio.run(main())