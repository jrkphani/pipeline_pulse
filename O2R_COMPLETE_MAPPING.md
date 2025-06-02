# Pipeline Pulse: O2R Tracker - Complete Field Mapping

## ✅ **Available Fields (Mapped from Zoho CRM CSV)**

| O2R Tracker Field | Zoho CRM CSV Field | Status | Usage |
|-------------------|-------------------|---------|--------|
| **Territory/Region** | `Business Region` | ✅ Available | Regional grouping and analysis |
| **Service Line** | `Solution Type` | ✅ Available | Service categorization (MSP, Gen AI, etc.) |
| **AWS Funded Tag** | `Type of Funding` | ✅ Available | Identify AWS funding programs |
| **Alliance Motion** | `Market Segment` | ✅ Available | Track AWS partnership activities |
| **Proposal Sent Date** | `Proposal Submission date` | ✅ Available | Phase I milestone tracking |
| **PO Received Date** | `PO Generation Date` | ✅ Available | Phase II milestone tracking |
| **Kickoff Date** | `Kick-off Date` | ✅ Available | Phase III milestone tracking |
| **Invoice Date** | `Invoice Date` | ✅ Available | Phase IV milestone tracking |
| **Payment Received** | `Received On` | ✅ Available | Phase IV milestone tracking |
| **Revenue Recognition** | `OB Recognition Date` | ✅ Available | Phase IV completion tracking |

## ❌ **Missing Fields**

| O2R Tracker Field | Status | Workaround |
|-------------------|---------|------------|
| **Strategic Account Flag** | ❌ Not Available | Use manual tagging or Account Name patterns |
| **SOW Initiated Date** | ❌ Not Available | Estimate from Stage progression or manual entry |

## 🚀 **Implementation Impact**

### **Excellent News: 83% Data Coverage!**
- **10 out of 12 fields** are available in current CSV
- Can build **full 4-phase tracking** immediately
- Only need workarounds for 2 minor fields

### **Complete O2R Tracker Phases**

#### **Phase I: Opportunity to Proposal** ✅
- Deal qualified → Use `Created Time`
- Proposal sent → Use `Proposal Submission date` ✅
- Proposal accepted → Derive from Stage progression

#### **Phase II: Proposal to Commitment** ✅  
- SOW initiated → ❌ Estimate from Stage + `Proposal Submission date`
- SOW approved → Derive from Stage progression
- PO received → Use `PO Generation Date` ✅

#### **Phase III: Execution** ✅
- Kickoff complete → Use `Kick-off Date` ✅
- Milestones baselined → Derive from `Kick-off Date` + timeline
- Execution started → Use `Kick-off Date` ✅

#### **Phase IV: Revenue Realization** ✅
- Customer signoff → Derive from Stage progression
- Invoice raised → Use `Invoice Date` ✅
- Payment received → Use `Received On` ✅
- Revenue recognized → Use `OB Recognition Date` ✅

## 📊 **Enhanced Data Model**

```typescript
interface EnhancedOpportunityTracker {
  // Core fields (from previous CSV analysis)
  dealId: string;           // Record Id
  dealName: string;         // Opportunity Name
  owner: string;            // Opportunity Owner
  account: string;          // Account Name
  sgdAmount: number;        // Converted OCH Revenue
  probability: number;      // Probability (%)
  currentStage: string;     // Stage
  closingDate: string;      // Closing Date
  createdDate: string;      // Created Time
  country: string;          // Country
  
  // NEW: Enhanced tracking fields
  territory: string;        // Business Region ✅
  serviceType: string;      // Solution Type ✅
  fundingType: string;      // Type of Funding ✅
  marketSegment: string;    // Market Segment ✅
  
  // NEW: Phase milestone dates
  proposalDate: string;     // Proposal Submission date ✅
  poDate: string;           // PO Generation Date ✅
  kickoffDate: string;      // Kick-off Date ✅
  invoiceDate: string;      // Invoice Date ✅
  paymentDate: string;      // Received On ✅
  revenueDate: string;      // OB Recognition Date ✅
  
  // Calculated fields
  currentPhase: OpportunityPhase;
  phaseProgress: PhaseProgress;
  healthSignal: HealthSignal;
  daysInPhase: number;
  revenueRealized: boolean;
}

interface PhaseProgress {
  phase1: {
    qualified: { date: string, status: PhaseStatus },
    proposalSent: { date: string, status: PhaseStatus },
    proposalAccepted: { date: string, status: PhaseStatus }
  },
  phase2: {
    sowInitiated: { date: string | null, status: PhaseStatus }, // ❌ Estimated
    sowApproved: { date: string, status: PhaseStatus },
    poReceived: { date: string, status: PhaseStatus } // ✅ PO Generation Date
  },
  phase3: {
    kickoffComplete: { date: string, status: PhaseStatus }, // ✅ Kick-off Date
    milestonesBaselined: { date: string, status: PhaseStatus },
    executionStarted: { date: string, status: PhaseStatus }
  },
  phase4: {
    customerSignoff: { date: string, status: PhaseStatus },
    invoiceRaised: { date: string, status: PhaseStatus }, // ✅ Invoice Date
    paymentReceived: { date: string, status: PhaseStatus }, // ✅ Received On
    revenueRecognized: { date: string, status: PhaseStatus } // ✅ OB Recognition Date
  }
}
```

