import type { Deal, PipelineStats, SalesStage } from '@/types/index';

// ---------------------------------------------------------------------------
// Stage SLA lookup (mirrors STAGE_SLA from types)
// ---------------------------------------------------------------------------

const SLA: Record<SalesStage, number | null> = {
  'New Hunt': 14,
  'Qualified': 21,
  'Proposal Submitted': 30,
  'FR Raised': 21,
  'Order Book': 14,
  'Closed Won': null,
  'Lost': null,
};

// ---------------------------------------------------------------------------
// Computed fields
// ---------------------------------------------------------------------------

const FX_RATE = 1.348;

function computeHealth(days: number, sla: number | null): Deal['stage_health'] {
  if (sla == null) return 'green';
  if (days > sla) return 'red';
  if (days >= sla * 0.8) return 'amber';
  return 'green';
}

function computePSHealth(days: number | null, stage: Deal['presales_stage']): Deal['ps_stage_health'] {
  if (days == null || stage == null) return null;
  const psSla: Record<string, number> = {
    'First Call Done': 7, 'BANT Qualified': 14, 'Discovery Completed': 14,
    'TCO Prepared': 14, 'Effort Estimated': 14, 'Deal Structured': 14,
    'Solution Designed': 21, 'Proposal Drafted': 14, 'Proposal Presented': 14,
    'Solution Signed Off': 7, 'FR Submitted': 7, 'SOW Submitted': 7,
    'PO / Approval Received': 7, 'Internal Kickoff Done': 7, 'Customer Kicked Off': 7,
  };
  const sla = psSla[stage];
  if (!sla) return null;
  if (days <= sla * 0.8) return 'green';
  if (days <= sla) return 'amber';
  return 'red';
}

function computeClosureConfirmed(d: Partial<Deal>): string | null {
  const advancedPS = ['Internal Kickoff Done', 'Customer Kicked Off', 'In Delivery', 'CST Submitted', 'Engagement Completed'];
  if (!d.presales_stage || !advancedPS.includes(d.presales_stage)) return null;
  if (d.funding_flag === 'Customer Funded') {
    return d.sow_id ? '✓ Confirmed (SOW)' : '⏳ Awaiting SOW';
  }
  if (d.funding_flag === 'AWS Funded') {
    return d.po_id ? '✓ Confirmed (PO)' : '⏳ Awaiting PO';
  }
  return null;
}

// ---------------------------------------------------------------------------
// Deal factory — builds a full Deal from essential inputs
// ---------------------------------------------------------------------------

interface DealInput {
  deal_id: string;
  account_name: string;
  opportunity_name: string;
  country: Deal['country'];
  seller: string;
  seller_email: string;
  presales_consultant: string | null;
  presales_sa: string | null;
  swim_lane: Deal['swim_lane'];
  lead_source: Deal['lead_source'];
  aws_segment: Deal['aws_segment'];
  funding_type: Deal['funding_type'];
  funding_flag: Deal['funding_flag'];
  gtm_motion: Deal['gtm_motion'];
  deal_value_usd: number;
  total_fy: number;
  sales_stage: Deal['sales_stage'];
  days_in_stage: number;
  action_bucket: string | null;
  target_date: string | null;
  close_date: string;
  presales_stage: Deal['presales_stage'];
  ps_days_in_stage: number | null;
  stage_status: Deal['stage_status'];
  stage_blocker: string | null;
  next_ps_stage: string | null;
  eta_fr_po: string | null;
  sow_id: string | null;
  tco: Deal['tco'];
  effort_est: Deal['effort_est'];
  fr_id: string | null;
  po_id: string | null;
  weekly_sales_action: string | null;
  presales_action: string | null;
  action_owner: string | null;
  deal_notes: string | null;
  ace_id: string | null;
  map_status: Deal['map_status'];
}

export function makeDeal(input: DealInput): Deal {
  const sla = SLA[input.sales_stage];
  const health = computeHealth(input.days_in_stage, sla);
  const psHealth = computePSHealth(input.ps_days_in_stage, input.presales_stage);
  const sgd = Math.round(input.deal_value_usd * FX_RATE);

  const prob: Record<string, number> = {
    'New Hunt': 0.10, 'Qualified': 0.25, 'Proposal Submitted': 0.50,
    'FR Raised': 0.75, 'Order Book': 0.90, 'Closed Won': 1.0, 'Lost': 0,
  };

  return {
    id: crypto.randomUUID(),
    ...input,
    deal_value_sgd: sgd,
    weighted_value_sgd: Math.round(sgd * (prob[input.sales_stage] ?? 0.25)),
    stage_sla: sla,
    stage_health: health,
    is_stalled: health === 'red',
    ps_stage_health: psHealth,
    archive_flag: 'Active',
    funding_program: null,
    opp_id: null,
    aws_account: null,
    closure_confirmed: computeClosureConfirmed(input),
    o2r_phase: null,
  };
}

