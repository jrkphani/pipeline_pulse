import type {
  DealDetail,
  PresalesBand,
  DualTrack,
  TimelineEvent,
  QTreeGroup,
  SolutionFit,
  DealDetailOverview,
  DealDetailAIFields,
  PlaceholderTab,
} from '@/types/deal-detail';
import type { Deal } from '@/types/index';

// ---------------------------------------------------------------------------
// Placeholder tab metadata (shared across all deals)
// ---------------------------------------------------------------------------

const PLACEHOLDER_TABS: Record<string, PlaceholderTab> = {
  tco: { icon: '\u2699', title: 'TCO Session', subtitle: 'Wizard \u2014 Infra \u2192 Licences \u2192 Services \u2192 Output' },
  documents: { icon: '\u2593', title: 'Documents', subtitle: '2 uploaded \u00b7 AI extraction complete' },
  revenue: { icon: '\u25B2', title: 'Revenue \u00b7 O2R', subtitle: 'KPI cards + monthly milestone schedule' },
  linked: { icon: '\u2615', title: 'Linked records', subtitle: 'Dual-funded \u00b7 1 linked deal' },
  proposal: { icon: '\uD83D\uDD12', title: 'Proposal & SOW', subtitle: 'Generate from Solution Fit tab to unlock' },
};

// ---------------------------------------------------------------------------
// Rich deal detail for OCBC Bank (1CH-SG-006) — matches wireframe exactly
// ---------------------------------------------------------------------------

