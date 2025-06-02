# Currency Conversion System with Database Persistence & Weekly Refresh

## Overview

Pipeline Pulse now features a comprehensive currency conversion system that persists exchange rates to the database and automatically refreshes them weekly. The system provides accurate SGD conversions for 17+ currencies with multiple fallback layers for maximum reliability.

## Features

### ✅ Database Persistence
- **SQLAlchemy Model**: `CurrencyRate` model with currency_code, sgd_rate, and updated_at fields
- **Automatic Caching**: All exchange rates are saved to the database with timestamps
- **Data Integrity**: Proper error handling and database rollback on failures
- **Historical Tracking**: Maintains update timestamps for cache age calculation

### ✅ Weekly Refresh System
- **Background Scheduler**: Runs every hour to check for stale rates (7+ days old)
- **Automatic Updates**: Triggers refresh when rates become stale
- **Manual Refresh**: API endpoint for on-demand updates
- **Timestamp Management**: Updates cache timestamps even with fallback rates

### ✅ Multi-Layer Fallback System
1. **Live API Rates**: CurrencyFreaks API (when API key configured)
2. **Fresh Cached Rates**: Database rates < 7 days old
3. **Stale Cached Rates**: Database rates > 7 days old (when API fails)
4. **Static Fallback Rates**: Hardcoded rates as final fallback

### ✅ Frontend Integration
- **Currency Status Component**: Real-time cache status display
- **Manual Refresh Button**: Allows users to trigger rate updates
- **Status Indicators**: Visual feedback for fresh/stale/empty cache states

## API Endpoints

### Currency Conversion
```bash
POST /api/currency/convert?amount=1000&from_currency=USD
```
**Response:**
```json
{
  "original_amount": 1000.0,
  "original_currency": "USD",
  "converted_amount": 1333.33,
  "target_currency": "SGD",
  "rate_source": "live",
  "conversion_rate": "1 SGD = 0.75 USD"
}
```

### Get Exchange Rates
```bash
GET /api/currency/rates
```
**Response:**
```json
{
  "USD": 0.75,
  "EUR": 0.68,
  "GBP": 0.58,
  "JPY": 110.0,
  "SGD": 1.0
}
```

### Cache Status
```bash
GET /api/currency/rates/cache-status
```
**Response:**
```json
{
  "cache_status": "fresh",
  "total_currencies": 17,
  "last_updated": "2025-06-01T13:30:14.151005",
  "age_days": 0,
  "currencies": ["USD", "EUR", "GBP", "JPY", "AUD"]
}
```

### Manual Refresh
```bash
POST /api/currency/rates/refresh
```
**Response:**
```json
{
  "success": true,
  "message": "Exchange rates refreshed successfully",
  "rates": {...},
  "cache_info": {
    "total_currencies": 18,
    "cached_currencies": 17,
    "last_updated": "2025-06-01T13:30:14.151005"
  }
}
```

### Supported Currencies
```bash
GET /api/currency/supported-currencies
```
**Response:**
```json
{
  "base_currency": "SGD",
  "supported_currencies": ["USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "CNY", "HKD", "INR", "KRW", "MYR", "PHP", "THB", "TWD", "VND", "IDR"],
  "total_count": 17
}
```

## Configuration

### Environment Variables
```bash
# Currency Settings
BASE_CURRENCY=SGD
CURRENCY_API_KEY=fdd7d81e5f0d434393a5a0cca6053423  # CurrencyFreaks API key
CURRENCY_CACHE_DAYS=7
```

### API Integration
- **Provider**: CurrencyFreaks API (https://currencyfreaks.com/)
- **Base Currency**: USD (converted to SGD-based rates)
- **Update Frequency**: Weekly automatic refresh
- **Rate Source**: Live API rates with database persistence

### Database Setup
The system automatically creates the `currency_rates` table:
```sql
CREATE TABLE currency_rates (
    id INTEGER PRIMARY KEY,
    currency_code VARCHAR(3) NOT NULL UNIQUE,
    sgd_rate FLOAT NOT NULL,
    updated_at DATETIME NOT NULL
);
```

## Testing

### Run Complete Workflow Test
```bash
cd backend
python3 test_complete_workflow.py
```

### Run Weekly Refresh Test
```bash
cd backend
python3 test_weekly_refresh.py
```

## Production Deployment

1. **API Key Configuration** (Already configured):
   - ✅ CurrencyFreaks API key: `fdd7d81e5f0d434393a5a0cca6053423`
   - ✅ Live exchange rates enabled
   - ✅ Weekly automatic refresh operational

2. **Database Initialization**:
   ```bash
   python3 init_db.py
   ```

3. **Start Application**:
   ```bash
   python3 -m uvicorn main:app --host 0.0.0.0 --port 8000
   ```

## System Benefits

- **Accuracy**: Real-time exchange rates ensure precise financial analysis
- **Reliability**: Multiple fallback layers prevent system failures
- **Performance**: Database caching minimizes API calls
- **Automation**: Weekly refresh keeps rates current without manual intervention
- **Transparency**: Clear status indicators show rate freshness
- **Scalability**: Efficient background processing handles updates

## Supported Currencies

USD, EUR, GBP, JPY, AUD, CAD, CHF, CNY, HKD, INR, KRW, MYR, PHP, THB, TWD, VND, IDR, SGD (base)

## Rate Sources

- **live**: Fresh from CurrencyFreaks API
- **cached**: From database cache (< 7 days)
- **fallback**: Static rates or stale cache
- **base**: SGD to SGD (1.0)
- **unsupported**: Currency not supported
- **error**: Conversion failed
