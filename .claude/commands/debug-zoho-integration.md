# Debug Zoho Integration

Debug and troubleshoot Zoho CRM integration issues: $ARGUMENTS

## 🔍 Common Zoho Integration Issues

### Authentication Problems
- OAuth2 token expiration and refresh failures
- Invalid client credentials
- Redirect URL mismatches
- Scope permission issues

### API Connection Issues
- Rate limiting and quota exceeded
- Network connectivity problems
- SSL certificate issues
- API endpoint changes

### Data Synchronization Problems
- Field mapping mismatches
- Data type conversion errors
- Missing required fields
- Custom field access issues

## 🛠️ Diagnostic Commands

### Check Authentication Status

```python
# Test Zoho authentication
python -c "
from app.services.zoho_auth_service import ZohoAuthService
import asyncio

async def test_auth():
    auth_service = ZohoAuthService()
    try:
        # Test token retrieval
        token = await auth_service.get_access_token()
        print(f'✅ Access token retrieved: {token[:20]}...')
        
        # Test token refresh
        refresh_result = await auth_service.refresh_token()
        print(f'✅ Token refresh: {refresh_result}')
        
        # Check token expiry
        expires_at = auth_service.get_token_expiry()
        print(f'🕒 Token expires at: {expires_at}')
        
    except Exception as e:
        print(f'❌ Authentication failed: {str(e)}')

asyncio.run(test_auth())
"
```

### Test API Connectivity

```python
# Test basic API connectivity
python -c "
from app.services.zoho_service import ZohoService
import asyncio

async def test_api():
    zoho_service = ZohoService()
    try:
        # Test basic API call
        deals = await zoho_service.get_deals(limit=1)
        print(f'✅ API connectivity: Retrieved {len(deals)} deals')
        
        # Test specific endpoints
        fields = await zoho_service.get_fields()
        print(f'✅ Fields endpoint: {len(fields)} fields available')
        
        # Test user info
        user_info = await zoho_service.get_user_info()
        print(f'✅ User info: {user_info.get(\"display_name\", \"Unknown\")}')
        
    except Exception as e:
        print(f'❌ API test failed: {str(e)}')
        import traceback
        traceback.print_exc()

asyncio.run(test_api())
"
```

### Check Environment Configuration

```bash
# Verify environment variables
python -c "
import os
from dotenv import load_dotenv

load_dotenv()

required_vars = [
    'ZOHO_CLIENT_ID',
    'ZOHO_CLIENT_SECRET', 
    'ZOHO_REDIRECT_URL',
    'ZOHO_BASE_URL'
]

print('🔧 Environment Configuration Check:')
for var in required_vars:
    value = os.getenv(var)
    if value:
        # Mask sensitive values
        if 'SECRET' in var or 'TOKEN' in var:
            display_value = value[:8] + '...' if len(value) > 8 else '***'
        else:
            display_value = value
        print(f'✅ {var}: {display_value}')
    else:
        print(f'❌ {var}: Missing')

# Check database connection
try:
    from app.core.database import get_db
    db = next(get_db())
    print('✅ Database connection: OK')
except Exception as e:
    print(f'❌ Database connection: {str(e)}')
"
```

## 🔧 Zoho API Diagnostics

### Test Rate Limiting

```python
# Test API rate limits
python -c "
import asyncio
import time
from app.services.zoho_service import ZohoService

async def test_rate_limits():
    zoho_service = ZohoService()
    
    print('🚀 Testing API rate limits...')
    
    start_time = time.time()
    successful_calls = 0
    failed_calls = 0
    
    for i in range(10):  # Test 10 rapid calls
        try:
            deals = await zoho_service.get_deals(limit=1)
            successful_calls += 1
            print(f'Call {i+1}: ✅ Success')
        except Exception as e:
            failed_calls += 1
            print(f'Call {i+1}: ❌ Failed - {str(e)}')
            
            # Check if it's a rate limit error
            if '429' in str(e) or 'rate limit' in str(e).lower():
                print('⚠️ Rate limit detected')
                break
        
        await asyncio.sleep(0.1)  # Small delay between calls
    
    duration = time.time() - start_time
    print(f'\\n📊 Results:')
    print(f'Successful calls: {successful_calls}')
    print(f'Failed calls: {failed_calls}')
    print(f'Duration: {duration:.2f} seconds')
    print(f'Rate: {successful_calls/duration:.2f} calls/second')

asyncio.run(test_rate_limits())
"
```