## 🎯 **Updated CSV Requirements**

### **Required CSV Export Fields (Enhanced)**
```csv
Record Id,Opportunity Name,Account Name,OCH Revenue,Currency,Exchange Rate,
Probability (%),Stage,Closing Date,Opportunity Owner,Created Time,Country,
Business Region,Solution Type,Type of Funding,Market Segment,
Proposal Submission date,PO Generation Date,Kick-off Date,
Invoice Date,Received On,OB Recognition Date
```

### **Field Usage in O2R Tracker**

#### **Filtering & Grouping**
- **Business Region** → Territory-based dashboards
- **Solution Type** → Service line analysis  
- **Type of Funding** → AWS-funded deal tracking
- **Market Segment** → Alliance motion categorization

#### **Timeline Tracking**
- **Proposal Submission date** → Phase I milestone
- **PO Generation Date** → Phase II completion
- **Kick-off Date** → Phase III initiation
- **Invoice Date** → Phase IV billing
- **Received On** → Phase IV payment
- **OB Recognition Date** → Phase IV completion

#### **Health Signal Calculation**
```typescript
const calculateAdvancedHealthSignal = (deal: EnhancedOpportunityTracker): HealthSignal => {
  const today = new Date();
  
  // Check for delays in each phase
  if (deal.proposalDate && !deal.poDate) {
    const daysSinceProposal = getDaysBetween(deal.proposalDate, today);
    if (daysSinceProposal > 30) return '🔴'; // Proposal stalled
  }
  
  if (deal.poDate && !deal.kickoffDate) {
    const daysSincePO = getDaysBetween(deal.poDate, today);
    if (daysSincePO > 14) return '🟡'; // Kickoff delayed
  }
  
  if (deal.kickoffDate && !deal.invoiceDate) {
    const daysSinceKickoff = getDaysBetween(deal.kickoffDate, today);
    if (daysSinceKickoff > 60) return '🟡'; // Execution delayed
  }
  
  if (deal.invoiceDate && !deal.paymentDate) {
    const daysSinceInvoice = getDaysBetween(deal.invoiceDate, today);
    if (daysSinceInvoice > 45) return '🔴'; // Payment overdue
  }
  
  return '✅'; // On track
};
```

## 🚀 **Implementation Strategy (Updated)**

### **Phase 1: Enhanced Foundation (Week 1-2)**
- ✅ Build complete 4-phase tracking with available milestone dates
- ✅ Territory and service line filtering
- ✅ AWS funding and alliance motion analysis
- ✅ Advanced health signal calculation

### **Phase 2: Rich Analytics (Week 3-4)**
- ✅ Phase-based pipeline analysis
- ✅ Territory performance dashboards  
- ✅ Service line revenue tracking
- ✅ AWS motion effectiveness metrics

### **Phase 3: Executive Reporting (Week 5-6)**
- ✅ Slide-style tracker with full milestone data
- ✅ Revenue realization tracking
- ✅ Phase velocity analysis
- ✅ Territory and service line comparisons

## 🎉 **Conclusion**

**Excellent data coverage!** With 10 out of 12 required fields available, we can build a **comprehensive Opportunity-to-Revenue tracker** immediately. The missing SOW date can be estimated, and Strategic Account flag can be added later as a custom enhancement.

**Ready to implement full O2R tracking with rich business intelligence!**
