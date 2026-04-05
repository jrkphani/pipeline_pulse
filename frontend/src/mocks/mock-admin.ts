/**
 * Mock data for Admin Console panels.
 * All arrays match the wireframe at pipeline_pulse_admin_rbac_v2.html.
 */
import { http, HttpResponse, delay } from 'msw';
import type {
  AdminUser,
  StageSLA,
  Threshold,
  GTMMotion,
  FundingType,
  FXRate,
  DocAIField,
  QTreeQuestionnaire,
  QTreeParseResult,
  SystemHealth,
  SOPEntry,
  ModelConfig,
  CatalogEntry,
  TemplateEntry,
} from '@/types/admin';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

export const MOCK_ADMIN_USERS: AdminUser[] = [
  { id: 1, name: 'Tracy Tan', email: 'tracy.tan@1cloudhub.com', role: 'ae', status: 'active', last_active: 'Today 09:14', country: 'SG' },
  { id: 2, name: 'Elijah', email: 'elijah@1cloudhub.com', role: 'ae', status: 'active', last_active: 'Today 08:47', country: 'SG' },
  { id: 3, name: 'Ajay Samuel', email: 'ajay.samuel@1cloudhub.com', role: 'presales_consultant', status: 'active', last_active: 'Today 10:02', country: 'SG' },
  { id: 4, name: 'Nitin', email: 'nitin@1cloudhub.com', role: 'presales_sa', status: 'active', last_active: 'Today 11:15', country: 'PH' },
  { id: 5, name: 'Raziel', email: 'raziel@1cloudhub.com', role: 'sdr', status: 'active', last_active: 'Today 09:55', country: 'SG' },
  { id: 6, name: 'Phani', email: 'phani@1cloudhub.com', role: 'cro', status: 'active', last_active: 'Today 08:00', country: 'SG' },
  { id: 7, name: 'Kai Wong', email: 'kai.wong@1cloudhub.com', role: 'sales_ops', status: 'active', last_active: 'Today 10:30', country: 'SG' },
  { id: 8, name: 'Wei Lin', email: 'wei.lin@1cloudhub.com', role: 'aws_alliance_manager', status: 'active', last_active: 'Today 07:55', country: 'SG' },
  { id: 9, name: 'Priya S.', email: 'priya@1cloudhub.com', role: 'finance_manager', status: 'active', last_active: 'Yesterday', country: 'SG' },
  { id: 10, name: 'Break-Glass Admin', email: 'admin@1cloudhub.com', role: 'admin', status: 'break_glass', last_active: 'Never', country: '\u2014' },
];

export const MOCK_STAGE_SLAS: StageSLA[] = [
  { stage: 'New Hunt', sla_days: 14, probability_pct: 10, last_changed: 'Apr 4 \u00b7 kai.wong', changed_by: 'kai.wong' },
  { stage: 'Qualified', sla_days: 21, probability_pct: 25, last_changed: 'Apr 1 \u00b7 kai.wong', changed_by: 'kai.wong' },
  { stage: 'Proposal Submitted', sla_days: 30, probability_pct: 50, last_changed: 'Mar 28 \u00b7 admin', changed_by: 'admin' },
  { stage: 'FR Raised', sla_days: 21, probability_pct: 75, last_changed: 'Mar 28 \u00b7 admin', changed_by: 'admin' },
  { stage: 'Order Book', sla_days: 14, probability_pct: 90, last_changed: 'Mar 28 \u00b7 admin', changed_by: 'admin' },
];

export const MOCK_THRESHOLDS: Threshold[] = [
  { setting: 'Min Coverage Ratio', value: '4.0\u00d7', last_changed: 'Apr 5 \u00b7 kai.wong', changed_by: 'kai.wong' },
  { setting: 'ICP Score Floor', value: '65', last_changed: 'Apr 5 \u00b7 kai.wong', changed_by: 'kai.wong' },
  { setting: 'Doc AI Floor', value: '85%', last_changed: 'Apr 3 \u00b7 admin', changed_by: 'admin' },
  { setting: 'Must-Close Prob.', value: '75%', last_changed: 'Apr 3 \u00b7 admin', changed_by: 'admin' },
];

