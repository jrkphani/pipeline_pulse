import type { ColDef, ColGroupDef } from '@ag-grid-community/core';
import { format, parseISO } from 'date-fns';
import type { Deal } from '@/types/index';
import { DateCellEditor } from './date-cell-editor';
import {
  SalesStageCellRenderer,
  PresalesStageCellRenderer,
  SGDValueCellRenderer,
  DaysInStageCellRenderer,
  PSDaysInStageCellRenderer,
  FundingFlagCellRenderer,
  StageStatusCellRenderer,
  TriStateCellRenderer,
  ClosureConfirmedCellRenderer,
  ACEIdCellRenderer,
  CountryCellRenderer,
  NullableTextCellRenderer,
  DealIdCellRenderer,
} from './cell-renderers';

// ---------------------------------------------------------------------------
// Default column definition
// ---------------------------------------------------------------------------
//
// ARIA NOTE (Brand Guide §11.3):
// AG Grid Community automatically adds role="columnheader" and derives
// aria-label from headerName on every column. This meets WCAG 2.1 AA for
// standard sortable/filterable headers and no headerComponent override is
// needed. A custom headerComponent would only be warranted if a column
// header gains interactive children beyond sort (e.g. an info tooltip or
// inline filter button). Flagged as “compliant — no action required”.
// ---------------------------------------------------------------------------

export const defaultColDef: ColDef<Deal> = {
  editable: true,
  resizable: true,
  sortable: true,
  filter: true,
  cellStyle: { display: 'flex', alignItems: 'center' },
};

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const checkboxCol: ColDef<Deal> = {
  headerCheckboxSelection: true,
  checkboxSelection: true,
  width: 40,
  maxWidth: 40,
  pinned: 'left',
  editable: false,
  sortable: false,
  filter: false,
  resizable: false,
  suppressHeaderMenuButton: true,
};

function dateCol(field: keyof Deal, headerName: string, width = 110): ColDef<Deal> {
  return {
    field,
    headerName,
    width,
    cellEditor: DateCellEditor,
    valueFormatter: (params) => {
      if (!params.value) return '—';
      try { return format(parseISO(params.value as string), 'dd MMM yyyy'); }
      catch { return String(params.value); }
    },
  };
}

// ---------------------------------------------------------------------------
// Group IDs — exported for use by Group Pills in PipelineGrid
// ---------------------------------------------------------------------------

export const GROUP_IDS = {
  IDENTITY: 'dealIdentity',
  REVENUE: 'revenue',
  VELOCITY: 'velocity',
  SALES_STAGE: 'salesStage',
  PRESALES_STAGE: 'presalesStage',
  DEPENDENCIES: 'dependencies',
} as const;

export type ColumnGroupId = typeof GROUP_IDS[keyof typeof GROUP_IDS];

// ---------------------------------------------------------------------------
// Frozen Anchor Columns — always visible, pinned left
// ---------------------------------------------------------------------------

const frozenAnchorCols: ColDef<Deal>[] = [
  { field: 'deal_id', headerName: 'Deal ID', width: 120, pinned: 'left', editable: false, lockVisible: true, cellRenderer: DealIdCellRenderer },
  { field: 'account_name', headerName: 'Account Name', pinned: 'left', width: 170 },
  { field: 'opportunity_name', headerName: 'Opportunity', pinned: 'left', width: 200 },
];

// ---------------------------------------------------------------------------
// Column Group 1: DEAL IDENTITY (remaining cols after frozen anchors)
// ---------------------------------------------------------------------------

const dealIdentityGroup: ColGroupDef<Deal> = {
  headerName: 'Deal Identity',
  groupId: GROUP_IDS.IDENTITY,
  children: [
    { field: 'country', headerName: 'CTY', width: 75, cellRenderer: CountryCellRenderer, columnGroupShow: 'open' },
    { field: 'seller', headerName: 'Seller', width: 100 },
    { field: 'presales_consultant', headerName: 'PC', width: 90, cellRenderer: NullableTextCellRenderer, columnGroupShow: 'open' },
    { field: 'swim_lane', headerName: 'Swim Lane', width: 140, cellRenderer: NullableTextCellRenderer, columnGroupShow: 'open' },
    { field: 'lead_source', headerName: 'Lead Source', width: 120, cellRenderer: NullableTextCellRenderer, columnGroupShow: 'open' },
    { field: 'funding_flag', headerName: 'Funding', width: 100, cellRenderer: FundingFlagCellRenderer },
    { field: 'gtm_motion', headerName: 'GTM Motion', width: 110, columnGroupShow: 'open' },
  ],
};

// ---------------------------------------------------------------------------
// Column Group 2: REVENUE (Excel cols Q–AE)
// ---------------------------------------------------------------------------

