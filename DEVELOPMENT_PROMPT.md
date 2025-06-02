# Pipeline Pulse Dashboard - Complete Development Prompt

## Project Overview
Create a comprehensive deal analysis platform called "Pipeline Pulse" that transforms Zoho CRM data into actionable revenue insights. The application should replicate and enhance the **1CloudHub Deals Analysis - Active Pipeline with Revenue** dashboard functionality with advanced filtering capabilities, built with TypeScript React frontend using shadcn/ui components, Vite for development, and Python FastAPI backend with Zoho CRM MCP server integration.

## Core Dashboard Specification: "1CloudHub Deals Analysis"

### Dashboard Title and Dynamic Description
```
1CloudHub Deals Analysis - Active Pipeline with Revenue
[Dynamic subtitle based on filters applied]
Example: "Sales Stage Pipeline: 89 Deals • SGD 2.1M Value • Current Quarter • 10-40% Probability"
```

### Advanced Filtering System

#### 1. **Revenue Filter** (Always Applied)
- Only include deals with actual OCH Revenue values
- Exclude deals where OCH Revenue is null, undefined, empty string, or zero
- This ensures only deals with real financial value are analyzed
- **Non-configurable**: Always active for data quality

#### 2. **Date Range Filter** (User Selectable)
Implement date filtering based on "Closing Date" field with these presets:

```typescript
interface DateFilter {
  label: string;
  value: string;
  startDate: Date;
  endDate: Date;
  isDefault?: boolean;
}

const DATE_FILTER_PRESETS: DateFilter[] = [
  {
    label: "Current Month",
    value: "current-month",
    startDate: startOfMonth(new Date()),
    endDate: endOfMonth(new Date())
  },
  {
    label: "Current Quarter", 
    value: "current-quarter",
    startDate: startOfQuarter(new Date()),
    endDate: endOfQuarter(new Date()),
    isDefault: true // Default selection
  },
  {
    label: "Next Quarter",
    value: "next-quarter", 
    startDate: startOfQuarter(addQuarters(new Date(), 1)),
    endDate: endOfQuarter(addQuarters(new Date(), 1))
  },
  {
    label: "Q2 Next Year",
    value: "q2-next-year",
    startDate: startOfQuarter(addQuarters(new Date(), 2)), 
    endDate: endOfQuarter(addQuarters(new Date(), 2))
  },
  {
    label: "Custom Range",
    value: "custom",
    startDate: null, // User selects
    endDate: null    // User selects
  }
];
```

#### 3. **Probability Stage Filter** (User Selectable)
Replace hardcoded 10-89% filter with business-meaningful stage presets:

```typescript
interface ProbabilityStage {
  label: string;
  value: string;
  minProbability: number;
  maxProbability: number;
  description: string;
  color: string;
  isDefault?: boolean;
}

const PROBABILITY_STAGE_PRESETS: ProbabilityStage[] = [
  {
    label: "Sales Stage",
    value: "sales-stage",
    minProbability: 10,
    maxProbability: 40,
    description: "Early stage deals requiring sales development",
    color: "#ef4444" // Red
  },
  {
    label: "Presales Stage", 
    value: "presales-stage",
    minProbability: 40,
    maxProbability: 70,
    description: "Active opportunities in technical evaluation",
    color: "#f59e0b", // Yellow
    isDefault: true // Default selection
  },
  {
    label: "Deal Approval Stage",
    value: "deal-approval-stage", 
    minProbability: 80,
    maxProbability: 80,
    description: "Deals pending final approval and sign-off",
    color: "#3b82f6" // Blue
  },
  {
    label: "Delivery Stage",
    value: "delivery-stage",
    minProbability: 81,
    maxProbability: 100,
    description: "Approved deals moving to implementation",
    color: "#10b981" // Green
  },
  {
    label: "Active Pipeline",
    value: "active-pipeline",
    minProbability: 10, 
    maxProbability: 89,
    description: "All deals requiring sales attention (excludes very low and near-certain)",
    color: "#6366f1" // Indigo
  },
  {
    label: "All Deals",
    value: "all-deals",
    minProbability: 0,
    maxProbability: 100, 
    description: "Complete pipeline including all probability ranges",
    color: "#64748b" // Gray
  }
];
```

### Filter Control Panel UI