export const MOCK_GTM_MOTIONS: GTMMotion[] = [
  { label: 'Agentic AI',  status: 'active' },
  { label: 'SAP',         status: 'active' },
  { label: 'Migrations',  status: 'active' },
  { label: 'MSP',         status: 'active' },
];

export const MOCK_FUNDING_TYPES: FundingType[] = [
  { label: 'MAP 2.0 \u2014 Assess',               category: 'MAP' },
  { label: 'MAP 2.0 \u2014 Mobilize',              category: 'MAP' },
  { label: 'MAP 2.0 \u2014 Migrate & Modernize',   category: 'MAP' },
  { label: 'MAP Lite \u2014 Assess',               category: 'MAP' },
  { label: 'MAP Lite \u2014 Mobilize/Migrate',     category: 'MAP' },
  { label: 'MAP Modernization SPI',         category: 'MAP' },
  { label: 'MAP Gen AI Booster',            category: 'MAP' },
  { label: 'MMP \u2014 MVA (Assessment)',          category: 'Microsoft' },
  { label: 'MMP \u2014 Project Funding',           category: 'Microsoft' },
  { label: 'EBA Sprint',                    category: 'EBA' },
  { label: 'IWB \u2014 Assess',                   category: 'Startup' },
  { label: 'IWB \u2014 Build',                    category: 'Startup' },
  { label: 'IWM \u2014 Assess',                   category: 'Startup' },
  { label: 'IWM \u2014 Migrate',                  category: 'Startup' },
  { label: 'OLA (Licensing Assessment)',     category: 'Assessment' },
  { label: 'SG AI Springboard \u2014 Discovery',  category: 'SG Local' },
  { label: 'SG AI Springboard \u2014 Impl.',      category: 'SG Local' },
  { label: 'NCI (New Customer)',             category: 'Annual' },
  { label: 'PGI (Partner Growth)',           category: 'Annual' },
  { label: 'MSP Strategic Services',        category: 'Annual' },
  { label: 'SCA POC Funding',               category: 'SCA/GenAI' },
  { label: 'SCA Prod Funding',              category: 'SCA/GenAI' },
  { label: 'Gen AI 20% POC',                category: 'SCA/GenAI' },
  { label: 'Gen AI 20% Prod',               category: 'SCA/GenAI' },
  { label: 'Customer Funded',               category: 'Non-AWS' },
];

export const MOCK_FX_RATES: FXRate[] = [
  { from: 'USD', to: 'SGD', rate: 1.34, source: 'Currency Freaks', updated: 'Today 06:00', changed_by: 'auto', status: 'fresh' },
  { from: 'USD', to: 'MYR', rate: 4.71, source: 'Currency Freaks', updated: 'Today 06:00', changed_by: 'auto', status: 'fresh' },
  { from: 'USD', to: 'PHP', rate: 57.2, source: 'Currency Freaks', updated: 'Today 06:00', changed_by: 'auto', status: 'fresh' },
  { from: 'USD', to: 'IDR', rate: 16150, source: 'Manual override', updated: 'Mar 29', changed_by: 'kai.wong', status: 'stale', stale_label: '7d old' },
];

export const MOCK_DOCAI_FIELDS: DocAIField[] = [
  { doc_type: 'Proposal', field: 'Deal Value (SGD)', acceptance_pct: 94, samples: 47, status: 'ok', floor_pct: 85 },
  { doc_type: 'Proposal', field: 'Account Name', acceptance_pct: 99, samples: 47, status: 'ok', floor_pct: 85 },
  { doc_type: 'SOW', field: 'Delivery Timeline', acceptance_pct: 81, samples: 22, status: 'below_floor', floor_pct: 85 },
  { doc_type: 'SOW', field: 'Payment Terms', acceptance_pct: 76, samples: 22, status: 'below_floor', floor_pct: 85 },
  { doc_type: 'PO', field: 'PO ID', acceptance_pct: 97, samples: 31, status: 'ok', floor_pct: 85 },
];

