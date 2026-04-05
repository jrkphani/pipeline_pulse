// ---------------------------------------------------------------------------
// Aggregated reports mock data — mirrors wireframe exactly
// ---------------------------------------------------------------------------

export interface VelocityMetrics {
  avgFullCycle: number;
  dealsStalled: number;
  stalledPct: number;
  bottleneckStage: string;
  bottleneckSlaMultiple: number;
  onTrackRate: number;
  onTrackCount: number;
  onTrackTotal: number;
}

export interface StageFunnel {
  stage: string;
  color: string;
  sla: number;
  active: number;
  entered: number;
  advanced: number;
  convPct: number;
  avgDwell: number;
  vsSla: number;
  status: 'ok' | 'warn' | 'stall';
}

export interface StallEntry {
  dealId: string;
  account: string;
  seller: string;
  stage: string;
  daysAtStage: number;
  sla: number;
  stallRatio: number;
  flag: 'RED' | 'AMBER';
}

export interface ChannelMetrics {
  topChannel: string;
  topChannelDeals: number;
  topSeller: string;
  topSellerDeals: number;
  sdrSourcedRev: string;
  sdrSourcedPct: number;
  directRev: string;
  directPct: number;
}

export interface HeatmapCell {
  value: number;
  heat: 0 | 1 | 2 | 3;
}

export interface ChannelRevenue {
  channel: string;
  dealCount: number;
  avgDealSize: string;
  totalPipeline: string;
  wonFy: string;
  convRate: string;
}

export interface RevenueMetrics {
  annualTarget: string;
  bookedYtd: string;
  bookedPct: number;
  pipelineCoverage: number;
  gapToTarget: string;
  monthsRemaining: number;
}

export interface SellerRevenue {
  name: string;
  country: 'SG' | 'PH';
  monthly: (number | null)[];
  annual: number;
  booked: number;
  gap: number;
  rag: 'meet' | 'above' | 'below';
}

export interface HealthMetrics {
  activePipeline: string;
  activeCount: number;
  weightedForecast: string;
  coverageRatio: number;
  stallRed: number;
  stallAmber: number;
  stallPct: number;
}

export interface StageHealth {
  stage: string;
  count: number;
  pipelineValue: string;
  avgDeal: string;
  probWeight: number;
  weightedValue: string;
  onTrack: number;
  stalled: number;
}

export interface StageDistribution {
  name: string;
  value: number;
  color: string;
}

export interface GtmPipeline {
  name: string;
  value: number;
}

export interface FunnelMetrics {
  leadsCreated: number;
  icpQualified: number;
  icpRate: number;
  graduatedToOpportunity: number;
  graduationRate: number;
  closedWon: number;
  winRate: number;
}

export interface FunnelStage {
  label: string;
  count: number;
  pct: number;
  color: string;
  unit: 'leads' | 'deals';
}

export interface GtmConversion {
  motion: string;
  leadsIn: number;
  dealsCreated: number;
  won: number;
  leadToWon: number;
  status: 'ok' | 'warn' | 'stall';
}

export interface DropOff {
  gate: string;
  inCount: number;
  outCount: number;
  dropPct: number;
  status: 'ok' | 'warn' | 'stall';
}

export interface FunnelLeadRecord {
  type: 'lead';
  lead_id: string;
  company_name: string;
  contact_name: string;
  gtm_motion: string;
  icp_score: number | null;
  n_signal: boolean;
  t_signal: boolean;
  i_signal: boolean;
  last_activity_date: string | null;
}

export interface FunnelDealRecord {
  type: 'deal';
  deal_id: string;
  account_name: string;
  gtm_motion: string;
  value_sgd: number;
  stage: string;
  seller: string;
  days_in_stage: number;
}

export type FunnelRecord = FunnelLeadRecord | FunnelDealRecord;

export interface WhiteSpaceMetrics {
  accountsCovered: number;
  totalWonAccounts: number;
  upsellFlags: number;
  whiteSpaceArr: string;
  avgSolutionsPerAccount: number;
  targetSolutions: number;
}

