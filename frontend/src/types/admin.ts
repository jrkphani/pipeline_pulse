// Admin Console types — mirrors wireframe panels

import type { UserRole } from './auth';

// ---------------------------------------------------------------------------
// User Management
// ---------------------------------------------------------------------------

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'inactive' | 'break_glass';
  last_active: string;
  country: string;
}

// ---------------------------------------------------------------------------
// Reference Data
// ---------------------------------------------------------------------------

export interface StageSLA {
  stage: string;
  sla_days: number;
  probability_pct: number;
  last_changed: string;
  changed_by: string;
}

export interface Threshold {
  setting: string;
  value: string;
  last_changed: string;
  changed_by: string;
}

export interface GTMMotion {
  label: string;
  status: 'active' | 'hidden';
}

export interface FundingType {
  label: string;
  category: string;
}

// ---------------------------------------------------------------------------
// FX Rates
// ---------------------------------------------------------------------------

export interface FXRate {
  from: string;
  to: string;
  rate: number;
  source: string;
  updated: string;
  changed_by: string;
  status: 'fresh' | 'stale';
  stale_label?: string;
}

// ---------------------------------------------------------------------------
// Doc AI
// ---------------------------------------------------------------------------

export interface DocAIField {
  doc_type: string;
  field: string;
  acceptance_pct: number;
  samples: number;
  status: 'ok' | 'below_floor';
  floor_pct: number;
}

// ---------------------------------------------------------------------------
// Q Tree
// ---------------------------------------------------------------------------

export interface QTreeQuestionnaire {
  id: string;
  name: string;
  roles: string;
  domain: string;
  sections: number;
  questions: number;
  version: string;
  status: 'active' | 'draft';
  signoff: 'both_approved' | 'pending_presales' | 'pending_sdr' | 'none';
  uploaded: string;
}

export interface QTreeQuestion {
  number: number;
  text: string;
  type: 'multi-select' | 'single-select' | 'text';
  options: string[];
}

export interface QTreeSection {
  title: string;
  questions: QTreeQuestion[];
}

export interface QTreeParseResult {
  filename: string;
  title: string;
  roles: string;
  domain: string;
  sections: QTreeSection[];
  total_questions: number;
  errors: number;
}

// ---------------------------------------------------------------------------
// System Health
// ---------------------------------------------------------------------------

export interface QueueStatus {
  name: string;
  pending: number;
  status: 'ok' | 'active' | 'down';
}

export interface PerformanceMetric {
  metric: string;
  p95: string;
  sla: string;
}

export interface SystemHealth {
  queues: QueueStatus[];
  performance: PerformanceMetric[];
}

// ---------------------------------------------------------------------------
// SOPs
// ---------------------------------------------------------------------------

export interface SOPEntry {
  id: string;
  agent: string;
  file: string;
  version: string;
  last_edited: string;
  editor_role: UserRole | null;
  editor_name: string;
  status: 'active' | 'draft' | 'not_started';
  content?: string;
  audit_log?: SOPAuditEntry[];
}

export interface SOPAuditEntry {
  timestamp: string;
  role: UserRole;
  user: string;
  action: string;
}

// ---------------------------------------------------------------------------
// Model Config
// ---------------------------------------------------------------------------

export interface ModelConfig {
  use_case: string;
  agent: string;
  model: 'haiku' | 'sonnet' | 'opus';
  allowed_overrides: ('haiku' | 'sonnet' | 'opus')[];
  quality_gate: string;
}

// ---------------------------------------------------------------------------
// Solution Catalog
// ---------------------------------------------------------------------------