const OCBC_PRESALES_BANDS: PresalesBand[] = [
  {
    id: 'b1',
    name: 'Band 1 \u00b7 New Hunt',
    band_number: 1,
    status: 'done',
    total_days: 14,
    deliverable_summary: 'BANT confirmed',
    steps: [
      { name: 'Customer First Call', owner: 'Vartika S.', owner_role: 'AE', sla_days: 7, completed_at: '2026-02-16', status: 'done', deliverable: null, blocker: null, unlock_hint: null },
      { name: 'BANT Qualification', owner: 'Vartika S.', owner_role: 'AE', sla_days: 14, completed_at: '2026-03-01', status: 'done', deliverable: 'BANT confirmed', blocker: null, unlock_hint: null },
    ],
  },
  {
    id: 'b2',
    name: 'Band 2 \u00b7 Discovery',
    band_number: 2,
    status: 'done',
    total_days: 30,
    deliverable_summary: 'Architecture doc',
    steps: [
      { name: 'Discovery Workshop', owner: 'Ajay S.', owner_role: 'PC', sla_days: null, completed_at: '2026-03-05', status: 'done', deliverable: null, blocker: null, unlock_hint: null },
      { name: 'Indicative TCO Preparation', owner: 'Srihari D.', owner_role: 'SA', sla_days: null, completed_at: '2026-03-12', status: 'done', deliverable: null, blocker: null, unlock_hint: null },
      { name: 'Ballpark Effort Estimation', owner: 'Srihari D.', owner_role: 'SA', sla_days: null, completed_at: '2026-03-18', status: 'done', deliverable: null, blocker: null, unlock_hint: null },
      { name: 'Deal Structuring', owner: 'Vartika S.', owner_role: 'AE', sla_days: null, completed_at: '2026-03-25', status: 'done', deliverable: null, blocker: null, unlock_hint: null },
      { name: 'Solution Design', owner: 'Srihari D.', owner_role: 'SA', sla_days: null, completed_at: '2026-03-31', status: 'done', deliverable: 'Architecture doc', blocker: null, unlock_hint: null },
    ],
  },
  {
    id: 'b3',
    name: 'Band 3 \u00b7 Proposal',
    band_number: 3,
    status: 'active',
    total_days: null,
    deliverable_summary: null,
    steps: [
      { name: 'Solution Proposal Preparation', owner: 'Ajay S.', owner_role: 'PC', sla_days: 14, completed_at: '2026-04-01', status: 'done', deliverable: 'Proposal document', blocker: null, unlock_hint: null },
      { name: 'Solution Presentation to Customer', owner: 'Vartika S. + Ajay S.', owner_role: 'AE', sla_days: 14, completed_at: '2026-04-22', status: 'done', deliverable: null, blocker: null, unlock_hint: null },
      { name: 'Customer Solution Sign Off', owner: 'Vartika S.', owner_role: 'AE', sla_days: 7, completed_at: null, status: 'current', deliverable: null, blocker: '34 days stalled \u2014 CFO awaiting migration cost breakdown', unlock_hint: 'Completing this unlocks: Negotiation stage + Band 4' },
    ],
  },
  {
    id: 'b4',
    name: 'Band 4 \u00b7 Negotiation',
    band_number: 4,
    status: 'pending',
    total_days: null,
    deliverable_summary: null,
    steps: [
      { name: 'FR Submission', owner: '', owner_role: 'AE', sla_days: 7, completed_at: null, status: 'pending', deliverable: 'FR ID', blocker: null, unlock_hint: null },
      { name: 'SOW Preparation', owner: '', owner_role: 'PC', sla_days: 14, completed_at: null, status: 'pending', deliverable: 'SOW', blocker: null, unlock_hint: null },
      { name: 'Commercial Negotiation', owner: '', owner_role: 'AE', sla_days: 14, completed_at: null, status: 'pending', deliverable: null, blocker: null, unlock_hint: null },
      { name: 'Contract Review', owner: '', owner_role: 'AE', sla_days: 7, completed_at: null, status: 'pending', deliverable: null, blocker: null, unlock_hint: null },
    ],
  },
  {
    id: 'b5',
    name: 'Band 5 \u00b7 Order Book',
    band_number: 5,
    status: 'pending',
    total_days: null,
    deliverable_summary: null,
    steps: [
      { name: 'PO / Approval Received', owner: '', owner_role: 'AE', sla_days: 7, completed_at: null, status: 'pending', deliverable: 'PO', blocker: null, unlock_hint: null },
      { name: 'Internal Kickoff', owner: '', owner_role: 'PM', sla_days: 7, completed_at: null, status: 'pending', deliverable: null, blocker: null, unlock_hint: null },
      { name: 'Customer Kickoff', owner: '', owner_role: 'PM', sla_days: 7, completed_at: null, status: 'pending', deliverable: null, blocker: null, unlock_hint: null },
      { name: 'In Delivery', owner: '', owner_role: 'PM', sla_days: null, completed_at: null, status: 'pending', deliverable: null, blocker: null, unlock_hint: null },
      { name: 'Engagement Completed', owner: '', owner_role: 'PM', sla_days: null, completed_at: null, status: 'pending', deliverable: null, blocker: null, unlock_hint: null },
    ],
  },
];

const OCBC_DUAL_TRACK: DualTrack = {
  commercial_nodes: [
    { label: 'NH', status: 'done' },
    { label: 'Discovery', status: 'done' },
    { label: 'Proposal', status: 'current' },
    { label: 'Negotiation', status: 'pending' },
    { label: 'Order Book', status: 'locked' },
  ],
  presales_bands: [
    { band_number: 1, total: 2, completed: 2, status: 'done' },
    { band_number: 2, total: 5, completed: 5, status: 'done' },
    { band_number: 3, total: 3, completed: 2, status: 'active' },
    { band_number: 4, total: 4, completed: 0, status: 'pending' },
    { band_number: 5, total: 5, completed: 0, status: 'pending' },
  ],
  current_step_label: 'Customer Sign Off (Band 3 \u00b7 2/3)',
  next_gate: 'FR Submission \u2192 unlocks Negotiation',
  stall_days: 34,
};

