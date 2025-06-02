# Pipeline Pulse Dashboard - Required CSV Columns Specification

## Essential Columns (Required for Core Functionality)

### 1. **OCH Revenue** (Primary Revenue Field)
- **Column Name**: `OCH Revenue` 
- **Data Type**: Float/Number
- **Purpose**: Primary revenue amount in local currency
- **Usage**:
  - Data quality filtering (excludes null/zero values)
  - Currency conversion to SGD
  - Pipeline value calculations
  - Deal sizing metrics
- **Filter Logic**: `WHERE OCH Revenue IS NOT NULL AND OCH Revenue > 0`
- **Note**: This is the ONLY revenue field that should be used (not Amount or Opportunity Amount)

### 2. **Currency** (Currency Type)
- **Column Name**: `Currency`
- **Data Type**: String
- **Purpose**: Identifies the currency of OCH Revenue
- **Usage**:
  - Currency conversion logic
  - Display original currency alongside SGD
  - Exchange rate validation
- **Expected Values**: `USD`, `SGD`, `INR`, `PHP`
- **Conversion Logic**: Used in `convertToSGD()` function

### 3. **Exchange Rate** (Conversion Rate)
- **Column Name**: `Exchange Rate`
- **Data Type**: Float/Number  
- **Purpose**: Exchange rate for currency conversion
- **Usage**:
  - Convert local currency to SGD
  - Standardize all revenue to common currency
- **Expected Values**: 
  - USD: `0.75` (1 SGD = 0.75 USD)
  - SGD: `1` (base currency)
  - INR: `62.14` (1 SGD = 62.14 INR)
  - PHP: `42.02` (1 SGD = 42.02 PHP)

### 4. **Probability (%)** (Deal Probability)
- **Column Name**: `Probability (%)`
- **Data Type**: Integer
- **Purpose**: Deal success probability percentage
- **Usage**:
  - Probability stage filtering (Sales/Presales/Approval/Delivery)
  - Color-coded display in UI
  - Weighted pipeline calculations
  - Stage-based business intelligence
- **Filter Stages**:
  - Sales Stage: 10-40%
  - Presales Stage: 40-70%
  - Deal Approval: 80%
  - Delivery Stage: 81-100%

### 5. **Closing Date** (Target Close Date)
- **Column Name**: `Closing Date`
- **Data Type**: Date (YYYY-MM-DD format)
- **Purpose**: Expected deal closure date
- **Usage**:
  - Date range filtering (Current Month/Quarter/Next Quarters)
  - Timeline analysis
  - Quarter-based reporting
  - Days to close calculations
- **Filter Presets**:
  - Current Month
  - Current Quarter (default)
  - Next Quarter
  - Q2 Next Year
  - Custom Range

## Core Deal Information (Required for Display)

### 6. **Opportunity Name** (Deal Title)
- **Column Name**: `Opportunity Name`
- **Data Type**: String
- **Purpose**: Primary deal identifier
- **Usage**:
  - Main deal display in drill-down table
  - Export file naming
  - Deal tracking and identification
- **Display**: Primary column in country drill-down tables

### 7. **Account Name** (Customer Company)
- **Column Name**: `Account Name`
- **Data Type**: String
- **Purpose**: Customer/client company name
- **Usage**:
  - Customer identification in deal tables
  - Account-based analysis
  - Export reporting
- **Display**: Second column in deal details

### 8. **Stage** (Sales Stage)
- **Column Name**: `Stage`
- **Data Type**: String
- **Purpose**: Current sales process stage
- **Usage**:
  - Display current deal status
  - Stage progression analysis
  - CRM sync status tracking
- **Examples**: "SOW preparation (70)", "FR approved (80)", "Presales assigned (40)"

### 9. **Country** (Geographic Location)
- **Column Name**: `Country`
- **Data Type**: String (Country Code)
- **Purpose**: Geographic deal location
- **Usage**:
  - Country-based grouping and analysis
  - Geographic pipeline distribution
  - Regional performance metrics
  - Flag display in UI
- **Expected Values**: `MY`, `SG`, `PH`, `IND`, `TH`, `US`, `VNM`
- **Display**: Country flags with expandable sections

## Deal Ownership & Tracking (Required for Management)

### 10. **Opportunity Owner** (Sales Rep)
- **Column Name**: `Opportunity Owner`
- **Data Type**: String
- **Purpose**: Assigned sales person
- **Usage**:
  - Sales rep performance tracking
  - Deal ownership identification
  - Territory analysis
  - CRM updates and notifications
- **Display**: Owner column in deal details

### 11. **Created Time** (Deal Creation Date)
- **Column Name**: `Created Time`
- **Data Type**: Date/DateTime
- **Purpose**: When opportunity was first created
- **Usage**:
  - Deal age calculation
  - Sales velocity analysis
  - Pipeline health metrics
  - Days in stage calculations
- **Display**: Created Date column (replaces Type field)
- **Format**: YYYY-MM-DD for display

