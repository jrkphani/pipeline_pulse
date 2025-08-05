# JWT Token Documentation for Pipeline Pulse

## 🎯 Overview

Pipeline Pulse uses JSON Web Tokens (JWT) for user authentication and session management. This document provides comprehensive information about the JWT token structure, usage, and security considerations.

## 📋 Token Structure

### Standard JWT Claims

Our JWT tokens follow RFC 7519 standards with the following structure:

```json
{
  "sub": "user@example.com",           // Subject (user email)
  "user_id": "zoho_user_id",           // Zoho CRM user ID
  "region": "Singapore",               // User's region/territory
  "name": "John Doe",                  // User's full name
  "roles": ["admin", "user"],          // User roles/permissions
  "exp": 1672531200,                   // Expiration time (Unix timestamp)
  "iat": 1672444800,                   // Issued at time (Unix timestamp)
  "iss": "pipeline-pulse-api"          // Issuer identifier
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sub` | string | ✅ | Primary user identifier (email address) |
| `user_id` | string | ✅ | Zoho CRM user ID for API operations |
| `region` | string | ✅ | User's geographical region/territory |
| `name` | string | ✅ | User's display name |
| `roles` | array | ✅ | Array of user roles/permissions |
| `exp` | number | ✅ | Token expiration time (Unix timestamp) |
| `iat` | number | ✅ | Token issued at time (Unix timestamp) |
| `iss` | string | ✅ | Token issuer (always "pipeline-pulse-api") |

## 🔐 Security Configuration

### Signing Algorithm
- **Algorithm**: HS256 (HMAC with SHA-256)
- **Key Source**: AWS Secrets Manager (production) or environment variables (development)
- **Key Rotation**: Manual (recommend implementing automatic rotation)

### Token Expiration
- **Default Expiration**: 30 minutes (configurable via `ACCESS_TOKEN_EXPIRE_MINUTES`)
- **Maximum Expiration**: 24 hours (recommended limit)
- **Refresh Strategy**: OAuth refresh token flow

### Environment-Specific Secrets

#### Development
```bash
JWT_SECRET=dev-secret-key-change-in-production
```

#### Production
```bash
# Stored in AWS Secrets Manager
# Key: pipeline-pulse/app-secrets
# Field: jwt_secret
```

## 🔄 Token Lifecycle

### 1. Token Creation

Tokens are created during the OAuth callback process:

```python
# From oauth.py
def create_access_token(data: dict, expires_delta: Union[timedelta, None] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "iss": "pipeline-pulse-api"
    })
    
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt
```

### 2. Token Storage

Tokens are stored in the database using the session management system:

```python
# From session_management.py
async def store_session(self, token: str, user_id: str = None) -> Dict[str, Any]:
    # Extract user info from JWT
    user_info = await self.extract_user_info(token)
    
    # Store in database
    new_session = SessionToken(
        user_email=user_info["user_email"],
        user_id=user_info["user_id"],
        jwt_token=token,
        region=user_info["region"],
        # ... other fields
    )
```

### 3. Token Validation

Tokens are validated on each API request:

```python
# Validation process
try:
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    user_email = payload.get("sub")
    
    # Check expiration
    if payload.get("exp") < datetime.utcnow().timestamp():
        raise HTTPException(status_code=401, detail="Token expired")
        
except JWTError:
    raise HTTPException(status_code=401, detail="Invalid token")
```

### 4. Token Refresh

When tokens expire, users must re-authenticate through OAuth:

```python
# OAuth refresh flow
async def zoho_oauth_callback(code: str, state: str) -> RedirectResponse:
    # Exchange code for tokens
    tokens = await oauth_manager.exchange_code_for_tokens(code)
    
    # Get user info
    user_info = await oauth_manager.get_user_info(tokens["access_token"])
    
    # Create new JWT
    jwt_token = create_access_token(data=jwt_data, expires_delta=access_token_expires)
    
    # Store and return
    await oauth_manager.store_user_tokens(user_id, tokens, user_info)
    return RedirectResponse(url=f"{settings.FRONTEND_URL}/auth/callback?token={jwt_token}")
```

## 🛡️ Security Best Practices

### 1. Token Transmission
- **HTTPS Only**: All token transmission must use HTTPS
- **Secure Headers**: Include security headers in responses
- **No URL Parameters**: Never pass tokens in URL parameters

### 2. Token Storage
- **Client-Side**: Use secure, HTTP-only cookies or secure storage
- **Server-Side**: Database storage with proper indexing
- **Expiration**: Implement proper token expiration

