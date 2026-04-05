import type {
  Lead,
  LeadActivity,
  LeadsStats,
  MQLGate,
  LeadStage,
} from '@/types/leads';

// ---------------------------------------------------------------------------
// MQL Gate computation
// ---------------------------------------------------------------------------

export function computeMQLGate(lead: Partial<Lead>): MQLGate {
  return {
    meeting_booked: lead.meeting_booked === true,
    dm_confirmed: lead.dm_icp_confirmed === 'Decision Maker',
    pain_point_confirmed: lead.pain_point_confirmed === true,
    budget_indicator_filled: lead.budget_indicator != null,
    timeline_filled: lead.timeline != null,
  };
}

export function isMQLReady(gate: MQLGate): boolean {
  return (
    gate.meeting_booked &&
    gate.dm_confirmed &&
    gate.pain_point_confirmed &&
    gate.budget_indicator_filled &&
    gate.timeline_filled
  );
}

export function computeLeadStatus(lead: Partial<Lead>): LeadStage {
  const gate = computeMQLGate(lead);
  const ready = isMQLReady(gate);
  if (ready && lead.mql_approved_by) return 'Graduated';
  if (ready) return 'MQL Ready';
  if (
    (lead.attempt_count ?? 0) > 1 &&
    (lead.pain_point_confirmed || lead.meeting_booked)
  ) {
    return 'Engaged';
  }
  return 'Contacted';
}

// ---------------------------------------------------------------------------
// Mock Leads — seeded from 1CH_SDR_Lead_Tracker.xlsx patterns
// ---------------------------------------------------------------------------

function makeLead(input: Omit<Lead, 'mql_gate' | 'mql_ready_auto' | 'lead_status' | 'notes'> & { lead_status?: LeadStage; notes?: string | null }): Lead {
  const gate = computeMQLGate(input);
  const mqlReady = isMQLReady(gate);
  const status = input.lead_status ?? computeLeadStatus({ ...input, mql_gate: gate, mql_ready_auto: mqlReady });
  return {
    ...input,
    mql_gate: gate,
    mql_ready_auto: mqlReady,
    lead_status: status,
    notes: input.notes ?? null,
  };
}

