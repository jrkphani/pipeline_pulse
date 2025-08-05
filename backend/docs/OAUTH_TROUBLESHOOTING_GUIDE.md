# OAuth Troubleshooting Guide for Pipeline Pulse

## 🎯 Overview

This guide provides comprehensive troubleshooting information for OAuth authentication issues in Pipeline Pulse. It covers common problems, diagnostic steps, and solutions for both development and production environments.

## 🔍 Common OAuth Issues

### 1. Authorization Code Exchange Failures

#### Issue: `400 Bad Request` during code exchange
**Symptoms:**
- Error message: "Token exchange failed"
- Code exchange endpoint returning 400 status
- Invalid grant type errors

**Possible Causes:**
- Incorrect client credentials
- Expired authorization code
- Mismatched redirect URI
- Invalid grant type parameter

**Diagnostic Steps:**
```bash
# Check environment variables
echo $ZOHO_CLIENT_ID
echo $ZOHO_CLIENT_SECRET
echo $ZOHO_ACCOUNTS_URL

# Test token exchange manually
curl -X POST "https://accounts.zoho.in/oauth/v2/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=$ZOHO_CLIENT_ID" \
  -d "client_secret=$ZOHO_CLIENT_SECRET" \
  -d "code=YOUR_AUTH_CODE" \
  -d "grant_type=authorization_code" \
  -d "redirect_uri=YOUR_REDIRECT_URI"
```

**Solutions:**
1. Verify client credentials in Zoho Console
2. Check redirect URI exact match
3. Ensure code is used within 10 minutes
4. Validate grant type is "authorization_code"

### 2. State Parameter Validation Errors

#### Issue: `invalid_state` error during callback
**Symptoms:**
- Redirected to login with error=invalid_state
- State parameter mismatch
- Expired state tokens

**Possible Causes:**
- State parameter expired (10-minute timeout)
- State parameter not found in cache
- Multiple authentication attempts

**Diagnostic Steps:**
```python
# Check state storage in oauth.py
print(f"Stored states: {oauth_states}")
print(f"Received state: {state}")
print(f"State exists: {state in oauth_states}")
```

**Solutions:**
1. Reduce time between auth URL generation and callback
2. Implement persistent state storage (Redis/database)
3. Clear browser cache and cookies
4. Check system clock synchronization

### 3. Token Refresh Failures

#### Issue: `401 Unauthorized` during token refresh
**Symptoms:**
- Refresh token expired or invalid
- Token manager failing to refresh
- Continuous re-authentication required

**Possible Causes:**
- Refresh token expired (90+ days)
- Invalid refresh token
- Revoked application access
- Network connectivity issues

**Diagnostic Steps:**
```python
# Test token refresh manually
async def test_token_refresh():
    from app.services.token_manager import token_manager
    from app.core.database import get_db
    
    db = next(get_db())
    try:
        token = await token_manager.get_valid_access_token(db, force_refresh=True)
        print(f"Token refresh successful: {bool(token)}")
    except Exception as e:
        print(f"Token refresh failed: {e}")
```

**Solutions:**
1. Check refresh token validity in Zoho Console
2. Re-authenticate user if refresh token expired
3. Verify network connectivity
4. Check token manager configuration

### 4. User Information Retrieval Failures

#### Issue: `400 Bad Request` when getting user info
**Symptoms:**
- Cannot fetch user information
- Empty user data returned
- API permission errors

**Possible Causes:**
- Insufficient OAuth scopes
- Invalid access token
- API endpoint changes
- Regional data center issues

**Diagnostic Steps:**
```python
# Test user info endpoint
async def test_user_info():
    import httpx
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{settings.ZOHO_BASE_URL}/users?type=CurrentUser",
            headers={
                "Authorization": f"Zoho-oauthtoken {access_token}",
                "Content-Type": "application/json"
            }
        )
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
```

**Solutions:**
1. Verify OAuth scopes include user permissions
2. Check access token validity
3. Validate API endpoint URL
4. Ensure correct data center configuration