const revenueGroup: ColGroupDef<Deal> = {
  headerName: 'Revenue (SGD)',
  groupId: GROUP_IDS.REVENUE,
  children: [
    { field: 'deal_value_sgd', headerName: 'Deal Value (SGD)', width: 150, cellRenderer: SGDValueCellRenderer, type: 'numericColumn', filter: 'agNumberColumnFilter' },
    { field: 'deal_value_usd', headerName: 'Deal Value (USD)', width: 140, cellRenderer: SGDValueCellRenderer, type: 'numericColumn', filter: 'agNumberColumnFilter', columnGroupShow: 'open' },
    { field: 'total_fy', headerName: 'Total FY', width: 130, cellRenderer: SGDValueCellRenderer, type: 'numericColumn', filter: 'agNumberColumnFilter', columnGroupShow: 'open' },
    dateCol('close_date', 'Close Date', 110),
  ],
};

// ---------------------------------------------------------------------------
// Column Group 3: VELOCITY (days + health metrics)
// ---------------------------------------------------------------------------

const velocityGroup: ColGroupDef<Deal> = {
  headerName: 'Velocity',
  groupId: GROUP_IDS.VELOCITY,
  children: [
    { field: 'days_in_stage', headerName: 'Days', width: 80, cellRenderer: DaysInStageCellRenderer, editable: false, filter: 'agNumberColumnFilter',
      cellClassRules: {
        'pp-cell-health-green': (p) => p.data?.stage_health === 'green',
        'pp-cell-health-amber': (p) => p.data?.stage_health === 'amber',
        'pp-cell-health-red': (p) => p.data?.stage_health === 'red',
      },
    },
    { field: 'action_bucket', headerName: 'Action Bucket', width: 150, cellRenderer: NullableTextCellRenderer, columnGroupShow: 'open' },
    dateCol('target_date', 'Target Date', 110),
  ],
};

// ---------------------------------------------------------------------------
// Column Group 4: SALES STAGE (Excel cols AL–AQ)
// ---------------------------------------------------------------------------

const salesStageGroup: ColGroupDef<Deal> = {
  headerName: 'Sales Stage',
  groupId: GROUP_IDS.SALES_STAGE,
  children: [
    { field: 'sales_stage', headerName: 'Stage', width: 155, cellRenderer: SalesStageCellRenderer, editable: false },
  ],
};

// ---------------------------------------------------------------------------
// Column Group 5: PRESALES STAGE (Excel cols AR–AX) — hidden by default
// ---------------------------------------------------------------------------

const presalesStageGroup: ColGroupDef<Deal> = {
  headerName: 'Presales Stage',
  groupId: GROUP_IDS.PRESALES_STAGE,
  children: [
    { field: 'presales_stage', headerName: 'PS Stage', width: 160, cellRenderer: PresalesStageCellRenderer, editable: false, hide: true },
    { field: 'ps_days_in_stage', headerName: 'PS Days', width: 80, cellRenderer: PSDaysInStageCellRenderer, editable: false, filter: 'agNumberColumnFilter', hide: true },
    { field: 'stage_status', headerName: 'Status', width: 110, cellRenderer: StageStatusCellRenderer, hide: true },
    { field: 'stage_blocker', headerName: 'Blocker', width: 200, cellRenderer: NullableTextCellRenderer, hide: true, columnGroupShow: 'open' },
    { field: 'next_ps_stage', headerName: 'Next Stage', width: 150, cellRenderer: NullableTextCellRenderer, hide: true, columnGroupShow: 'open' },
    dateCol('eta_fr_po', 'ETA FR/PO', 110),
  ].map((col) => ({ ...col, hide: true })) as ColDef<Deal>[],
};

// ---------------------------------------------------------------------------
// Column Group 6: DEPENDENCIES (Excel cols AY–BL) — hidden by default
// ---------------------------------------------------------------------------

const dependenciesGroup: ColGroupDef<Deal> = {
  headerName: 'Dependencies',
  groupId: GROUP_IDS.DEPENDENCIES,
  children: [
    { field: 'sow_id', headerName: 'SOW ID', width: 140, cellRenderer: NullableTextCellRenderer },
    { field: 'tco', headerName: 'TCO', width: 60, cellRenderer: TriStateCellRenderer },
    { field: 'effort_est', headerName: 'Effort', width: 60, cellRenderer: TriStateCellRenderer },
    { field: 'fr_id', headerName: 'FR ID', width: 130, cellRenderer: NullableTextCellRenderer, columnGroupShow: 'open' },
    { field: 'po_id', headerName: 'PO ID', width: 130, cellRenderer: NullableTextCellRenderer, columnGroupShow: 'open' },
    { field: 'closure_confirmed', headerName: 'Closure', width: 160, cellRenderer: ClosureConfirmedCellRenderer, editable: false, columnGroupShow: 'open' },
  ].map((col) => ({ ...col, hide: true })) as ColDef<Deal>[],
};

// ---------------------------------------------------------------------------
// Group → child field mapping — used by Group Pills to toggle visibility
// ---------------------------------------------------------------------------

