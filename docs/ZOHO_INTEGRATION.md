# Zoho Integration Configuration Guide

## 📋 Overview

Pipeline Pulse integrates with Zoho services for:
- **Authentication:** Zoho Directory SAML SSO
- **CRM Data:** Zoho CRM API integration
- **User Management:** Role-based access control

## 🔐 Zoho Directory SAML SSO Setup

### 1. Create SAML Application in Zoho Directory

1. **Login to Zoho Directory Admin Console**
   - URL: `https://directory.zoho.in/`
   - Navigate to **Applications** → **SAML Apps**

2. **Create New SAML Application**
   ```
   Application Name: Pipeline Pulse Production
   Description: Sales analytics and pipeline management system
   ```

3. **Configure Service Provider Details**
   ```
   Entity ID: https://1chsalesreports.com
   ACS URL: https://1chsalesreports.com/api/auth/saml/acs
   Single Logout URL: https://1chsalesreports.com/api/auth/saml/logout
   Name ID Format: Email Address
   ```

4. **Attribute Mapping**
   ```
   Email: Primary Email Address
   FirstName: First Name
   LastName: Last Name
   Department: Department
   JobTitle: Job Title
   ```

5. **Download Metadata**
   - Save the SAML metadata XML file
   - Extract the X.509 certificate for backend configuration

### 2. Backend SAML Configuration

Update `backend/app/auth/saml_config.py`:

```python
def get_saml_settings():
    """Get SAML settings for pysaml2"""
    return {
        "entityid": "https://1chsalesreports.com",
        "assertion_consumer_service": {
            "url": "https://1chsalesreports.com/api/auth/saml/acs",
            "binding": "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
        },
        "single_logout_service": {
            "url": "https://1chsalesreports.com/api/auth/saml/logout",
            "binding": "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect"
        },
        "idp": {
            "entityId": "https://directory.zoho.in/p/60021093475/app/128434000000235001/sso",
            "singleSignOnService": {
                "url": "https://directory.zoho.in/p/60021093475/app/128434000000235001/sso",
                "binding": "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect"
            },
            "singleLogoutService": {
                "url": "https://directory.zoho.in/p/60021093475/app/128434000000235001/sso/logout",
                "binding": "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect"
            },
            "x509cert": os.getenv("ZOHO_SAML_X509_CERT", "").replace("\\n", "\n")
        }
    }
```

### 3. Role Assignment Logic

The system automatically assigns roles based on user attributes:

```python
def determine_user_role(saml_attributes):
    """Determine user role based on SAML attributes"""
    job_title = saml_attributes.get('JobTitle', [''])[0].lower()
    department = saml_attributes.get('Department', [''])[0].lower()
    
    # Admin roles
    if any(title in job_title for title in ['ceo', 'cto', 'director']) or 'it' in department:
        return 'admin'
    
    # Manager roles
    if any(title in job_title for title in ['manager', 'lead', 'supervisor']):
        return 'manager'
    
    # Sales roles
    if any(title in job_title for title in ['sales', 'account', 'business development']):
        return 'sales'
    
    # Default role
    return 'user'
```

## 🔗 Zoho CRM API Integration

### 1. Create Server-based Application

1. **Go to Zoho API Console**
   - URL: `https://api-console.zoho.in/` (India data center)
   - Click **"Server-based Applications"**

2. **Configure Application**
   ```
   Client Name: Pipeline Pulse Server
   Homepage URL: https://1chsalesreports.com
   Authorized Redirect URIs:
     - https://1chsalesreports.com/api/auth/zoho/oauth-callback
     - http://localhost:8000/api/auth/zoho/oauth-callback
   ```

3. **Note Credentials**
   ```
   Client ID: 1000.JKDZ5EYYE175QA1WGK5UVGM2R37KAY
   Client Secret: 47b3ac5c29d2168b8d5c529fc2aa1f9c93da5c1be7
   ```

### 2. Generate Refresh Token

#### Option A: Authorization Code Flow

1. **Authorization URL**
   ```
   https://accounts.zoho.in/oauth/v2/auth?scope=ZohoCRM.modules.ALL,ZohoCRM.settings.ALL,ZohoCRM.users.ALL,ZohoCRM.org.ALL,ZohoCRM.bulk.ALL&client_id=1000.JKDZ5EYYE175QA1WGK5UVGM2R37KAY&response_type=code&access_type=offline&redirect_uri=https://1chsalesreports.com/api/auth/zoho/oauth-callback
   ```

2. **Exchange Code for Tokens**
   ```bash
   curl -X POST https://accounts.zoho.in/oauth/v2/token \
     -d "grant_type=authorization_code" \
     -d "client_id=1000.JKDZ5EYYE175QA1WGK5UVGM2R37KAY" \
     -d "client_secret=47b3ac5c29d2168b8d5c529fc2aa1f9c93da5c1be7" \
     -d "redirect_uri=https://1chsalesreports.com/api/auth/zoho/oauth-callback" \
     -d "code=AUTHORIZATION_CODE"
   ```

#### Option B: Self Client (Recommended)

1. **Go to API Console → Self Client**
2. **Select Scopes:**
   - ZohoCRM.modules.ALL
   - ZohoCRM.settings.ALL
   - ZohoCRM.users.ALL
   - ZohoCRM.org.ALL
   - ZohoCRM.bulk.ALL
