# Zoho OAuth Authentication Implementation

This document describes the Zoho OAuth authentication implementation for Pipeline Pulse based on the [Zoho CRM Python SDK v8.0](https://github.com/zoho/zohocrm-python-sdk-8.0/blob/main/versions/2.0.0/README.md#sdk-sample-code).

## Overview

Pipeline Pulse supports three authentication modes:
1. **Traditional**: Email/password authentication only
2. **Zoho**: Zoho OAuth authentication only  
3. **Hybrid**: Both methods (default)

The authentication mode can be configured via the `AUTH_MODE` environment variable.

## Implementation Details

### Database Schema

The Zoho OAuth tokens are stored in the `zoho_oauth_tokens` table:

```sql
CREATE TABLE zoho_oauth_tokens (
    user_email VARCHAR PRIMARY KEY,
    client_id VARCHAR NOT NULL,
    client_secret VARCHAR NOT NULL,
    refresh_token VARCHAR,
    access_token VARCHAR,
    grant_token VARCHAR,
    expiry_time BIGINT,
    redirect_url VARCHAR,
    api_domain VARCHAR
);
```

### Authentication Flow

1. **Login Initiation** (`/api/v1/auth/zoho/login`)
   - User clicks "Login with Zoho"
   - Redirected to Zoho OAuth authorization page
   - Scope includes: `ZohoCRM.modules.ALL,ZohoCRM.settings.ALL,ZohoCRM.users.ALL,ZohoCRM.org.ALL,ZohoCRM.bulk.ALL`

2. **OAuth Callback** (`/api/v1/auth/zoho/callback`)
   - Receives authorization code from Zoho
   - Exchanges code for access/refresh tokens
   - Fetches user information from Zoho CRM
   - Creates or updates user account in Pipeline Pulse
   - Establishes session and sets session cookie

3. **Token Storage**
   - Uses custom `ZohoPostgresDBStore` implementing Zoho's `TokenStore` interface
   - Tokens are stored per user email for multi-user support
   - Automatic token refresh handled by Zoho SDK

### Key Components

#### 1. Zoho SDK Initialization (`app/core/zoho_sdk.py`)
- Initializes SDK once at application startup
- Configures custom database store for token persistence
- Handles multi-user context switching

#### 2. Authentication Endpoints (`app/api/v1/endpoints/zoho_only_auth.py`)
- `/login` - Initiates Zoho OAuth flow
- `/callback` - Handles OAuth callback
- `/logout` - Clears session (preserves Zoho tokens)
- `/revoke` - Revokes Zoho tokens and logs out
- `/status` - Returns authentication status

#### 3. Authentication Middleware (`app/core/auth_middleware.py`)
- `get_current_user` - Requires authenticated user
- `get_current_user_with_zoho` - Requires user with Zoho connection
- `get_optional_current_user` - Optional authentication

#### 4. Token Management (`app/core/zoho_db_store.py`)
- Custom implementation of Zoho's `TokenStore` interface
- Handles async database operations in sync context
- Manages token lifecycle (save, retrieve, delete)

## Configuration

### Environment Variables

```bash
# Authentication mode
AUTH_MODE=zoho  # Options: traditional, zoho, hybrid

# Zoho OAuth Configuration
ZOHO_CLIENT_ID=your_client_id
ZOHO_CLIENT_SECRET=your_client_secret
ZOHO_REDIRECT_URI=http://localhost:8000/api/v1/auth/zoho/callback
ZOHO_DATA_CENTER=IN  # Options: US, EU, IN, AU
ZOHO_API_USER_EMAIL=admin@your-domain.com
```

### Setting Up Zoho OAuth

1. **Register Application in Zoho**
   - Go to [Zoho API Console](https://api-console.zoho.com/)
   - Create a new client
   - Set redirect URI to match your configuration
   - Note the Client ID and Client Secret

2. **Configure Pipeline Pulse**
   - Update `.env` file with Zoho credentials
   - Set `AUTH_MODE=zoho` for Zoho-only authentication
   - Ensure database migrations are run

## Usage Examples

### Frontend Integration

```javascript
// Login with Zoho
const loginWithZoho = () => {
  window.location.href = '/api/v1/auth/zoho/login';
};

// Check authentication status
const checkAuthStatus = async () => {
  const response = await fetch('/api/v1/auth/zoho/status');
  const data = await response.json();
  
  if (data.authenticated) {
    console.log('User:', data.user);
    console.log('Zoho Connected:', data.zoho_connected);
  }
};

// Logout
const logout = async () => {
  await fetch('/api/v1/auth/zoho/logout', { method: 'POST' });
  window.location.href = '/login';
};
```

### Backend Usage

```python
from fastapi import Depends
from app.core.auth_middleware import get_current_user_with_zoho
from app.models.user import User

@router.get("/protected")
async def protected_endpoint(
    current_user: User = Depends(get_current_user_with_zoho)
):
    """Endpoint requiring Zoho authentication."""
    return {"user": current_user.email}
```

## Security Considerations

1. **Token Storage**
   - OAuth tokens are encrypted at rest in the database
   - Refresh tokens enable long-lived sessions
   - Access tokens are automatically refreshed by SDK

2. **Session Management**
   - Sessions expire after 8 hours by default
   - Session cookies are httpOnly and secure
   - Sessions are stored in database for persistence

3. **User Account Creation**
   - New users are automatically created on first Zoho login
   - Email from Zoho CRM is used as primary identifier
   - Random password is generated (unused in Zoho-only mode)

## Migration from Traditional Auth

To migrate existing users to Zoho authentication:

1. Set `AUTH_MODE=hybrid` to support both methods
2. Prompt existing users to connect their Zoho accounts
3. Once all users have connected, switch to `AUTH_MODE=zoho`
4. Traditional login endpoints remain available in hybrid mode

## Troubleshooting

### Common Issues

1. **"Token exchange failed"**
   - Verify Zoho credentials in .env
   - Check redirect URI matches exactly
   - Ensure Zoho app has correct permissions

2. **"User info failed"**
   - Verify scopes include user profile access
   - Check Zoho API limits haven't been exceeded

3. **"Session expired"**
   - Normal behavior after 8 hours
   - User needs to re-authenticate

### Debug Logging

Enable debug logging for authentication:

```python
# In .env
LOG_LEVEL=DEBUG
```

This will log detailed information about:
- OAuth flow steps
- Token exchange process
- User creation/updates
- Session management

## API Reference

### Authentication Endpoints

#### POST `/api/v1/auth/zoho/login`
Initiates Zoho OAuth login flow.

**Response**: Redirect to Zoho authorization page

#### GET `/api/v1/auth/zoho/callback`
Handles OAuth callback from Zoho.

**Query Parameters**:
- `code`: Authorization code from Zoho
- `state`: State parameter for security
- `error`: Error message if authorization failed

**Response**: Redirect to frontend with session cookie

#### POST `/api/v1/auth/zoho/logout`
Logs out the current user (preserves Zoho tokens).

**Response**:
```json
{
  "message": "Logged out successfully"
}
```

#### POST `/api/v1/auth/zoho/revoke`
Revokes Zoho tokens and logs out user.

**Response**:
```json
{
  "message": "Zoho access revoked and logged out successfully"
}
```

#### GET `/api/v1/auth/zoho/status`
Returns current authentication status.

**Response**:
```json
{
  "authenticated": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe"
  },
  "zoho_connected": true,
  "token_status": {
    "has_token": true,
    "has_refresh_token": true,
    "has_access_token": true
  }
}
```