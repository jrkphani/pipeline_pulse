# Pipeline Pulse: Opportunity-to-Revenue Tracker Integration Analysis

## Current CSV Data Coverage Assessment

### ✅ **Available Data (From Current CSV)**

#### Core Deal Information
- **Deal Name** ✅ `Opportunity Name`
- **Deal Owner** ✅ `Opportunity Owner` 
- **Stage** ✅ `Stage`
- **Forecasted Amount** ✅ `OCH Revenue` + `Currency` + `Exchange Rate`
- **Closing Date** ✅ `Closing Date` (maps to baseline date)
- **Account Name** ✅ `Account Name`
- **Deal Type** ✅ `Type` (EN/NN/EE classifications)

#### Supporting Fields
- **Record ID** ✅ `Record Id` (for CRM linkage)
- **Probability** ✅ `Probability (%)` (for health signals)
- **Created Time** ✅ `Created Time` (for timeline analysis)
- **Country** ✅ `Country` (for regional grouping)

### ❌ **Missing Data (Need Additional Fields)**

#### Execution Tracking Fields
- **Territory/Region** ❌ Not in current CSV
- **Service Line** ❌ Not available
- **Strategic Account Flag** ❌ Not available
- **AWS Funded Tag** ❌ Not available
- **Alliance Motion Details** ❌ Not available

#### Phase-Specific Dates
- **Proposal Sent Date** ❌ Not available
- **SOW Initiated Date** ❌ Not available  
- **PO Received Date** ❌ Not available
- **Kickoff Date** ❌ Not available
- **Invoice Dates** ❌ Not available
- **Payment Received** ❌ Not available

#### Execution Status
- **Current Phase** ❌ Need to derive from Stage
- **Baseline vs Actual Tracking** ❌ Not available
- **Blockers/Comments** ❌ Not available
- **Last Updated** ❌ Only have Modified Time

## Implementation Strategy

### Phase 1: **Foundation with Current Data** (Immediate Implementation)

```typescript
interface OpportunityToRevenueBase {
  // Available from CSV
  dealId: string;           // Record Id
  dealName: string;         // Opportunity Name
  owner: string;            // Opportunity Owner
  account: string;          // Account Name
  currentStage: string;     // Stage
  sgdAmount: number;        // Converted OCH Revenue
  probability: number;      // Probability (%)
  baselineCloseDate: string; // Closing Date
  createdDate: string;      // Created Time
  country: string;          // Country
  dealType: string;         // Type
  
  // Derived/Calculated fields
  inferredPhase: OpportunityPhase;
  healthSignal: 'green' | 'yellow' | 'red';
  daysInCurrentPhase: number;
}

enum OpportunityPhase {
  OPPORTUNITY_TO_PROPOSAL = 'opportunity-to-proposal',
  PROPOSAL_TO_COMMITMENT = 'proposal-to-commitment', 
  EXECUTION = 'execution',
  REVENUE_REALIZATION = 'revenue-realization'
}
```

### Phase 2: **Enhanced Data Collection** (Requires Additional CSV Fields)

#### Required Zoho CRM Custom Fields
```sql
-- Additional fields needed in CSV export:
Territory (Custom Field) -- Regional grouping
Service_Line (Custom Field) -- MSP, Gen AI, etc.
Strategic_Account (Checkbox) -- Yes/No flag
AWS_Funded (Checkbox) -- TCO Program participation
Alliance_Motion (Custom Field) -- FR, CPPO status
Proposal_Date (Custom Field) -- When proposal sent
SOW_Date (Custom Field) -- When SOW initiated
PO_Date (Custom Field) -- When PO received
Kickoff_Date (Custom Field) -- Project start
```

### Phase 3: **Full Execution Tracking** (Custom Module)