function extractFields(group: ColGroupDef<Deal>): string[] {
  return (group.children as ColDef<Deal>[])
    .map((c) => c.field as string | undefined)
    .filter((f): f is string => f != null);
}

export const GROUP_FIELD_MAP: Record<ColumnGroupId, string[]> = {
  [GROUP_IDS.IDENTITY]: extractFields(dealIdentityGroup),
  [GROUP_IDS.REVENUE]: extractFields(revenueGroup),
  [GROUP_IDS.VELOCITY]: extractFields(velocityGroup),
  [GROUP_IDS.SALES_STAGE]: extractFields(salesStageGroup),
  [GROUP_IDS.PRESALES_STAGE]: extractFields(presalesStageGroup),
  [GROUP_IDS.DEPENDENCIES]: extractFields(dependenciesGroup),
};

// ---------------------------------------------------------------------------
// Pipeline View — frozen anchors + 6 column groups (no actions)
// ---------------------------------------------------------------------------

export const pipelineColumnDefs: (ColDef<Deal> | ColGroupDef<Deal>)[] = [
  checkboxCol,
  ...frozenAnchorCols,
  dealIdentityGroup,
  revenueGroup,
  velocityGroup,
  salesStageGroup,
  presalesStageGroup,
  dependenciesGroup,
];

// ---------------------------------------------------------------------------
// Alliance View — ACE-specific columns
// ---------------------------------------------------------------------------

export const allianceColumnDefs: (ColDef<Deal> | ColGroupDef<Deal>)[] = [
  checkboxCol,
  { field: 'deal_id', headerName: 'Deal ID', width: 120, pinned: 'left', editable: false, lockVisible: true, cellRenderer: DealIdCellRenderer },
  { field: 'account_name', headerName: 'Account Name', pinned: 'left', width: 170 },
  { field: 'opportunity_name', headerName: 'Opportunity', pinned: 'left', width: 200 },
  { field: 'sales_stage', headerName: 'Stage', width: 155, cellRenderer: SalesStageCellRenderer, editable: false },
  { field: 'deal_value_sgd', headerName: 'Deal Value (SGD)', width: 150, cellRenderer: SGDValueCellRenderer, type: 'numericColumn', filter: 'agNumberColumnFilter' },
  { field: 'funding_flag', headerName: 'Funding', width: 100, cellRenderer: FundingFlagCellRenderer },
  { field: 'funding_type', headerName: 'Funding Type', width: 200 },
  { field: 'ace_id', headerName: 'ACE ID', width: 150, cellRenderer: ACEIdCellRenderer },
  {
    field: 'map_status',
    headerName: 'MAP Status',
    width: 120,
    cellRenderer: (params: { value: string | null }) => {
      const val = params.value;
      if (!val) return '—';
      const colors: Record<string, { bg: string; text: string }> = {
        Submitted: { bg: 'var(--pp-stage-2-bg)', text: 'var(--pp-stage-2-text)' },
        'Under Review': { bg: 'var(--pp-stage-3-bg)', text: 'var(--pp-stage-3-text)' },
        Approved: { bg: 'var(--pp-stage-4-bg)', text: 'var(--pp-stage-4-text)' },
      };
      const c = colors[val] ?? { bg: 'transparent', text: 'inherit' };
      return `<span style="display:inline-flex;align-items:center;padding:1px 8px;border-radius:9999px;font-size:12px;font-weight:500;background:${c.bg};color:${c.text}">${val}</span>`;
    },
  },
  { field: 'seller', headerName: 'Seller', width: 100 },
  dateCol('close_date', 'Close Date', 110),
];

// ---------------------------------------------------------------------------
// Finance View — read-only
// ---------------------------------------------------------------------------

export const financeColumnDefs: (ColDef<Deal> | ColGroupDef<Deal>)[] = [
  { field: 'account_name', headerName: 'Account Name', pinned: 'left', editable: false, width: 170 },
  { field: 'deal_value_sgd', headerName: 'Deal Value (SGD)', cellRenderer: SGDValueCellRenderer, type: 'numericColumn', filter: 'agNumberColumnFilter', editable: false, width: 150 },
  { field: 'sales_stage', headerName: 'Stage', cellRenderer: SalesStageCellRenderer, editable: false, width: 155 },
  { field: 'funding_flag', headerName: 'Funding', cellRenderer: FundingFlagCellRenderer, editable: false, width: 100 },
  { field: 'po_id', headerName: 'PO ID', width: 130, editable: false, cellRenderer: NullableTextCellRenderer },
  dateCol('close_date', 'Close Date', 110),
  { field: 'sow_id', headerName: 'SOW ID', width: 140, editable: false, cellRenderer: NullableTextCellRenderer },
  { field: 'closure_confirmed', headerName: 'Closure', width: 160, editable: false, cellRenderer: ClosureConfirmedCellRenderer },
];