### Validate Field Mappings

```python
# Check field mappings between Pipeline Pulse and Zoho
python -c "
from app.services.zoho_service import ZohoService
import asyncio

async def validate_field_mappings():
    zoho_service = ZohoService()
    
    # Expected fields from Pipeline Pulse mapping
    expected_fields = {
        'Business_Region': 'Territory/Region',
        'Solution_Type': 'Service Line',
        'Type_of_Funding': 'AWS Funded Tag',
        'Market_Segment': 'Alliance Motion',
        'Proposal_Submission_date': 'Proposal Sent Date',
        'PO_Generation_Date': 'PO Received Date',
        'Kick_off_Date': 'Kickoff Date',
        'Invoice_Date': 'Invoice Date',
        'Received_On': 'Payment Received',
        'OB_Recognition_Date': 'Revenue Recognition'
    }
    
    try:
        # Get all available fields
        fields = await zoho_service.get_fields()
        field_names = [f.get('api_name', '') for f in fields]
        
        print('🗺️ Field Mapping Validation:')
        
        missing_fields = []
        available_fields = []
        
        for zoho_field, pipeline_field in expected_fields.items():
            if zoho_field in field_names:
                print(f'✅ {pipeline_field} -> {zoho_field}')
                available_fields.append(zoho_field)
            else:
                print(f'❌ {pipeline_field} -> {zoho_field} (NOT FOUND)')
                missing_fields.append(zoho_field)
        
        print(f'\\n📊 Summary:')
        print(f'Available fields: {len(available_fields)}/{len(expected_fields)}')
        print(f'Missing fields: {len(missing_fields)}')
        
        if missing_fields:
            print(f'\\n⚠️ Missing fields need to be created in Zoho CRM:')
            for field in missing_fields:
                print(f'  - {field}')
        
    except Exception as e:
        print(f'❌ Field validation failed: {str(e)}')

asyncio.run(validate_field_mappings())
"
```

## 🧪 Data Integrity Tests

### Test Data Synchronization

```python
# Test data sync between Pipeline Pulse and Zoho
python -c "
from app.services.zoho_service import ZohoService
from app.core.database import get_db
from app.models.analysis import Analysis
import asyncio

async def test_data_sync():
    zoho_service = ZohoService()
    db = next(get_db())
    
    try:
        # Get sample data from both sources
        print('📊 Testing data synchronization...')
        
        # Get deals from Zoho
        zoho_deals = await zoho_service.get_deals(limit=5)
        print(f'Zoho CRM: {len(zoho_deals)} deals retrieved')
        
        # Get local records
        local_records = db.query(Analysis).limit(5).all()
        print(f'Local DB: {len(local_records)} records found')
        
        # Check for common fields
        if zoho_deals and local_records:
            zoho_deal = zoho_deals[0]
            local_record = local_records[0]
            
            print('\\n🔍 Field comparison:')
            common_fields = ['Deal_Name', 'Account_Name', 'Amount', 'Stage']
            
            for field in common_fields:
                zoho_value = zoho_deal.get(field, 'N/A')
                local_value = getattr(local_record, field.lower(), 'N/A')
                
                if str(zoho_value) == str(local_value):
                    print(f'✅ {field}: Match')
                else:
                    print(f'⚠️ {field}: Zoho={zoho_value}, Local={local_value}')
        
        # Test currency conversion
        print('\\n💱 Testing currency conversion:')
        sgd_amounts = []
        for deal in zoho_deals[:3]:
            original_amount = deal.get('Amount', 0)
            currency = deal.get('Currency', 'USD')
            
            if original_amount and currency != 'SGD':
                # Test conversion (mock)
                converted_amount = original_amount * 1.35  # Mock USD to SGD
                print(f'💰 {currency} {original_amount} -> SGD {converted_amount:.2f}')
                sgd_amounts.append(converted_amount)
            else:
                sgd_amounts.append(original_amount)
        
        if sgd_amounts:
            total_sgd = sum(sgd_amounts)
            print(f'💰 Total pipeline value: SGD {total_sgd:,.2f}')
        
    except Exception as e:
        print(f'❌ Data sync test failed: {str(e)}')

asyncio.run(test_data_sync())
"
```

