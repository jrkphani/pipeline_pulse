# Zoho Integration Troubleshooting

## 🚨 Common Issues & Solutions

### Authentication Problems

#### 1. OAuth Redirect Loop

**Symptoms:**
- Users redirected to login page after successful Zoho authentication
- Session not persisting after OAuth callback
- "Authentication required" errors on protected pages

**Root Causes:**
- OAuth tokens not saved to database
- Session cookie configuration issues
- SAML/OAuth configuration mismatch

**Solutions:**

1. **Verify Token Storage:**
   ```bash
   # Check if tokens are being saved
   curl -X GET "https://api.1chsalesreports.com/zoho/status"
   ```

2. **Fix Token Persistence:**
   ```python
   # Ensure store_user_tokens actually saves to database
   def store_user_tokens(user_name: str, tokens: Dict[str, Any], db: Session) -> bool:
       # Must save to database, not just environment variables
       token_record = ZohoTokenRecord(
           user_name=user_name,
           access_token=tokens.get('access_token'),
           refresh_token=tokens.get('refresh_token')
       )
       db.add(token_record)
       db.commit()
       return True
   ```

3. **Check Database Connection:**
   ```bash
   # Verify database connectivity
   psql -h localhost -U your_user -d pipeline_pulse -c "SELECT COUNT(*) FROM zoho_oauth_tokens;"
   ```

#### 2. SAML Authentication Failures

**Symptoms:**
- SAML login redirects to error page
- "Invalid SAML response" errors
- Certificate validation failures

**Solutions:**

1. **Verify SAML Configuration:**
   ```python
   # Check SAML settings in backend/app/auth/saml_config.py
   def get_saml_settings():
       return {
           "sp": {
               "entityId": "https://1chsalesreports.com",  # Must match exactly
               "assertionConsumerService": {
                   "url": "https://1chsalesreports.com/api/auth/saml/acs",
                   "binding": "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
               }
           }
       }
   ```

2. **Fix X.509 Certificate Format:**
   ```bash
   # Certificate should be single line without headers
   ZOHO_SAML_X509_CERT="MIICert...base64content...=="
   
   # NOT like this (common mistake):
   # -----BEGIN CERTIFICATE-----
   # MIICert...
   # -----END CERTIFICATE-----
   ```

3. **Validate Entity IDs:**
   - Service Provider Entity ID: `https://1chsalesreports.com`
   - ACS URL: `https://1chsalesreports.com/api/auth/saml/acs`
   - Both must match Zoho Directory configuration exactly

#### 3. Token Expiry Issues

**Symptoms:**
- `INVALID_TOKEN` errors in API calls
- Intermittent authentication failures
- 401 Unauthorized responses

**Solutions:**

1. **Enable Automatic Token Refresh:**
   ```python
   # In zoho_service.py
   async def get_access_token(self):
       if self.is_token_expired():
           await self.refresh_access_token()
       return self.current_access_token
   ```

2. **Check Refresh Token Validity:**
   ```bash
   curl -X POST https://accounts.zoho.in/oauth/v2/token \
     -d "grant_type=refresh_token" \
     -d "client_id=YOUR_CLIENT_ID" \
     -d "client_secret=YOUR_CLIENT_SECRET" \
     -d "refresh_token=YOUR_REFRESH_TOKEN"
   ```

3. **Monitor Token Health:**
   ```python
   # Add token monitoring endpoint
   @app.get("/api/token/health")
   async def token_health():
       return {
           "access_token_valid": is_access_token_valid(),
           "refresh_token_available": has_refresh_token(),
           "expires_at": get_token_expiry()
       }
   ```

### API Connection Issues

#### 4. Data Center Mismatch

**Symptoms:**
- Authentication succeeds but API calls fail
- "Invalid request" errors
- Inconsistent API responses

**Solutions:**

1. **Verify Data Center:**
   ```python
   # Check your Zoho account data center
   # India: accounts.zoho.in, www.zohoapis.in
   # US: accounts.zoho.com, www.zohoapis.com
   # EU: accounts.zoho.eu, www.zohoapis.eu
   
   ZOHO_BASE_URL = "https://www.zohoapis.in/crm/v8"  # For India DC
   ZOHO_ACCOUNTS_URL = "https://accounts.zoho.in"
   ```

2. **Update Environment Variables:**
   ```bash
   # For India data center (most common)
   ZOHO_BASE_URL=https://www.zohoapis.in/crm/v8
   ZOHO_ACCOUNTS_URL=https://accounts.zoho.in
   
   # For US data center
   ZOHO_BASE_URL=https://www.zohoapis.com/crm/v8
   ZOHO_ACCOUNTS_URL=https://accounts.zoho.com
   ```

#### 5. API Rate Limiting

**Symptoms:**
- HTTP 429 "Too Many Requests" errors
- Slow API responses
- Failed bulk operations

**Solutions:**

