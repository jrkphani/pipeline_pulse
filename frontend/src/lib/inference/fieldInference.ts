import type { AISuggestion } from '@/components/grid/inline-new-deal/new-deal.types';

// ---------------------------------------------------------------------------
// Mock AI Field Inference
// Maps account name fragments → historically observed deal defaults.
// Replace with real API call when backend inference endpoint is ready.
// ---------------------------------------------------------------------------

interface AccountHistory {
  suggestions: AISuggestion[];
  priorDeals: number;
}

/**
 * Predefined account history mapping.
 * Keys are lowercase account-name fragments (first segment / common abbreviation).
 */
const ACCOUNT_HISTORY: Record<string, AccountHistory> = {
  uob: {
    suggestions: [
      { field: 'seller', label: 'Seller', value: 'Vikram S.' },
      { field: 'gtm_motion', label: 'GTM motion', value: 'SAP' },
      { field: 'funding_flag', label: 'Funding', value: 'AWS Funded' },
    ],
    priorDeals: 2,
  },
  dbs: {
    suggestions: [
      { field: 'seller', label: 'Seller', value: 'Vartika S.' },
      { field: 'gtm_motion', label: 'GTM motion', value: 'Agentic AI' },
      { field: 'funding_flag', label: 'Funding', value: 'AWS Funded' },
    ],
    priorDeals: 1,
  },
  grab: {
    suggestions: [
      { field: 'seller', label: 'Seller', value: 'Elijah M.' },
      { field: 'gtm_motion', label: 'GTM motion', value: 'Agentic AI' },
      { field: 'funding_flag', label: 'Funding', value: 'AWS Funded' },
    ],
    priorDeals: 1,
  },
  ocbc: {
    suggestions: [
      { field: 'seller', label: 'Seller', value: 'Vartika S.' },
      { field: 'gtm_motion', label: 'GTM motion', value: 'SAP' },
      { field: 'funding_flag', label: 'Funding', value: 'AWS Funded' },
    ],
    priorDeals: 1,
  },
  singtel: {
    suggestions: [
      { field: 'seller', label: 'Seller', value: 'Tracy T.' },
      { field: 'gtm_motion', label: 'GTM motion', value: 'Migrations' },
      { field: 'funding_flag', label: 'Funding', value: 'AWS Funded' },
    ],
    priorDeals: 3,
  },
  capitaland: {
    suggestions: [
      { field: 'seller', label: 'Seller', value: 'Vikram S.' },
      { field: 'gtm_motion', label: 'GTM motion', value: 'SAP' },
      { field: 'funding_flag', label: 'Funding', value: 'Customer Funded' },
    ],
    priorDeals: 2,
  },
};

/**
 * Infer field defaults from a partial account name.
 * Matches the first segment of the input against known account history keys.
 *
 * @returns matching suggestions + prior deal count, or `null` if no match.
 */
export function inferFields(accountName: string): AccountHistory | null {
  const lower = accountName.toLowerCase().trim();
  if (lower.length < 2) return null;

  for (const [key, history] of Object.entries(ACCOUNT_HISTORY)) {
    if (lower.includes(key)) return history;
  }
  return null;
}
