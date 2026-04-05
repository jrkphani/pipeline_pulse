// ---------------------------------------------------------------------------
// Deal Detail — types for /pipeline/$dealId view
// Aligned with pipeline_pulse_full_wireframe.html
// ---------------------------------------------------------------------------

import type { SalesStage, FundingFlag, FundingType, Country } from './index';

// ---- Presales Banding (Accordion) ----

export type BandStatus = 'done' | 'active' | 'pending';

export interface BandStep {
  name: string;
  owner: string;
  owner_role: 'AE' | 'PC' | 'SA' | 'PM';
  sla_days: number | null;
  completed_at: string | null;           // ISO date or null if not done
  status: 'done' | 'in_progress' | 'current' | 'pending';
  deliverable: string | null;            // e.g. "BANT confirmed", "Architecture doc"
  blocker: string | null;                // stall reason if current & blocked
  unlock_hint: string | null;            // "Completing this unlocks: ..."
}

export interface PresalesBand {
  id: string;                            // e.g. "b1"
  name: string;                          // e.g. "Band 1 . New Hunt"
  band_number: number;
  status: BandStatus;
  steps: BandStep[];
  total_days: number | null;             // days taken (done bands) or null
  deliverable_summary: string | null;    // e.g. "BANT confirmed"
}

// ---- Dual Track (Commercial + Presales compact view) ----

export type TrackNodeStatus = 'done' | 'current' | 'pending' | 'locked';

export interface CommercialTrackNode {
  label: string;                         // e.g. "NH", "Discovery", "Proposal"
  status: TrackNodeStatus;
}

export interface PresalesTrackBand {
  band_number: number;
  total: number;
  completed: number;
  status: 'done' | 'active' | 'pending';
}

export interface DualTrack {
  commercial_nodes: CommercialTrackNode[];
  presales_bands: PresalesTrackBand[];
  current_step_label: string;            // e.g. "Customer Sign Off (Band 3 . 2/3)"
  next_gate: string;                     // e.g. "FR Submission -> unlocks Negotiation"
  stall_days: number | null;
}

// ---- Timeline ----

export type TimelineEventType = 'stall_alert' | 'meeting' | 'stage_change';

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  title: string;
  date: string;                          // ISO date
  participants: string | null;           // e.g. "Vikram S., Priya M."
  context: string | null;                // e.g. "CTO + CFO OCBC"
  note: string | null;
  is_alert: boolean;                     // red highlight for stall alerts
}

// ---- AI Q Tree ----

export type QStatus = 'answered' | 'active' | 'locked' | 'pending';

export interface QTreeQuestion {
  number: number;
  question: string;
  status: QStatus;
  answer: string | null;
  answered_by: string | null;
  answered_at: string | null;            // ISO datetime
  ai_hint: string | null;               // why AI selected this question
  unlock_hint: string | null;            // "answer Q7 to unlock"
}

export interface QTreeGroup {
  id: string;
  name: string;                          // e.g. "SAP Migration discovery"
  domain_confidence: number | null;      // 0-100, e.g. 91
  answered_count: number;
  total_count: number;
  status: 'active' | 'not_started';
  questions: QTreeQuestion[];
}

// ---- Solution Fit ----

export interface SolutionSignal {
  text: string;
  confirmed: boolean;
  source: string;                        // e.g. "Q tree . Q1", "TCO Creator"
}

export interface SolutionCapability {
  name: string;
  confirmed: boolean;
}

export interface SolutionFit {
  fit_label: string;                     // "Partial Fit", "Strong Fit", etc.
  primary_area: string;                  // e.g. "SAP Migration"
  score: number;                         // 0-100
  signals_confirmed: number;
  signals_total: number;
  qtree_completion_pct: number;          // 0-100
  capabilities: SolutionCapability[];
  signals: SolutionSignal[];
  can_generate_proposal: boolean;
  blocked_reason: string | null;         // why proposal generation is locked
}

// ---- RACI ----

export interface RaciMember {
  role: 'AE' | 'PC' | 'SA' | 'PM' | 'AM';
  name: string;
}

// ---- Tab Placeholder Info ----

export interface PlaceholderTab {
  icon: string;
  title: string;
  subtitle: string;
}

// ---- Deal Detail (full payload) ----

export type DealDetailTab =
  | 'overview'
  | 'timeline'
  | 'qtree'
  | 'solution-fit'
  | 'tco'
  | 'documents'
  | 'revenue'
  | 'linked'
  | 'proposal';

export interface DealDetailOverview {
  account_name: string;
  opportunity_name: string;
  deal_value_sgd: number;
  seller: string;
  gtm_motion: string;
  close_date: string;
  funding_type: string;
  program: string | null;
  ace_id: string | null;
  ace_status: string | null;             // e.g. "ACE incomplete"
  days_in_stage: number;
  is_stalled: boolean;
  lead_source: string | null;
  country: Country;
}

export interface DealDetailAIFields {
  model_label: string;                   // e.g. "Bedrock Sonnet"
  last_run: string;                      // e.g. "23 Apr"
  fields: {
    source: string;                      // e.g. "TCO Creator", "Solution Fit"
    label: string;
    value: string;
  }[];
}

export interface DealDetail {
  id: string;
  deal_id: string;                       // e.g. "1CH-SG-003"
  account_name: string;
  opportunity_name: string;
  display_name: string;                  // e.g. "OCBC Bank . SAP RISE Migration"

  // Header badges
  sales_stage: SalesStage;
  stage_label: string;                   // e.g. "3 . Proposal"
  funding_flag: FundingFlag;
  funding_type: FundingType | null;
  program_badge: string | null;          // e.g. "MAP"
  days_in_stage: number;
  is_stalled: boolean;
  action_label: string;                  // primary CTA text, e.g. "Submit proposal"

  // Sections
  dual_track: DualTrack;
  presales_bands: PresalesBand[];
  raci: RaciMember[];
  raci_actions: string[];                // e.g. ["Submit proposal", "Book technical deep-dive"]
  overview: DealDetailOverview;
  ai_fields: DealDetailAIFields;
  timeline: TimelineEvent[];
  qtree_groups: QTreeGroup[];
  solution_fit: SolutionFit;

  // Placeholder tabs metadata
  placeholder_tabs: Record<string, PlaceholderTab>;
}
