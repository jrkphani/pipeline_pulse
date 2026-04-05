// ---------------------------------------------------------------------------
// Pipeline Pulse — Core Domain Types
// Aligned with 1CH_Unified_Deal_Tracker.xlsx column groups
// ---------------------------------------------------------------------------

// ---- Enums & Literals ----

export const SALES_STAGES = [
  'New Hunt',
  'Qualified',
  'Proposal Submitted',
  'FR Raised',
  'Order Book',
  'Closed Won',
  'Lost',
] as const;
export type SalesStage = (typeof SALES_STAGES)[number];

const PRESALES_STAGES = [
  'First Call Done',
  'BANT Qualified',
  'Discovery Completed',
  'TCO Prepared',
  'Effort Estimated',
  'Deal Structured',
  'Solution Designed',
  'Proposal Drafted',
  'Proposal Presented',
  'Solution Signed Off',
  'FR Submitted',
  'SOW Submitted',
  'PO / Approval Received',
  'Internal Kickoff Done',
  'Customer Kicked Off',
  'In Delivery',
  'CST Submitted',
  'Engagement Completed',
  'Lost',
] as const;
export type PresalesStage = (typeof PRESALES_STAGES)[number];

export type FundingFlag = 'AWS Funded' | 'Customer Funded';
export type FundingType =
  | 'MAP 2.0 — Assess'
  | 'MAP 2.0 — Mobilize'
  | 'MAP 2.0 — Migrate & Modernize'
  | 'MAP Lite — Assess'
  | 'MAP Lite — Mobilize/Migrate'
  | 'SCA POC Funding'
  | 'Gen AI 20% POC'
  | 'IW Build'
  | 'Customer Funded'
  | string; // extensible via Reference Data admin

export type GTMMotion =
  | 'Agentic AI'
  | 'SAP'
  | 'Migrations'
  | 'MSP'
  | string; // extensible

export type Country = 'SG' | 'PH' | 'MY' | 'ID' | 'IN';

export type SwimLane =
  | 'The New Hunt'
  | 'Protect the Bank'
  | 'Strategic Accounts'
  | 'Event Driven Revenue';

export type LeadSource =
  | 'AWS AM'
  | 'SDR'
  | 'Personal Connect'
  | 'SAP GTM'
  | 'Event'
  | 'External Referral'
  | 'Marketing'
  | 'Existing Customer'
  | 'Migrations GTM';

export type AWSSegment =
  | 'Focus'
  | 'Scale'
  | 'Enterprise'
  | 'StartUp'
  | 'Emerging Markets'
  | 'Public Sector'
  | 'Indirect';

export type StageStatus = 'In Progress' | 'Planned' | 'Not Planned' | 'Blocked';
export type TriState = 'Yes' | 'No' | 'TBD';
export type DealHealth = 'green' | 'amber' | 'red';
export type ArchiveFlag = 'Active' | 'Archive' | 'Stale';

// ---------------------------------------------------------------------------
// Deal — one row in the pipeline grid
// ---------------------------------------------------------------------------

export interface Deal {
  /** Internal UUID */
  id: string;

  // ── DEAL IDENTITY (Excel cols A–P) ──────────────────────────────────────
  deal_id: string;                       // e.g. "1CH-SG-001"
  account_name: string;
  opportunity_name: string;
  country: Country;
  seller: string;                        // display name (e.g. "Tracy T.")
  seller_email: string;                  // e.g. "tracy.tan@1cloudhub.com"
  presales_consultant: string | null;    // display name
  presales_sa: string | null;            // display name
  swim_lane: SwimLane | null;
  lead_source: LeadSource | null;
  aws_segment: AWSSegment | null;
  funding_type: FundingType | null;
  funding_flag: FundingFlag;
  gtm_motion: GTMMotion;
  archive_flag: ArchiveFlag;

  // ── REVENUE (Excel cols Q–AE) ───────────────────────────────────────────
  deal_value_usd: number;
  deal_value_sgd: number;                // = USD × FX rate
  total_fy: number;                      // sum of monthly revenue allocations
  weighted_value_sgd: number;

  // ── SALES STAGE (Excel cols AL–AQ) ──────────────────────────────────────
  sales_stage: SalesStage;
  days_in_stage: number;                 // computed: TODAY - stage timestamp
  stage_sla: number | null;              // lookup from STAGE_SLA
  stage_health: DealHealth;              // computed: days vs SLA
  is_stalled: boolean;
  action_bucket: string | null;
  target_date: string | null;            // ISO date
  close_date: string;                    // ISO date — expected close

  // ── PRESALES STAGE (Excel cols AR–AX) ───────────────────────────────────
  presales_stage: PresalesStage | null;
  ps_days_in_stage: number | null;       // computed
  ps_stage_health: DealHealth | null;    // computed: ≤80%=green, ≤100%=amber, >100%=red
  stage_status: StageStatus | null;
  stage_blocker: string | null;
  next_ps_stage: string | null;
  eta_fr_po: string | null;             // ISO date

  // ── DEPENDENCIES (Excel cols AY–BL) ─────────────────────────────────────
  sow_id: string | null;
  tco: TriState;
  effort_est: TriState;
  funding_program: string | null;
  opp_id: string | null;                // AWS opportunity ID
  fr_id: string | null;
  aws_account: string | null;
  po_id: string | null;
  closure_confirmed: string | null;      // computed status string

  // ── ACTIONS (Excel cols BM–BR) ──────────────────────────────────────────
  weekly_sales_action: string | null;
  presales_action: string | null;
  action_owner: string | null;
  deal_notes: string | null;

  // ── ALLIANCE (for Alliance View tab) ────────────────────────────────────
  ace_id: string | null;
  map_status: 'Submitted' | 'Under Review' | 'Approved' | null;
  o2r_phase: string | null;
}

// ---------------------------------------------------------------------------
// Filter State — used by FilterToolbar ↔ PipelineGrid
// ---------------------------------------------------------------------------

export interface FilterState {
  stages: string[];
  sellers: string[];
  gtmMotions: string[];
  fundingFlags: string[];
}

export const EMPTY_FILTER_STATE: FilterState = {
  stages: [],
  sellers: [],
  gtmMotions: [],
  fundingFlags: [],
};

// ---------------------------------------------------------------------------
// Pipeline Stats
// ---------------------------------------------------------------------------

export interface PipelineStats {
  total_pipeline_sgd: number;
  weighted_forecast_sgd: number;
  deal_count: number;
  stalled_count: number;
  fx_rate_usd_sgd: number;
  fx_rate_age_hours: number;
}

// ---------------------------------------------------------------------------
// User Role
// ---------------------------------------------------------------------------

export type UserRole =
  | 'cro'
  | 'ae'
  | 'pc'
  | 'sa'
  | 'pm'
  | 'am'
  | 'finance'
  | 'sdr'
  | 'admin';