const OCBC_TIMELINE: TimelineEvent[] = [
  {
    id: 'tl-1',
    type: 'stall_alert',
    title: 'Stall alert \u2014 34 days at Stage 3',
    date: '2026-04-05',
    participants: null,
    context: 'Auto-flagged \u00b7 SLA 30 days',
    note: 'OCBC rank #1 stalled deal. CRO notified. Customer sign off delayed pending CFO cost breakdown review.',
    is_alert: true,
  },
  {
    id: 'tl-2',
    type: 'meeting',
    title: 'Meeting \u2014 Proposal walkthrough',
    date: '2026-04-22',
    participants: 'Vartika S., Ajay S.',
    context: 'CTO + CFO OCBC',
    note: 'Proposal presented. Positive reception on 3-year savings. CFO requested detailed migration cost breakdown \u2014 follow-up due 30 Apr. CTO raised BW migration scope (unresolved).',
    is_alert: false,
  },
  {
    id: 'tl-3',
    type: 'stage_change',
    title: 'Moved to Stage 3 \u00b7 Proposal',
    date: '2026-04-01',
    participants: 'Vartika S.',
    context: null,
    note: 'Discovery completed. Fit-gap analysis initiated. Brownfield approach confirmed by customer.',
    is_alert: false,
  },
  {
    id: 'tl-4',
    type: 'meeting',
    title: 'Meeting \u2014 Discovery workshop',
    date: '2026-03-15',
    participants: 'Ajay S., Srihari D.',
    context: null,
    note: 'Full-day workshop with OCBC IT. ECC architecture mapped. Integration list confirmed: SuccessFactors, Ariba, Bloomberg, MAS gateway.',
    is_alert: false,
  },
  {
    id: 'tl-5',
    type: 'stage_change',
    title: 'Moved to Stage 2 \u00b7 Discovery',
    date: '2026-02-15',
    participants: 'Vartika S.',
    context: null,
    note: null,
    is_alert: false,
  },
];

const OCBC_QTREE: QTreeGroup[] = [
  {
    id: 'sap',
    name: 'SAP Migration discovery',
    domain_confidence: 91,
    answered_count: 6,
    total_count: 8,
    status: 'active',
    questions: [
      { number: 1, question: 'What SAP ERP version is currently running in production?', status: 'answered', answer: 'SAP ECC 6.0 with EHP7. Single production instance covering FICO, MM, SD, and HR. BW landscape separate on older hardware.', answered_by: 'Vartika S.', answered_at: '2026-04-18T14:32:00+08:00', ai_hint: null, unlock_hint: null },
      { number: 2, question: 'How many named SAP users and what are the primary business units?', status: 'answered', answer: '~1,200 named users, ~400 daily active. Finance & Accounting, Retail Banking Ops, Supply Chain, HR.', answered_by: 'Vartika S.', answered_at: '2026-04-18T14:38:00+08:00', ai_hint: null, unlock_hint: null },
      { number: 3, question: 'What are the top 3 pain points driving this migration?', status: 'answered', answer: '1) ECC end-of-maintenance 2027. 2) Month-end close takes 8 days, target 3. 3) Real-time treasury reporting gaps \u2014 manual Excel workarounds daily.', answered_by: 'Vartika S.', answered_at: '2026-04-18T15:10:00+08:00', ai_hint: null, unlock_hint: null },
      { number: 4, question: 'Are there regulatory pressures accelerating the timeline?', status: 'answered', answer: 'MAS TRM guidelines require core system resilience by Q3 2027. PDPA amendments need data residency controls \u2014 AWS Singapore satisfies this.', answered_by: 'Ajay S.', answered_at: '2026-04-22T10:15:00+08:00', ai_hint: null, unlock_hint: null },
      { number: 5, question: 'Which third-party systems must integrate with the new landscape?', status: 'answered', answer: 'SuccessFactors, Ariba, Bloomberg terminal, MAS regulatory API, FAST/GIRO payment rails. BW migration TBD.', answered_by: 'Ajay S.', answered_at: '2026-04-22T10:42:00+08:00', ai_hint: null, unlock_hint: null },
      { number: 6, question: 'Current hosting model and data centre footprint?', status: 'answered', answer: 'On-premises Changi Business Park DC1, DR at Jurong East DC2. Both leases expire Q4 2026 \u2014 natural migration window.', answered_by: 'Vartika S.', answered_at: '2026-04-23T09:05:00+08:00', ai_hint: null, unlock_hint: null },
      { number: 7, question: 'What is the appetite for greenfield vs brownfield \u2014 has the IT org run a fit-gap analysis?', status: 'active', answer: null, answered_by: null, answered_at: null, ai_hint: 'AI selected based on complex integration landscape and tight timeline', unlock_hint: null },
      { number: 8, question: 'Has the business case been formally approved at board level?', status: 'locked', answer: null, answered_by: null, answered_at: null, ai_hint: null, unlock_hint: 'Answer Q7 to unlock' },
    ],
  },
  {
    id: 'vm',
    name: 'VMware Exit discovery',
    domain_confidence: null,
    answered_count: 0,
    total_count: 0,
    status: 'not_started',
    questions: [],
  },
  {
    id: 'ge',
    name: 'GenAI discovery',
    domain_confidence: null,
    answered_count: 0,
    total_count: 0,
    status: 'not_started',
    questions: [],
  },
];