// ---------------------------------------------------------------------------
// 10 realistic Singapore-region deals
// ---------------------------------------------------------------------------

// Mutable so POST handler can append new deals
export let MOCK_DEALS: Deal[] = [
  makeDeal({ deal_id: '1CH-SG-001', account_name: 'Panasonic APAC', opportunity_name: 'SAP S/4HANA Migration', country: 'SG', seller: 'Tracy T.', seller_email: 'tracy.tan@1cloudhub.com', presales_consultant: 'Ajay S.', presales_sa: 'Nitin K.', swim_lane: 'Strategic Accounts', lead_source: 'AWS AM', aws_segment: 'Enterprise', funding_type: 'MAP 2.0 — Migrate & Modernize', funding_flag: 'AWS Funded', gtm_motion: 'SAP', deal_value_usd: 360000, total_fy: 485000, sales_stage: 'Proposal Submitted', days_in_stage: 8, action_bucket: 'Proposal Stage', target_date: '2026-04-18', close_date: '2026-06-30', presales_stage: 'Proposal Drafted', ps_days_in_stage: 5, stage_status: 'In Progress', stage_blocker: null, next_ps_stage: 'Proposal Presented', eta_fr_po: '2026-05-15', sow_id: null, tco: 'Yes', effort_est: 'Yes', fr_id: null, po_id: null, weekly_sales_action: 'Follow up on proposal review with CTO', presales_action: 'Finalize migration timeline', action_owner: 'tracy.tan@1cloudhub.com', deal_notes: 'SAP RISE migration. Customer evaluating Azure as alternative.', ace_id: 'ACE-SG-0241', map_status: 'Submitted' }),
  makeDeal({ deal_id: '1CH-SG-002', account_name: 'Hitachi APAC', opportunity_name: 'VMware Exit — Azure', country: 'SG', seller: 'Elijah M.', seller_email: 'elijah@1cloudhub.com', presales_consultant: 'Ajay S.', presales_sa: 'Preeth R.', swim_lane: 'The New Hunt', lead_source: 'SDR', aws_segment: 'Focus', funding_type: 'Customer Funded', funding_flag: 'Customer Funded', gtm_motion: 'Migrations', deal_value_usd: 237000, total_fy: 320000, sales_stage: 'Qualified', days_in_stage: 19, action_bucket: 'Requirement Gathering', target_date: '2026-04-25', close_date: '2026-08-15', presales_stage: 'Discovery Completed', ps_days_in_stage: 12, stage_status: 'In Progress', stage_blocker: null, next_ps_stage: 'TCO Prepared', eta_fr_po: null, sow_id: null, tco: 'No', effort_est: 'No', fr_id: null, po_id: null, weekly_sales_action: 'Schedule discovery workshop with infra team', presales_action: 'Prepare TCO comparison VMware vs AWS', action_owner: 'ajay.samuel@1cloudhub.com', deal_notes: 'Customer has 200+ VMware VMs.', ace_id: null, map_status: null }),
  makeDeal({ deal_id: '1CH-SG-003', account_name: 'DBS Bank', opportunity_name: 'GenAI Platform Phase 1', country: 'SG', seller: 'Vartika S.', seller_email: 'vartika.shah@1cloudhub.com', presales_consultant: 'Ajay S.', presales_sa: 'Nitin K.', swim_lane: 'Strategic Accounts', lead_source: 'Personal Connect', aws_segment: 'Enterprise', funding_type: 'Gen AI 20% POC', funding_flag: 'AWS Funded', gtm_motion: 'Agentic AI', deal_value_usd: 890000, total_fy: 1200000, sales_stage: 'FR Raised', days_in_stage: 5, action_bucket: 'FR Raise', target_date: '2026-04-11', close_date: '2026-05-31', presales_stage: 'FR Submitted', ps_days_in_stage: 3, stage_status: 'In Progress', stage_blocker: null, next_ps_stage: 'SOW Submitted', eta_fr_po: '2026-04-20', sow_id: null, tco: 'Yes', effort_est: 'Yes', fr_id: 'FR-2026-0438', po_id: null, weekly_sales_action: 'Follow up on FR approval with AWS PDM', presales_action: 'Begin SOW preparation', action_owner: 'vartika.shah@1cloudhub.com', deal_notes: 'Bedrock RAG platform for internal knowledge base.', ace_id: 'ACE-SG-0238', map_status: 'Approved' }),
  makeDeal({ deal_id: '1CH-SG-004', account_name: 'Five Star Finance', opportunity_name: 'Data Modernisation', country: 'SG', seller: 'Tracy T.', seller_email: 'tracy.tan@1cloudhub.com', presales_consultant: null, presales_sa: null, swim_lane: 'The New Hunt', lead_source: 'SDR', aws_segment: 'Scale', funding_type: 'Customer Funded', funding_flag: 'Customer Funded', gtm_motion: 'Agentic AI', deal_value_usd: 133000, total_fy: 180000, sales_stage: 'New Hunt', days_in_stage: 3, action_bucket: 'Opportunity Identification', target_date: '2026-04-14', close_date: '2026-09-30', presales_stage: 'First Call Done', ps_days_in_stage: 2, stage_status: 'Planned', stage_blocker: null, next_ps_stage: 'BANT Qualified', eta_fr_po: null, sow_id: null, tco: 'No', effort_est: 'No', fr_id: null, po_id: null, weekly_sales_action: 'Qualify budget and decision maker', presales_action: null, action_owner: 'tracy.tan@1cloudhub.com', deal_notes: 'SMB fintech, exploring data lake on AWS.', ace_id: null, map_status: null }),
  makeDeal({ deal_id: '1CH-SG-005', account_name: 'Singapore Airlines', opportunity_name: 'AWS AMS Premium', country: 'SG', seller: 'Sripriya J.', seller_email: 'jonnadula.sripriya@1cloudhub.com', presales_consultant: 'Ajay S.', presales_sa: 'Mathesh K.', swim_lane: 'Protect the Bank', lead_source: 'AWS AM', aws_segment: 'Enterprise', funding_type: 'MAP 2.0 — Assess', funding_flag: 'AWS Funded', gtm_motion: 'MSP', deal_value_usd: 712000, total_fy: 960000, sales_stage: 'Order Book', days_in_stage: 2, action_bucket: 'Customer kick off', target_date: '2026-04-07', close_date: '2026-04-30', presales_stage: 'Internal Kickoff Done', ps_days_in_stage: 1, stage_status: 'In Progress', stage_blocker: null, next_ps_stage: 'Customer Kicked Off', eta_fr_po: '2026-04-10', sow_id: 'SOW-SIA-2026-003', tco: 'Yes', effort_est: 'Yes', fr_id: 'FR-2026-0412', po_id: 'PO-AWS-0891', weekly_sales_action: 'Coordinate kickoff logistics with SIA PM', presales_action: 'Prepare onboarding runbook', action_owner: 'mathesh@1cloudhub.com', deal_notes: 'AMS premium tier — 24/7 coverage. SOW signed, PO received.', ace_id: 'ACE-SG-0229', map_status: 'Approved' }),
  makeDeal({ deal_id: '1CH-SG-006', account_name: 'OCBC Bank', opportunity_name: 'SAP RISE Migration', country: 'SG', seller: 'Vartika S.', seller_email: 'vartika.shah@1cloudhub.com', presales_consultant: 'Ajay S.', presales_sa: 'Srihari D.', swim_lane: 'Strategic Accounts', lead_source: 'SAP GTM', aws_segment: 'Enterprise', funding_type: 'MAP 2.0 — Migrate & Modernize', funding_flag: 'AWS Funded', gtm_motion: 'SAP', deal_value_usd: 1780000, total_fy: 2400000, sales_stage: 'Proposal Submitted', days_in_stage: 34, action_bucket: 'Customer Alignment', target_date: '2026-03-28', close_date: '2026-07-15', presales_stage: 'Proposal Presented', ps_days_in_stage: 28, stage_status: 'Blocked', stage_blocker: 'Awaiting OCBC procurement committee approval', next_ps_stage: 'Solution Signed Off', eta_fr_po: '2026-06-01', sow_id: null, tco: 'Yes', effort_est: 'Yes', fr_id: null, po_id: null, weekly_sales_action: 'Escalate to OCBC VP Infrastructure', presales_action: 'Prepare revised proposal addressing security concerns', action_owner: 'vartika.shah@1cloudhub.com', deal_notes: 'Large SAP RISE deal. Competitor (TCS) also in the mix.', ace_id: null, map_status: 'Under Review' }),
  makeDeal({ deal_id: '1CH-SG-007', account_name: 'Grab Holdings', opportunity_name: 'GenAI CoE Build-out', country: 'SG', seller: 'Elijah M.', seller_email: 'elijah@1cloudhub.com', presales_consultant: 'Ajay S.', presales_sa: 'Nitin K.', swim_lane: 'The New Hunt', lead_source: 'Personal Connect', aws_segment: 'Enterprise', funding_type: 'SCA POC Funding', funding_flag: 'AWS Funded', gtm_motion: 'Agentic AI', deal_value_usd: 556000, total_fy: 750000, sales_stage: 'Qualified', days_in_stage: 11, action_bucket: 'Requirement Gathering', target_date: '2026-04-21', close_date: '2026-08-31', presales_stage: 'Solution Designed', ps_days_in_stage: 8, stage_status: 'In Progress', stage_blocker: null, next_ps_stage: 'Proposal Drafted', eta_fr_po: null, sow_id: null, tco: 'TBD', effort_est: 'No', fr_id: null, po_id: null, weekly_sales_action: 'Present solution design to Grab engineering', presales_action: 'Complete Bedrock architecture document', action_owner: 'nitin@1cloudhub.com', deal_notes: 'GenAI CoE — Bedrock agents for driver support.', ace_id: null, map_status: null }),
  makeDeal({ deal_id: '1CH-ID-008', account_name: 'Telkomsel', opportunity_name: 'VMware to AWS Lift', country: 'ID', seller: 'Olivia R.', seller_email: 'olivia@1cloudhub.com', presales_consultant: 'Ajay S.', presales_sa: 'Jothikumar S.', swim_lane: 'Event Driven Revenue', lead_source: 'AWS AM', aws_segment: 'Focus', funding_type: 'MAP Lite — Mobilize/Migrate', funding_flag: 'AWS Funded', gtm_motion: 'Migrations', deal_value_usd: 475000, total_fy: 640000, sales_stage: 'FR Raised', days_in_stage: 22, action_bucket: 'FR Raise', target_date: '2026-04-04', close_date: '2026-06-15', presales_stage: 'FR Submitted', ps_days_in_stage: 18, stage_status: 'In Progress', stage_blocker: null, next_ps_stage: 'PO / Approval Received', eta_fr_po: '2026-04-15', sow_id: null, tco: 'Yes', effort_est: 'Yes', fr_id: 'FR-2026-0425', po_id: null, weekly_sales_action: 'Chase AWS for FR approval — overdue', presales_action: 'Prepare migration runbook', action_owner: 'olivia@1cloudhub.com', deal_notes: 'VMware exit for Telkomsel Indonesia. FR delayed.', ace_id: 'ACE-SG-0245', map_status: 'Submitted' }),
  makeDeal({ deal_id: '1CH-ID-009', account_name: 'Bank Mandiri', opportunity_name: 'Data Lake on AWS', country: 'ID', seller: 'Olivia R.', seller_email: 'olivia@1cloudhub.com', presales_consultant: null, presales_sa: 'Dhivya B.', swim_lane: 'The New Hunt', lead_source: 'SDR', aws_segment: 'Scale', funding_type: 'Customer Funded', funding_flag: 'Customer Funded', gtm_motion: 'Agentic AI', deal_value_usd: 215000, total_fy: 290000, sales_stage: 'New Hunt', days_in_stage: 6, action_bucket: 'Opportunity Identification', target_date: '2026-04-14', close_date: '2026-10-31', presales_stage: 'First Call Done', ps_days_in_stage: 4, stage_status: 'Planned', stage_blocker: null, next_ps_stage: 'BANT Qualified', eta_fr_po: null, sow_id: null, tco: 'No', effort_est: 'No', fr_id: null, po_id: null, weekly_sales_action: 'Schedule BANT qualification', presales_action: null, action_owner: 'olivia@1cloudhub.com', deal_notes: 'Greenfield data lake. Currently on Oracle DW.', ace_id: null, map_status: null }),
  makeDeal({ deal_id: '1CH-SG-010', account_name: 'StarHub', opportunity_name: 'AMS Managed Services', country: 'SG', seller: 'Sripriya J.', seller_email: 'jonnadula.sripriya@1cloudhub.com', presales_consultant: 'Ajay S.', presales_sa: 'Narmadha S.', swim_lane: 'Protect the Bank', lead_source: 'Personal Connect', aws_segment: 'Focus', funding_type: 'Customer Funded', funding_flag: 'Customer Funded', gtm_motion: 'MSP', deal_value_usd: 311000, total_fy: 420000, sales_stage: 'Order Book', days_in_stage: 4, action_bucket: 'Internal Kick Off', target_date: '2026-04-07', close_date: '2026-05-15', presales_stage: 'Customer Kicked Off', ps_days_in_stage: 2, stage_status: 'In Progress', stage_blocker: null, next_ps_stage: 'In Delivery', eta_fr_po: null, sow_id: 'SOW-STH-2026-001', tco: 'Yes', effort_est: 'Yes', fr_id: null, po_id: null, weekly_sales_action: 'Kickoff meeting scheduled for Monday', presales_action: 'Handover docs to delivery', action_owner: 'narmadha@1cloudhub.com', deal_notes: 'AMS renewal + scope expansion. SOW signed.', ace_id: null, map_status: null }),
];

