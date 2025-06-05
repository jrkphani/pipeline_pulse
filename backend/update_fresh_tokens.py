#!/usr/bin/env python3
"""
Script to update AWS Secrets Manager with fresh Zoho tokens
"""
import json
import requests
import boto3
from botocore.exceptions import ClientError

def exchange_auth_code_for_tokens():
    """Exchange the authorization code for fresh access and refresh tokens"""
    
    # Fresh authorization code you generated
    auth_code = "1000.3a8225b102d963c52c51c8f0552fe248.d619465e78e37dcfb637ec73bbee0406"
    
    # Production credentials
    client_id = "1000.JKDZ5EYYE175QA1WGK5UVGM2R37KAY"
    client_secret = "47b3ac5c29d2168b8d5c529fc2aa1f9c93da5c1be7"
    redirect_uri = "https://api.1chsalesreports.com/api/zoho/auth/callback"
    
    # Token exchange URL
    token_url = "https://accounts.zoho.in/oauth/v2/token"
    
    # Prepare token exchange request
    token_data = {
        "grant_type": "authorization_code",
        "client_id": client_id,
        "client_secret": client_secret,
        "redirect_uri": redirect_uri,
        "code": auth_code
    }
    
    print("🔄 Exchanging authorization code for tokens...")
    
    try:
        response = requests.post(token_url, data=token_data, timeout=30)
        response.raise_for_status()
        
        token_response = response.json()
        
        if "access_token" in token_response and "refresh_token" in token_response:
            print("✅ Token exchange successful!")
            print(f"   Access Token: {token_response['access_token'][:20]}...")
            print(f"   Refresh Token: {token_response['refresh_token'][:20]}...")
            print(f"   Expires In: {token_response.get('expires_in', 'N/A')} seconds")
            
            return token_response
        else:
            print(f"❌ Token exchange failed: {token_response}")
            return None
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Token exchange request failed: {e}")
        return None
    except Exception as e:
        print(f"❌ Unexpected error during token exchange: {e}")
        return None

def update_aws_secrets(tokens):
    """Update AWS Secrets Manager with fresh tokens"""

    if not tokens:
        print("❌ No tokens to update")
        return False

    print("🔄 Updating AWS Secrets Manager...")

    try:
        # Create AWS Secrets Manager client
        client = boto3.client('secretsmanager', region_name='us-east-1')

        # Update Zoho secrets
        zoho_secrets = {
            "client_id": "1000.JKDZ5EYYE175QA1WGK5UVGM2R37KAY",
            "client_secret": "47b3ac5c29d2168b8d5c529fc2aa1f9c93da5c1be7",
            "access_token": tokens["access_token"],
            "refresh_token": tokens["refresh_token"],
            "base_url": "https://www.zohoapis.in/crm/v8",
            "accounts_url": "https://accounts.zoho.in"
        }

        # Update the secret
        client.update_secret(
            SecretId="zoho-crm-credentials",
            SecretString=json.dumps(zoho_secrets)
        )

        print("✅ AWS Secrets Manager updated successfully!")
        print("   Updated secrets:")
        for key, value in zoho_secrets.items():
            if key in ["access_token", "refresh_token", "client_secret"]:
                print(f"   - {key}: {value[:20]}...")
            else:
                print(f"   - {key}: {value}")

        return True

    except ClientError as e:
        print(f"❌ AWS Secrets Manager error: {e}")
        return False
    except Exception as e:
        print(f"❌ Failed to update AWS Secrets Manager: {e}")
        return False

def test_fresh_tokens():
    """Test the fresh tokens by making a simple API call"""

    print("🔄 Testing fresh tokens...")

    try:
        # Get secrets from AWS
        client = boto3.client('secretsmanager', region_name='us-east-1')
        response = client.get_secret_value(SecretId="zoho-crm-credentials")
        secrets = json.loads(response['SecretString'])

        if not secrets:
            print("❌ Could not retrieve secrets from AWS")
            return False

        # Test API call to get user info
        headers = {
            "Authorization": f"Zoho-oauthtoken {secrets['access_token']}",
            "Content-Type": "application/json"
        }

        test_url = f"{secrets['base_url']}/users?type=CurrentUser"

        response = requests.get(test_url, headers=headers, timeout=30)
        response.raise_for_status()

        user_data = response.json()

        if "users" in user_data and len(user_data["users"]) > 0:
            user = user_data["users"][0]
            print("✅ Token test successful!")
            print(f"   User: {user.get('full_name', 'N/A')}")
            print(f"   Email: {user.get('email', 'N/A')}")
            print(f"   Organization: {user.get('org_name', 'N/A')}")
            return True
        else:
            print(f"❌ Unexpected API response: {user_data}")
            return False

    except ClientError as e:
        print(f"❌ AWS Secrets Manager error: {e}")
        return False
    except requests.exceptions.RequestException as e:
        print(f"❌ API test request failed: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error during token test: {e}")
        return False

def main():
    """Main function to update and test fresh tokens"""

    print("🚀 Starting fresh token update process...")
    print("=" * 50)

    # Step 1: Exchange authorization code for tokens
    tokens = exchange_auth_code_for_tokens()
    if not tokens:
        print("❌ Failed to get fresh tokens. Exiting.")
        return

    print()

    # Step 2: Update AWS Secrets Manager
    success = update_aws_secrets(tokens)
    if not success:
        print("❌ Failed to update AWS Secrets Manager. Exiting.")
        return

    print()

    # Step 3: Test the fresh tokens
    test_success = test_fresh_tokens()
    if test_success:
        print()
        print("🎉 SUCCESS! Fresh tokens are working!")
        print("   - Tokens exchanged successfully")
        print("   - AWS Secrets Manager updated")
        print("   - API connection verified")
        print()
        print("✅ Your Zoho CRM integration should now be working!")
    else:
        print()
        print("⚠️  Tokens updated but test failed. Please check manually.")

if __name__ == "__main__":
    main()