3. **Generate Code** (valid for 10 minutes)
4. **Exchange for Refresh Token**

### 3. API Configuration

Environment variables for CRM integration:

```bash
# Zoho CRM API Configuration
ZOHO_CLIENT_ID=1000.JKDZ5EYYE175QA1WGK5UVGM2R37KAY
ZOHO_CLIENT_SECRET=47b3ac5c29d2168b8d5c529fc2aa1f9c93da5c1be7
ZOHO_REFRESH_TOKEN=1000.1f6445ad715711237fbf078342cc1975.efec29cda25213ee26264296c04dd176
ZOHO_BASE_URL=https://www.zohoapis.in/crm/v2
```

### 4. API Usage Examples

#### Get Organization Info
```python
async def get_organization_info():
    """Get Zoho CRM organization information"""
    access_token = await get_access_token()
    
    headers = {
        'Authorization': f'Zoho-oauthtoken {access_token}',
        'Content-Type': 'application/json'
    }
    
    response = await httpx.get(
        f"{ZOHO_BASE_URL}/org",
        headers=headers
    )
    
    return response.json()
```

#### Get Deals Data
```python
async def get_deals(page=1, per_page=200):
    """Get deals from Zoho CRM"""
    access_token = await get_access_token()
    
    headers = {
        'Authorization': f'Zoho-oauthtoken {access_token}',
        'Content-Type': 'application/json'
    }
    
    params = {
        'page': page,
        'per_page': per_page,
        'fields': 'Deal_Name,Amount,Stage,Closing_Date,Account_Name,Owner'
    }
    
    response = await httpx.get(
        f"{ZOHO_BASE_URL}/Deals",
        headers=headers,
        params=params
    )
    
    return response.json()
```

## 🔄 Token Management

### Automatic Token Refresh

```python
async def get_access_token():
    """Get valid access token, refresh if needed"""
    
    # Check if current token is valid
    if is_token_valid():
        return current_access_token
    
    # Refresh token
    refresh_data = {
        'grant_type': 'refresh_token',
        'client_id': ZOHO_CLIENT_ID,
        'client_secret': ZOHO_CLIENT_SECRET,
        'refresh_token': ZOHO_REFRESH_TOKEN
    }
    
    response = await httpx.post(
        'https://accounts.zoho.in/oauth/v2/token',
        data=refresh_data
    )
    
    token_data = response.json()
    
    # Store new access token
    store_access_token(
        token_data['access_token'],
        expires_in=token_data['expires_in']
    )
    
    return token_data['access_token']
```

## 🔧 Troubleshooting

### Common Issues

#### 1. SAML Authentication Failures

**Issue:** Users cannot log in via SAML
**Solutions:**
- Verify SAML metadata is correctly configured
- Check X.509 certificate format (remove `\n` and add proper line breaks)
- Ensure ACS URL matches exactly: `https://1chsalesreports.com/api/auth/saml/acs`
- Verify entity ID: `https://1chsalesreports.com`

#### 2. CRM API Authentication Errors

**Issue:** `INVALID_TOKEN` or `AUTHENTICATION_FAILURE`
**Solutions:**
- Check if refresh token is valid
- Verify client credentials
- Ensure correct data center (India: `accounts.zoho.in`)
- Check API scopes are properly granted

#### 3. Data Center Mismatch

**Issue:** API calls fail with authentication errors
**Solutions:**
- Verify your Zoho account data center
- Use correct API endpoints:
  - India: `https://www.zohoapis.in/crm/v2`
  - US: `https://www.zohoapis.com/crm/v2`
  - EU: `https://www.zohoapis.eu/crm/v2`

### Testing Integration

#### Test SAML SSO
```bash
# Test SAML login endpoint
curl -I https://1chsalesreports.com/api/auth/saml/login

# Should redirect to Zoho Directory
```

#### Test CRM API
```bash
# Test organization endpoint
curl -H "Authorization: Zoho-oauthtoken ACCESS_TOKEN" \
     https://www.zohoapis.in/crm/v2/org
```

## 📊 Data Mapping

### CRM Fields to Application

| Zoho CRM Field | Application Field | Type |
|----------------|-------------------|------|
| Deal_Name | deal_name | String |
| Amount | amount | Decimal |
| Stage | stage | String |
| Closing_Date | closing_date | Date |
| Account_Name | account_name | String |
| Owner | owner | String |
| Probability | probability | Integer |
| Currency | currency | String |

### User Attributes Mapping

| SAML Attribute | Application Field | Usage |
|----------------|-------------------|-------|
| Email | email | Primary identifier |
| FirstName | first_name | Display name |
| LastName | last_name | Display name |
| Department | department | Role assignment |
| JobTitle | job_title | Role assignment |

## 🔒 Security Considerations

### SAML Security
- Always use HTTPS for all SAML endpoints
- Validate SAML assertions properly
- Implement proper session management
- Use secure cookies for session storage

### API Security
- Store refresh tokens securely
- Implement token rotation
- Use HTTPS for all API calls
- Validate API responses
- Implement rate limiting

### Access Control
- Implement role-based access control
- Validate user permissions on each request
- Log all authentication attempts
- Monitor for suspicious activity

---

**Last Updated:** June 2025  
**Version:** 1.0  
**Data Center:** India (zoho.in)