#### Extended Data Model
```typescript
interface FullOpportunityTracker extends OpportunityToRevenueBase {
  // Phase I: Opportunity to Proposal
  phase1: {
    dealQualified: PhaseStep;
    proposalSent: PhaseStep;
    proposalAccepted: PhaseStep;
  };
  
  // Phase II: Proposal to Commitment  
  phase2: {
    sowInitiated: PhaseStep;
    sowApproved: PhaseStep;
    poReceived: PhaseStep;
  };
  
  // Phase III: Execution
  phase3: {
    kickoffComplete: PhaseStep;
    milestonesBaselined: PhaseStep;
    executionStarted: PhaseStep;
  };
  
  // Phase IV: Revenue Realization
  phase4: {
    customerSignoff: PhaseStep;
    invoiceRaised: PhaseStep;
    paymentReceived: PhaseStep;
    revenueRecognized: PhaseStep;
  };
  
  // Metadata
  assignedRoles: AssignedRoles;
  comments: Comment[];
  weeklyUpdateFlag: boolean;
  lastUpdated: string;
}

interface PhaseStep {
  baselineDate: string;
  actualDate?: string;
  status: '✅' | '🚧' | '🔴' | '🟡';
  owner: string;
  comments?: string;
}
```

## Implementation Approach

### **Option 1: Start with Current CSV (Recommended)**

#### What We Can Build Immediately:
```typescript
// Stage-to-Phase Mapping
const inferPhaseFromStage = (stage: string): OpportunityPhase => {
  const stageMapping = {
    'Prospecting (10)': OpportunityPhase.OPPORTUNITY_TO_PROPOSAL,
    'Sales Qualified (20)': OpportunityPhase.OPPORTUNITY_TO_PROPOSAL,
    'Presales assigned (40)': OpportunityPhase.OPPORTUNITY_TO_PROPOSAL,
    'Proposal submitted (60)': OpportunityPhase.PROPOSAL_TO_COMMITMENT,
    'SOW submitted (70)': OpportunityPhase.PROPOSAL_TO_COMMITMENT,
    'PO / SOW Sign-off (90)': OpportunityPhase.EXECUTION,
    'Project Kicked off (95)': OpportunityPhase.EXECUTION,
    'Customer Sign-off (95)': OpportunityPhase.REVENUE_REALIZATION,
  };
  
  return stageMapping[stage] || OpportunityPhase.OPPORTUNITY_TO_PROPOSAL;
};

// Health Signal Calculation
const calculateHealthSignal = (deal: OpportunityToRevenueBase): string => {
  const today = new Date();
  const closeDate = new Date(deal.baselineCloseDate);
  const daysToClose = Math.ceil((closeDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysToClose < 0 && deal.probability < 90) return '🔴'; // Overdue
  if (daysToClose < 30 && deal.probability < 70) return '🟡'; // At risk
  if (deal.probability >= 80) return '✅'; // On track
  return '🚧'; // In progress
};
```