### Test Bulk Update Operations

```python
# Test bulk update functionality
python -c "
from app.services.zoho_service import ZohoService
import asyncio

async def test_bulk_update():
    zoho_service = ZohoService()
    
    try:
        print('🔄 Testing bulk update operations...')
        
        # Get a test deal
        deals = await zoho_service.get_deals(limit=1)
        if not deals:
            print('❌ No deals found for testing')
            return
        
        test_deal = deals[0]
        deal_id = test_deal.get('id')
        
        print(f'📝 Test deal: {test_deal.get(\"Deal_Name\", \"Unknown\")} (ID: {deal_id})')
        
        # Test field update (safe field that won't affect business)
        update_data = {
            'id': deal_id,
            'Description': f'Test update from Pipeline Pulse - {asyncio.get_event_loop().time()}'
        }
        
        # Simulate bulk update (single record for safety)
        update_result = await zoho_service.bulk_update_deals([update_data])
        
        if update_result.get('success_count', 0) > 0:
            print('✅ Bulk update test: SUCCESS')
        else:
            print('❌ Bulk update test: FAILED')
            print(f'Error details: {update_result}')
        
        # Verify the update
        updated_deal = await zoho_service.get_deal(deal_id)
        if updated_deal:
            print(f'✅ Update verification: Deal retrieved successfully')
            print(f'Description: {updated_deal.get(\"Description\", \"N/A\")}')
        else:
            print('❌ Update verification: Failed to retrieve updated deal')
        
    except Exception as e:
        print(f'❌ Bulk update test failed: {str(e)}')

asyncio.run(test_bulk_update())
"
```

## 🔧 Common Issue Fixes

### Fix Token Refresh Issues

```python
# Diagnose and fix token refresh problems
python -c "
from app.services.zoho_auth_service import ZohoAuthService
from app.core.database import get_db
import asyncio
import os

async def fix_token_issues():
    auth_service = ZohoAuthService()
    
    print('🔧 Diagnosing token issues...')
    
    try:
        # Check current token status
        current_token = auth_service.get_stored_token()
        if current_token:
            print('✅ Token found in storage')
            
            # Check if token is expired
            if auth_service.is_token_expired():
                print('⚠️ Token is expired, attempting refresh...')
                
                refresh_success = await auth_service.refresh_token()
                if refresh_success:
                    print('✅ Token refreshed successfully')
                else:
                    print('❌ Token refresh failed')
                    print('💡 Solution: Re-authenticate via /zoho/auth endpoint')
            else:
                print('✅ Token is still valid')
        else:
            print('❌ No token found in storage')
            print('💡 Solution: Complete OAuth2 flow via /zoho/auth endpoint')
        
        # Test token with API call
        try:
            test_token = await auth_service.get_access_token()
            print(f'✅ Token test successful: {test_token[:20]}...')
        except Exception as e:
            print(f'❌ Token test failed: {str(e)}')
            
            # Suggest solutions
            print('\\n💡 Troubleshooting steps:')
            print('1. Check ZOHO_CLIENT_ID and ZOHO_CLIENT_SECRET in environment')
            print('2. Verify redirect URL matches Zoho app configuration')
            print('3. Ensure Zoho app has required scopes enabled')
            print('4. Re-authenticate via web interface')
        
    except Exception as e:
        print(f'❌ Token diagnosis failed: {str(e)}')

asyncio.run(fix_token_issues())
"
```

### Reset Authentication Flow