export interface AccountCoverage {
  account: string;
  solutions: Record<string, boolean>;
  whiteSpace: { label: string; variant: 'upsell' | 'warning' | 'danger' | 'success' };
}

export interface ReportsData {
  velocity: {
    metrics: VelocityMetrics;
    stageFunnel: StageFunnel[];
    stallRegister: StallEntry[];
  };
  channels: {
    metrics: ChannelMetrics;
    heatmap: {
      sellers: string[];
      sources: string[];
      cells: HeatmapCell[][];
      totals: { row: number[]; col: number[]; grand: number };
    };
    revenueByChannel: ChannelRevenue[];
  };
  revenue: {
    metrics: RevenueMetrics;
    sellers: SellerRevenue[];
    months: string[];
  };
  health: {
    metrics: HealthMetrics;
    stageDistribution: StageDistribution[];
    gtmPipeline: GtmPipeline[];
    stageHealth: StageHealth[];
  };
  funnel: {
    metrics: FunnelMetrics;
    stages: FunnelStage[];
    gtmConversion: GtmConversion[];
    dropOff: DropOff[];
    stageRecords: Record<string, FunnelRecord[]>;
  };
  whiteSpace: {
    metrics: WhiteSpaceMetrics;
    solutionAreas: string[];
    accounts: AccountCoverage[];
  };
}

// ---------------------------------------------------------------------------
// The actual mock payload — data taken directly from the wireframe
// ---------------------------------------------------------------------------