#### Filter Bar Layout
```tsx
<div className="filter-panel bg-card border rounded-lg p-4 mb-6">
  <div className="grid gap-4 md:grid-cols-3">
    {/* Date Range Filter */}
    <div className="space-y-2">
      <label className="text-sm font-medium">Closing Date Range</label>
      <Select value={dateFilter} onValueChange={setDateFilter}>
        <SelectTrigger>
          <SelectValue placeholder="Select time period" />
        </SelectTrigger>
        <SelectContent>
          {DATE_FILTER_PRESETS.map(preset => (
            <SelectItem key={preset.value} value={preset.value}>
              {preset.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {dateFilter === 'custom' && (
        <div className="flex gap-2 mt-2">
          <DatePicker 
            placeholder="Start date"
            value={customStartDate}
            onChange={setCustomStartDate}
          />
          <DatePicker 
            placeholder="End date" 
            value={customEndDate}
            onChange={setCustomEndDate}
          />
        </div>
      )}
    </div>

    {/* Probability Stage Filter */}
    <div className="space-y-2">
      <label className="text-sm font-medium">Pipeline Stage</label>
      <Select value={probabilityStage} onValueChange={setProbabilityStage}>
        <SelectTrigger>
          <SelectValue placeholder="Select pipeline stage" />
        </SelectTrigger>
        <SelectContent>
          {PROBABILITY_STAGE_PRESETS.map(stage => (
            <SelectItem key={stage.value} value={stage.value}>
              <div className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{backgroundColor: stage.color}}
                />
                <span>{stage.label}</span>
                <span className="text-xs text-muted-foreground">
                  ({stage.minProbability}%-{stage.maxProbability}%)
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        {selectedStage?.description}
      </p>
    </div>

    {/* Additional Filters */}
    <div className="space-y-2">
      <label className="text-sm font-medium">Additional Filters</label>
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={clearAllFilters}
        >
          Clear Filters
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={exportFiltered}
        >
          Export Filtered
        </Button>
      </div>
    </div>
  </div>

  {/* Active Filter Summary */}
  <div className="flex items-center gap-2 mt-4 pt-4 border-t">
    <span className="text-sm text-muted-foreground">Active filters:</span>
    <Badge variant="secondary">{selectedDateRange.label}</Badge>
    <Badge 
      variant="secondary"
      style={{backgroundColor: selectedStage.color + '20', color: selectedStage.color}}
    >
      {selectedStage.label}
    </Badge>
    <span className="text-sm text-muted-foreground ml-auto">
      Showing {filteredDeals.length} deals • SGD {formatCurrency(totalValue)}
    </span>
  </div>
</div>
```

### Dynamic Dashboard Metrics

#### Context-Aware Summary Statistics
```typescript
interface DashboardMetrics {
  totalDeals: number;
  totalValue: number; // In SGD
  avgDealSize: number;
  avgProbability: number;
  stageDistribution: {
    [stageName: string]: {
      count: number;
      value: number;
      percentage: number;
    }
  };
  timeframeLabel: string;
  stageLabel: string;
}

// Example output based on filters:
const exampleMetrics = {
  totalDeals: 89,
  totalValue: 2100000, // SGD 2.1M
  avgDealSize: 23595,
  avgProbability: 52.3,
  stageDistribution: {
    "40-50%": { count: 34, value: 850000, percentage: 38.2 },
    "50-60%": { count: 28, value: 720000, percentage: 31.5 },
    "60-70%": { count: 27, value: 530000, percentage: 30.3 }
  },
  timeframeLabel: "Current Quarter (Q4 2024)",
  stageLabel: "Presales Stage (40-70%)"
};
```

### Enhanced Country Analysis Table

#### Dynamic Country Rankings
The country table must recalculate based on applied filters:

```typescript
interface CountryMetrics {
  countryCode: string;
  countryName: string; 
  flag: string;
  dealCount: number;
  totalValue: number; // SGD standardized
  avgProbability: number;
  avgDealSize: number;
  deals: Deal[];
  stageBreakdown: {
    [stageRange: string]: number; // Deal count per probability range
  };
}

// Example filtered results for "Presales Stage + Current Quarter":
const filteredCountryMetrics = [
  {
    countryCode: "SG",
    countryName: "Singapore", 
    flag: "🇸🇬",
    dealCount: 28,
    totalValue: 980000, // SGD
    avgProbability: 55.2,
    avgDealSize: 35000,
    stageBreakdown: {
      "40-50%": 12,
      "50-60%": 9, 
      "60-70%": 7
    }
  },
  // ... other countries
];
```