const OCBC_SOLUTION_FIT: SolutionFit = {
  fit_label: 'Partial Fit',
  primary_area: 'SAP Migration',
  score: 62,
  signals_confirmed: 6,
  signals_total: 9,
  qtree_completion_pct: 75,
  capabilities: [
    { name: 'SAP Migration', confirmed: true },
    { name: 'AWS Infrastructure', confirmed: true },
    { name: 'Data & Analytics', confirmed: false },
    { name: 'SuccessFactors', confirmed: false },
  ],
  signals: [
    { text: 'ECC end-of-life pressure confirmed (2027)', confirmed: true, source: 'Q tree \u00b7 Q1' },
    { text: 'MAS TRM compliance requirement logged', confirmed: true, source: 'Q tree \u00b7 Q4' },
    { text: 'DC lease expiry creates migration window', confirmed: true, source: 'Q tree \u00b7 Q6' },
    { text: 'Month-end close pain point (8d \u2192 3d target)', confirmed: true, source: 'Q tree \u00b7 Q3' },
    { text: 'AWS Singapore data residency satisfies PDPA', confirmed: true, source: 'Apollo.io' },
    { text: 'MAP funding eligibility confirmed (ARR > SGD 500K)', confirmed: true, source: 'TCO Creator' },
    { text: 'Fit-gap analysis completion \u2014 Q7 pending', confirmed: false, source: 'Q tree \u00b7 Q7' },
    { text: 'Board-level budget approval confirmed', confirmed: false, source: 'Q tree \u00b7 Q8' },
    { text: 'BW migration scope defined', confirmed: false, source: 'Q tree \u00b7 in progress' },
  ],
  can_generate_proposal: false,
  blocked_reason: 'Complete Q tree (75% \u2192 100%) and TCO session to unlock \u00b7 Deal > SGD 500K requires CRO approval',
};

const OCBC_OVERVIEW: DealDetailOverview = {
  account_name: 'OCBC Bank Ltd',
  opportunity_name: 'SAP RISE Migration',
  deal_value_sgd: 2400000,
  seller: 'Vartika S.',
  gtm_motion: 'SAP Migration',
  close_date: '2026-07-15',
  funding_type: 'Dual (AWS + Customer)',
  program: 'MAP \u2014 AWS Partner',
  ace_id: null,
  ace_status: 'ACE incomplete',
  days_in_stage: 34,
  is_stalled: true,
  lead_source: 'SAP GTM',
  country: 'SG',
};

const OCBC_AI_FIELDS: DealDetailAIFields = {
  model_label: 'Bedrock Sonnet',
  last_run: '23 Apr',
  fields: [
    { source: 'TCO Creator', label: 'TCO ARR (SGD)', value: '960,000 / yr' },
    { source: 'TCO Creator', label: '3-year savings', value: 'SGD 1,240,000' },
    { source: 'TCO Creator', label: 'Current infra cost', value: 'SGD 420K / yr' },
    { source: 'TCO Creator', label: 'Recommended program', value: 'MAP (SGD 240K cash)' },
    { source: 'Solution Fit', label: 'Fit status', value: 'Partial Fit' },
    { source: 'Solution Fit', label: 'Primary area', value: 'SAP Migration' },
    { source: 'Solution Fit', label: 'Signals confirmed', value: '6 of 9' },
    { source: 'Solution Fit', label: 'Confidence', value: 'Medium \u2014 Q tree 75%' },
  ],
};

