# Zoho SDK Troubleshooting Guide

## Quick Diagnostics

### 1. Check SDK Installation
```bash
python -c "
try:
    import zohocrmsdk
    print('✅ Zoho SDK is installed')
    print(f'Version: {zohocrmsdk.__version__ if hasattr(zohocrmsdk, \"__version__\") else \"Unknown\"}')
except ImportError as e:
    print('❌ Zoho SDK not installed')
    print(f'Error: {e}')
    print('Install with: pip install zohocrmsdk8_0')
"
```

### 2. Validate SDK Manager
```bash
python -c "
from app.services.zoho_sdk_manager import get_sdk_manager
manager = get_sdk_manager()
status = manager.validate_initialization()
print('SDK Manager Status:')
for key, value in status.items():
    print(f'  {key}: {value}')
"
```

### 3. Test Service Integration
```bash
python -c "
from app.services.zoho_service import ZohoService
import asyncio

async def test_service():
    service = ZohoService()
    status = await service.get_connection_status()
    print('Service Status:')
    for key, value in status.items():
        print(f'  {key}: {value}')

asyncio.run(test_service())
"
```

## Common Issues & Solutions

### Issue 1: SDK Not Available Error

**Error Message:**
```
WARNING:app.services.zoho_sdk_manager:Zoho SDK not available: No module named 'zohocrmsdk'
```

**Solution:**
```bash
# Install the SDK
pip install zohocrmsdk8_0

# Verify installation
pip list | grep zoho

# For development environment
pip install -r requirements.txt
```

**Alternative Solution (if pip install fails):**
```bash
# Install directly from source
git clone https://github.com/zoho/zohocrm-python-sdk-6.0.git
cd zohocrm-python-sdk-6.0
python setup.py install
```

### Issue 2: Authentication Failures

**Error Message:**
```
ZohoSDKManagerError: Missing required OAuth parameters: client_id, client_secret, redirect_uri
```

**Solution:**
```bash
# Check your .env file has these variables
ZOHO_CLIENT_ID=your_client_id_here
ZOHO_CLIENT_SECRET=your_client_secret_here
ZOHO_REFRESH_TOKEN=your_refresh_token_here

# For production, check AWS Secrets Manager
aws secretsmanager get-secret-value --secret-id pipeline-pulse/zoho-tokens
```

**Debug Steps:**
```python
# Test configuration
from app.core.config import settings

print(f"Client ID: {settings.ZOHO_CLIENT_ID[:8]}..." if settings.ZOHO_CLIENT_ID else "❌ Not set")
print(f"Client Secret: {'✅ Set' if settings.ZOHO_CLIENT_SECRET else '❌ Not set'}")
print(f"Refresh Token: {'✅ Set' if settings.ZOHO_REFRESH_TOKEN else '❌ Not set'}")
```

### Issue 3: Token Store Errors

**Error Message:**
```
FileNotFoundError: [Errno 2] No such file or directory: './zoho_tokens.txt'
```

**Solution:**
```bash
# Create the token file directory
mkdir -p $(dirname ./zoho_tokens.txt)
touch ./zoho_tokens.txt

# Set proper permissions
chmod 600 ./zoho_tokens.txt

# For production, use absolute paths
ZOHO_SDK_TOKEN_STORE_PATH=/app/data/zoho_tokens.txt
```

### Issue 4: Data Center Configuration

**Error Message:**
```
ZohoSDKManagerError: Unsupported data center: INVALID
```

**Solution:**
```bash
# Valid data centers
ZOHO_SDK_DATA_CENTER=IN  # India
ZOHO_SDK_DATA_CENTER=US  # United States
ZOHO_SDK_DATA_CENTER=EU  # Europe
ZOHO_SDK_DATA_CENTER=AU  # Australia

# Check your Zoho account region
# India: accounts.zoho.in
# US: accounts.zoho.com
# EU: accounts.zoho.eu
# Australia: accounts.zoho.com.au
```

### Issue 5: Rate Limiting

**Error Message:**
```
AsyncZohoWrapperError: SDK operation failed: RATE_LIMIT_EXCEEDED
```