export const MOCK_QTREE_REGISTRY: QTreeQuestionnaire[] = [
  { id: 'qt-1', name: 'SAP Migration \u2014 Presales Discovery', roles: 'PC \u00b7 SA', domain: 'SAP Migration', sections: 4, questions: 22, version: 'v1.0', status: 'active', signoff: 'both_approved', uploaded: 'Apr 4' },
  { id: 'qt-2', name: 'SAP Migration \u2014 Sales Qualification', roles: 'AE', domain: 'SAP Migration', sections: 3, questions: 14, version: 'v1.0', status: 'active', signoff: 'both_approved', uploaded: 'Apr 4' },
  { id: 'qt-3', name: 'Agentic AI \u2014 SDR First Call', roles: 'SDR', domain: 'Agentic AI', sections: 2, questions: 9, version: 'v1.1', status: 'active', signoff: 'both_approved', uploaded: 'Apr 5' },
  { id: 'qt-4', name: 'Agentic AI \u2014 Presales Technical', roles: 'PC \u00b7 SA', domain: 'Agentic AI', sections: 5, questions: 28, version: 'v1.0', status: 'draft', signoff: 'pending_presales', uploaded: 'Apr 5' },
  { id: 'qt-5', name: 'VMware Exit \u2014 Sales Qualification', roles: 'AE', domain: 'VMware Exit', sections: 3, questions: 16, version: 'v1.0', status: 'active', signoff: 'both_approved', uploaded: 'Apr 3' },
  { id: 'qt-6', name: 'General \u2014 SDR Demand Gen Qualifier', roles: 'SDR', domain: 'All domains', sections: 2, questions: 11, version: 'v2.0', status: 'active', signoff: 'both_approved', uploaded: 'Apr 1' },
];

export const MOCK_QTREE_PARSE_RESULT: QTreeParseResult = {
  filename: 'sap-presales-discovery.md',
  title: 'SAP Migration \u2014 Presales Discovery',
  roles: 'PC \u00b7 SA',
  domain: 'SAP Migration',
  total_questions: 22,
  errors: 0,
  sections: [
    {
      title: 'Section 1: Current Landscape',
      questions: [
        { number: 1, text: 'What version of SAP are you currently running?', type: 'single-select', options: ['SAP ECC 6.0', 'S/4HANA on-prem', 'SAP BW/4HANA', 'Other (text)'] },
        { number: 2, text: 'Which SAP modules are active?', type: 'multi-select', options: ['FI/CO', 'MM', 'SD', 'PP', 'HR/HCM', 'Other (text)'] },
      ],
    },
    {
      title: 'Section 2: Migration Drivers',
      questions: [
        { number: 3, text: 'What is the primary driver for migration?', type: 'single-select', options: ['ECC end-of-maintenance', 'Cost reduction', 'Feature gaps', 'Board mandate'] },
      ],
    },
    {
      title: 'Section 3: Infrastructure',
      questions: [
        { number: 4, text: 'Current hosting environment?', type: 'single-select', options: ['On-premises', 'Colocation', 'AWS', 'Azure', 'Other'] },
      ],
    },
    {
      title: 'Section 4: Commercial',
      questions: [
        { number: 5, text: 'Budget range for migration project?', type: 'single-select', options: ['< $250K', '$250K\u2013$500K', '$500K\u2013$1M', '> $1M'] },
      ],
    },
  ],
};