## 🌍 Region-Specific Issues

### India Data Center (.in)
**Configuration:**
```bash
ZOHO_ACCOUNTS_URL=https://accounts.zoho.in
ZOHO_BASE_URL=https://www.zohoapis.in/crm/v2
```

**Common Issues:**
- Using .com endpoints instead of .in
- Incorrect data center in OAuth app settings
- Mixed region configurations

### US Data Center (.com)
**Configuration:**
```bash
ZOHO_ACCOUNTS_URL=https://accounts.zoho.com
ZOHO_BASE_URL=https://www.zohoapis.com/crm/v2
```

**Common Issues:**
- Region mismatch between OAuth app and API calls
- User registered in different data center

### EU Data Center (.eu)
**Configuration:**
```bash
ZOHO_ACCOUNTS_URL=https://accounts.zoho.eu
ZOHO_BASE_URL=https://www.zohoapis.eu/crm/v2
```

## 🔧 Environment-Specific Issues

### Development Environment

#### Issue: CORS errors during OAuth flow
**Symptoms:**
- Browser console showing CORS errors
- OAuth callback failing
- Mixed content warnings

**Solutions:**
```python
# Ensure proper CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

#### Issue: Redirect URI mismatch
**Symptoms:**
- "redirect_uri_mismatch" error
- Development vs production URI conflicts

**Solutions:**
1. Use development-specific redirect URI
2. Configure multiple redirect URIs in Zoho Console
3. Use environment-based URI selection

### Production Environment

#### Issue: HTTPS certificate errors
**Symptoms:**
- SSL certificate validation failures
- OAuth callback not working
- Mixed content errors

**Solutions:**
1. Ensure valid SSL certificate
2. Use HTTPS for all OAuth endpoints
3. Configure proper certificate chain

#### Issue: Load balancer routing issues
**Symptoms:**
- Inconsistent OAuth behavior
- Some requests failing
- Session affinity problems

**Solutions:**
1. Configure session affinity
2. Use shared session storage
3. Implement proper health checks

## 📊 Monitoring and Debugging

### Enable Debug Logging

```python
# Add to main.py or relevant modules
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# OAuth-specific logging
oauth_logger = logging.getLogger("app.api.endpoints.oauth")
oauth_logger.setLevel(logging.DEBUG)
```

### Monitor OAuth Flow

```python
# Add monitoring to oauth.py
async def zoho_oauth_callback(code, state):
    logger.info(f"OAuth callback received - code: {'present' if code else 'missing'}")
    logger.info(f"State validation: {state in oauth_states}")
    
    try:
        tokens = await oauth_manager.exchange_code_for_tokens(code)
        logger.info("Token exchange successful")
        
        user_info = await oauth_manager.get_user_info(tokens["access_token"])
        logger.info(f"User info retrieved: {user_info.get('email', 'unknown')}")
        
        # Continue with JWT creation...
        
    except Exception as e:
        logger.error(f"OAuth callback failed: {e}")
        # Handle error appropriately
```

### Health Check Endpoints

```python
# Add to oauth.py or health.py
@router.get("/oauth/health")
async def oauth_health_check():
    """OAuth system health check"""
    return {
        "status": "healthy",
        "client_id_configured": bool(settings.ZOHO_CLIENT_ID),
        "client_secret_configured": bool(settings.ZOHO_CLIENT_SECRET),
        "accounts_url": settings.ZOHO_ACCOUNTS_URL,
        "base_url": settings.ZOHO_BASE_URL,
        "environment": settings.ENVIRONMENT
    }
```

## 🧪 Testing OAuth Flow

### Manual Testing

```bash
# 1. Generate auth URL
curl -X GET "http://localhost:8000/api/zoho/auth-url"

# 2. Visit auth URL in browser and complete OAuth flow

# 3. Check callback handling
# Monitor server logs for callback processing