1. **Implement Exponential Backoff:**
   ```python
   import asyncio
   from random import uniform
   
   async def api_call_with_retry(func, max_retries=3):
       for attempt in range(max_retries):
           try:
               return await func()
           except RateLimitError:
               if attempt == max_retries - 1:
                   raise
               delay = (2 ** attempt) + uniform(0, 1)
               await asyncio.sleep(delay)
   ```

2. **Reduce Concurrent Requests:**
   ```python
   # Limit concurrent API calls
   semaphore = asyncio.Semaphore(5)  # Max 5 concurrent requests
   
   async def limited_api_call():
       async with semaphore:
           return await make_api_call()
   ```

3. **Monitor API Usage:**
   ```bash
   # Check current API usage
   curl -H "Authorization: Zoho-oauthtoken ACCESS_TOKEN" \
     "https://www.zohoapis.in/crm/v8/org"
   
   # Look for X-RATELIMIT headers in response
   ```

#### 6. Field Mapping Errors

**Symptoms:**
- "Invalid field" errors
- Data not syncing correctly
- Missing fields in API responses

**Solutions:**

1. **Validate Field Names:**
   ```python
   # Get available fields for module
   async def get_module_fields(module_name):
       response = await api_call(f"/settings/fields?module={module_name}")
       return [field['api_name'] for field in response['fields']]
   ```

2. **Check Field Permissions:**
   ```python
   # Ensure user has read/write access to custom fields
   required_fields = [
       'Territory', 'Service_Line', 'AWS_Funded_Tag',
       'Proposal_Submission_Date', 'PO_Generation_Date'
   ]
   ```

3. **Handle Missing Fields Gracefully:**
   ```python
   def safe_field_extract(record, field_name, default=None):
       return record.get(field_name, default) if record else default
   ```

### SDK Integration Issues

#### 7. SDK Initialization Failures

**Symptoms:**
- "SDK not initialized" errors
- Import errors for Zoho SDK
- SDK configuration failures

**Solutions:**

1. **Verify SDK Installation:**
   ```bash
   pip install zohocrmsdk8_0
   python -c "import zohocrmsdk; print('SDK installed successfully')"
   ```

2. **Check SDK Configuration:**
   ```python
   # In zoho_sdk_manager.py
   def initialize_sdk():
       try:
           from zohocrmsdk.src.com.zoho.crm.api.initializer import Initializer
           from zohocrmsdk.src.com.zoho.api.authenticator.oauth_token import OAuthToken
           
           # Initialize with proper configuration
           token = OAuthToken(
               client_id=settings.ZOHO_CLIENT_ID,
               client_secret=settings.ZOHO_CLIENT_SECRET,
               refresh_token=settings.ZOHO_REFRESH_TOKEN
           )
           
           Initializer.initialize(
               user=User.email(settings.ZOHO_USER_EMAIL),
               token=token,
               dc=INDataCenter()
           )
           return True
       except Exception as e:
           logger.error(f"SDK initialization failed: {e}")
           return False
   ```

3. **Handle SDK Errors:**
   ```python
   from zohocrmsdk.src.com.zoho.crm.api.util.api_exception import APIException
   
   try:
       response = await sdk_operation()
   except APIException as e:
       logger.error(f"SDK API error: {e.status.value} - {e.details}")
       raise ZohoServiceError(f"API operation failed: {e.details}")
   ```

#### 8. Async Wrapper Issues

**Symptoms:**
- Deadlock in async operations
- "Event loop is running" errors
- Performance degradation

**Solutions:**

1. **Fix Event Loop Issues:**
   ```python
   import asyncio
   from concurrent.futures import ThreadPoolExecutor
   
   class AsyncZohoWrapper:
       def __init__(self):
           self.executor = ThreadPoolExecutor(max_workers=5)
       
       async def async_sdk_call(self, sync_function, *args, **kwargs):
           loop = asyncio.get_event_loop()
           return await loop.run_in_executor(
               self.executor, 
               sync_function, 
               *args, **kwargs
           )
   ```

2. **Proper Resource Management:**
   ```python
   async def __aenter__(self):
       self.executor = ThreadPoolExecutor(max_workers=5)
       return self
   
   async def __aexit__(self, exc_type, exc_val, exc_tb):
       self.executor.shutdown(wait=True)
   ```

### Database Issues

#### 9. Token Storage Problems

**Symptoms:**
- Tokens not persisting between requests
- Database connection errors
- Duplicate token records

**Solutions:**

1. **Fix Database Schema:**
   ```sql
   -- Ensure proper constraints
   ALTER TABLE zoho_oauth_tokens 
   ADD CONSTRAINT unique_user_token UNIQUE (user_name);
   
   -- Add indices for performance
   CREATE INDEX idx_zoho_tokens_user ON zoho_oauth_tokens(user_name);
   CREATE INDEX idx_zoho_tokens_created ON zoho_oauth_tokens(created_at);
   ```

