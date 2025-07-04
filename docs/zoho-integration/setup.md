# Zoho Integration Setup Guide

## 🎯 Overview

This guide walks you through setting up complete Zoho integration for Pipeline Pulse, including SAML authentication and CRM API access.

## 📋 Prerequisites

- **Zoho CRM Organization**: Admin access with API permissions
- **Zoho Directory Access**: Admin privileges for SAML configuration
- **AWS Infrastructure**: Deployed and configured
- **Domain Access**: Control over production domain (`1chsalesreports.com`)

## 🔐 Part 1: SAML Authentication Setup

### Step 1: Create SAML Application in Zoho Directory

1. **Access Zoho Directory Admin Console**
   ```
   URL: https://directory.zoho.in/
   Navigate to: Applications → SAML Apps
   ```

2. **Create New SAML Application**
   ```
   Application Name: Pipeline Pulse Production
   Description: Sales analytics and pipeline management system
   Logo: Upload Pipeline Pulse logo (optional)
   ```

3. **Configure Service Provider Details**
   ```
   Entity ID: https://1chsalesreports.com
   ACS URL: https://1chsalesreports.com/api/auth/saml/acs
   Single Logout URL: https://1chsalesreports.com/api/auth/saml/logout
   Name ID Format: Email Address
   ```

4. **Set Attribute Mapping**
   ```
   Email: Primary Email Address
   FirstName: First Name  
   LastName: Last Name
   Department: Department
   JobTitle: Job Title
   Role: Role (if available)
   ```

5. **Download SAML Metadata**
   - Save the metadata XML file
   - Extract the X.509 certificate
   - Note the SSO URL and Entity ID

### Step 2: Configure Backend SAML

Update `backend/app/auth/saml_config.py`:

```python
def get_saml_settings():
    return {
        "sp": {
            "entityId": "https://1chsalesreports.com",
            "assertionConsumerService": {
                "url": "https://1chsalesreports.com/api/auth/saml/acs",
                "binding": "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
            },
            "singleLogoutService": {
                "url": "https://1chsalesreports.com/api/auth/saml/logout",
                "binding": "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect"
            },
            "NameIDFormat": "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress"
        },
        "idp": {
            "entityId": "https://accounts.zoho.in/samlresponse/...",  # From metadata
            "singleSignOnService": {
                "url": "https://accounts.zoho.in/samlauthrequest/...",  # From metadata
                "binding": "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect"
            },
            "x509cert": "YOUR_X509_CERTIFICATE_HERE"  # From metadata
        }
    }
```

## 📊 Part 2: CRM API Setup

### Step 1: Create Zoho CRM Connected App

1. **Access Zoho CRM Developer Console**
   ```
   URL: https://accounts.zoho.com/developerconsole
   Navigate to: Connected Apps
   ```

2. **Create Server-based Application**
   ```
   Application Name: Pipeline Pulse CRM Integration
   Application Type: Server-based Applications
   ```

3. **Configure OAuth Details**
   ```
   Homepage URL: https://1chsalesreports.com
   Authorized Redirect URIs: 
   - https://1chsalesreports.com/api/oauth/callback
   - https://api.1chsalesreports.com/oauth/callback
   ```

4. **Set API Scopes**
   ```
   Required Scopes:
   - ZohoCRM.modules.ALL
   - ZohoCRM.users.READ  
   - ZohoCRM.org.READ
   - ZohoCRM.settings.READ
   ```

5. **Save Configuration**
   - Note the **Client ID** and **Client Secret**
   - Download the credentials if available

### Step 2: Generate Refresh Token

**Option A: Self-Client Authorization (Recommended)**

1. **Get Authorization Code**
   ```bash
   # Visit this URL in browser (replace CLIENT_ID with your actual ID)
   https://accounts.zoho.com/oauth/v2/auth?scope=ZohoCRM.modules.ALL,ZohoCRM.users.READ,ZohoCRM.org.READ,ZohoCRM.settings.READ&client_id=CLIENT_ID&response_type=code&access_type=offline&redirect_uri=https://1chsalesreports.com/api/oauth/callback
   ```

2. **Extract Authorization Code**
   - After authorization, you'll be redirected to: 
   ```
   https://1chsalesreports.com/api/oauth/callback?code=AUTHORIZATION_CODE
   ```
   - Copy the `AUTHORIZATION_CODE` from the URL