```bash
# Reset Zoho authentication completely
python -c "
from app.core.database import get_db
from app.models.zoho_token import ZohoToken  # Assuming you have this model
import os

def reset_auth():
    print('🔄 Resetting Zoho authentication...')
    
    try:
        # Clear stored tokens from database
        db = next(get_db())
        tokens = db.query(ZohoToken).all()
        for token in tokens:
            db.delete(token)
        db.commit()
        print('✅ Cleared stored tokens from database')
        
        # Clear any cached tokens in environment
        env_vars_to_clear = [
            'ZOHO_ACCESS_TOKEN',
            'ZOHO_REFRESH_TOKEN'
        ]
        
        for var in env_vars_to_clear:
            if os.getenv(var):
                print(f'⚠️ Found {var} in environment - should be cleared')
        
        print('\\n🔧 Next steps:')
        print('1. Restart the backend server')
        print('2. Visit /token-management page in frontend')
        print('3. Click \"Connect to Zoho CRM\" button')
        print('4. Complete OAuth2 authentication flow')
        print('5. Test connection with a few API calls')
        
    except Exception as e:
        print(f'❌ Reset failed: {str(e)}')

reset_auth()
"
```

### Fix Field Mapping Issues

```python
# Diagnose and suggest fixes for field mapping issues
python -c "
from app.services.zoho_service import ZohoService
import asyncio

async def fix_field_mapping():
    zoho_service = ZohoService()
    
    print('🗺️ Diagnosing field mapping issues...')
    
    try:
        # Get all available fields
        fields = await zoho_service.get_fields()
        
        # Create lookup for easy searching
        field_lookup = {f.get('api_name', '').lower(): f for f in fields}
        field_names = list(field_lookup.keys())
        
        # Check for common field variations
        required_mappings = {
            'territory': ['business_region', 'region', 'territory', 'area'],
            'service_line': ['solution_type', 'service_type', 'product_line', 'service'],
            'aws_funding': ['type_of_funding', 'funding_type', 'aws_program'],
            'proposal_date': ['proposal_submission_date', 'proposal_date', 'proposal_sent'],
            'po_date': ['po_generation_date', 'po_date', 'purchase_order_date'],
            'kickoff_date': ['kick_off_date', 'kickoff_date', 'project_start'],
            'invoice_date': ['invoice_date', 'billing_date', 'invoice_generated'],
            'payment_date': ['received_on', 'payment_date', 'payment_received'],
            'revenue_date': ['ob_recognition_date', 'revenue_recognition_date', 'revenue_date']
        }
        
        print('\\n🔍 Field mapping suggestions:')
        
        suggestions = {}
        for pipeline_field, possible_names in required_mappings.items():
            found_matches = []
            
            for possible_name in possible_names:
                if possible_name in field_names:
                    field_info = field_lookup[possible_name]
                    found_matches.append({
                        'api_name': field_info.get('api_name'),
                        'display_label': field_info.get('display_label'),
                        'data_type': field_info.get('data_type')
                    })
            
            if found_matches:
                best_match = found_matches[0]
                print(f'✅ {pipeline_field}: {best_match[\"api_name\"]} ({best_match[\"data_type\"]})')
                suggestions[pipeline_field] = best_match['api_name']
            else:
                print(f'❌ {pipeline_field}: No matching field found')
                print(f'   💡 Create custom field in Zoho CRM with API name: {possible_names[0]}')
        
        # Generate mapping configuration
        if suggestions:
            print('\\n📋 Suggested field mapping configuration:')
            print('FIELD_MAPPING = {')
            for pipeline_field, zoho_field in suggestions.items():
                print(f'    \"{pipeline_field}\": \"{zoho_field}\",')
            print('}')
        
    except Exception as e:
        print(f'❌ Field mapping diagnosis failed: {str(e)}')

asyncio.run(fix_field_mapping())
"
```

## 📊 Performance Diagnostics

### Test API Performance

