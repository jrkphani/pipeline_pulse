import type { ColDef, ColGroupDef } from '@ag-grid-community/core';
import { format, parseISO } from 'date-fns';
import type { Lead } from '@/types/leads';
import { LEAD_GTM_MOTIONS, LEAD_SOURCE_TYPES, LEAD_MARKETS } from '@/types/leads';
import { DateCellEditor } from './date-cell-editor';
import {
  LeadIdCellRenderer,
  LeadStageCellRenderer,
  NTICPSignalRenderer,
  ICPStarRenderer,
  MeetingBadgeRenderer,
  CTYBadgeRenderer,
  CompanyContactCellRenderer,
  GTMMotionBadgeRenderer,
} from './lead-cell-renderers';

// ---------------------------------------------------------------------------
// Default column definition for leads grid
// ---------------------------------------------------------------------------

export const leadDefaultColDef: ColDef<Lead> = {
  editable: true,
  resizable: true,
  sortable: true,
  filter: true,
  singleClickEdit: false,
  stopEditingWhenCellsLoseFocus: true,
  cellStyle: { display: 'flex', alignItems: 'center' },
};

// ---------------------------------------------------------------------------
// Group IDs
// ---------------------------------------------------------------------------

export const LEAD_GROUP_IDS = {
  IDENTITY: 'leadIdentity',
  GTM: 'leadGTM',
  SIGNALS: 'leadSignals',
  ACTIVITY: 'leadActivity',
  CONVERSION: 'leadConversion',
} as const;