## Optional Enhancement Columns (Improve Functionality)

### 12. **Type** (Deal Classification)
- **Column Name**: `Type`
- **Data Type**: String
- **Purpose**: Deal type classification
- **Usage**:
  - Deal categorization
  - Business type analysis
  - Strategic insights
- **Values**: 
  - `EN – Existing client, New Opportunity`
  - `NN – New client, New Opportunity`
  - `EE – Existing client, Existing Opportunity Renewal`

### 13. **Contact Name** (Primary Contact)
- **Column Name**: `Contact Name`
- **Data Type**: String
- **Purpose**: Primary deal contact
- **Usage**:
  - Contact management
  - Deal relationship tracking
  - Communication history

### 14. **Next Step** (Action Items)
- **Column Name**: `Next Step`
- **Data Type**: String
- **Purpose**: Immediate action required
- **Usage**:
  - Action item tracking
  - Sales activity management
  - Deal progression planning

### 15. **Lead Source** (Deal Origin)
- **Column Name**: `Lead Source`
- **Data Type**: String
- **Purpose**: How deal was acquired
- **Usage**:
  - Lead source analysis
  - Marketing effectiveness
  - Channel performance

## Record Management (System Fields)

### 16. **Record Id** (Unique Identifier)
- **Column Name**: `Record Id`
- **Data Type**: String
- **Purpose**: Unique deal identifier in CRM
- **Usage**:
  - CRM synchronization
  - Deal updates and modifications
  - Data integrity maintenance

### 17. **Modified Time** (Last Update)
- **Column Name**: `Modified Time`
- **Data Type**: Date/DateTime
- **Purpose**: Last modification timestamp
- **Usage**:
  - Data freshness tracking
  - Sync status monitoring
  - Change detection

## Data Processing Logic

### Currency Conversion Implementation
```typescript
function convertToSGD(ochRevenue: number, currency: string, exchangeRate: number): number {
  if (!ochRevenue || ochRevenue === 0) return 0;
  
  switch(currency) {
    case 'SGD': return ochRevenue;
    case 'USD': return ochRevenue / 0.75;  // Using Exchange Rate column
    case 'INR': return ochRevenue / 62.14; // Using Exchange Rate column  
    case 'PHP': return ochRevenue / 42.02; // Using Exchange Rate column
    default: return ochRevenue / (exchangeRate || 1);
  }
}
```

### Data Quality Filtering
```sql
-- Revenue Filter (Always Applied)
WHERE "OCH Revenue" IS NOT NULL 
  AND "OCH Revenue" > 0

-- Probability Stage Filter (User Selectable)  
WHERE "Probability (%)" BETWEEN {minProbability} AND {maxProbability}

-- Date Range Filter (User Selectable)
WHERE "Closing Date" BETWEEN {startDate} AND {endDate}

-- Country Grouping
GROUP BY "Country"
ORDER BY SUM(converted_sgd_revenue) DESC
```

### Calculated Fields
```typescript
interface ProcessedDeal {
  // Original fields
  opportunityName: string;     // From "Opportunity Name"
  accountName: string;         // From "Account Name"  
  originalAmount: number;      // From "OCH Revenue"
  originalCurrency: string;    // From "Currency"
  probability: number;         // From "Probability (%)"
  stage: string;              // From "Stage"
  closingDate: string;        // From "Closing Date"
  country: string;            // From "Country"
  owner: string;              // From "Opportunity Owner"
  createdDate: string;        // From "Created Time"
  
  // Calculated fields
  sgdAmount: number;          // Converted using currency + exchange rate
  daysInStage: number;        // Current date - "Created Time"
  daysToClose: number;        // "Closing Date" - current date
  weightedValue: number;      // sgdAmount * (probability/100)
  riskLevel: string;          // Based on days in stage + probability
}
```

## Export Requirements

### CSV Column Mapping for Export
```csv
Opportunity Name,Account Name,SGD Amount,Original Amount,Currency,Probability,Stage,Closing Date,Country,Owner,Created Date,Days in Stage,Risk Level
```

### Minimum Required Columns for Basic Functionality
For the dashboard to work with basic functionality, these 9 columns are absolutely essential:
1. **OCH Revenue** - Revenue amount
2. **Currency** - Currency type  
3. **Exchange Rate** - Conversion rate
4. **Probability (%)** - Deal probability
5. **Closing Date** - Target close date
6. **Opportunity Name** - Deal identifier
7. **Account Name** - Customer name
8. **Country** - Geographic location
9. **Stage** - Current sales stage

### Recommended Additional Columns for Full Functionality
For enhanced features and complete dashboard experience:
10. **Opportunity Owner** - Sales rep assignment
11. **Created Time** - Deal creation date
12. **Type** - Deal classification
13. **Record Id** - CRM synchronization
14. **Next Step** - Action items

This specification ensures the Pipeline Pulse dashboard can process Zoho CRM exports effectively, perform accurate currency conversions, apply meaningful business filters, and provide comprehensive deal analysis capabilities.