#### Slide-Style Tracker UI (Phase 1)
```tsx
const OpportunityTrackerSlide = ({ deal }: { deal: OpportunityToRevenueBase }) => {
  return (
    <Card className="w-full aspect-video bg-gradient-to-br from-blue-50 to-white">
      {/* Header */}
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">{deal.dealName}</CardTitle>
            <CardDescription>{deal.account} • {deal.country}</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(deal.sgdAmount)}
            </div>
            <div className="text-sm text-muted-foreground">
              {deal.probability}% • {deal.healthSignal}
            </div>
          </div>
        </div>
      </CardHeader>

      {/* Phase Progress Bar */}
      <CardContent>
        <div className="space-y-4">
          <PhaseProgressBar currentPhase={deal.inferredPhase} />
          
          {/* Current Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Current Stage</label>
              <p className="text-sm">{deal.currentStage}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Owner</label>
              <p className="text-sm">{deal.owner}</p>
            </div>
          </div>
          
          {/* Timeline */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Timeline</label>
            <div className="flex justify-between text-xs">
              <span>Created: {formatDate(deal.createdDate)}</span>
              <span>Target Close: {formatDate(deal.baselineCloseDate)}</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all" 
                style={{ width: `${Math.min(deal.daysInCurrentPhase / 90 * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
```

### **Option 2: Enhanced CSV Export (Medium Term)**

#### Request Additional Zoho CRM Fields:
1. **Territory** - Add as custom field in Zoho
2. **Service Line** - Dropdown: MSP, Gen AI, Cloud Migration, etc.
3. **Strategic Account** - Checkbox field
4. **AWS Funded** - Checkbox for TCO program deals
5. **Alliance Motion** - Text field for FR/CPPO status

#### Modified CSV Export Requirements:
```csv
Record Id,Opportunity Name,Account Name,Territory,Service Line,Strategic Account,AWS Funded,Alliance Motion,OCH Revenue,Currency,Exchange Rate,Probability (%),Stage,Closing Date,Opportunity Owner,Created Time,Country,Type,Proposal Date,SOW Date,PO Date
```

### **Option 3: Full Custom Module (Long Term)**

#### Database Schema Extension:
```sql
-- Opportunity Tracker Tables
CREATE TABLE opportunity_phases (
    id UUID PRIMARY KEY,
    deal_id VARCHAR REFERENCES deals(record_id),
    phase_name VARCHAR NOT NULL,
    baseline_date DATE,
    actual_date DATE,
    status VARCHAR CHECK (status IN ('pending', 'in_progress', 'completed', 'blocked')),
    owner VARCHAR,
    comments TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE weekly_updates (
    id UUID PRIMARY KEY,
    deal_id VARCHAR REFERENCES deals(record_id),
    week_ending DATE,
    updated_by VARCHAR,
    update_notes TEXT,
    health_signal VARCHAR,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE role_assignments (
    id UUID PRIMARY KEY,
    deal_id VARCHAR REFERENCES deals(record_id),
    role_name VARCHAR, -- 'sales_leader', 'delivery', 'revops', etc.
    assigned_to VARCHAR,
    phase VARCHAR,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## Feature Development Roadmap

### **Week 1-2: Foundation**
- ✅ Implement basic O2R tracker with current CSV data
- ✅ Stage-to-phase inference logic
- ✅ Health signal calculation
- ✅ Slide-style UI components

### **Week 3-4: Enhanced Filtering**
- ✅ Filter by inferred phase
- ✅ Filter by health signal
- ✅ Sort by days in phase
- ✅ Export tracker slides as PDF

### **Week 5-6: Role-Based Views**
- ✅ Sales leader dashboard
- ✅ Deal owner detailed view
- ✅ Executive summary view
- ✅ Weekly update tracking

### **Week 7-8: Custom Data Collection**
- ✅ Manual phase date entry
- ✅ Comments and blockers
- ✅ Role assignments
- ✅ AWS motion tracking

### **Week 9-12: Full Integration**
- ✅ Enhanced Zoho CSV fields
- ✅ Bidirectional CRM sync
- ✅ Automated reminders
- ✅ Advanced analytics

## API Endpoints Required

```typescript
// Basic O2R Tracker
GET /api/o2r/deals                    // List all tracked deals
GET /api/o2r/deals/{id}              // Get specific deal tracker
PUT /api/o2r/deals/{id}/phase        // Update phase information
POST /api/o2r/deals/{id}/comment     // Add comment/blocker

// Role Management  
GET /api/o2r/roles                   // List role assignments
PUT /api/o2r/deals/{id}/assign       // Assign roles to deal

// Weekly Reviews
GET /api/o2r/weekly/{date}           // Get weekly review data
POST /api/o2r/weekly/update          // Mark deal as updated this week

// Analytics
GET /api/o2r/analytics/health        // Health signal summary
GET /api/o2r/analytics/revenue       // Revenue realization tracking
GET /api/o2r/export/slides           // Export tracker slides
```

## Conclusion

**Yes, we can start building the Opportunity-to-Revenue tracker immediately** with the current CSV data by:

1. **Inferring phases** from existing Stage field
2. **Using Closing Date** as baseline timeline
3. **Calculating health signals** from probability and dates
4. **Building slide-style UI** with available data

However, for **full functionality**, we'll need to enhance the CSV export with additional custom fields from Zoho CRM. The modular approach allows us to start with basic functionality and progressively enhance capabilities as more data becomes available.

**Recommended Starting Point**: Implement Phase 1 with current data to prove the concept, then expand based on user feedback and additional data availability.