export const MOCK_SYSTEM_HEALTH: SystemHealth = {
  queues: [
    { name: 'Celery default', pending: 0, status: 'ok' },
    { name: 'Celery beat', pending: 0, status: 'ok' },
    { name: 'Bedrock routing', pending: 2, status: 'active' },
  ],
  performance: [
    { metric: 'Grid load', p95: '1.4s', sla: '<2s' },
    { metric: 'API response', p95: '145ms', sla: '<200ms' },
    { metric: 'Active users', p95: '8', sla: '\u2014' },
  ],
};

export const MOCK_SOPS: SOPEntry[] = [
  { id: 'sop-1', agent: 'Orchestrator', file: 'orchestrator.md', version: 'v1.2', last_edited: 'Apr 5', editor_role: 'sales_ops', editor_name: 'kai.wong', status: 'active',
    content: '# Orchestrator SOP v1.2\n\n## Routing Rules\n- On deal.stage_changed \u2192 Stall Detection if days > SLA \u00d7 0.8\n- On lead.graduated \u2192 Enrichment within 60s\n- On proposal.generated \u2192 ACE Compliance\n\n## Quiet Hours\nSGT 22:00\u201306:00 \u2014 batch non-critical comms',
    audit_log: [
      { timestamp: 'Apr 5 \u00b7 09:14', role: 'sales_ops', user: 'kai.wong', action: 'updated quiet hours 23:00\u219222:00' },
      { timestamp: 'Apr 3 \u00b7 14:22', role: 'admin', user: 'admin', action: 'added escalation fallback rule' },
      { timestamp: 'Mar 28 \u00b7 10:05', role: 'admin', user: 'admin', action: 'created v1.0' },
    ],
  },
  { id: 'sop-2', agent: 'Communications', file: 'communications.md', version: 'v1.1', last_edited: 'Apr 5', editor_role: 'sales_ops', editor_name: 'kai.wong', status: 'active' },
  { id: 'sop-3', agent: 'Doc Intelligence', file: 'doc-intel.md', version: 'v1.1', last_edited: 'Apr 4', editor_role: 'admin', editor_name: 'admin', status: 'active' },
  { id: 'sop-4', agent: 'Discovery / Q Tree', file: 'discovery-qtree.md', version: 'v1.0', last_edited: 'Apr 3', editor_role: 'sales_ops', editor_name: 'kai.wong', status: 'draft' },
  { id: 'sop-5', agent: 'Solution Fit', file: 'solution-fit.md', version: '\u2014', last_edited: '\u2014', editor_role: null, editor_name: '\u2014', status: 'not_started' },
  { id: 'sop-6', agent: 'White Space', file: 'white-space.md', version: '\u2014', last_edited: '\u2014', editor_role: null, editor_name: '\u2014', status: 'not_started' },
];

export const MOCK_MODEL_CONFIGS: ModelConfig[] = [
  { use_case: 'Orchestrator Routing', agent: 'Orchestrator', model: 'sonnet', allowed_overrides: ['sonnet', 'opus'], quality_gate: '\u2014' },
  { use_case: 'Lead Enrichment', agent: 'Enrichment', model: 'haiku', allowed_overrides: ['haiku', 'sonnet'], quality_gate: 'ICP \u2265 65' },
  { use_case: 'Proposal Draft (standard)', agent: 'Proposal & SOW', model: 'sonnet', allowed_overrides: ['sonnet', 'opus'], quality_gate: 'Fit \u2265 60, TCO not null' },
  { use_case: 'Proposal Draft (high-value)', agent: 'Proposal & SOW', model: 'opus', allowed_overrides: ['opus', 'sonnet'], quality_gate: 'Deal > SGD 500K' },
  { use_case: 'Morning Brief', agent: 'Target Retirement', model: 'haiku', allowed_overrides: ['haiku', 'sonnet'], quality_gate: '\u2014' },
];