2. **Implement Proper Token Updates:**
   ```python
   def upsert_token(db: Session, user_name: str, tokens: dict):
       existing = db.query(ZohoTokenRecord).filter_by(user_name=user_name).first()
       if existing:
           existing.access_token = tokens['access_token']
           existing.updated_at = datetime.utcnow()
       else:
           new_token = ZohoTokenRecord(user_name=user_name, **tokens)
           db.add(new_token)
       db.commit()
   ```

#### 10. Migration Issues

**Symptoms:**
- Alembic migration failures
- Database schema conflicts
- Missing tables or columns

**Solutions:**

1. **Check Migration Status:**
   ```bash
   cd backend
   alembic current
   alembic history
   ```

2. **Fix Migration Conflicts:**
   ```bash
   # Reset migrations if needed
   alembic stamp head
   alembic revision --autogenerate -m "fix_schema"
   alembic upgrade head
   ```

3. **Manual Schema Fixes:**
   ```sql
   -- Add missing columns
   ALTER TABLE zoho_oauth_tokens 
   ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;
   
   -- Fix data types
   ALTER TABLE zoho_oauth_tokens 
   ALTER COLUMN access_token TYPE TEXT;
   ```

## 🔧 Debugging Tools

### Log Analysis

```bash
# Backend logs
tail -f backend/logs/app.log | grep -i zoho

# Filter specific errors
grep -i "authentication\|token\|oauth" backend/logs/app.log

# Check API response logs
grep -A 5 -B 5 "zoho.*error" backend/logs/app.log
```

### Network Debugging

```bash
# Test connectivity
curl -I https://accounts.zoho.in/oauth/v2/auth
curl -I https://www.zohoapis.in/crm/v8/org

# Test with authentication
curl -H "Authorization: Zoho-oauthtoken ACCESS_TOKEN" \
  https://www.zohoapis.in/crm/v8/org

# Check DNS resolution
nslookup accounts.zoho.in
nslookup www.zohoapis.in
```

### Database Debugging

```sql
-- Check token records
SELECT user_name, created_at, updated_at, 
       LENGTH(access_token) as token_length
FROM zoho_oauth_tokens;

-- Find expired tokens
SELECT * FROM zoho_oauth_tokens 
WHERE expires_at < NOW();

-- Check sync history
SELECT * FROM zoho_sync_operations 
ORDER BY created_at DESC LIMIT 10;
```

## 📋 Health Check Checklist

### Pre-Production Checklist

- [ ] SAML configuration matches Zoho Directory
- [ ] X.509 certificate properly formatted
- [ ] OAuth application configured with correct redirects
- [ ] Environment variables set correctly
- [ ] Database tables created and indexed
- [ ] SDK initialized successfully
- [ ] Token refresh mechanism working
- [ ] API endpoints responding correctly
- [ ] Rate limiting configured
- [ ] Error handling implemented
- [ ] Logging configured for troubleshooting

### Production Monitoring

- [ ] Set up alerts for authentication failures
- [ ] Monitor API rate limit usage
- [ ] Track token refresh success rate
- [ ] Monitor sync operation status
- [ ] Set up health check endpoints
- [ ] Configure log aggregation
- [ ] Implement performance metrics
- [ ] Set up database monitoring

## 🆘 Emergency Procedures

### Complete Authentication Reset

If all authentication is broken:

1. **Reset OAuth Application:**
   ```bash
   # Regenerate client secret in Zoho API Console
   # Update environment variables
   export ZOHO_CLIENT_SECRET="new_secret_here"
   ```

2. **Clear Token Storage:**
   ```sql
   DELETE FROM zoho_oauth_tokens;
   ```

3. **Re-authenticate:**
   ```bash
   # Visit OAuth URL to re-authenticate
   curl "https://api.1chsalesreports.com/oauth/zoho/authorize"
   ```

### Rollback to HTTP Client

If SDK integration fails completely:

1. **Revert to Previous Version:**
   ```bash
   git checkout [commit-before-sdk-migration]
   ```

2. **Remove SDK Dependencies:**
   ```bash
   pip uninstall zohocrmsdk8_0
   ```

3. **Update Configuration:**
   ```bash
   # Remove SDK-specific environment variables
   unset ZOHO_SDK_DATA_CENTER
   unset ZOHO_SDK_ENVIRONMENT
   ```

## 📞 Support Contacts

### Internal Support
- **Technical Lead**: Review application logs and configuration
- **Database Admin**: Check database connectivity and schema
- **DevOps**: Verify infrastructure and networking

### External Support
- **Zoho Developer Support**: https://help.zoho.com/portal/en/community/zoho-crm
- **Zoho API Console**: https://api-console.zoho.in/
- **SDK Documentation**: https://github.com/zoho/zohocrm-python-sdk-8.0

---

*This troubleshooting guide consolidates solutions for all common Zoho integration issues encountered in Pipeline Pulse.*