### Filter State Management

#### URL State Persistence
```typescript
// URL structure: /analysis?date=current-quarter&stage=presales-stage&custom_start=2024-10-01&custom_end=2024-12-31

interface FilterState {
  dateRange: string;
  probabilityStage: string;
  customStartDate?: string;
  customEndDate?: string;
}

const useFilterState = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const filters: FilterState = {
    dateRange: searchParams.get('date') || 'current-quarter',
    probabilityStage: searchParams.get('stage') || 'presales-stage',
    customStartDate: searchParams.get('custom_start') || undefined,
    customEndDate: searchParams.get('custom_end') || undefined
  };

  const updateFilters = (newFilters: Partial<FilterState>) => {
    const updatedParams = new URLSearchParams(searchParams);
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) {
        updatedParams.set(key, value);
      } else {
        updatedParams.delete(key);
      }
    });
    setSearchParams(updatedParams);
  };

  return { filters, updateFilters };
};
```

### Backend API Enhancements

#### Enhanced Analysis Endpoint
```python
@app.post("/api/analysis/filtered")
async def get_filtered_analysis(request: FilteredAnalysisRequest):
    """
    Get pipeline analysis with date and probability filters applied
    """
    
class FilteredAnalysisRequest(BaseModel):
    date_range: str  # preset key or 'custom'
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None  
    probability_stage: str  # preset key
    min_probability: Optional[int] = None
    max_probability: Optional[int] = None

class FilteredAnalysisResponse(BaseModel):
    summary: DashboardMetrics
    countries: List[CountryMetrics]
    stage_insights: StageInsights
    filter_applied: FilterState
    
# Example API response:
{
  "summary": {
    "total_deals": 89,
    "total_value": 2100000,
    "avg_deal_size": 23595,
    "timeframe_label": "Current Quarter (Q4 2024)",
    "stage_label": "Presales Stage (40-70%)"
  },
  "countries": [...],
  "stage_insights": {
    "conversion_probability": 52.3,
    "time_to_close_avg": 45, // days
    "risk_factors": ["High concentration in Singapore", "Q4 closing pressure"]
  },
  "filter_applied": {
    "date_range": "current-quarter", 
    "probability_stage": "presales-stage"
  }
}
```

### Advanced Analytics Features

#### Stage-Specific Insights
Based on selected probability stage, show relevant metrics:

**Sales Stage (10-40%)**:
- Lead qualification metrics
- Conversion funnel analysis  
- Top lead sources
- Sales activity requirements

**Presales Stage (40-70%)**:
- Technical evaluation progress
- Competitive analysis
- Resource allocation needs
- Proposal success rates

**Deal Approval Stage (80%)**:
- Contract negotiation status
- Legal/procurement bottlenecks
- Decision maker engagement
- Timeline risks

**Delivery Stage (81-100%)**:
- Implementation readiness
- Resource capacity planning
- Revenue recognition timeline
- Customer success handoff

### Currency Standardization Engine
Implement exact SGD conversion logic:
```typescript
function convertToSGD(amount: number, currency: string, exchangeRate: number): number {
  if (!amount || amount === 0) return 0;
  
  if (currency === 'SGD') {
    return amount; // Base currency
  } else if (currency === 'USD' && exchangeRate === 0.75) {
    return amount / exchangeRate; // USD to SGD: amount ÷ 0.75 = SGD
  } else if (currency === 'INR' && exchangeRate === 62.14) {
    return amount / exchangeRate; // INR to SGD: amount ÷ 62.14 = SGD
  } else if (currency === 'PHP' && exchangeRate === 42.02) {
    return amount / exchangeRate; // PHP to SGD: amount ÷ 42.02 = SGD
  } else {
    return amount / (exchangeRate || 1); // Generic conversion
  }
}
```

### Interactive Drill-Down Enhancements

