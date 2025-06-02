/**
 * Filter types and presets for Pipeline Pulse Dashboard
 */

export interface DateFilter {
  label: string;
  value: string;
  startDate: Date | null;
  endDate: Date | null;
  isDefault?: boolean;
}

export interface ProbabilityStage {
  label: string;
  value: string;
  minProbability: number;
  maxProbability: number;
  description: string;
  color: string;
  isDefault?: boolean;
}

export interface FilterState {
  dateRange: string;
  probabilityStage: string;
  customStartDate?: string;
  customEndDate?: string;
}

// Date filter presets based on development prompt
export const DATE_FILTER_PRESETS: DateFilter[] = [
  {
    label: "Current Month",
    value: "current-month",
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
  },
  {
    label: "Current Quarter", 
    value: "current-quarter",
    startDate: new Date(new Date().getFullYear(), Math.floor(new Date().getMonth() / 3) * 3, 1),
    endDate: new Date(new Date().getFullYear(), Math.floor(new Date().getMonth() / 3) * 3 + 3, 0),
    isDefault: true // Default selection
  },
  {
    label: "Next Quarter",
    value: "next-quarter", 
    startDate: new Date(new Date().getFullYear(), Math.floor(new Date().getMonth() / 3) * 3 + 3, 1),
    endDate: new Date(new Date().getFullYear(), Math.floor(new Date().getMonth() / 3) * 3 + 6, 0)
  },
  {
    label: "Q2 Next Year",
    value: "q2-next-year",
    startDate: new Date(new Date().getFullYear() + 1, 3, 1), // April 1st next year
    endDate: new Date(new Date().getFullYear() + 1, 6, 0)    // June 30th next year
  },
  {
    label: "All Time",
    value: "all-time",
    startDate: null,
    endDate: null
  },
  {
    label: "Custom Range",
    value: "custom",
    startDate: null, // User selects
    endDate: null    // User selects
  }
];

// Probability stage presets based on development prompt
export const PROBABILITY_STAGE_PRESETS: ProbabilityStage[] = [
  {
    label: "Sales Stage",
    value: "sales-stage",
    minProbability: 10,
    maxProbability: 39,
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
    minProbability: 71,
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

// Helper functions
export const getDateFilterByValue = (value: string): DateFilter | undefined => {
  return DATE_FILTER_PRESETS.find(filter => filter.value === value);
};

export const getProbabilityStageByValue = (value: string): ProbabilityStage | undefined => {
  return PROBABILITY_STAGE_PRESETS.find(stage => stage.value === value);
};

export const getDefaultDateFilter = (): DateFilter => {
  return DATE_FILTER_PRESETS.find(filter => filter.isDefault) || DATE_FILTER_PRESETS[1];
};

export const getDefaultProbabilityStage = (): ProbabilityStage => {
  return PROBABILITY_STAGE_PRESETS.find(stage => stage.isDefault) || PROBABILITY_STAGE_PRESETS[1];
};

// Format date for display
export const formatDateRange = (filter: DateFilter): string => {
  if (!filter.startDate || !filter.endDate) {
    return filter.label;
  }
  
  const start = filter.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const end = filter.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  
  return `${start} - ${end}`;
};

// Generate dynamic subtitle for dashboard
export const generateDashboardSubtitle = (
  filteredDealsCount: number,
  totalValue: number,
  dateFilter: DateFilter,
  probabilityStage: ProbabilityStage
): string => {
  const valueFormatted = `SGD ${(totalValue / 1000000).toFixed(1)}M`;
  const probabilityRange = `${probabilityStage.minProbability}-${probabilityStage.maxProbability}%`;
  
  return `${probabilityStage.label}: ${filteredDealsCount} Deals • ${valueFormatted} Value • ${dateFilter.label} • ${probabilityRange} Probability`;
};