```python
# Test API response times and performance
python -c "
import asyncio
import time
from app.services.zoho_service import ZohoService

async def test_performance():
    zoho_service = ZohoService()
    
    print('⚡ Testing API performance...')
    
    # Test different page sizes
    page_sizes = [1, 10, 50, 100, 200]
    
    for page_size in page_sizes:
        try:
            start_time = time.time()
            deals = await zoho_service.get_deals(limit=page_size)
            end_time = time.time()
            
            duration = end_time - start_time
            rate = len(deals) / duration if duration > 0 else 0
            
            print(f'📊 Page size {page_size}: {duration:.2f}s, {len(deals)} records, {rate:.1f} records/sec')
            
        except Exception as e:
            print(f'❌ Page size {page_size}: Failed - {str(e)}')
    
    # Test field retrieval performance
    print('\\n🔍 Testing field retrieval...')
    start_time = time.time()
    fields = await zoho_service.get_fields()
    end_time = time.time()
    
    print(f'📊 Fields retrieval: {end_time - start_time:.2f}s, {len(fields)} fields')
    
    # Test bulk operations performance
    print('\\n🔄 Testing bulk operations...')
    test_deals = await zoho_service.get_deals(limit=5)
    
    if test_deals:
        # Prepare bulk update data (safe test)
        bulk_data = []
        for deal in test_deals:
            bulk_data.append({
                'id': deal.get('id'),
                'Description': f'Performance test - {time.time()}'
            })
        
        start_time = time.time()
        result = await zoho_service.bulk_update_deals(bulk_data)
        end_time = time.time()
        
        duration = end_time - start_time
        success_count = result.get('success_count', 0)
        
        print(f'📊 Bulk update: {duration:.2f}s, {success_count} records updated')

asyncio.run(test_performance())
"
```

### Check Memory Usage

```python
# Monitor memory usage during Zoho operations
python -c "
import asyncio
import psutil
import os
from app.services.zoho_service import ZohoService

async def monitor_memory():
    process = psutil.Process(os.getpid())
    zoho_service = ZohoService()
    
    print('🧠 Monitoring memory usage...')
    
    # Initial memory
    initial_memory = process.memory_info().rss / 1024 / 1024  # MB
    print(f'Initial memory: {initial_memory:.2f} MB')
    
    # Test large data fetch
    print('\\n📥 Fetching large dataset...')
    memory_before = process.memory_info().rss / 1024 / 1024
    
    deals = await zoho_service.get_deals(limit=1000)  # Large dataset
    
    memory_after = process.memory_info().rss / 1024 / 1024
    memory_used = memory_after - memory_before
    
    print(f'Memory before: {memory_before:.2f} MB')
    print(f'Memory after: {memory_after:.2f} MB')
    print(f'Memory used: {memory_used:.2f} MB')
    print(f'Records fetched: {len(deals)}')
    print(f'Memory per record: {memory_used/len(deals)*1024:.2f} KB' if deals else 'N/A')
    
    # Test garbage collection
    import gc
    gc.collect()
    
    memory_after_gc = process.memory_info().rss / 1024 / 1024
    memory_freed = memory_after - memory_after_gc
    
    print(f'\\n🗑️ After garbage collection: {memory_after_gc:.2f} MB')
    print(f'Memory freed: {memory_freed:.2f} MB')

asyncio.run(monitor_memory())
"
```

## 🚨 Emergency Fixes

### Complete System Reset

```bash
# Emergency reset for complete system failure
echo "🚨 EMERGENCY ZOHO INTEGRATION RESET"
echo "This will reset all Zoho-related data and configuration"
echo ""
read -p "Are you sure you want to proceed? (yes/no): " confirm

if [ "$confirm" = "yes" ]; then
    echo "🔄 Resetting Zoho integration..."
    
    # Stop backend server
    echo "⏹️ Stopping backend server..."
    pkill -f "uvicorn main:app"
    
    # Clear cached tokens
    echo "🗑️ Clearing cached data..."
    cd backend
    python -c "
from app.core.database import get_db
from sqlalchemy import text
db = next(get_db())
# Clear token tables (adjust table names as needed)
try:
    db.execute(text('DELETE FROM zoho_tokens'))
    db.execute(text('DELETE FROM bulk_update_batches'))
    db.execute(text('DELETE FROM bulk_update_records'))
    db.commit()
    print('✅ Database cleared')
except Exception as e:
    print(f'⚠️ Database clear error: {e}')
"
    
    # Reset environment
    echo "🔧 Checking environment configuration..."
    python -c "
import os
required_vars = ['ZOHO_CLIENT_ID', 'ZOHO_CLIENT_SECRET', 'ZOHO_REDIRECT_URL']
missing = [v for v in required_vars if not os.getenv(v)]
if missing:
    print(f'❌ Missing environment variables: {missing}')
    print('💡 Please check your .env file')
else:
    print('✅ Environment variables present')
"
    
    # Restart services
    echo "🚀 Restarting backend server..."
    uvicorn main:app --reload --port 8000 &
    
    echo ""
    echo "✅ Reset complete!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Wait for backend server to start (check http://localhost:8000/docs)"
    echo "2. Visit frontend token management page"
    echo "3. Complete OAuth2 authentication flow"
    echo "4. Test basic API connectivity"
    echo "5. Run field mapping validation"
    
else
    echo "❌ Reset cancelled"
fi
```