### 3. Token Validation
- **Signature Verification**: Always verify JWT signature
- **Expiration Check**: Validate token expiration
- **Issuer Validation**: Verify token issuer

### 4. Error Handling
- **Generic Errors**: Don't expose specific validation errors
- **Rate Limiting**: Implement rate limiting for auth endpoints
- **Audit Logging**: Log authentication attempts

## 📊 Token Usage Patterns

### Frontend Integration

```javascript
// Store token after authentication
localStorage.setItem('auth_token', token);

// Include token in API requests
const response = await fetch('/api/endpoint', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

### Backend Middleware

```python
# JWT middleware for FastAPI
async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_email = payload.get("sub")
        
        if user_email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
            
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
```

## 🔧 Configuration

### Environment Variables

```bash
# JWT Configuration
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# OAuth Configuration
ZOHO_CLIENT_ID=your-client-id
ZOHO_CLIENT_SECRET=your-client-secret
ZOHO_REDIRECT_URI=https://your-domain.com/api/zoho/auth/callback
```

### AWS Secrets Manager

```json
{
  "jwt_secret": "your-production-jwt-secret",
  "zoho_client_secret": "your-zoho-client-secret",
  "database_password": "your-database-password"
}
```

## 🚨 Common Issues and Troubleshooting

### Token Expiration

**Issue**: `401 Unauthorized` with "Token expired" message

**Solution**:
1. Check token expiration time
2. Implement automatic token refresh
3. Redirect user to login

### Invalid Signature

**Issue**: `401 Unauthorized` with "Invalid token" message

**Solution**:
1. Verify JWT secret key configuration
2. Check token format
3. Ensure proper encoding/decoding

### Missing Claims

**Issue**: Missing user information in token

**Solution**:
1. Verify OAuth flow completion
2. Check user info extraction
3. Validate token creation process

### Region Mismatch

**Issue**: User accessing wrong region data

**Solution**:
1. Verify region claim in token
2. Check OAuth user info extraction
3. Validate region-specific configurations

## 📈 Monitoring and Analytics

### Token Metrics

Monitor these key metrics:

- **Token Creation Rate**: Number of tokens created per hour
- **Token Validation Rate**: Number of validation attempts per hour
- **Token Expiration Rate**: Number of expired tokens per hour
- **Authentication Failure Rate**: Failed authentication attempts

### Health Checks

```python
# Token health check endpoint
@router.get("/auth/health")
async def auth_health_check():
    return {
        "status": "healthy",
        "jwt_algorithm": settings.ALGORITHM,
        "token_expiry_minutes": settings.ACCESS_TOKEN_EXPIRE_MINUTES,
        "environment": settings.ENVIRONMENT
    }
```

## 🔄 Token Rotation Strategy

### Automatic Rotation (Recommended)

```python
# Implement automatic token rotation
async def rotate_jwt_secret():
    # Generate new secret
    new_secret = secrets.token_urlsafe(64)
    
    # Update in AWS Secrets Manager
    await secrets_manager.update_secret(
        'pipeline-pulse/app-secrets',
        {'jwt_secret': new_secret}
    )
    
    # Invalidate existing tokens
    await invalidate_all_tokens()
```

### Manual Rotation

1. Generate new secret key
2. Update AWS Secrets Manager
3. Deploy new configuration
4. Invalidate existing tokens
5. Users re-authenticate

## 📚 Additional Resources

- [JWT RFC 7519](https://tools.ietf.org/html/rfc7519)
- [OAuth 2.0 RFC 6749](https://tools.ietf.org/html/rfc6749)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)
- [AWS Secrets Manager](https://docs.aws.amazon.com/secretsmanager/)

## 🧪 Testing

### Unit Tests

```python
def test_jwt_creation():
    user_data = {
        "sub": "test@example.com",
        "user_id": "test-123",
        "region": "Singapore",
        "name": "Test User",
        "roles": ["user"]
    }
    
    token = create_access_token(data=user_data)
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    
    assert payload["sub"] == "test@example.com"
    assert payload["iss"] == "pipeline-pulse-api"
```

### Integration Tests

```python
async def test_oauth_flow():
    # Test complete OAuth flow
    auth_url = await oauth_manager.generate_auth_url("test-state")
    
    # Simulate callback
    tokens = await oauth_manager.exchange_code_for_tokens("test-code")
    
    # Verify JWT creation
    assert "access_token" in tokens
```

---

**Last Updated**: December 2024
**Next Review**: January 2025
**Owner**: Backend Team
**Stakeholders**: Security, Frontend, DevOps Teams