export interface CatalogEntry {
  id: string;
  label: string;
  category: string;
  pain_points: number;
  signals: number;
  combos: number;
  version: string;
  pain_points_text?: string;
  signals_text?: string;
  arr_potential?: string;
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

export interface TemplateEntry {
  name: string;
  solution: string;
  doc_type: string;
  version: string;
  uploaded_by_role: UserRole | null;
  legal_approval: 'approved' | 'pending' | 'required';
  uploaded: string;
}

// ---------------------------------------------------------------------------
// RBAC
// ---------------------------------------------------------------------------

export type Permission =
  | 'pipeline_own'
  | 'pipeline_all'
  | 'deal_edit'
  | 'demand_gen'
  | 'dashboard_kpi'
  | 'reports'
  | 'qtree_session'
  | 'export_xlsx'
  | 'ref_data'
  | 'fx_rates'
  | 'doc_ai_monitor'
  | 'qtree_config'
  | 'sop_management'
  | 'model_config'
  | 'solution_catalog'
  | 'template_library'
  | 'user_management'
  | 'system_health'
  | 'excel_import'
  | 'break_glass';

export type AccessLevel = 'full' | 'read' | 'none';

/** Wireframe RBAC Matrix — 10 roles × 20 permissions */
export const RBAC_MATRIX: Record<string, Record<Permission, AccessLevel>> = {
  sdr: {
    pipeline_own: 'none', pipeline_all: 'none', deal_edit: 'none', demand_gen: 'full',
    dashboard_kpi: 'read', reports: 'none', qtree_session: 'full', export_xlsx: 'none',
    ref_data: 'none', fx_rates: 'none', doc_ai_monitor: 'none', qtree_config: 'none',
    sop_management: 'none', model_config: 'none', solution_catalog: 'none', template_library: 'none',
    user_management: 'none', system_health: 'none', excel_import: 'none', break_glass: 'none',
  },
  ae: {
    pipeline_own: 'full', pipeline_all: 'none', deal_edit: 'full', demand_gen: 'none',
    dashboard_kpi: 'full', reports: 'read', qtree_session: 'full', export_xlsx: 'full',
    ref_data: 'none', fx_rates: 'none', doc_ai_monitor: 'none', qtree_config: 'none',
    sop_management: 'none', model_config: 'none', solution_catalog: 'none', template_library: 'none',
    user_management: 'none', system_health: 'none', excel_import: 'none', break_glass: 'none',
  },
  presales_consultant: {
    pipeline_own: 'full', pipeline_all: 'none', deal_edit: 'full', demand_gen: 'none',
    dashboard_kpi: 'full', reports: 'read', qtree_session: 'full', export_xlsx: 'none',
    ref_data: 'none', fx_rates: 'none', doc_ai_monitor: 'none', qtree_config: 'none',
    sop_management: 'none', model_config: 'none', solution_catalog: 'none', template_library: 'none',
    user_management: 'none', system_health: 'none', excel_import: 'none', break_glass: 'none',
  },
  presales_sa: {
    pipeline_own: 'full', pipeline_all: 'none', deal_edit: 'full', demand_gen: 'none',
    dashboard_kpi: 'full', reports: 'read', qtree_session: 'full', export_xlsx: 'none',
    ref_data: 'none', fx_rates: 'none', doc_ai_monitor: 'none', qtree_config: 'none',
    sop_management: 'none', model_config: 'none', solution_catalog: 'none', template_library: 'none',
    user_management: 'none', system_health: 'none', excel_import: 'none', break_glass: 'none',
  },
  presales_manager: {
    pipeline_own: 'full', pipeline_all: 'full', deal_edit: 'none', demand_gen: 'read',
    dashboard_kpi: 'full', reports: 'full', qtree_session: 'none', export_xlsx: 'full',
    ref_data: 'none', fx_rates: 'none', doc_ai_monitor: 'none', qtree_config: 'none',
    sop_management: 'none', model_config: 'none', solution_catalog: 'none', template_library: 'none',
    user_management: 'none', system_health: 'none', excel_import: 'none', break_glass: 'none',
  },
  aws_alliance_manager: {
    pipeline_own: 'full', pipeline_all: 'full', deal_edit: 'none', demand_gen: 'none',
    dashboard_kpi: 'full', reports: 'full', qtree_session: 'none', export_xlsx: 'full',
    ref_data: 'none', fx_rates: 'none', doc_ai_monitor: 'none', qtree_config: 'none',
    sop_management: 'none', model_config: 'none', solution_catalog: 'none', template_library: 'none',
    user_management: 'none', system_health: 'none', excel_import: 'none', break_glass: 'none',
  },
  cro: {
    pipeline_own: 'full', pipeline_all: 'full', deal_edit: 'none', demand_gen: 'read',
    dashboard_kpi: 'full', reports: 'full', qtree_session: 'none', export_xlsx: 'full',
    ref_data: 'none', fx_rates: 'none', doc_ai_monitor: 'none', qtree_config: 'none',
    sop_management: 'none', model_config: 'none', solution_catalog: 'none', template_library: 'none',
    user_management: 'none', system_health: 'none', excel_import: 'none', break_glass: 'none',
  },
  finance_manager: {
    pipeline_own: 'read', pipeline_all: 'read', deal_edit: 'none', demand_gen: 'none',
    dashboard_kpi: 'full', reports: 'full', qtree_session: 'none', export_xlsx: 'full',
    ref_data: 'none', fx_rates: 'none', doc_ai_monitor: 'none', qtree_config: 'none',
    sop_management: 'none', model_config: 'none', solution_catalog: 'none', template_library: 'none',
    user_management: 'none', system_health: 'none', excel_import: 'none', break_glass: 'none',
  },
  sales_ops: {
    pipeline_own: 'read', pipeline_all: 'read', deal_edit: 'none', demand_gen: 'read',
    dashboard_kpi: 'full', reports: 'full', qtree_session: 'none', export_xlsx: 'full',
    ref_data: 'full', fx_rates: 'full', doc_ai_monitor: 'full', qtree_config: 'full',
    sop_management: 'full', model_config: 'full', solution_catalog: 'full', template_library: 'full',
    user_management: 'full', system_health: 'full', excel_import: 'full', break_glass: 'none',
  },
  admin: {
    pipeline_own: 'full', pipeline_all: 'full', deal_edit: 'full', demand_gen: 'full',
    dashboard_kpi: 'full', reports: 'full', qtree_session: 'full', export_xlsx: 'full',
    ref_data: 'full', fx_rates: 'full', doc_ai_monitor: 'full', qtree_config: 'full',
    sop_management: 'full', model_config: 'full', solution_catalog: 'full', template_library: 'full',
    user_management: 'full', system_health: 'full', excel_import: 'full', break_glass: 'full',
  },
  // Roles not in the wireframe RBAC matrix — minimal access
  sales_manager: {
    pipeline_own: 'full', pipeline_all: 'full', deal_edit: 'none', demand_gen: 'read',
    dashboard_kpi: 'full', reports: 'full', qtree_session: 'none', export_xlsx: 'full',
    ref_data: 'none', fx_rates: 'none', doc_ai_monitor: 'none', qtree_config: 'none',
    sop_management: 'none', model_config: 'none', solution_catalog: 'none', template_library: 'none',
    user_management: 'none', system_health: 'none', excel_import: 'none', break_glass: 'none',
  },
};

/** RBAC role display order matching wireframe columns */
export const RBAC_ROLE_COLUMNS = [
  'sdr', 'ae', 'presales_consultant', 'presales_sa', 'presales_manager',
  'aws_alliance_manager', 'cro', 'finance_manager', 'sales_ops', 'admin',
] as const;

export const RBAC_ROLE_SHORT_LABELS: Record<string, string> = {
  sdr: 'SDR',
  ae: 'AE',
  presales_consultant: 'PC',
  presales_sa: 'SA',
  presales_manager: 'Pre. Mgr',
  aws_alliance_manager: 'Alliance',
  cro: 'CRO',
  finance_manager: 'Finance',
  sales_ops: 'Sales Ops',
  admin: 'Sys Admin',
};

/** Permission groups for RBAC matrix display */
export const RBAC_PERMISSION_GROUPS: { group: string; permissions: { key: Permission; label: string }[] }[] = [
  {
    group: 'Application \u2014 Sales',
    permissions: [
      { key: 'pipeline_own', label: 'Pipeline \u2014 own records' },
      { key: 'pipeline_all', label: 'Pipeline \u2014 all records' },
      { key: 'deal_edit', label: 'Deal edit (inline + side panel)' },
      { key: 'demand_gen', label: 'Demand Gen / Lead pipeline' },
      { key: 'dashboard_kpi', label: 'Dashboard & KPI cards' },
      { key: 'reports', label: 'Reports (all 6 views)' },
      { key: 'qtree_session', label: 'Q Tree session (live discovery)' },
      { key: 'export_xlsx', label: 'Export (xlsx / SheetJS)' },
    ],
  },
  {
    group: 'Admin \u2014 Operations & AI Artifacts',
    permissions: [
      { key: 'ref_data', label: 'Reference Data (SLAs, weights)' },
      { key: 'fx_rates', label: 'FX Rates (manual override + sync)' },
      { key: 'doc_ai_monitor', label: 'Doc AI Monitor (acceptance stats)' },
      { key: 'qtree_config', label: 'Q Tree Config (upload, reorder)' },
      { key: 'sop_management', label: 'SOP Management (edit, rollback)' },
      { key: 'model_config', label: 'Model Config (Haiku/Sonnet/Opus)' },
      { key: 'solution_catalog', label: 'Solution Catalog (add, edit)' },
      { key: 'template_library', label: 'Template Library (upload, version)' },
    ],
  },
  {
    group: 'Admin \u2014 System',
    permissions: [
      { key: 'user_management', label: 'User Management (invite, roles)' },
      { key: 'system_health', label: 'System Health Monitor' },
      { key: 'excel_import', label: 'Excel Import (migration wizard)' },
      { key: 'break_glass', label: 'Break-Glass Management \uD83D\uDD12' },
    ],
  },
];