### Quick Health Check

```bash
# Quick health check for Zoho integration
echo "🏥 Zoho Integration Health Check"
echo "================================"

echo ""
echo "1️⃣ Environment Configuration:"
cd backend
python -c "
import os
from dotenv import load_dotenv
load_dotenv()

checks = {
    'ZOHO_CLIENT_ID': bool(os.getenv('ZOHO_CLIENT_ID')),
    'ZOHO_CLIENT_SECRET': bool(os.getenv('ZOHO_CLIENT_SECRET')),
    'ZOHO_REDIRECT_URL': bool(os.getenv('ZOHO_REDIRECT_URL')),
    'ZOHO_BASE_URL': bool(os.getenv('ZOHO_BASE_URL'))
}

for var, status in checks.items():
    print(f'   {\"✅\" if status else \"❌\"} {var}')
"

echo ""
echo "2️⃣ Backend Server Status:"
if curl -f http://localhost:8000/health >/dev/null 2>&1; then
    echo "   ✅ Backend server running"
else
    echo "   ❌ Backend server not responding"
fi

echo ""
echo "3️⃣ Database Connectivity:"
python -c "
try:
    from app.core.database import get_db
    db = next(get_db())
    print('   ✅ Database connection OK')
except Exception as e:
    print(f'   ❌ Database connection failed: {e}')
"

echo ""
echo "4️⃣ Zoho API Connectivity:"
python -c "
from app.services.zoho_service import ZohoService
import asyncio

async def quick_test():
    try:
        zoho_service = ZohoService()
        deals = await zoho_service.get_deals(limit=1)
        print('   ✅ Zoho API accessible')
        print(f'   📊 Sample data: {len(deals)} deals retrieved')
    except Exception as e:
        print(f'   ❌ Zoho API failed: {str(e)[:50]}...')

asyncio.run(quick_test())
"

echo ""
echo "🎯 Health Check Complete"
echo ""
echo "If any checks failed, run the detailed diagnostic commands above"
echo "or use the emergency reset procedure for critical issues."
```

## 📋 Troubleshooting Checklist

### Authentication Issues ✅
- [ ] Environment variables configured correctly
- [ ] Zoho app client ID and secret are valid
- [ ] Redirect URL matches Zoho app configuration
- [ ] Required scopes are enabled in Zoho app
- [ ] Token is not expired or corrupted
- [ ] Database stores token data correctly

### API Connection Issues ✅
- [ ] Network connectivity to Zoho servers
- [ ] SSL certificates are valid
- [ ] API endpoints are correct
- [ ] Rate limits not exceeded
- [ ] Request headers formatted correctly
- [ ] JSON payload structure is valid

### Data Issues ✅
- [ ] Field mappings are correct
- [ ] Data types match between systems
- [ ] Required fields are provided
- [ ] Custom fields exist in Zoho CRM
- [ ] Currency conversion is working
- [ ] Date formats are consistent

### Performance Issues ✅
- [ ] Memory usage within acceptable limits
- [ ] API response times under 5 seconds
- [ ] Bulk operations complete successfully
- [ ] Database queries are optimized
- [ ] Background tasks are processing
- [ ] Error rates below 5%

Usage: `/debug-zoho [issue_type]` where issue_type is `auth`, `api`, `data`, `performance`, or `all`