export const MOCK_CATALOG: CatalogEntry[] = [
  { id: 'CAT-001', label: 'SAP Migration', category: 'Migration', pain_points: 6, signals: 8, combos: 2, version: 'v2.1', arr_potential: '$250K\u2013$1.2M', pain_points_text: 'SAP ECC end-of-maintenance 2027\nRising on-prem infrastructure cost\nInability to run S/4HANA features\nData silos across SAP modules', signals_text: 'SAP ECC mentioned in discovery\nHardware refresh budget allocated\nBoard mandate for cloud' },
  { id: 'CAT-002', label: 'VMware Exit', category: 'Migration', pain_points: 5, signals: 7, combos: 1, version: 'v2.1' },
  { id: 'CAT-003', label: 'Agentic AI', category: 'GenAI', pain_points: 7, signals: 9, combos: 3, version: 'v2.1' },
  { id: 'CAT-004', label: 'AMS', category: 'Managed Svc', pain_points: 4, signals: 5, combos: 4, version: 'v2.1' },
];

export const MOCK_TEMPLATES: TemplateEntry[] = [
  { name: 'Proposal \u2014 SAP Migration', solution: 'SAP Migration', doc_type: 'Proposal', version: 'v1.2', uploaded_by_role: 'admin', legal_approval: 'approved', uploaded: 'Apr 3' },
  { name: 'SOW \u2014 SAP Migration', solution: 'SAP Migration', doc_type: 'SOW', version: 'v1.1', uploaded_by_role: 'sales_ops', legal_approval: 'pending', uploaded: 'Apr 4' },
  { name: 'Proposal \u2014 VMware Exit', solution: 'VMware Exit', doc_type: 'Proposal', version: 'v1.0', uploaded_by_role: 'admin', legal_approval: 'approved', uploaded: 'Apr 1' },
  { name: 'SOW \u2014 VMware Exit', solution: 'VMware Exit', doc_type: 'SOW', version: 'v1.0', uploaded_by_role: 'sales_ops', legal_approval: 'pending', uploaded: 'Apr 4' },
  { name: 'SOW \u2014 Agentic AI', solution: 'Agentic AI', doc_type: 'SOW', version: '\u2014', uploaded_by_role: null, legal_approval: 'required', uploaded: '\u2014' },
];

// ---------------------------------------------------------------------------
// MSW Handlers
// ---------------------------------------------------------------------------

export const adminHandlers = [
  http.get('/api/v1/admin/users', () => {
    return HttpResponse.json({ users: MOCK_ADMIN_USERS });
  }),

  http.get('/api/v1/admin/reference-data', () => {
    return HttpResponse.json({
      stage_slas: MOCK_STAGE_SLAS,
      thresholds: MOCK_THRESHOLDS,
      gtm_motions: MOCK_GTM_MOTIONS,
      funding_types: MOCK_FUNDING_TYPES,
    });
  }),

  http.get('/api/v1/admin/qtree', () => {
    return HttpResponse.json({ questionnaires: MOCK_QTREE_REGISTRY });
  }),

  http.post('/api/v1/admin/qtree/parse', async () => {
    await delay(1500);
    return HttpResponse.json(MOCK_QTREE_PARSE_RESULT);
  }),

  http.get('/api/v1/admin/fx-rates', () => {
    return HttpResponse.json({ rates: MOCK_FX_RATES });
  }),

  http.get('/api/v1/admin/doc-ai', () => {
    return HttpResponse.json({ fields: MOCK_DOCAI_FIELDS });
  }),

  http.get('/api/v1/admin/health', async () => {
    await delay(300);
    return HttpResponse.json(MOCK_SYSTEM_HEALTH);
  }),

  http.get('/api/v1/admin/sops', () => {
    return HttpResponse.json({ sops: MOCK_SOPS });
  }),

  http.get('/api/v1/admin/models', () => {
    return HttpResponse.json({ models: MOCK_MODEL_CONFIGS });
  }),

  http.get('/api/v1/admin/catalog', () => {
    return HttpResponse.json({ entries: MOCK_CATALOG });
  }),

  http.get('/api/v1/admin/templates', () => {
    return HttpResponse.json({ templates: MOCK_TEMPLATES });
  }),
];
