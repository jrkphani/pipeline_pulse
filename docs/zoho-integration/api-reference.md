# Zoho Integration API Reference

## 📋 Overview

This reference documents all Zoho-related API endpoints and SDK operations used in Pipeline Pulse, including authentication, data retrieval, and synchronization.

## 🔐 Authentication Endpoints

### OAuth Authorization

**GET** `/api/oauth/zoho/authorize`

Initiates Zoho OAuth flow for CRM access.

**Response:**
```json
{
  "authorization_url": "https://accounts.zoho.in/oauth/v2/auth?...",
  "state": "random_state_token"
}
```

**GET** `/api/oauth/callback`

Handles OAuth callback and exchanges authorization code for tokens.

**Query Parameters:**
- `code` (required): Authorization code from Zoho
- `state` (optional): State parameter for CSRF protection

**Response:**
```json
{
  "status": "success",
  "message": "Authorization successful",
  "user": {
    "email": "user@example.com",
    "tokens_stored": true
  }
}
```

### Token Management

**GET** `/api/zoho/status`

Returns current OAuth token status and connection health.

**Response:**
```json
{
  "status": "healthy",
  "connection": "active",
  "token_info": {
    "access_token_valid": true,
    "refresh_token_available": true,
    "expires_at": "2024-12-04T10:30:00Z"
  },
  "last_refresh": "2024-12-03T10:30:00Z"
}
```

## 📊 CRM Data Endpoints

### Organization Information

**GET** `/api/zoho/organization`

Retrieves Zoho CRM organization details.

**Response:**
```json
{
  "status": "success",
  "data": {
    "company_name": "1CloudHub",
    "country": "Singapore",
    "currency": "SGD",
    "time_zone": "Asia/Singapore",
    "date_format": "dd/MM/yyyy"
  }
}
```

### Deals Management

**GET** `/api/deals`

Retrieves deals from Zoho CRM with filtering and pagination.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `per_page` (optional): Records per page (default: 200, max: 200)
- `fields` (optional): Comma-separated field names
- `stage` (optional): Filter by deal stage
- `territory` (optional): Filter by territory

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "id": "4876876000000123456",
      "Deal_Name": "AWS Migration Project",
      "Amount": 150000.00,
      "Stage": "Proposal/Price Quote",
      "Closing_Date": "2024-12-31",
      "Account_Name": "Tech Corp",
      "Owner": {
        "name": "John Doe",
        "email": "john@1cloudhub.com"
      },
      "Territory": "Singapore",
      "Service_Line": "Cloud Migration",
      "AWS_Funded_Tag": "Migration Acceleration Program"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 200,
    "total_records": 1,
    "has_next": false
  }
}
```

**GET** `/api/deals/{deal_id}`

Retrieves a specific deal by ID.

**Response:**
```json
{
  "status": "success",
  "data": {
    "id": "4876876000000123456",
    "Deal_Name": "AWS Migration Project",
    "Amount": 150000.00,
    "Stage": "Proposal/Price Quote",
    "Closing_Date": "2024-12-31",
    "Account_Name": "Tech Corp",
    "Territory": "Singapore",
    "Service_Line": "Cloud Migration",
    "AWS_Funded_Tag": "Migration Acceleration Program",
    "Proposal_Submission_Date": "2024-11-15",
    "PO_Generation_Date": null,
    "Kick_off_Date": null
  }
}
```

**PUT** `/api/deals/{deal_id}`

Updates a specific deal.

**Request Body:**
```json
{
  "Deal_Name": "Updated Deal Name",
  "Amount": 200000.00,
  "Stage": "Negotiation/Review"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Deal updated successfully",
  "data": {
    "id": "4876876000000123456",
    "updated_fields": ["Deal_Name", "Amount", "Stage"]
  }
}
```

### Bulk Operations

**POST** `/api/bulk/deals/update`

Updates multiple deals in a single operation.

**Request Body:**
```json
{
  "records": [
    {
      "id": "4876876000000123456",
      "Stage": "Closed Won",
      "Closing_Date": "2024-12-01"
    },
    {
      "id": "4876876000000123457", 
      "Stage": "Closed Lost",
      "Closing_Date": "2024-12-01"
    }
  ]
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Bulk update completed",
  "results": {
    "successful": 2,
    "failed": 0,
    "details": [
      {
        "id": "4876876000000123456",
        "status": "success"
      },
      {
        "id": "4876876000000123457",
        "status": "success"
      }
    ]
  }
}
```

## 🔄 Synchronization Endpoints

### Full Synchronization

**POST** `/api/sync/full`

Initiates complete data synchronization from Zoho CRM.

**Request Body:**
```json
{
  "force_refresh": false,
  "modules": ["Deals", "Accounts", "Contacts"]
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Full synchronization initiated",
  "sync_id": "sync_123456789",
  "estimated_duration": "5-10 minutes"
}
```

**GET** `/api/sync/status`

Returns current synchronization status.

**Response:**
```json
{
  "status": "success",
  "data": {
    "last_sync": "2024-12-03T14:30:00Z",
    "sync_status": "completed",
    "records_processed": 1250,
    "records_updated": 45,
    "records_created": 12,
    "errors": 0,
    "next_scheduled_sync": "2024-12-03T18:00:00Z"
  }
}
```

### Dashboard Data

**GET** `/api/sync/live-dashboard-data`

Retrieves real-time dashboard data with live sync from Zoho.

**Response:**
```json
{
  "status": "success",
  "data": {
    "total_records": 1250,
    "active_deals": 145,
    "total_pipeline_value": 15750000.00,
    "quarterly_forecast": {
      "q4_2024": 3250000.00,
      "q1_2025": 4100000.00
    },
    "by_stage": {
      "Qualification": 25,
      "Proposal/Price Quote": 34,
      "Negotiation/Review": 18,
      "Closed Won": 12,
      "Closed Lost": 8
    },
    "by_territory": {
      "Singapore": 67,
      "Malaysia": 23,
      "Australia": 31,
      "Global": 24
    },
    "last_updated": "2024-12-03T15:45:00Z"
  }
}
```

## 🔍 SDK Operations Reference

### Zoho SDK Manager

Direct SDK operations available through the service layer:

```python
from app.services.zoho_service import ZohoService