#### Enhanced Deal Table Columns
1. **Opportunity Name** - Full deal title and description
2. **Account** - Customer/client company name  
3. **SGD Amount** - Converted amount with original currency shown below
4. **Probability** - Color-coded percentage badges matching stage colors
5. **Stage** - Current sales stage from Zoho CRM
6. **Closing Date** - Expected close date (highlighted if within selected range)
7. **Owner** - Assigned sales person
8. **Created Date** - When opportunity was first created
9. **Days in Stage** - Age of deal in current probability range
10. **Risk Indicator** - Flag for deals requiring attention

#### Stage-Colored Probability Display
```tsx
const getProbabilityBadgeColor = (probability: number, selectedStage: ProbabilityStage) => {
  // Use the selected stage color for deals within that range
  if (probability >= selectedStage.minProbability && probability <= selectedStage.maxProbability) {
    return selectedStage.color;
  }
  
  // Default colors for deals outside selected range  
  if (probability >= 81) return "#10b981"; // Green - Delivery
  if (probability === 80) return "#3b82f6"; // Blue - Approval  
  if (probability >= 40) return "#f59e0b"; // Yellow - Presales
  return "#ef4444"; // Red - Sales
};
```

### Export Enhancements

#### Context-Aware Export Options
```typescript
const exportOptions = [
  {
    format: "csv",
    label: `Export ${selectedStage.label} - ${selectedDateRange.label}`,
    filename: `pipeline_${selectedStage.value}_${selectedDateRange.value}_${format(new Date(), 'yyyy-MM-dd')}.csv`
  },
  {
    format: "excel", 
    label: "Executive Summary Report",
    filename: `executive_summary_${selectedStage.value}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`,
    includeCharts: true
  },
  {
    format: "pdf",
    label: "Pipeline Health Report", 
    filename: `pipeline_health_${selectedDateRange.value}.pdf`,
    includeInsights: true
  }
];
```

### Performance Optimizations

#### Efficient Filtering Implementation
```typescript
const useFilteredDeals = (deals: Deal[], filters: FilterState) => {
  return useMemo(() => {
    return deals.filter(deal => {
      // Revenue filter (always applied)
      if (!deal.ochRevenue || deal.ochRevenue <= 0) return false;
      
      // Date range filter
      const closingDate = new Date(deal.closingDate);
      if (filters.dateRange !== 'all') {
        const { startDate, endDate } = getDateRange(filters);
        if (closingDate < startDate || closingDate > endDate) return false;
      }
      
      // Probability stage filter  
      const stage = PROBABILITY_STAGE_PRESETS.find(s => s.value === filters.probabilityStage);
      if (stage) {
        if (deal.probability < stage.minProbability || deal.probability > stage.maxProbability) {
          return false;
        }
      }
      
      return true;
    });
  }, [deals, filters]);
};
```

### Success Metrics
The enhanced dashboard should demonstrate:
1. ✅ **Dynamic Filtering**: Date and probability stage filters work seamlessly
2. ✅ **Business Context**: Stage names align with sales process terminology  
3. ✅ **Data Quality**: Revenue filter ensures only valuable deals are analyzed
4. ✅ **Time Relevance**: Date filters focus on actionable time periods
5. ✅ **Stage Insights**: Each probability stage provides relevant business intelligence
6. ✅ **URL Persistence**: Filter state persists across browser sessions
7. ✅ **Export Flexibility**: Context-aware export options for different stakeholders

## Technical Stack Requirements

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Library**: shadcn/ui components with Tailwind CSS
- **State Management**: React Query for API state + URL state for filters
- **Routing**: React Router DOM with search params
- **Date Handling**: date-fns for date manipulation
- **File Upload**: React Dropzone  
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React

### Backend
- **Framework**: Python FastAPI
- **Data Processing**: Pandas for CSV analysis with date filtering
- **Database**: SQLite/PostgreSQL with SQLAlchemy
- **API Documentation**: Auto-generated with FastAPI
- **File Handling**: Aiofiles for async file operations
- **CRM Integration**: Zoho CRM MCP server

### Development Commands

```bash
# Frontend setup
cd frontend
npm install
npm run dev

# Backend setup  
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

This comprehensive prompt provides the complete specification for building an advanced Pipeline Pulse dashboard with dynamic filtering capabilities that transform raw CRM data into stage-specific, time-relevant business intelligence.
