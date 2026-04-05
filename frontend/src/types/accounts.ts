import type { LeadMarket } from './leads';

// ---------------------------------------------------------------------------
// Account
// ---------------------------------------------------------------------------

export const STRATEGIC_TIERS = ['A', 'B', 'C'] as const;
export type StrategicTier = (typeof STRATEGIC_TIERS)[number];

export const ACCOUNT_INDUSTRIES = [
  'Telecommunications',
  'Financial Services',
  'Manufacturing',
  'Technology',
  'Healthcare',
  'Government',
  'Retail',
  'Energy',
  'Education',
  'Other',
] as const;
export type AccountIndustry = (typeof ACCOUNT_INDUSTRIES)[number];

export interface Account {
  account_id: string;
  company_name: string;
  market: LeadMarket;
  country: LeadMarket;
  industry: AccountIndustry | string | null;
  website: string | null;
  linkedin_url: string | null;

  // Strategic classification
  strategic_tier: StrategicTier | null;
  tier_set_by: string | null;
  tier_set_date: string | null;

  // Ownership
  named_ae: string | null;
  sourcing_sdr: string | null;

  // Aggregated health (computed from linked data)
  contact_count: number;
  open_lead_count: number;
  open_deal_count: number;
  pipeline_sgd: number;
  last_activity_date: string | null;

  // Notes
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Stats for the accounts stats bar
export interface AccountsStats {
  total: number;
  tier_a: number;
  tier_b: number;
  tier_c: number;
  untiered: number;
  total_pipeline_sgd: number;
  accounts_with_open_leads: number;
  accounts_with_no_pipeline: number;
}