const OCBC_DEAL_DETAIL: DealDetail = {
  id: crypto.randomUUID(),
  deal_id: '1CH-SG-006',
  account_name: 'OCBC Bank',
  opportunity_name: 'SAP RISE Migration',
  display_name: 'OCBC Bank \u00b7 SAP RISE Migration',
  sales_stage: 'Proposal Submitted',
  stage_label: '3 \u00b7 Proposal',
  funding_flag: 'AWS Funded',
  funding_type: 'MAP 2.0 \u2014 Migrate & Modernize',
  program_badge: 'MAP',
  days_in_stage: 34,
  is_stalled: true,
  action_label: 'Submit proposal',
  dual_track: OCBC_DUAL_TRACK,
  presales_bands: OCBC_PRESALES_BANDS,
  raci: [
    { role: 'AE', name: 'Vartika S.' },
    { role: 'PC', name: 'Ajay S.' },
    { role: 'SA', name: 'Srihari D.' },
  ],
  raci_actions: ['Submit proposal', 'Book technical deep-dive'],
  overview: OCBC_OVERVIEW,
  ai_fields: OCBC_AI_FIELDS,
  timeline: OCBC_TIMELINE,
  qtree_groups: OCBC_QTREE,
  solution_fit: OCBC_SOLUTION_FIT,
  placeholder_tabs: PLACEHOLDER_TABS,
};

// ---------------------------------------------------------------------------
// Factory — generate a basic DealDetail from a grid-level Deal
// ---------------------------------------------------------------------------

function stageToLabel(stage: Deal['sales_stage']): string {
  const map: Record<string, string> = {
    'New Hunt': '1 \u00b7 New Hunt',
    'Qualified': '2 \u00b7 Discovery',
    'Proposal Submitted': '3 \u00b7 Proposal',
    'FR Raised': '4 \u00b7 Negotiation',
    'Order Book': '5 \u00b7 Order Book',
    'Closed Won': 'Won',
    'Lost': 'Lost',
  };
  return map[stage] ?? stage;
}

function stageToAction(stage: Deal['sales_stage']): string {
  const map: Record<string, string> = {
    'New Hunt': 'Schedule discovery',
    'Qualified': 'Schedule discovery',
    'Proposal Submitted': 'Submit proposal',
    'FR Raised': 'Advance to Order Book',
    'Order Book': 'Raise invoice',
    'Closed Won': 'View summary',
    'Lost': 'Review post-mortem',
  };
  return map[stage] ?? 'Next action';
}

function buildMinimalDualTrack(deal: Deal): DualTrack {
  const stages = ['NH', 'Discovery', 'Proposal', 'Negotiation', 'Order Book'];
  const stageIndex: Record<string, number> = {
    'New Hunt': 0, 'Qualified': 1, 'Proposal Submitted': 2,
    'FR Raised': 3, 'Order Book': 4, 'Closed Won': 4, 'Lost': -1,
  };
  const idx = stageIndex[deal.sales_stage] ?? 0;

  return {
    commercial_nodes: stages.map((label, i) => ({
      label,
      status: i < idx ? 'done' as const : i === idx ? 'current' as const : 'pending' as const,
    })),
    presales_bands: [
      { band_number: 1, total: 2, completed: idx >= 1 ? 2 : 0, status: idx >= 1 ? 'done' as const : idx === 0 ? 'active' as const : 'pending' as const },
      { band_number: 2, total: 5, completed: idx >= 2 ? 5 : 0, status: idx >= 2 ? 'done' as const : idx === 1 ? 'active' as const : 'pending' as const },
      { band_number: 3, total: 3, completed: idx >= 3 ? 3 : 0, status: idx >= 3 ? 'done' as const : idx === 2 ? 'active' as const : 'pending' as const },
      { band_number: 4, total: 4, completed: idx >= 4 ? 4 : 0, status: idx >= 4 ? 'done' as const : idx === 3 ? 'active' as const : 'pending' as const },
      { band_number: 5, total: 5, completed: 0, status: idx === 4 ? 'active' as const : 'pending' as const },
    ],
    current_step_label: `Stage ${idx + 1}`,
    next_gate: idx < 4 ? `${stages[idx + 1]} gate` : 'Complete',
    stall_days: deal.is_stalled ? deal.days_in_stage : null,
  };
}