3. **Exchange for Refresh Token**
   ```bash
   curl -X POST https://accounts.zoho.com/oauth/v2/token \
     -d "grant_type=authorization_code" \
     -d "client_id=YOUR_CLIENT_ID" \
     -d "client_secret=YOUR_CLIENT_SECRET" \
     -d "redirect_uri=https://1chsalesreports.com/api/oauth/callback" \
     -d "code=AUTHORIZATION_CODE"
   ```

4. **Save Refresh Token**
   - The response will contain `refresh_token`
   - Store this securely in AWS Secrets Manager

**Option B: Using Pipeline Pulse OAuth Flow**

1. **Access OAuth Endpoint**
   ```
   https://api.1chsalesreports.com/oauth/zoho/authorize
   ```

2. **Complete Authorization**
   - Follow the OAuth flow
   - Token will be automatically stored

### Step 3: Configure Environment Variables

Set these environment variables (AWS Secrets Manager recommended for production):

```bash
# Zoho CRM API Configuration
ZOHO_CLIENT_ID=your_client_id_here
ZOHO_CLIENT_SECRET=your_client_secret_here  
ZOHO_REFRESH_TOKEN=your_refresh_token_here
ZOHO_USER_EMAIL=admin@1cloudhub.com
ZOHO_REDIRECT_URI=https://1chsalesreports.com/api/oauth/callback

# Zoho API URLs
ZOHO_BASE_URL=https://www.zohoapis.com/crm/v8
ZOHO_ACCOUNTS_URL=https://accounts.zoho.com

# SAML Configuration
SAML_ENTITY_ID=https://1chsalesreports.com
SAML_ACS_URL=https://1chsalesreports.com/api/auth/saml/acs
SAML_SLO_URL=https://1chsalesreports.com/api/auth/saml/logout
```

## 🧪 Part 3: Testing Integration

### Test SAML Authentication

1. **Access Application**
   ```
   https://1chsalesreports.com
   ```

2. **Verify Redirect**
   - Should redirect to Zoho login
   - After login, should redirect back to application
   - Should see user dashboard

3. **Check User Data**
   - Verify user profile displays correctly
   - Confirm role and permissions are set

### Test CRM API Access

1. **Check Connection Status**
   ```bash
   curl https://api.1chsalesreports.com/zoho/status
   ```

2. **Test Data Retrieval**
   ```bash
   curl https://api.1chsalesreports.com/deals
   ```

3. **Verify Sync Status**
   ```bash
   curl https://api.1chsalesreports.com/sync/status
   ```

## 🔧 Part 4: Advanced Configuration

### SDK Configuration

The Zoho SDK is automatically configured via `zoho_sdk_manager.py`. Key settings:

```python
# SDK Environment
ENVIRONMENT = "PRODUCTION"  # or "SANDBOX" for testing

# Token Store
TOKEN_STORE = "DATABASE"  # Stores tokens in PostgreSQL

# Connection Pool
MAX_CONNECTIONS = 10
CONNECTION_TIMEOUT = 30

# Auto-refresh settings
AUTO_REFRESH_TOKENS = True
REFRESH_MARGIN_MINUTES = 5
```

### Database Configuration

Ensure these tables exist for token management:
- `zoho_oauth_tokens` - OAuth token storage
- `zoho_token_records` - Token metadata
- `token_refresh_logs` - Refresh history

### Monitoring Setup

Configure monitoring for:
- **Token Expiry**: Alerts when tokens need refresh
- **API Rate Limits**: Monitor API usage
- **Connection Health**: Track API availability
- **Sync Status**: Monitor data synchronization

## 🚨 Troubleshooting

### Common Issues

**"OAuth token not found"**
- Verify refresh token is correctly set
- Check token hasn't expired
- Ensure database connectivity

**"SAML authentication failed"**  
- Verify SAML certificate is correct
- Check entity IDs match exactly
- Confirm ACS URL is accessible

**"API rate limit exceeded"**
- Implement request throttling
- Distribute API calls over time
- Consider upgrading Zoho plan

For more detailed troubleshooting, see [troubleshooting guide](./troubleshooting.md).

## ✅ Verification Checklist

- [ ] SAML application created in Zoho Directory
- [ ] Service provider details configured correctly
- [ ] X.509 certificate extracted and configured
- [ ] Connected app created in Zoho CRM
- [ ] OAuth scopes properly set
- [ ] Refresh token generated and stored
- [ ] Environment variables configured
- [ ] Database tables created
- [ ] SAML authentication tested
- [ ] CRM API access verified
- [ ] Monitoring configured

---

*This guide consolidates setup information from multiple sources and provides the complete configuration process.*