# Initialize service
service = ZohoService()

# Get connection status
status = await service.get_connection_status()

# Get deals with filters
deals = await service.get_deals(
    page=1,
    per_page=100,
    stage="Proposal/Price Quote"
)

# Get specific deal
deal = await service.get_deal("4876876000000123456")

# Update deal
result = await service.update_deal(
    "4876876000000123456",
    {"Stage": "Negotiation/Review"}
)

# Create new deal
new_deal = await service.create_deal({
    "Deal_Name": "New Opportunity",
    "Amount": 75000.00,
    "Stage": "Qualification",
    "Account_Name": "Prospect Corp"
})

# Search deals
search_results = await service.search_deals(
    criteria="(Stage:equals:Proposal/Price Quote)"
)
```

### Async Zoho Wrapper

Low-level SDK operations:

```python
from app.services.async_zoho_wrapper import AsyncZohoWrapper

async with AsyncZohoWrapper() as wrapper:
    # Get records with specific fields
    result = await wrapper.get_records(
        module_name="Deals",
        page=1,
        per_page=200,
        fields=["Deal_Name", "Amount", "Stage", "Closing_Date"]
    )
    
    # Update multiple records
    records_data = [
        {"id": "123", "Stage": "Closed Won"},
        {"id": "456", "Stage": "Closed Lost"}
    ]
    result = await wrapper.update_records("Deals", records_data)
    
    # Search with criteria
    search_result = await wrapper.search_records(
        module_name="Deals",
        criteria="(Territory:equals:Singapore)"
    )
```

## 📋 Field Mappings

### Zoho CRM to Pipeline Pulse

| Zoho Field | Pipeline Pulse Field | Type | Required |
|------------|---------------------|------|----------|
| `Deal_Name` | `deal_name` | String | Yes |
| `Amount` | `amount` | Decimal | Yes |
| `Stage` | `stage` | String | Yes |
| `Closing_Date` | `closing_date` | Date | Yes |
| `Account_Name` | `account_name` | String | Yes |
| `Owner` | `owner` | Object | Yes |
| `Territory` | `territory` | String | No |
| `Service_Line` | `service_line` | String | No |
| `AWS_Funded_Tag` | `aws_funded_tag` | String | No |
| `Alliance_Motion` | `alliance_motion` | String | No |
| `Proposal_Submission_Date` | `proposal_date` | Date | No |
| `PO_Generation_Date` | `po_date` | Date | No |
| `Kick_off_Date` | `kickoff_date` | Date | No |
| `Invoice_Date` | `invoice_date` | Date | No |
| `Received_On` | `payment_date` | Date | No |
| `OB_Recognition_Date` | `revenue_date` | Date | No |

### O2R Business Fields

| Field | Values | Description |
|-------|--------|-------------|
| `Territory` | Singapore, Malaysia, Australia, Global | Business region |
| `Service_Line` | Cloud Migration, Data & Analytics, Security, Modern Apps | Solution type |
| `AWS_Funded_Tag` | MAP, ProServ Credit, Co-Sell, Private Offer | Funding type |
| `Alliance_Motion` | Strategic, Marketplace, Channel, Direct | Market segment |

## 🚨 Error Codes

### HTTP Status Codes

- `200` - Success
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (invalid or expired tokens)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

### Application Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| `ZOHO_AUTH_001` | Invalid access token | Refresh OAuth tokens |
| `ZOHO_AUTH_002` | Refresh token expired | Re-authenticate user |
| `ZOHO_API_001` | API rate limit exceeded | Implement retry with backoff |
| `ZOHO_API_002` | Invalid field name | Check field mapping |
| `ZOHO_API_003` | Record not found | Verify record ID |
| `ZOHO_SDK_001` | SDK initialization failed | Check configuration |
| `ZOHO_SDK_002` | Connection timeout | Check network connectivity |

### Error Response Format

```json
{
  "status": "error",
  "error": {
    "code": "ZOHO_AUTH_001",
    "message": "Invalid access token",
    "details": "The provided access token has expired",
    "timestamp": "2024-12-03T15:30:00Z"
  }
}
```

## 🔧 Rate Limiting

### API Limits

- **CRM API**: 10,000 credits per day
- **Concurrent requests**: 10 per minute
- **Bulk operations**: 100 records per request

### SDK Configuration

The SDK automatically handles rate limiting with:
- Exponential backoff
- Retry mechanisms
- Connection pooling
- Request queuing

## 🧪 Testing Endpoints

### Health Check

**GET** `/api/health/zoho`

Quick health check for Zoho integration.

**Response:**
```json
{
  "status": "healthy",
  "services": {
    "oauth": "connected",
    "crm_api": "accessible",
    "sdk": "initialized"
  },
  "timestamp": "2024-12-03T15:30:00Z"
}
```

### Test Endpoints (Development Only)

**GET** `/api/test/zoho/connection`

Tests Zoho CRM connectivity and returns sample data.

**POST** `/api/test/zoho/token-refresh`

Forces token refresh for testing purposes.

---

*This API reference consolidates all Zoho integration endpoints and provides comprehensive usage examples for developers.*