export const MOCK_LEADS: Lead[] = [
  makeLead({
    lead_id: 'L-SG-001',
    company_name: 'Panasonic Asia',
    contact_name: 'David Tan',
    title_role: 'VP IT',
    country: 'SG',
    email: 'david.tan@panasonic.com',
    phone: '+65 9123 4567',
    gtm_motion: 'SAP Migration',
    campaign_name: 'SAP S/4HANA Cloud Q1',
    lead_source_type: 'AWS AM Referral',
    date_added: '2026-01-15',
    assigned_sdr: 'Raziel',
    receiving_seller: 'Tracy T.',
    market: 'SG',
    attempt_count: 6,
    last_activity_date: '2026-03-10',
    first_contact_date: '2026-01-18',
    days_to_first_contact: 3,
    meeting_booked: true,
    meeting_date: '2026-02-05',
    dm_icp_confirmed: 'Decision Maker',
    pain_point_confirmed: true,
    budget_indicator: 'Confirmed',
    timeline: 'Within 3 months',
    mql_approved_by: 'Sarah Chen',
    mql_date: '2026-02-20',
    lead_status: 'Graduated',
    days_to_mql: 36,
    handoff_date: '2026-02-22',
    deal_id: 'D-SG-001',
    icp_score: 4,
    icp_score_overridden: false,
  }),
  makeLead({
    lead_id: 'L-SG-002',
    company_name: 'DBS Bank',
    contact_name: 'James Lim',
    title_role: 'Head of IT',
    country: 'SG',
    email: 'james.lim@dbs.com',
    phone: '+65 9234 5678',
    gtm_motion: 'Agentic AI',
    campaign_name: 'AI Automation Series',
    lead_source_type: 'Event Follow-up',
    date_added: '2026-02-01',
    assigned_sdr: 'Raziel',
    receiving_seller: null,
    market: 'SG',
    attempt_count: 5,
    last_activity_date: '2026-03-25',
    first_contact_date: '2026-02-03',
    days_to_first_contact: 2,
    meeting_booked: true,
    meeting_date: '2026-03-01',
    dm_icp_confirmed: 'Decision Maker',
    pain_point_confirmed: true,
    budget_indicator: 'Exploring',
    timeline: '3–6 months',
    mql_approved_by: null,
    mql_date: null,
    days_to_mql: null,
    handoff_date: null,
    deal_id: null,
    icp_score: 4,
    icp_score_overridden: false,
  }),
  makeLead({
    lead_id: 'L-ID-001',
    company_name: 'Telkom Indonesia',
    contact_name: 'Budi Santoso',
    title_role: 'CTO',
    country: 'ID',
    email: 'budi.santoso@telkom.co.id',
    phone: '+62 812 3456 7890',
    gtm_motion: 'MAP Lite',
    campaign_name: 'Cloud Migration ASEAN',
    lead_source_type: 'AWS AM Referral',
    date_added: '2026-02-10',
    assigned_sdr: 'Telestar-VN-03',
    receiving_seller: null,
    market: 'ID',
    attempt_count: 4,
    last_activity_date: '2026-03-20',
    first_contact_date: '2026-02-14',
    days_to_first_contact: 4,
    meeting_booked: true,
    meeting_date: '2026-03-05',
    dm_icp_confirmed: 'Influencer',
    pain_point_confirmed: true,
    budget_indicator: 'Aware',
    timeline: '3–6 months',
    mql_approved_by: null,
    mql_date: null,
    days_to_mql: null,
    handoff_date: null,
    deal_id: null,
    icp_score: 3,
    icp_score_overridden: false,
  }),
  makeLead({
    lead_id: 'L-MY-001',
    company_name: 'Celcom Axiata',
    contact_name: 'Ahmad Faris',
    title_role: 'Head of Cloud',
    country: 'MY',
    email: 'ahmad.faris@celcom.com.my',
    phone: '+60 12 345 6789',
    gtm_motion: 'SCA GenAI',
    campaign_name: 'GenAI POC Series',
    lead_source_type: 'LinkedIn',
    date_added: '2026-02-15',
    assigned_sdr: 'Telestar-VN-01',
    receiving_seller: null,
    market: 'MY',
    attempt_count: 3,
    last_activity_date: '2026-03-18',
    first_contact_date: '2026-02-20',
    days_to_first_contact: 5,
    meeting_booked: false,
    meeting_date: null,
    dm_icp_confirmed: null,
    pain_point_confirmed: true,
    budget_indicator: null,
    timeline: null,
    mql_approved_by: null,
    mql_date: null,
    days_to_mql: null,
    handoff_date: null,
    deal_id: null,
    icp_score: 3,
    icp_score_overridden: false,
  }),
  makeLead({
    lead_id: 'L-MY-002',
    company_name: 'Axiata Digital',
    contact_name: 'Phua Kia',
    title_role: 'Head Digital',
    country: 'MY',
    email: 'phua.kia@axiata.com',
    phone: '+60 16 789 0123',
    gtm_motion: 'Agentic AI',
    campaign_name: 'AI Automation Series',
    lead_source_type: 'Cold Outbound',
    date_added: '2026-02-20',
    assigned_sdr: 'Telestar-VN-01',
    receiving_seller: null,
    market: 'MY',
    attempt_count: 2,
    last_activity_date: '2026-03-15',
    first_contact_date: '2026-02-25',
    days_to_first_contact: 5,
    meeting_booked: false,
    meeting_date: null,
    dm_icp_confirmed: null,
    pain_point_confirmed: true,
    budget_indicator: null,
    timeline: null,
    mql_approved_by: null,
    mql_date: null,
    days_to_mql: null,
    handoff_date: null,
    deal_id: null,
    icp_score: 2,
    icp_score_overridden: false,
  }),
  makeLead({
    lead_id: 'L-PH-001',
    company_name: 'Globe Telecom',
    contact_name: 'Maria Santos',
    title_role: 'IT Director',
    country: 'PH',
    email: 'maria.santos@globe.com.ph',
    phone: '+63 917 123 4567',
    gtm_motion: 'VMware Exit',
    campaign_name: 'VMware to AWS Q1',
    lead_source_type: 'Referral',
    date_added: '2026-03-01',
    assigned_sdr: 'Telestar-VN-02',
    receiving_seller: null,
    market: 'PH',
    attempt_count: 1,
    last_activity_date: '2026-03-05',
    first_contact_date: '2026-03-05',
    days_to_first_contact: 4,
    meeting_booked: false,
    meeting_date: null,
    dm_icp_confirmed: null,
    pain_point_confirmed: false,
    budget_indicator: null,
    timeline: null,
    mql_approved_by: null,
    mql_date: null,
    days_to_mql: null,
    handoff_date: null,
    deal_id: null,
    icp_score: 2,
    icp_score_overridden: false,
  }),
  makeLead({
    lead_id: 'L-IN-001',
    company_name: 'Infosys BPM',
    contact_name: 'Rahul Sharma',
    title_role: 'VP Cloud',
    country: 'IN',
    email: 'rahul.sharma@infosys.com',
    phone: '+91 98765 43210',
    gtm_motion: 'SCA GenAI',
    campaign_name: 'GenAI POC Series',
    lead_source_type: 'Inbound Website',
    date_added: '2026-03-05',
    assigned_sdr: 'Telestar-VN-03',
    receiving_seller: null,
    market: 'IN',
    attempt_count: 1,
    last_activity_date: '2026-03-10',
    first_contact_date: '2026-03-10',
    days_to_first_contact: 5,
    meeting_booked: false,
    meeting_date: null,
    dm_icp_confirmed: null,
    pain_point_confirmed: false,
    budget_indicator: null,
    timeline: null,
    mql_approved_by: null,
    mql_date: null,
    days_to_mql: null,
    handoff_date: null,
    deal_id: null,
    icp_score: 1,
    icp_score_overridden: false,
  }),
  makeLead({
    lead_id: 'L-SG-003',
    company_name: 'OCBC Bank',
    contact_name: 'Wei Ling',
    title_role: 'CISO',
    country: 'SG',
    email: 'wei.ling@ocbc.com',
    phone: '+65 9345 6789',
    gtm_motion: 'SAP Migration',
    campaign_name: 'SAP S/4HANA Cloud Q1',
    lead_source_type: 'Event Follow-up',
    date_added: '2026-02-08',
    assigned_sdr: 'Raziel',
    receiving_seller: null,
    market: 'SG',
    attempt_count: 4,
    last_activity_date: '2026-03-22',
    first_contact_date: '2026-02-12',
    days_to_first_contact: 4,
    meeting_booked: false,
    meeting_date: null,
    dm_icp_confirmed: 'Influencer',
    pain_point_confirmed: true,
    budget_indicator: null,
    timeline: null,
    mql_approved_by: null,
    mql_date: null,
    days_to_mql: null,
    handoff_date: null,
    deal_id: null,
    icp_score: 4,
    icp_score_overridden: false,
  }),
];

