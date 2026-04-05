// ---------------------------------------------------------------------------
// Pipeline Pulse — Lead Domain Types
// Aligned with 1CH_SDR_Lead_Tracker.xlsx "Lead Summary" tab
// ---------------------------------------------------------------------------

// ---- Lead Status Progression ----

export const LEAD_STAGES = ['Contacted', 'Engaged', 'MQL Ready', 'Graduated'] as const;
export type LeadStage = (typeof LEAD_STAGES)[number];

// ---- GTM Motions for Leads ----

export const LEAD_GTM_MOTIONS = [
  'SAP Migration',
  'SCA GenAI',
  'VMware Exit',
  'MAP Lite',
  'Agentic AI',
  'Reconcile AI',
] as const;
export type LeadGTMMotion = (typeof LEAD_GTM_MOTIONS)[number];

// ---- Lead Source Types ----

export const LEAD_SOURCE_TYPES = [
  'AWS AM Referral',
  'Event Follow-up',
  'Cold Outbound',
  'LinkedIn',
  'Referral',
  'Inbound Website',
] as const;
export type LeadSourceType = (typeof LEAD_SOURCE_TYPES)[number];

// ---- Budget Indicators ----

export const BUDGET_INDICATORS = ['Aware', 'Exploring', 'Confirmed'] as const;
export type BudgetIndicator = (typeof BUDGET_INDICATORS)[number];

// ---- Timeline Options ----

export const TIMELINE_OPTIONS = [
  'Within 3 months',
  '3–6 months',
  '6+ months',
] as const;
export type TimelineOption = (typeof TIMELINE_OPTIONS)[number];

// ---- DM / ICP Options ----

export const DM_ICP_OPTIONS = ['Decision Maker', 'Influencer', 'Unknown'] as const;
export type DMICPOption = (typeof DM_ICP_OPTIONS)[number];

// ---- Markets ----

export const LEAD_MARKETS = ['SG', 'MY', 'PH', 'ID', 'IN'] as const;
export type LeadMarket = (typeof LEAD_MARKETS)[number];

// ---------------------------------------------------------------------------
// MQL Gate — all 5 must be met for MQL Ready (auto-computed)
// ---------------------------------------------------------------------------

export interface MQLGate {
  meeting_booked: boolean;
  dm_confirmed: boolean;
  pain_point_confirmed: boolean;
  budget_indicator_filled: boolean;
  timeline_filled: boolean;
}

// ---------------------------------------------------------------------------
// ICP Score — 1 to 5 stars (Apollo.io enriched, SDR can override)
// ---------------------------------------------------------------------------

export type ICPScore = 1 | 2 | 3 | 4 | 5;

// ---------------------------------------------------------------------------
// Lead — core record
// ---------------------------------------------------------------------------

export interface Lead {
  // IDENTITY & PROVENANCE
  lead_id: string;
  company_name: string;
  contact_name: string;
  title_role: string;
  country: LeadMarket;
  email: string;
  phone: string | null;
  gtm_motion: LeadGTMMotion | string;
  campaign_name: string | null;
  lead_source_type: LeadSourceType | string;
  date_added: string;

  // OWNERSHIP
  assigned_sdr: string;
  receiving_seller: string | null;
  market: LeadMarket;

  // ACTIVITY (computed/auto)
  attempt_count: number;
  last_activity_date: string | null;
  first_contact_date: string | null;
  days_to_first_contact: number | null;

  // MQL QUALIFICATION GATE
  meeting_booked: boolean;
  meeting_date: string | null;
  dm_icp_confirmed: DMICPOption | null;
  pain_point_confirmed: boolean;
  budget_indicator: BudgetIndicator | null;
  timeline: TimelineOption | null;
  mql_gate: MQLGate;
  mql_ready_auto: boolean;
  mql_approved_by: string | null;
  mql_date: string | null;

  // CONVERSION
  lead_status: LeadStage;
  days_to_mql: number | null;
  handoff_date: string | null;
  deal_id: string | null;

  // ICP ENRICHMENT (Apollo.io)
  icp_score: ICPScore | null;
  icp_score_overridden: boolean;

  // NOTES
  notes: string | null;
}

// ---------------------------------------------------------------------------
// Lead Activity Log Entry
// ---------------------------------------------------------------------------

export interface LeadActivity {
  activity_id: string;
  lead_id: string;
  company_name: string;
  contact_name: string;
  date: string;
  attempt_number: number;
  channel: 'Call' | 'WhatsApp' | 'Email' | 'LinkedIn' | 'Meeting';
  outcome: string;
  notes: string | null;
  next_action: string | null;
  next_action_date: string | null;
  sdr_name: string;
}

// ---------------------------------------------------------------------------
// Stats for the stats bar
// ---------------------------------------------------------------------------

export interface LeadsStats {
  total: number;
  contacted: number;
  engaged: number;
  mql_ready: number;
  graduated: number;
  disqualified: number;
  conversion_rate: number;
  graduation_queue_count: number;
}

// ---------------------------------------------------------------------------
// Filter State for Leads
// ---------------------------------------------------------------------------

export interface LeadFilterState {
  sdrs: string[];
  gtmMotions: string[];
  statuses: string[];
  markets: string[];
}

export const EMPTY_LEAD_FILTER_STATE: LeadFilterState = {
  sdrs: [],
  gtmMotions: [],
  statuses: [],
  markets: [],
};
