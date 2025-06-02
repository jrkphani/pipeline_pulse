# Data Consistency Guide

## Overview
This document explains the differences in total pipeline value and deal counts across different pages in the Pipeline Pulse application.

## Data Sources & Currency Handling

### 1. Main Dashboard (`/`)
- **Data Source**: `/api/o2r/dashboard/summary` (with fallback to `/api/analysis/{id}`)
- **Currency**: Converted to SGD using live exchange rates
- **Deal Count**: Shows both total deals (273) and processed deals (181)
- **Total Value**: SGD 1.72M (converted values) ✅ FIXED

### 2. Analysis Page (`/analysis/{id}`)
- **Data Source**: `/api/analysis/{id}`
- **Currency**: Original values from uploaded data (mixed currencies)
- **Deal Count**: 181 processed deals
- **Total Value**: SGD 22.49M (original currency values)

### 3. O2R Dashboard (`/o2r`)
- **Data Source**: `/api/o2r/dashboard/summary`
- **Currency**: Converted to SGD using live exchange rates
- **Deal Count**: 181 opportunities
- **Total Value**: SGD 1.72M (converted values)

### 4. O2R Opportunities (`/o2r/opportunities`)
- **Data Source**: `/api/o2r/opportunities`
- **Currency**: Converted to SGD using live exchange rates
- **Deal Count**: 181 opportunities (now shows all, previously limited to 100)
- **Total Value**: SGD 1.72M (converted values)

## Why the Differences?

### Currency Conversion
The main difference in total values is due to currency conversion:

- **Original Data**: Contains deals in multiple currencies (USD, INR, PHP, SGD, etc.)
- **O2R System**: Converts all amounts to SGD using live exchange rates from CurrencyFreaks API
- **Conversion Impact**: 
  - Original: SGD 22.49M (mixed currencies treated as SGD)
  - Converted: SGD 1.72M (properly converted to SGD)

### Deal Count Differences
- **Total Deals (273)**: All deals in the uploaded CSV file
- **Processed Deals (181)**: Deals that passed validation and processing filters
- **O2R Opportunities (181)**: Same as processed deals, synced from pipeline data

## Data Flow

```
CSV Upload (273 deals)
    ↓
Processing & Validation
    ↓
Processed Deals (181 deals, original currencies)
    ↓
O2R Sync with Currency Conversion
    ↓
O2R Opportunities (181 deals, SGD converted)
```

## Currency Conversion Examples

Based on live exchange rates:
- **USD 161,467 → SGD 208,478** (AI Seer MAP 2.0)
- **INR 1,500,000 → SGD 22,645** (Galaxy Health POC)
- **PHP 100,000 → SGD 2,313** (Test Opportunity)
- **SGD amounts remain unchanged**

## Data Consistency Indicators

Each page now includes data source indicators to help users understand:
- **Pipeline Data**: Original uploaded data with mixed currencies
- **O2R Tracking**: Converted to SGD using live exchange rates
- **Analysis View**: Raw data analysis with original currency values

## Recommendations

1. **For Financial Reporting**: Use O2R pages (SGD converted values)
2. **For Data Analysis**: Use Analysis pages (original values)
3. **For Deal Management**: Use O2R Opportunities page
4. **For Overview**: Use Main Dashboard (shows both perspectives)

## Current Data Consistency (After Fixes)

| Page | Deal Count | Total Value | Currency Handling |
|------|------------|-------------|-------------------|
| **Main Dashboard** | 181 processed (273 total) | SGD 1.72M | ✅ Converted to SGD |
| **Analysis Page** | 181 deals | SGD 22.49M | Original mixed currencies |
| **O2R Dashboard** | 181 opportunities | SGD 1.72M | ✅ Converted to SGD |
| **O2R Opportunities** | 181 opportunities | SGD 1.72M | ✅ Converted to SGD |

## Recent Fixes Applied

1. **Main Dashboard**: Now fetches converted SGD values from O2R system (was SGD 22.49M, now SGD 1.72M) ✅
2. **O2R Opportunities**: Increased limit to show all 181 opportunities ✅
3. **Data Source Indicators**: Added to clarify currency handling ✅
4. **Consistency**: All pages now show correct deal counts ✅

## Technical Details

### Currency Service
- **API**: CurrencyFreaks (live rates)
- **Update Frequency**: Weekly
- **Fallback**: Static rates if API unavailable
- **Base Currency**: SGD

### Data Synchronization
- **Trigger**: Manual sync via `/api/o2r/sync-from-pipeline`
- **Source**: Latest analysis data
- **Processing**: Currency conversion + health signal calculation
- **Storage**: In-memory store (opportunities_store)