# 4. Test token functionality
curl -X GET "http://localhost:8000/api/auth/validate" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Automated Testing

```python
# Test OAuth flow components
async def test_oauth_components():
    # Test auth URL generation
    auth_url = await oauth_manager.generate_auth_url("test-state")
    assert "client_id" in auth_url
    assert "state=test-state" in auth_url
    
    # Test state validation
    oauth_states["test-state"] = {
        "created_at": datetime.now(),
        "expires_at": datetime.now() + timedelta(minutes=10)
    }
    assert "test-state" in oauth_states
    
    # Test token validation
    test_token = create_test_jwt()
    payload = jwt.decode(test_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    assert payload["iss"] == "pipeline-pulse-api"
```

## 🚨 Emergency Procedures

### OAuth System Down

**Immediate Actions:**
1. Check OAuth service status
2. Verify DNS resolution
3. Test network connectivity
4. Check SSL certificate validity

**Recovery Steps:**
1. Switch to backup authentication method
2. Implement maintenance mode
3. Notify users of authentication issues
4. Monitor system recovery

### Token Mass Invalidation

**Scenario:** Need to invalidate all tokens

**Steps:**
```python
# Emergency token invalidation
async def emergency_token_invalidation():
    # 1. Rotate JWT secret
    new_secret = secrets.token_urlsafe(64)
    await secrets_manager.update_secret(
        'pipeline-pulse/app-secrets',
        {'jwt_secret': new_secret}
    )
    
    # 2. Clear all sessions
    from app.api.endpoints.session_management import SessionManager
    session_manager = SessionManager(db)
    await session_manager.clear_all_sessions()
    
    # 3. Force application restart
    # (depends on deployment method)
```

## 📋 Quick Reference

### Environment Variables Checklist

```bash
# Required for OAuth
ZOHO_CLIENT_ID=your_client_id
ZOHO_CLIENT_SECRET=your_client_secret
ZOHO_ACCOUNTS_URL=https://accounts.zoho.in
ZOHO_BASE_URL=https://www.zohoapis.in/crm/v2

# Required for JWT
SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Environment-specific
ENVIRONMENT=development|production
FRONTEND_URL=your_frontend_url
BASE_URL=your_api_base_url
```

### Common Error Codes

| Error Code | Description | Solution |
|------------|-------------|----------|
| `invalid_client` | Invalid client credentials | Check client ID/secret |
| `invalid_grant` | Invalid authorization code | Code expired or already used |
| `invalid_request` | Malformed request | Check request parameters |
| `invalid_scope` | Insufficient permissions | Update OAuth scopes |
| `redirect_uri_mismatch` | URI doesn't match registered | Update redirect URI |
| `access_denied` | User denied access | User needs to grant permission |
| `invalid_state` | State parameter invalid | Check state generation/validation |

### Useful Commands

```bash
# Check OAuth configuration
python -c "from app.core.config import settings; print(f'Client ID: {settings.ZOHO_CLIENT_ID[:10]}...')"

# Test database connection
python -c "from app.core.database import engine; print(engine.execute('SELECT 1').fetchone())"

# Generate test JWT
python test_jwt.py

# Check session storage
python -c "from app.api.endpoints.session_management import SessionManager; print('Session manager loaded')"
```

## 📞 Support Contacts

### Internal Support
- **Backend Team**: backend-team@company.com
- **Security Team**: security@company.com
- **DevOps Team**: devops@company.com

### External Support
- **Zoho Support**: https://help.zoho.com/
- **AWS Support**: https://aws.amazon.com/support/

## 📚 Additional Resources

- [Zoho OAuth Documentation](https://www.zoho.com/developer/help/api/oauth-overview.html)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OAuth 2.0 Security Best Practices](https://tools.ietf.org/html/draft-ietf-oauth-security-topics)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)

---

**Last Updated**: December 2024
**Next Review**: January 2025
**Owner**: Backend Team
**Emergency Contact**: +65-1234-5678
