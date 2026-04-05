import type { Account, AccountsStats, AccountIndustry, StrategicTier } from '@/types/accounts';
import type { LeadMarket } from '@/types/leads';
import { MOCK_LEADS } from './mock-leads';
import { MOCK_DEALS } from './mock-deals';

// ---------------------------------------------------------------------------
// Curated overrides for known accounts
// ---------------------------------------------------------------------------

interface AccountOverride {
  strategic_tier: StrategicTier;
  named_ae: string;
  industry: AccountIndustry;
}

const OVERRIDES: Record<string, AccountOverride> = {
  'Panasonic Asia::SG': { strategic_tier: 'A', named_ae: 'Tracy T.', industry: 'Manufacturing' },
  'DBS Bank::SG': { strategic_tier: 'A', named_ae: 'Tracy T.', industry: 'Financial Services' },
  'Telkom Indonesia::ID': { strategic_tier: 'B', named_ae: 'Benjamin', industry: 'Telecommunications' },
  'Celcom Axiata::MY': { strategic_tier: 'B', named_ae: 'Benjamin', industry: 'Telecommunications' },
  'Globe Telecom::PH': { strategic_tier: 'B', named_ae: 'July', industry: 'Telecommunications' },
  'Axiata Digital::MY': { strategic_tier: 'C', named_ae: 'Benjamin', industry: 'Technology' },
  'Infosys BPM::IN': { strategic_tier: 'C', named_ae: 'Jason Garcia', industry: 'Technology' },
  'OCBC Bank::SG': { strategic_tier: 'A', named_ae: 'Tracy T.', industry: 'Financial Services' },
};

// ---------------------------------------------------------------------------
// Auto-derive accounts from leads + deals
// ---------------------------------------------------------------------------

function buildAccounts(): Account[] {
  const accountMap = new Map<string, Account>();
  let counter = 0;

  // Build from leads
  for (const lead of MOCK_LEADS) {
    const key = `${lead.company_name}::${lead.market}`;
    if (!accountMap.has(key)) {
      counter++;
      const override = OVERRIDES[key];
      accountMap.set(key, {
        account_id: `ACC-${lead.market}-${String(counter).padStart(3, '0')}`,
        company_name: lead.company_name,
        market: lead.market,
        country: lead.country,
        industry: override?.industry ?? null,
        website: null,
        linkedin_url: null,
        strategic_tier: override?.strategic_tier ?? null,
        tier_set_by: override ? 'CRO' : null,
        tier_set_date: override ? '2026-01-20' : null,
        named_ae: override?.named_ae ?? lead.receiving_seller,
        sourcing_sdr: lead.assigned_sdr,
        contact_count: 0,
        open_lead_count: 0,
        open_deal_count: 0,
        pipeline_sgd: 0,
        last_activity_date: lead.last_activity_date,
        notes: null,
        created_at: lead.date_added,
        updated_at: lead.date_added,
      });
    }
    const acc = accountMap.get(key)!;
    acc.contact_count += 1;
    if (lead.lead_status !== 'Graduated') {
      acc.open_lead_count += 1;
    }
    if (lead.last_activity_date && (!acc.last_activity_date || lead.last_activity_date > acc.last_activity_date)) {
      acc.last_activity_date = lead.last_activity_date;
    }
  }

  // Also build from deals that may not have leads
  for (const deal of MOCK_DEALS) {
    // Find matching account by company name (deals don't have market, use country)
    const market = deal.country as LeadMarket;
    const key = `${deal.account_name}::${market}`;
    if (!accountMap.has(key)) {
      counter++;
      const override = OVERRIDES[key];
      accountMap.set(key, {
        account_id: `ACC-${market}-${String(counter).padStart(3, '0')}`,
        company_name: deal.account_name,
        market,
        country: market,
        industry: override?.industry ?? null,
        website: null,
        linkedin_url: null,
        strategic_tier: override?.strategic_tier ?? null,
        tier_set_by: override ? 'CRO' : null,
        tier_set_date: override ? '2026-01-20' : null,
        named_ae: override?.named_ae ?? deal.seller,
        sourcing_sdr: null,
        contact_count: 0,
        open_lead_count: 0,
        open_deal_count: 0,
        pipeline_sgd: 0,
        last_activity_date: null,
        notes: null,
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
      });
    }
  }

  // Aggregate deal data into accounts
  for (const deal of MOCK_DEALS) {
    const market = deal.country as LeadMarket;
    const key = `${deal.account_name}::${market}`;
    const acc = accountMap.get(key);
    if (acc && deal.sales_stage !== 'Lost' && deal.sales_stage !== 'Closed Won') {
      acc.open_deal_count += 1;
      acc.pipeline_sgd += deal.deal_value_sgd;
    }
  }

  return Array.from(accountMap.values());
}

export const MOCK_ACCOUNTS: Account[] = buildAccounts();

// ---------------------------------------------------------------------------
// Stats computation
// ---------------------------------------------------------------------------

export function computeAccountsStats(accounts: Account[]): AccountsStats {
  return {
    total: accounts.length,
    tier_a: accounts.filter((a) => a.strategic_tier === 'A').length,
    tier_b: accounts.filter((a) => a.strategic_tier === 'B').length,
    tier_c: accounts.filter((a) => a.strategic_tier === 'C').length,
    untiered: accounts.filter((a) => a.strategic_tier == null).length,
    total_pipeline_sgd: accounts.reduce((sum, a) => sum + a.pipeline_sgd, 0),
    accounts_with_open_leads: accounts.filter((a) => a.open_lead_count > 0).length,
    accounts_with_no_pipeline: accounts.filter((a) => a.pipeline_sgd === 0 && a.open_deal_count === 0).length,
  };
}