export const MOCK_REPORTS: ReportsData = {
  velocity: {
    metrics: {
      avgFullCycle: 87,
      dealsStalled: 7,
      stalledPct: 24,
      bottleneckStage: 'FR Raised',
      bottleneckSlaMultiple: 1.4,
      onTrackRate: 61,
      onTrackCount: 18,
      onTrackTotal: 29,
    },
    stageFunnel: [
      { stage: 'New Hunt', color: 'oklch(0.646 0.222 41.116)', sla: 14, active: 12, entered: 29, advanced: 21, convPct: 72, avgDwell: 11, vsSla: 0.79, status: 'ok' },
      { stage: 'Qualified', color: 'oklch(0.6 0.118 184.704)', sla: 21, active: 8, entered: 21, advanced: 15, convPct: 71, avgDwell: 18, vsSla: 0.86, status: 'warn' },
      { stage: 'Proposal Sub.', color: '#EF9F27', sla: 30, active: 5, entered: 15, advanced: 11, convPct: 73, avgDwell: 24, vsSla: 0.80, status: 'warn' },
      { stage: 'FR Raised', color: '#E24B4A', sla: 21, active: 3, entered: 11, advanced: 7, convPct: 64, avgDwell: 29, vsSla: 1.38, status: 'stall' },
      { stage: 'Order Book', color: '#1D9E75', sla: 14, active: 1, entered: 7, advanced: 6, convPct: 86, avgDwell: 12, vsSla: 0.86, status: 'warn' },
      { stage: 'Invoiced', color: '#0F6E56', sla: 30, active: 0, entered: 6, advanced: 5, convPct: 83, avgDwell: 21, vsSla: 0.70, status: 'ok' },
    ],
    stallRegister: [
      { dealId: '1CH-SG-002', account: 'Bank Of Bhutan', seller: 'tracy.tan', stage: 'Proposal Sub.', daysAtStage: 34, sla: 30, stallRatio: 1.13, flag: 'RED' },
      { dealId: '1CH-SG-007', account: 'Capita Land', seller: 'vartika.shah', stage: 'FR Raised', daysAtStage: 28, sla: 21, stallRatio: 1.33, flag: 'RED' },
      { dealId: '1CH-SG-011', account: 'EDB', seller: 'elijah', stage: 'FR Raised', daysAtStage: 30, sla: 21, stallRatio: 1.43, flag: 'RED' },
      { dealId: '1CH-MY-003', account: 'Panasonic', seller: 'minn.tbd', stage: 'Qualified', daysAtStage: 18, sla: 21, stallRatio: 0.86, flag: 'AMBER' },
    ],
  },

  channels: {
    metrics: {
      topChannel: 'AWS AM',
      topChannelDeals: 12,
      topSeller: 'Tracy Tan',
      topSellerDeals: 8,
      sdrSourcedRev: 'S$580K',
      sdrSourcedPct: 23,
      directRev: 'S$310K',
      directPct: 12,
    },
    heatmap: {
      sellers: ['Tracy Tan', 'Minn', 'Elijah', 'Vartika', 'Sripriya', 'Phani', 'Balajee'],
      sources: ['AWS AM', 'SDR', 'Direct / Self-Gen', 'Partner Referral'],
      cells: [
        [{ value: 4, heat: 2 }, { value: 2, heat: 1 }, { value: 2, heat: 1 }, { value: 3, heat: 2 }, { value: 1, heat: 0 }, { value: 0, heat: 0 }, { value: 0, heat: 0 }],
        [{ value: 2, heat: 1 }, { value: 1, heat: 0 }, { value: 3, heat: 2 }, { value: 2, heat: 1 }, { value: 1, heat: 0 }, { value: 0, heat: 0 }, { value: 0, heat: 0 }],
        [{ value: 1, heat: 0 }, { value: 0, heat: 0 }, { value: 1, heat: 0 }, { value: 0, heat: 0 }, { value: 2, heat: 1 }, { value: 2, heat: 1 }, { value: 0, heat: 0 }],
        [{ value: 0, heat: 0 }, { value: 1, heat: 0 }, { value: 0, heat: 0 }, { value: 1, heat: 0 }, { value: 0, heat: 0 }, { value: 0, heat: 0 }, { value: 2, heat: 1 }],
      ],
      totals: { row: [12, 9, 6, 4], col: [7, 4, 6, 6, 4, 2, 2], grand: 31 },
    },
    revenueByChannel: [
      { channel: 'AWS AM', dealCount: 12, avgDealSize: 'S$185K', totalPipeline: 'S$2.22M', wonFy: 'S$340K', convRate: '32%' },
      { channel: 'SDR', dealCount: 9, avgDealSize: 'S$65K', totalPipeline: 'S$585K', wonFy: 'S$120K', convRate: '41%' },
      { channel: 'Direct / Self-Gen', dealCount: 6, avgDealSize: 'S$52K', totalPipeline: 'S$312K', wonFy: 'S$90K', convRate: '28%' },
      { channel: 'Partner Referral', dealCount: 4, avgDealSize: 'S$210K', totalPipeline: 'S$840K', wonFy: 'S$0', convRate: '—' },
    ],
  },

  revenue: {
    metrics: {
      annualTarget: 'S$5.5M',
      bookedYtd: 'S$680K',
      bookedPct: 12,
      pipelineCoverage: 3.9,
      gapToTarget: 'S$4.82M',
      monthsRemaining: 9,
    },
    months: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
    sellers: [
      { name: 'Tracy Tan', country: 'SG', monthly: [104, null, null, null, null, null, null, null, null, null, null, null], annual: 1250, booked: 104, gap: 1146, rag: 'meet' },
      { name: 'Elijah', country: 'SG', monthly: [null, null, null, null, null, null, null, null, null, null, null, null], annual: 900, booked: 0, gap: 900, rag: 'below' },
      { name: 'Vartika Shah', country: 'SG', monthly: [null, null, null, null, null, null, null, null, null, null, null, null], annual: 850, booked: 0, gap: 850, rag: 'below' },
      { name: 'Sripriya', country: 'PH', monthly: [210, null, null, null, null, null, null, null, null, null, null, null], annual: 750, booked: 210, gap: 540, rag: 'above' },
    ],
  },

  health: {
    metrics: {
      activePipeline: 'S$3.96M',
      activeCount: 29,
      weightedForecast: 'S$1.42M',
      coverageRatio: 3.9,
      stallRed: 7,
      stallAmber: 4,
      stallPct: 38,
    },
    stageDistribution: [
      { name: 'New Hunt', value: 12, color: 'oklch(0.646 0.222 41.116)' },
      { name: 'Qualified', value: 8, color: 'oklch(0.6 0.118 184.704)' },
      { name: 'Proposal', value: 5, color: 'oklch(0.398 0.07 227.392)' },
      { name: 'FR Raised', value: 3, color: '#E24B4A' },
      { name: 'Order Book', value: 1, color: '#1D9E75' },
    ],
    gtmPipeline: [
      { name: 'Agentic AI', value: 1820 },
      { name: 'SAP Mig.', value: 920 },
      { name: 'VMware', value: 680 },
      { name: 'App Mod.', value: 380 },
      { name: 'Data', value: 160 },
    ],
    stageHealth: [
      { stage: 'New Hunt', count: 12, pipelineValue: 'S$1.42M', avgDeal: 'S$118K', probWeight: 10, weightedValue: 'S$142K', onTrack: 9, stalled: 3 },
      { stage: 'Qualified', count: 8, pipelineValue: 'S$1.08M', avgDeal: 'S$135K', probWeight: 25, weightedValue: 'S$270K', onTrack: 6, stalled: 2 },
      { stage: 'Proposal Sub.', count: 5, pipelineValue: 'S$820K', avgDeal: 'S$164K', probWeight: 50, weightedValue: 'S$410K', onTrack: 3, stalled: 2 },
      { stage: 'FR Raised', count: 3, pipelineValue: 'S$490K', avgDeal: 'S$163K', probWeight: 75, weightedValue: 'S$368K', onTrack: 1, stalled: 2 },
      { stage: 'Order Book', count: 1, pipelineValue: 'S$150K', avgDeal: 'S$150K', probWeight: 90, weightedValue: 'S$135K', onTrack: 1, stalled: 0 },
    ],
  },

  funnel: {
    metrics: {
      leadsCreated: 52,
      icpQualified: 34,
      icpRate: 65,
      graduatedToOpportunity: 29,
      graduationRate: 85,
      closedWon: 5,
      winRate: 17,
    },
    stages: [
      { label: 'SDR Created', count: 52, pct: 100, color: 'oklch(0.646 0.222 41.116)', unit: 'leads' },
      { label: 'ICP Scored', count: 44, pct: 85, color: 'oklch(0.6 0.118 184.704)', unit: 'leads' },
      { label: 'Signals Confirmed', count: 36, pct: 69, color: 'oklch(0.398 0.07 227.392)', unit: 'leads' },
      { label: 'ICP Qualified', count: 34, pct: 65, color: 'oklch(0.828 0.189 84.429)', unit: 'leads' },
      { label: 'Graduation Gate', count: 29, pct: 56, color: 'oklch(0.769 0.188 70.08)', unit: 'deals' },
      { label: 'Proposal Sub.', count: 21, pct: 40, color: '#E24B4A', unit: 'deals' },
      { label: 'FR Raised', count: 14, pct: 27, color: '#E24B4A', unit: 'deals' },
      { label: 'Closed Won', count: 5, pct: 10, color: '#1D9E75', unit: 'deals' },
    ],
    gtmConversion: [
      { motion: 'Agentic AI', leadsIn: 22, dealsCreated: 13, won: 3, leadToWon: 14, status: 'ok' },
      { motion: 'SAP Migration', leadsIn: 14, dealsCreated: 9, won: 1, leadToWon: 7, status: 'warn' },
      { motion: 'VMware Exit', leadsIn: 8, dealsCreated: 4, won: 1, leadToWon: 13, status: 'warn' },
      { motion: 'App Modernization', leadsIn: 8, dealsCreated: 3, won: 0, leadToWon: 0, status: 'stall' },
    ],
    dropOff: [
      { gate: 'ICP Scoring', inCount: 52, outCount: 44, dropPct: 15, status: 'ok' },
      { gate: 'Signal Confirmation', inCount: 44, outCount: 36, dropPct: 18, status: 'ok' },
      { gate: 'Graduation Gate', inCount: 36, outCount: 29, dropPct: 19, status: 'warn' },
      { gate: 'Proposal → FR', inCount: 21, outCount: 14, dropPct: 33, status: 'warn' },
      { gate: 'FR → Won', inCount: 14, outCount: 5, dropPct: 64, status: 'stall' },
    ],
    stageRecords: {
      'SDR Created': [
        { type: 'lead', lead_id: 'L-SG-041', company_name: 'Danone APAC',       contact_name: 'James Lim',     gtm_motion: 'Agentic AI',   icp_score: 4, n_signal: false, t_signal: false, i_signal: false, last_activity_date: '2026-03-28' },
        { type: 'lead', lead_id: 'L-SG-042', company_name: 'SGX Group',          contact_name: 'Priya Menon',   gtm_motion: 'SAP Migration', icp_score: 3, n_signal: false, t_signal: false, i_signal: false, last_activity_date: '2026-03-30' },
        { type: 'lead', lead_id: 'L-PH-017', company_name: 'Globe Telecom',      contact_name: 'Rico Santos',   gtm_motion: 'VMware Exit',   icp_score: null, n_signal: false, t_signal: false, i_signal: false, last_activity_date: null },
      ],
      'ICP Scored': [
        { type: 'lead', lead_id: 'L-SG-031', company_name: 'Capita Land',        contact_name: 'Sarah Koh',     gtm_motion: 'Agentic AI',   icp_score: 5, n_signal: true,  t_signal: false, i_signal: true,  last_activity_date: '2026-03-29' },
        { type: 'lead', lead_id: 'L-SG-033', company_name: 'Bank of Bhutan',     contact_name: 'Tashi Wangdi',  gtm_motion: 'SAP Migration', icp_score: 2, n_signal: false, t_signal: false, i_signal: false, last_activity_date: '2026-03-27' },
        { type: 'lead', lead_id: 'L-MY-008', company_name: 'CIMB Group',         contact_name: 'Hafizah Aziz',  gtm_motion: 'VMware Exit',   icp_score: 4, n_signal: true,  t_signal: false, i_signal: false, last_activity_date: '2026-03-31' },
      ],
      'Signals Confirmed': [
        { type: 'lead', lead_id: 'L-SG-022', company_name: 'EDB Singapore',      contact_name: 'Marcus Ng',     gtm_motion: 'Agentic AI',   icp_score: 5, n_signal: true,  t_signal: true,  i_signal: true,  last_activity_date: '2026-04-01' },
        { type: 'lead', lead_id: 'L-SG-024', company_name: 'OCBC Bank',          contact_name: 'Tan Wei Lin',   gtm_motion: 'SAP Migration', icp_score: 4, n_signal: true,  t_signal: true,  i_signal: false, last_activity_date: '2026-03-31' },
        { type: 'lead', lead_id: 'L-PH-011', company_name: 'BDO Unibank',        contact_name: 'Miguel Cruz',   gtm_motion: 'App Mod.',      icp_score: 3, n_signal: true,  t_signal: false, i_signal: true,  last_activity_date: '2026-03-30' },
      ],
      'ICP Qualified': [
        { type: 'lead', lead_id: 'L-SG-014', company_name: 'Singtel',            contact_name: 'Vikram Shah',   gtm_motion: 'Agentic AI',   icp_score: 5, n_signal: true,  t_signal: true,  i_signal: true,  last_activity_date: '2026-04-02' },
        { type: 'lead', lead_id: 'L-SG-016', company_name: 'DBS Bank',           contact_name: 'Ling Hui',      gtm_motion: 'SAP Migration', icp_score: 4, n_signal: true,  t_signal: true,  i_signal: true,  last_activity_date: '2026-04-01' },
        { type: 'lead', lead_id: 'L-MY-004', company_name: 'Maybank',            contact_name: 'Azri Hakim',    gtm_motion: 'VMware Exit',   icp_score: 4, n_signal: true,  t_signal: true,  i_signal: true,  last_activity_date: '2026-03-31' },
      ],
      'Graduation Gate': [
        { type: 'deal', deal_id: '1CH-SG-029', account_name: 'Singtel',          gtm_motion: 'Agentic AI',   value_sgd: 380000,  stage: 'Graduation Gate', seller: 'tracy.tan',    days_in_stage: 3  },
        { type: 'deal', deal_id: '1CH-SG-031', account_name: 'DBS Bank',         gtm_motion: 'SAP Migration', value_sgd: 520000, stage: 'Graduation Gate', seller: 'vartika.shah', days_in_stage: 5  },
        { type: 'deal', deal_id: '1CH-MY-012', account_name: 'Maybank',          gtm_motion: 'VMware Exit',  value_sgd: 210000,  stage: 'Graduation Gate', seller: 'elijah',       days_in_stage: 7  },
      ],
      'Proposal Sub.': [
        { type: 'deal', deal_id: '1CH-SG-018', account_name: 'Capita Land',      gtm_motion: 'Agentic AI',   value_sgd: 640000,  stage: 'Proposal Sub.',   seller: 'tracy.tan',    days_in_stage: 18 },
        { type: 'deal', deal_id: '1CH-SG-021', account_name: 'OCBC Bank',        gtm_motion: 'SAP Migration', value_sgd: 480000, stage: 'Proposal Sub.',   seller: 'sripriya',     days_in_stage: 24 },
        { type: 'deal', deal_id: '1CH-PH-009', account_name: 'Globe Telecom',    gtm_motion: 'App Mod.',     value_sgd: 190000,  stage: 'Proposal Sub.',   seller: 'elijah',       days_in_stage: 11 },
      ],
      'FR Raised': [
        { type: 'deal', deal_id: '1CH-SG-007', account_name: 'Capita Land',      gtm_motion: 'Agentic AI',   value_sgd: 620000,  stage: 'FR Raised',       seller: 'vartika.shah', days_in_stage: 28 },
        { type: 'deal', deal_id: '1CH-SG-011', account_name: 'EDB Singapore',    gtm_motion: 'SAP Migration', value_sgd: 310000, stage: 'FR Raised',       seller: 'elijah',       days_in_stage: 30 },
      ],
      'Closed Won': [
        { type: 'deal', deal_id: '1CH-SG-003', account_name: 'Danone APAC',      gtm_motion: 'Agentic AI',   value_sgd: 850000,  stage: 'Closed Won',      seller: 'tracy.tan',    days_in_stage: 0  },
        { type: 'deal', deal_id: '1CH-PH-004', account_name: 'Globe Telecom',    gtm_motion: 'App Mod.',     value_sgd: 175000,  stage: 'Closed Won',      seller: 'sripriya',     days_in_stage: 0  },
      ],
    },
  },

  whiteSpace: {
    metrics: {
      accountsCovered: 18,
      totalWonAccounts: 31,
      upsellFlags: 7,
      whiteSpaceArr: 'S$2.1M',
      avgSolutionsPerAccount: 1.4,
      targetSolutions: 2.5,
    },
    solutionAreas: ['AM', 'SAP Mig.', 'VMware Exit', 'Agentic AI', 'App Mod.', 'Data / Analytics', 'AMS'],
    accounts: [
      { account: 'Danone', solutions: { 'AM': true, 'Agentic AI': true }, whiteSpace: { label: 'AMS upsell', variant: 'upsell' } },
      { account: 'Bank Of Bhutan', solutions: { 'AM': true, 'Data / Analytics': true }, whiteSpace: { label: 'Agentic AI', variant: 'warning' } },
      { account: 'Flexibees', solutions: { 'AM': true, 'Agentic AI': true }, whiteSpace: { label: 'App Mod', variant: 'upsell' } },
      { account: 'ED SG', solutions: { 'AM': true, 'Agentic AI': true, 'App Mod.': true }, whiteSpace: { label: 'Well covered', variant: 'success' } },
      { account: 'Give Please', solutions: { 'AM': true }, whiteSpace: { label: '6 areas open', variant: 'danger' } },
    ],
  },
};
