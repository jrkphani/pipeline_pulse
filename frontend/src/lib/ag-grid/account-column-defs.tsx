import type { ColDef } from '@ag-grid-community/core';
import type { CustomCellRendererProps } from '@ag-grid-community/react';
import { format, parseISO } from 'date-fns';
import type { Account } from '@/types/accounts';
import { STRATEGIC_TIERS, ACCOUNT_INDUSTRIES } from '@/types/accounts';
import { LEAD_MARKETS } from '@/types/leads';

// ---------------------------------------------------------------------------
// Default column definition
// ---------------------------------------------------------------------------

export const accountDefaultColDef: ColDef<Account> = {
  editable: true,
  resizable: true,
  sortable: true,
  filter: true,
  singleClickEdit: false,
  stopEditingWhenCellsLoseFocus: true,
  cellStyle: { display: 'flex', alignItems: 'center' },
};

// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------

const MONO: React.CSSProperties = {
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontWeight: 500,
};

const COUNTRY_FLAGS: Record<string, string> = {
  SG: '\u{1F1F8}\u{1F1EC}', PH: '\u{1F1F5}\u{1F1ED}', MY: '\u{1F1F2}\u{1F1FE}', ID: '\u{1F1EE}\u{1F1E9}', IN: '\u{1F1EE}\u{1F1F3}',
};

const TIER_COLORS: Record<string, { bg: string; text: string }> = {
  A: { bg: '#E1F5EE', text: '#085041' },
  B: { bg: '#FAEEDA', text: '#633806' },
  C: { bg: '#F1EFE8', text: '#5F5E5A' },
};

// ---------------------------------------------------------------------------
// Cell renderers (React components)
// ---------------------------------------------------------------------------

function MarketRenderer(props: CustomCellRendererProps<Account, string>) {
  const code = props.value;
  if (!code) return null;
  const flag = COUNTRY_FLAGS[code] ?? '';
  return <span style={{ fontSize: 'var(--pp-font-size-sm)' }}>{flag} {code}</span>;
}

function TierRenderer(props: CustomCellRendererProps<Account, string | null>) {
  const tier = props.value;
  if (!tier) return <span style={{ color: 'var(--pp-color-muted)' }}>—</span>;
  const c = TIER_COLORS[tier] ?? { bg: '#F1EFE8', text: '#5F5E5A' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '1px 8px',
      borderRadius: '9999px', fontSize: 'var(--pp-font-size-sm)', fontWeight: 600,
      background: c.bg, color: c.text,
    }}>
      {tier}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------

const checkboxCol: ColDef<Account> = {
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

export const accountColumnDefs: ColDef<Account>[] = [
  checkboxCol,
  {
    field: 'account_id',
    headerName: 'Account ID',
    width: 100,
    pinned: 'left',
    editable: false,
    lockVisible: true,
    cellStyle: { ...accountDefaultColDef.cellStyle, ...MONO, fontSize: 'var(--pp-font-size-xs)', color: 'var(--pp-color-primary)', textDecoration: 'underline', textUnderlineOffset: '2px', cursor: 'pointer' },
  },
  {
    field: 'company_name',
    headerName: 'Company',
    width: 160,
    cellStyle: { ...accountDefaultColDef.cellStyle, fontWeight: 600 },
  },
  {
    field: 'market',
    headerName: 'Market',
    width: 55,
    cellRenderer: MarketRenderer,
    cellEditor: 'agSelectCellEditor',
    cellEditorParams: { values: [...LEAD_MARKETS] },
  },
  {
    field: 'strategic_tier',
    headerName: 'Tier',
    width: 55,
    cellRenderer: TierRenderer,
    cellEditor: 'agSelectCellEditor',
    cellEditorParams: { values: [...STRATEGIC_TIERS] },
  },
  {
    field: 'industry',
    headerName: 'Industry',
    width: 120,
    cellEditor: 'agSelectCellEditor',
    cellEditorParams: { values: [...ACCOUNT_INDUSTRIES] },
  },
  {
    field: 'named_ae',
    headerName: 'Named AE',
    width: 90,
  },
  {
    field: 'open_lead_count',
    headerName: 'Leads',
    width: 55,
    editable: false,
    type: 'numericColumn',
    cellStyle: (params) => ({
      ...accountDefaultColDef.cellStyle,
      ...MONO,
      fontSize: 'var(--pp-font-size-sm)',
      justifyContent: 'flex-end',
      color: params.value > 0 ? 'var(--pp-color-primary-500)' : 'var(--pp-color-muted)',
    }),
  },
  {
    field: 'open_deal_count',
    headerName: 'Deals',
    width: 55,
    editable: false,
    type: 'numericColumn',
    cellStyle: (params) => ({
      ...accountDefaultColDef.cellStyle,
      ...MONO,
      fontSize: 'var(--pp-font-size-sm)',
      justifyContent: 'flex-end',
      color: params.value > 0 ? 'var(--pp-color-success-700)' : 'var(--pp-color-muted)',
    }),
  },
  {
    field: 'pipeline_sgd',
    headerName: 'Pipeline (SGD)',
    width: 120,
    editable: false,
    type: 'numericColumn',
    filter: 'agNumberColumnFilter',
    sort: 'desc',
    cellStyle: { ...accountDefaultColDef.cellStyle, ...MONO, justifyContent: 'flex-end' },
    valueFormatter: (params) => {
      if (!params.value) return '—';
      return `S$ ${Number(params.value).toLocaleString('en-SG')}`;
    },
  },
  {
    field: 'last_activity_date',
    headerName: 'Last Activity',
    width: 90,
    editable: false,
    valueFormatter: (params) => {
      if (!params.value) return '—';
      try { return format(parseISO(params.value as string), 'dd MMM'); }
      catch { return String(params.value); }
    },
  },
  {
    field: 'sourcing_sdr',
    headerName: 'SDR',
    width: 80,
    editable: false,
    cellStyle: { ...accountDefaultColDef.cellStyle, color: 'var(--pp-color-muted)' },
  },
];