// ---------------------------------------------------------------------------
// Mock Lead Activities — 3 per lead
// ---------------------------------------------------------------------------

function makeActivities(lead: Lead, sdrName: string): LeadActivity[] {
  const base = {
    lead_id: lead.lead_id,
    company_name: lead.company_name,
    contact_name: lead.contact_name,
    sdr_name: sdrName,
  };
  const activities: LeadActivity[] = [];
  const channels: LeadActivity['channel'][] = ['Call', 'WhatsApp', 'Email'];
  const outcomes = [
    'Left voicemail, no response',
    'Connected — showed interest in AWS migration',
    'Sent follow-up deck via email',
  ];
  const nextActions = [
    'Follow up via WhatsApp',
    'Schedule discovery call',
    'Send case study',
  ];

  for (let i = 0; i < 3; i++) {
    const dayOffset = i * 7;
    const dateAdded = new Date(lead.date_added);
    dateAdded.setDate(dateAdded.getDate() + dayOffset + 3);
    activities.push({
      ...base,
      activity_id: `AL-${lead.lead_id}-${i + 1}`,
      date: dateAdded.toISOString().slice(0, 10),
      attempt_number: i + 1,
      channel: channels[i % channels.length],
      outcome: outcomes[i % outcomes.length],
      notes: i === 1 ? 'Good conversation — DM interested in POC' : null,
      next_action: nextActions[i % nextActions.length],
      next_action_date: (() => {
        const d = new Date(dateAdded);
        d.setDate(d.getDate() + 3);
        return d.toISOString().slice(0, 10);
      })(),
    });
  }
  return activities;
}

export const MOCK_LEAD_ACTIVITIES: LeadActivity[] = MOCK_LEADS.flatMap((lead) =>
  makeActivities(lead, lead.assigned_sdr),
);

// ---------------------------------------------------------------------------
// Stats computation
// ---------------------------------------------------------------------------

export function computeLeadsStats(leads: Lead[]): LeadsStats {
  const total = leads.length;
  const contacted = leads.filter((l) => l.lead_status === 'Contacted').length;
  const engaged = leads.filter((l) => l.lead_status === 'Engaged').length;
  const mql_ready = leads.filter((l) => l.lead_status === 'MQL Ready').length;
  const graduated = leads.filter((l) => l.lead_status === 'Graduated').length;
  const graduation_queue_count = leads.filter(
    (l) => l.mql_ready_auto && !l.mql_approved_by,
  ).length;

  return {
    total,
    contacted,
    engaged,
    mql_ready,
    graduated,
    disqualified: 0,
    conversion_rate: total > 0 ? graduated / total : 0,
    graduation_queue_count,
  };
}