function buildMinimalPresalesBands(deal: Deal): PresalesBand[] {
  const stageIndex: Record<string, number> = {
    'New Hunt': 0, 'Qualified': 1, 'Proposal Submitted': 2,
    'FR Raised': 3, 'Order Book': 4, 'Closed Won': 4, 'Lost': -1,
  };
  const idx = stageIndex[deal.sales_stage] ?? 0;

  const bandDefs: { name: string; steps: string[] }[] = [
    { name: 'Band 1 \u00b7 New Hunt', steps: ['Customer First Call', 'BANT Qualification'] },
    { name: 'Band 2 \u00b7 Discovery', steps: ['Discovery Workshop', 'Indicative TCO Preparation', 'Ballpark Effort Estimation', 'Deal Structuring', 'Solution Design'] },
    { name: 'Band 3 \u00b7 Proposal', steps: ['Solution Proposal Preparation', 'Solution Presentation to Customer', 'Customer Solution Sign Off'] },
    { name: 'Band 4 \u00b7 Negotiation', steps: ['FR Submission', 'SOW Preparation', 'Commercial Negotiation', 'Contract Review'] },
    { name: 'Band 5 \u00b7 Order Book', steps: ['PO / Approval Received', 'Internal Kickoff', 'Customer Kickoff', 'In Delivery', 'Engagement Completed'] },
  ];

  const roleRotation: Array<'AE' | 'PC' | 'SA' | 'PM'> = ['AE', 'PC', 'SA', 'PM'];

  return bandDefs.map((def, bandIdx) => {
    const bandNum = bandIdx + 1;
    const isDone = bandIdx < idx;
    const isActive = bandIdx === idx;
    const status: PresalesBand['status'] = isDone ? 'done' : isActive ? 'active' : 'pending';

    const steps = def.steps.map((stepName, stepIdx) => {
      const role = roleRotation[stepIdx % roleRotation.length];
      const owner = role === 'AE' ? deal.seller
        : role === 'PC' ? (deal.presales_consultant ?? '')
        : role === 'SA' ? (deal.presales_sa ?? '')
        : deal.seller;

      let stepStatus: 'done' | 'in_progress' | 'current' | 'pending';
      if (isDone) {
        stepStatus = 'done';
      } else if (isActive) {
        // For the active band, mark some steps done based on days_in_stage
        const completedInBand = Math.min(stepIdx < def.steps.length - 1 ? Math.floor(deal.days_in_stage / 7) : 0, def.steps.length - 1);
        if (stepIdx < completedInBand) stepStatus = 'done';
        else if (stepIdx === completedInBand) stepStatus = 'current';
        else stepStatus = 'pending';
      } else {
        stepStatus = 'pending';
      }

      return {
        name: stepName,
        owner,
        owner_role: role,
        sla_days: [7, 14, 14, 7, 21][stepIdx % 5],
        completed_at: stepStatus === 'done' ? '2026-03-15' : null,
        status: stepStatus,
        deliverable: stepIdx === def.steps.length - 1 && isDone ? def.name.split(' \u00b7 ')[1] : null,
        blocker: stepStatus === 'current' && deal.is_stalled ? `${deal.days_in_stage}d stalled` : null,
        unlock_hint: stepStatus === 'current' && bandIdx < 4 ? `Completing this unlocks: ${bandDefs[bandIdx + 1]?.name ?? 'next stage'}` : null,
      };
    });

    return {
      id: `b${bandNum}`,
      name: def.name,
      band_number: bandNum,
      status,
      steps,
      total_days: isDone ? 14 + bandIdx * 7 : null,
      deliverable_summary: isDone ? def.name.split(' \u00b7 ')[1] : null,
    };
  });
}

