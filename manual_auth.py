#!/usr/bin/env python3
"""
Manual Zoho OAuth - works with any redirect URI
"""

def generate_manual_auth():
    client_id = "1000.JKDZ5EYYE175QA1WGK5UVGM2R37KAY"
    
    print("🔑 Manual Zoho OAuth Setup")
    print("=" * 50)
    print()
    print("If your redirect URI doesn't match, try these alternative URLs:")
    print()
    
    # Common redirect URIs that might be configured
    redirect_options = [
        "urn:ietf:wg:oauth:2.0:oob",  # Out-of-band flow
        "http://localhost:3000/auth/callback",
        "http://localhost:5173/auth/callback", 
        "https://your-app-domain.com/auth/callback"
    ]
    
    for i, redirect_uri in enumerate(redirect_options, 1):
        auth_url = f"https://accounts.zoho.in/oauth/v2/auth?scope=ZohoCRM.modules.ALL,ZohoCRM.settings.ALL,ZohoCRM.org.ALL&client_id={client_id}&response_type=code&access_type=offline&redirect_uri={redirect_uri}"
        
        print(f"Option {i}: {redirect_uri}")
        print(f"URL: {auth_url}")
        print()
    
    print("📋 Instructions:")
    print("1. Try each URL above until one works")
    print("2. If using 'urn:ietf:wg:oauth:2.0:oob', the code will be displayed directly")
    print("3. Copy the authorization code")
    print("4. Let me know which option worked!")

if __name__ == "__main__":
    generate_manual_auth()