// ---------------------------------------------------------------------------
// Factory for creating a Deal from a minimal draft (inline new-deal row)
// ---------------------------------------------------------------------------

export interface NewDealDraftInput {
  account_name: string;
  opportunity_name: string;
  country?: Deal['country'];
  seller?: string;
  seller_email?: string;
  funding_flag?: Deal['funding_flag'];
  gtm_motion?: Deal['gtm_motion'];
  deal_value_usd?: number;
  close_date?: string;
  sales_stage?: Deal['sales_stage'];
}

let dealCounter = MOCK_DEALS.length + 1;

export function makeDealFromDraft(draft: NewDealDraftInput): Deal {
  const country = draft.country ?? 'SG';
  const id = `1CH-${country}-${String(dealCounter++).padStart(3, '0')}`;

  return makeDeal({
    deal_id: id,
    account_name: draft.account_name,
    opportunity_name: draft.opportunity_name,
    country,
    seller: draft.seller ?? '',
    seller_email: draft.seller_email ?? '',
    presales_consultant: null,
    presales_sa: null,
    swim_lane: 'The New Hunt',
    lead_source: null,
    aws_segment: null,
    funding_type: draft.funding_flag === 'AWS Funded' ? 'Customer Funded' : 'Customer Funded',
    funding_flag: draft.funding_flag ?? 'Customer Funded',
    gtm_motion: draft.gtm_motion ?? 'Agentic AI',
    deal_value_usd: draft.deal_value_usd ?? 0,
    total_fy: draft.deal_value_usd ?? 0,
    sales_stage: draft.sales_stage ?? 'New Hunt',
    days_in_stage: 0,
    action_bucket: 'Opportunity Identification',
    target_date: null,
    close_date: draft.close_date ?? new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
    presales_stage: null,
    ps_days_in_stage: null,
    stage_status: null,
    stage_blocker: null,
    next_ps_stage: null,
    eta_fr_po: null,
    sow_id: null,
    tco: 'No',
    effort_est: 'No',
    fr_id: null,
    po_id: null,
    weekly_sales_action: null,
    presales_action: null,
    action_owner: null,
    deal_notes: null,
    ace_id: null,
    map_status: null,
  });
}

export function recomputeStats(): PipelineStats {
  return {
    total_pipeline_sgd: MOCK_DEALS.reduce((sum, d) => sum + d.deal_value_sgd, 0),
    weighted_forecast_sgd: MOCK_DEALS.reduce((sum, d) => sum + d.weighted_value_sgd, 0),
    deal_count: MOCK_DEALS.length,
    stalled_count: MOCK_DEALS.filter((d) => d.is_stalled).length,
    fx_rate_usd_sgd: FX_RATE,
    fx_rate_age_hours: 2,
  };
}

export const MOCK_STATS: PipelineStats = {
  total_pipeline_sgd: MOCK_DEALS.reduce((sum, d) => sum + d.deal_value_sgd, 0),
  weighted_forecast_sgd: MOCK_DEALS.reduce((sum, d) => sum + d.weighted_value_sgd, 0),
  deal_count: MOCK_DEALS.length,
  stalled_count: MOCK_DEALS.filter((d) => d.is_stalled).length,
  fx_rate_usd_sgd: FX_RATE,
  fx_rate_age_hours: 2,
};