export function buildDealDetailFromDeal(deal: Deal): DealDetail {
  return {
    id: deal.id,
    deal_id: deal.deal_id,
    account_name: deal.account_name,
    opportunity_name: deal.opportunity_name,
    display_name: `${deal.account_name} \u00b7 ${deal.opportunity_name}`,
    sales_stage: deal.sales_stage,
    stage_label: stageToLabel(deal.sales_stage),
    funding_flag: deal.funding_flag,
    funding_type: deal.funding_type,
    program_badge: deal.funding_flag === 'AWS Funded' ? 'MAP' : null,
    days_in_stage: deal.days_in_stage,
    is_stalled: deal.is_stalled,
    action_label: stageToAction(deal.sales_stage),
    dual_track: buildMinimalDualTrack(deal),
    presales_bands: buildMinimalPresalesBands(deal),
    raci: [
      { role: 'AE', name: deal.seller },
      ...(deal.presales_consultant ? [{ role: 'PC' as const, name: deal.presales_consultant }] : []),
      ...(deal.presales_sa ? [{ role: 'SA' as const, name: deal.presales_sa }] : []),
    ],
    raci_actions: [stageToAction(deal.sales_stage)],
    overview: {
      account_name: deal.account_name,
      opportunity_name: deal.opportunity_name,
      deal_value_sgd: deal.deal_value_sgd,
      seller: deal.seller,
      gtm_motion: deal.gtm_motion,
      close_date: deal.close_date,
      funding_type: deal.funding_type ?? deal.funding_flag,
      program: deal.funding_flag === 'AWS Funded' ? 'MAP \u2014 AWS Partner' : null,
      ace_id: deal.ace_id,
      ace_status: deal.ace_id ? null : 'ACE incomplete',
      days_in_stage: deal.days_in_stage,
      is_stalled: deal.is_stalled,
      lead_source: deal.lead_source,
      country: deal.country,
    },
    ai_fields: {
      model_label: 'Bedrock Sonnet',
      last_run: 'Not run',
      fields: [],
    },
    timeline: [
      {
        id: 'tl-auto-1',
        type: 'stage_change',
        title: `Current stage: ${stageToLabel(deal.sales_stage)}`,
        date: new Date().toISOString().slice(0, 10),
        participants: deal.seller,
        context: null,
        note: deal.deal_notes,
        is_alert: false,
      },
    ],
    qtree_groups: [],
    solution_fit: {
      fit_label: 'Not assessed',
      primary_area: deal.gtm_motion,
      score: 0,
      signals_confirmed: 0,
      signals_total: 0,
      qtree_completion_pct: 0,
      capabilities: [],
      signals: [],
      can_generate_proposal: false,
      blocked_reason: 'Complete Q tree and TCO session to unlock',
    },
    placeholder_tabs: PLACEHOLDER_TABS,
  };
}

// ---------------------------------------------------------------------------
// Lookup — returns rich detail for OCBC, generated detail for others
// ---------------------------------------------------------------------------

export const RICH_DETAILS: Record<string, DealDetail> = {
  '1CH-SG-006': OCBC_DEAL_DETAIL,
};

export function getDealDetail(dealId: string, deals: Deal[]): DealDetail | null {
  // Check for hand-crafted rich detail first
  if (RICH_DETAILS[dealId]) {
    return RICH_DETAILS[dealId];
  }

  // Fall back to generating from grid-level deal
  const deal = deals.find((d) => d.deal_id === dealId);
  if (!deal) return null;

  return buildDealDetailFromDeal(deal);
}