**Solution:**
```python
# Implement exponential backoff
import asyncio
import random

async def retry_with_backoff(operation, max_retries=3):
    for attempt in range(max_retries):
        try:
            return await operation()
        except AsyncZohoWrapperError as e:
            if "RATE_LIMIT" in str(e) and attempt < max_retries - 1:
                delay = (2 ** attempt) + random.uniform(0, 1)
                await asyncio.sleep(delay)
                continue
            raise
```

### Issue 6: Async Context Manager Issues

**Error Message:**
```
RuntimeError: asyncio.run() cannot be called from a running event loop
```

**Solution:**
```python
# Don't use asyncio.run() in async functions
# Instead use direct await

# ❌ Wrong
async def bad_example():
    result = asyncio.run(wrapper.get_records("Deals"))

# ✅ Correct
async def good_example():
    async with AsyncZohoWrapper() as wrapper:
        result = await wrapper.get_records("Deals")
```

### Issue 7: Field Mapping Errors

**Error Message:**
```
KeyError: 'Deal_Name' not found in response
```

**Solution:**
```python
# Use safe field access
def safe_get_field(record, field_name, default=None):
    if isinstance(record, dict):
        return record.get(field_name, default)
    return default

# Example usage
deal_name = safe_get_field(deal_record, "Deal_Name", "Unknown Deal")
```

### Issue 8: Thread Pool Exhaustion

**Error Message:**
```
RuntimeError: cannot schedule new futures after shutdown
```

**Solution:**
```python
# Always use context manager for AsyncZohoWrapper
# ❌ Wrong
wrapper = AsyncZohoWrapper()
result = await wrapper.get_records("Deals")

# ✅ Correct
async with AsyncZohoWrapper() as wrapper:
    result = await wrapper.get_records("Deals")

# For multiple operations
async with AsyncZohoWrapper() as wrapper:
    deals = await wrapper.get_records("Deals")
    contacts = await wrapper.get_records("Contacts")
```

## Performance Issues

### Slow Response Times

**Diagnosis:**
```python
import time
import logging

# Enable debug logging
logging.getLogger('app.services.async_zoho_wrapper').setLevel(logging.DEBUG)

# Measure operation time
start_time = time.time()
async with AsyncZohoWrapper() as wrapper:
    result = await wrapper.get_records("Deals", per_page=100)
end_time = time.time()

print(f"Operation took: {end_time - start_time:.2f} seconds")
```

**Solutions:**
1. **Reduce page size**: Use smaller `per_page` values (50-100)
2. **Limit fields**: Specify only required fields
3. **Use pagination**: Don't fetch all records at once
4. **Implement caching**: Cache frequently accessed data

### Memory Usage

**Monitor memory usage:**
```python
import psutil
import os

process = psutil.Process(os.getpid())
memory_mb = process.memory_info().rss / 1024 / 1024
print(f"Memory usage: {memory_mb:.2f} MB")
```

**Optimization:**
```python
# Process records in batches
async def process_large_dataset():
    page = 1
    per_page = 100
    
    while True:
        async with AsyncZohoWrapper() as wrapper:
            result = await wrapper.get_records(
                "Deals", page=page, per_page=per_page
            )
            
            if not result.get("data"):
                break
                
            # Process batch
            process_batch(result["data"])
            
            # Clear references
            del result
            page += 1
```

## Environment-Specific Issues

### Development Environment

**Common Issues:**
1. **SSL Certificate errors**: Use `--trusted-host` for pip
2. **Port conflicts**: Change development port
3. **Database locks**: Use separate test database

**Solutions:**
```bash
# SSL issues
pip install --trusted-host pypi.org --trusted-host pypi.python.org zohocrmsdk8_0

# Port conflicts
uvicorn main:app --port 8001

# Test database
DATABASE_URL=sqlite:///./test_pipeline_pulse.db
```

### Production Environment

**Common Issues:**
1. **Permission errors**: Check file permissions
2. **Environment variables**: Verify all variables are set
3. **Network connectivity**: Check firewall rules

**Solutions:**
```bash
# Check permissions
ls -la /app/data/
chmod 755 /app/data/
chmod 600 /app/data/zoho_tokens.txt

# Verify environment
env | grep ZOHO

# Test connectivity
curl -v https://www.zohoapis.in/crm/v8/Deals
```

## Health Checks

### SDK Health Endpoint

Create a comprehensive health check:

```python
from fastapi import APIRouter

@router.get("/health/sdk")
async def sdk_health_check():
    checks = {}
    
    # Check SDK availability
    try:
        from app.services.zoho_sdk_manager import get_sdk_manager
        manager = get_sdk_manager()
        checks["sdk_manager"] = manager.validate_initialization()
    except Exception as e:
        checks["sdk_manager"] = {"status": "error", "error": str(e)}
    
    # Check service connectivity
    try:
        from app.services.zoho_service import ZohoService
        service = ZohoService()
        checks["service_status"] = await service.get_connection_status()
    except Exception as e:
        checks["service_status"] = {"status": "error", "error": str(e)}
    
    # Overall health
    overall_status = "healthy"
    for check in checks.values():
        if check.get("status") != "healthy":
            overall_status = "unhealthy"
            break
    
    return {
        "overall_status": overall_status,
        "checks": checks,
        "timestamp": datetime.now().isoformat()
    }
```

### Monitoring Script

```python
#!/usr/bin/env python3
"""
SDK Health Monitor
Run this script to continuously monitor SDK health
"""

import asyncio
import logging
from datetime import datetime

async def monitor_sdk_health():
    while True:
        try:
            from app.services.zoho_service import ZohoService
            service = ZohoService()
            status = await service.get_connection_status()
            
            if status["status"] == "healthy":
                print(f"✅ {datetime.now()}: SDK healthy")
            else:
                print(f"❌ {datetime.now()}: SDK unhealthy - {status.get('error')}")
                
        except Exception as e:
            print(f"💥 {datetime.now()}: Monitor error - {e}")
        
        await asyncio.sleep(60)  # Check every minute

if __name__ == "__main__":
    asyncio.run(monitor_sdk_health())
```

## Debug Commands

### Enable Verbose Logging

```python
import logging

# Set up comprehensive logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# Enable specific loggers
loggers = [
    'app.services.zoho_sdk_manager',
    'app.services.async_zoho_wrapper',
    'app.services.zoho_service',
    'zohocrmsdk'  # SDK internal logging
]

for logger_name in loggers:
    logging.getLogger(logger_name).setLevel(logging.DEBUG)
```

### Test Script

```python
#!/usr/bin/env python3
"""
SDK Test Script - Comprehensive SDK testing
"""

import asyncio
import sys
from app.services.zoho_sdk_manager import get_sdk_manager
from app.services.zoho_service import ZohoService

async def comprehensive_test():
    print("🧪 Starting SDK Comprehensive Test")
    
    # Test 1: SDK Manager
    print("\n1️⃣ Testing SDK Manager...")
    manager = get_sdk_manager()
    status = manager.validate_initialization()
    print(f"   Status: {status}")
    
    # Test 2: Service Initialization
    print("\n2️⃣ Testing Service...")
    service = ZohoService()
    connection_status = await service.get_connection_status()
    print(f"   Connection: {connection_status}")
    
    # Test 3: Field Validation
    print("\n3️⃣ Testing Field Validation...")
    tests = [
        ("Amount", "1000.50", True),
        ("Amount", "invalid", False),
        ("Probability", "75", True),
        ("Probability", "150", False),
    ]
    
    for field, value, expected_valid in tests:
        result = service.validate_field(field, value)
        status = "✅" if result["valid"] == expected_valid else "❌"
        print(f"   {status} {field}={value} -> {result['valid']}")
    
    print("\n🎉 Test completed!")

if __name__ == "__main__":
    asyncio.run(comprehensive_test())
```

## Getting Help

### Log Analysis

When reporting issues, include:

1. **Error logs** with full stack trace
2. **Configuration** (sanitize secrets)
3. **Environment details** (Python version, OS, etc.)
4. **Steps to reproduce** the issue

### Support Channels

1. **Internal Documentation**: Check this troubleshooting guide
2. **Zoho Developer Support**: [https://help.zoho.com/portal/en/community/zoho-crm](https://help.zoho.com/portal/en/community/zoho-crm)
3. **SDK Documentation**: [https://www.zoho.com/crm/developer/docs/](https://www.zoho.com/crm/developer/docs/)

### Escalation Path

1. **Level 1**: Check this guide and try common solutions
2. **Level 2**: Run diagnostic scripts and analyze logs
3. **Level 3**: Contact team lead with full diagnostic report
4. **Level 4**: Escalate to Zoho developer support

---

**Last Updated**: 2024-12-03  
**Version**: 1.0.0