export type LeadColumnGroupId = typeof LEAD_GROUP_IDS[keyof typeof LEAD_GROUP_IDS];

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const checkboxCol: ColDef<Lead> = {
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

function dateCol(field: keyof Lead, headerName: string, width = 78): ColDef<Lead> {
  return {
    field,
    headerName,
    width,
    cellEditor: DateCellEditor,
    valueFormatter: (params) => {
      if (!params.value) return '—';
      try { return format(parseISO(params.value as string), 'dd MMM'); }
      catch { return String(params.value); }
    },
  };
}

// ---------------------------------------------------------------------------
// Column Groups
// ---------------------------------------------------------------------------

const identityGroup: ColGroupDef<Lead> = {
  headerName: 'Identity',
  groupId: LEAD_GROUP_IDS.IDENTITY,
  children: [
    {
      field: 'company_name',
      headerName: 'Company · Contact',
      width: 160,
      cellRenderer: CompanyContactCellRenderer,
    },
    {
      field: 'country',
      headerName: 'CTY',
      width: 42,
      cellRenderer: CTYBadgeRenderer,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: { values: [...LEAD_MARKETS] },
    },
  ],
};

const gtmGroup: ColGroupDef<Lead> = {
  headerName: 'GTM & Source',
  groupId: LEAD_GROUP_IDS.GTM,
  children: [
    {
      field: 'gtm_motion',
      headerName: 'GTM Motion',
      width: 105,
      cellRenderer: GTMMotionBadgeRenderer,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: { values: [...LEAD_GTM_MOTIONS] },
    },
    {
      field: 'lead_source_type',
      headerName: 'Source',
      width: 100,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: { values: [...LEAD_SOURCE_TYPES] },
    },
  ],
};

const signalsGroup: ColGroupDef<Lead> = {
  headerName: 'ICP & Signals',
  groupId: LEAD_GROUP_IDS.SIGNALS,
  children: [
    {
      field: 'icp_score',
      headerName: 'ICP ★',
      width: 68,
      cellRenderer: ICPStarRenderer,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: { values: ['1', '2', '3', '4', '5'] },
      valueParser: (params) => {
        const val = Number(params.newValue);
        return val >= 1 && val <= 5 ? val : params.oldValue;
      },
    },
    {
      field: 'lead_status',
      headerName: 'Lead Status',
      width: 148,
      cellRenderer: LeadStageCellRenderer,
      editable: false,
    },
    {
      headerName: 'N·T·I',
      width: 62,
      cellRenderer: NTICPSignalRenderer,
      editable: false,
      sortable: false,
      filter: false,
      valueGetter: () => null,
    },
    {
      field: 'meeting_booked',
      headerName: 'Mtg?',
      width: 50,
      cellRenderer: MeetingBadgeRenderer,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: { values: ['Yes', 'No'] },
      valueFormatter: (params) => params.value ? 'Yes' : 'No',
      valueParser: (params) => params.newValue === 'Yes',
    },
  ],
};

const activityGroup: ColGroupDef<Lead> = {
  headerName: 'Activity',
  groupId: LEAD_GROUP_IDS.ACTIVITY,
  children: [
    {
      field: 'assigned_sdr',
      headerName: 'SDR',
      width: 90,
    },
    {
      field: 'attempt_count',
      headerName: 'Att',
      width: 40,
      editable: false,
      type: 'numericColumn',
      cellStyle: {
        ...leadDefaultColDef.cellStyle,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        justifyContent: 'flex-end',
      },
    },
    {
      ...dateCol('last_activity_date', 'Last Activity', 78),
    },
    {
      field: 'days_to_first_contact',
      headerName: 'DFC',
      width: 52,
      editable: false,
      type: 'numericColumn',
      cellStyle: {
        ...leadDefaultColDef.cellStyle,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        justifyContent: 'flex-end',
      },
      valueFormatter: (params) => params.value != null ? `${params.value}d` : '—',
    },
  ],
};

const conversionGroup: ColGroupDef<Lead> = {
  headerName: 'Conversion',
  groupId: LEAD_GROUP_IDS.CONVERSION,
  children: [
    {
      field: 'mql_approved_by',
      headerName: 'MQL Approved By',
      width: 110,
      editable: false,
      valueFormatter: (params) => params.value ?? '—',
    },
    {
      ...dateCol('mql_date', 'MQL Date', 80),
      editable: false,
    },
    {
      ...dateCol('handoff_date', 'Handoff', 80),
      editable: false,
    },
    {
      field: 'deal_id',
      headerName: 'Deal ID',
      width: 90,
      editable: false,
      valueFormatter: (params) => params.value ?? '—',
      cellStyle: (params) => {
        if (params.value) {
          return {
            ...leadDefaultColDef.cellStyle,
            color: 'var(--pp-lead-graduated-text)',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            fontWeight: 500,
            fontSize: '11px',
          };
        }
        return { ...leadDefaultColDef.cellStyle, color: 'hsl(var(--muted-foreground))' };
      },
    },
  ].map((col) => ({ ...col, hide: true })) as ColDef<Lead>[],
};

// ---------------------------------------------------------------------------
// Group → field mapping for visibility toggle
// ---------------------------------------------------------------------------

function extractFields(group: ColGroupDef<Lead>): (keyof Lead)[] {
  return (group.children as ColDef<Lead>[])
    .map((c) => c.field as keyof Lead | undefined)
    .filter((f): f is keyof Lead => f != null);
}

export const LEAD_GROUP_FIELD_MAP: Record<LeadColumnGroupId, (keyof Lead)[]> = {
  [LEAD_GROUP_IDS.IDENTITY]: extractFields(identityGroup),
  [LEAD_GROUP_IDS.GTM]: extractFields(gtmGroup),
  [LEAD_GROUP_IDS.SIGNALS]: extractFields(signalsGroup),
  [LEAD_GROUP_IDS.ACTIVITY]: extractFields(activityGroup),
  [LEAD_GROUP_IDS.CONVERSION]: extractFields(conversionGroup),
};

// ---------------------------------------------------------------------------
// Full column definitions for leads grid
// ---------------------------------------------------------------------------

export const leadColumnDefs: (ColDef<Lead> | ColGroupDef<Lead>)[] = [
  checkboxCol,
  {
    field: 'lead_id',
    headerName: 'Lead ID',
    width: 78,
    cellRenderer: LeadIdCellRenderer,
    editable: false,
    pinned: 'left',
    lockVisible: true,
  },
  identityGroup,
  gtmGroup,
  signalsGroup,
  activityGroup,
  conversionGroup,
];

// ---------------------------------------------------------------------------
// Group Pills config for StructuralToolbar
// ---------------------------------------------------------------------------

export interface LeadGroupPillConfig {
  id: LeadColumnGroupId;
  label: string;
  defaultVisible: boolean;
}

export const LEAD_GROUP_PILLS: LeadGroupPillConfig[] = [
  { id: LEAD_GROUP_IDS.IDENTITY, label: 'Identity', defaultVisible: true },
  { id: LEAD_GROUP_IDS.GTM, label: 'GTM & Source', defaultVisible: true },
  { id: LEAD_GROUP_IDS.SIGNALS, label: 'ICP & Signals', defaultVisible: true },
  { id: LEAD_GROUP_IDS.ACTIVITY, label: 'Activity', defaultVisible: true },
  { id: LEAD_GROUP_IDS.CONVERSION, label: 'Conversion', defaultVisible: false },
];

export function buildInitialLeadGroupVisibility(): Record<LeadColumnGroupId, boolean> {
  const map = {} as Record<LeadColumnGroupId, boolean>;
  for (const pill of LEAD_GROUP_PILLS) {
    map[pill.id] = pill.defaultVisible;
  }
  return map;
}
