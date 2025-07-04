// Opportunity Types for Pipeline Pulse
// Strong TypeScript definitions for O2R (Opportunity-to-Revenue) data

export type HealthSignal = 'healthy' | 'at_risk' | 'critical' | 'needs_update'
export type OpportunityPhase = 'phase_1' | 'phase_2' | 'phase_3' | 'phase_4'
export type FundingType = 'AWS_Funded' | 'Non_Funded' | 'Co_Sell' | 'Unknown'
export type ServiceType = 'CloudOps' | 'DataOps' | 'DevOps' | 'Migration' | 'Consulting' | 'Support'

export interface Opportunity {
  id: string
  deal_name: string
  account_name: string
  owner: string
  sgd_amount: number
  probability: number
  current_stage: string
  closing_date?: string | null
  territory?: string
  service_type?: ServiceType
  funding_type?: FundingType
  market_segment?: string
  strategic_account: boolean
  current_phase: OpportunityPhase
  health_signal: HealthSignal
  health_reason?: string
  comments?: string
  blockers: string[]
  action_items: string[]
  
  // O2R Milestone Dates
  proposal_date?: string | null
  po_date?: string | null
  kickoff_date?: string | null
  invoice_date?: string | null
  payment_date?: string | null
  revenue_date?: string | null
  
  // Metadata
  created_at?: string
  updated_at?: string
  last_modified_by?: string
}

export interface OpportunityFormData extends Omit<Opportunity, 'id' | 'created_at' | 'updated_at' | 'last_modified_by'> {
  // Form-specific overrides if needed
}

export interface OpportunityUpdate {
  id: string
  updates: Partial<Opportunity>
  reason?: string
}

export interface OpportunityListItem {
  id: string
  deal_name: string
  account_name: string
  sgd_amount: number
  current_phase: OpportunityPhase
  health_signal: HealthSignal
  closing_date?: string | null
  probability: number
  current_stage: string
}

// API Response Types
export interface OpportunityApiResponse {
  success: boolean
  data: Opportunity[]
  total: number
  page: number
  limit: number
}

export interface OpportunityUpdateResponse {
  success: boolean
  data: Opportunity
  message: string
}

// Filter and Search Types
export interface OpportunityFilters {
  phase?: OpportunityPhase[]
  health_signal?: HealthSignal[]
  territory?: string[]
  service_type?: ServiceType[]
  funding_type?: FundingType[]
  strategic_account?: boolean
  amount_min?: number
  amount_max?: number
  closing_date_start?: string
  closing_date_end?: string
  search_query?: string
}

export interface OpportunitySortConfig {
  field: keyof Opportunity
  direction: 'asc' | 'desc'
}