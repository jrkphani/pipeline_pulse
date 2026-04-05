import type { Deal, SalesStage, FundingFlag, GTMMotion, Country } from '@/types/index';

// ---------------------------------------------------------------------------
// New Deal Draft — fields the user fills in during inline creation
// ---------------------------------------------------------------------------

export interface NewDealDraft {
  account_name: string;
  opportunity_name: string;
  country: Country;
  seller: string;
  seller_email: string;
  funding_flag: FundingFlag;
  gtm_motion: GTMMotion;
  deal_value_usd: number;
  close_date: string; // ISO date
  sales_stage: SalesStage;
}

// ---------------------------------------------------------------------------
// New Deal Row — sentinel type for AG Grid pinned bottom row
// ---------------------------------------------------------------------------

export type NewDealRow = Partial<Deal> & { __isNewRow: true };

// ---------------------------------------------------------------------------
// AI suggestion
// ---------------------------------------------------------------------------

export interface AISuggestion {
  field: keyof NewDealDraft;
  label: string;
  value: string;
}

// ---------------------------------------------------------------------------
// Phase state machine
// ---------------------------------------------------------------------------

export type NewDealPhase = 'idle' | 'editing' | 'ai-suggesting' | 'ready' | 'saving';

/** Fields required before save is allowed */
export const REQUIRED_FIELDS: (keyof NewDealDraft)[] = [
  'account_name',
  'opportunity_name',
  'deal_value_usd',
  'close_date',
];

/** Tab order for editable fields in the new deal row */
export const TAB_FIELD_ORDER: string[] = [
  'account_name',
  'opportunity_name',
  'deal_value_usd',
  'seller',
  'gtm_motion',
  'close_date',
];
