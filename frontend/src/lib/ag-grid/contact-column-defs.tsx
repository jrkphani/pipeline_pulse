import type { ColDef } from '@ag-grid-community/core';
import type { CustomCellRendererProps } from '@ag-grid-community/react';
import { Check } from 'lucide-react';
import type { Contact } from '@/types/contacts';
import { CONTACT_DEPARTMENTS } from '@/types/contacts';

// ---------------------------------------------------------------------------
// Default column definition
// ---------------------------------------------------------------------------

export const contactDefaultColDef: ColDef<Contact> = {
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

// ---------------------------------------------------------------------------
// Cell renderers (React components)
// ---------------------------------------------------------------------------

function AvatarRenderer(props: CustomCellRendererProps<Contact>) {
  const d = props.data;
  if (!d) return null;
  const initials = `${d.first_name?.[0] ?? ''}${d.last_name?.[0] ?? ''}`.toUpperCase();
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: '24px', height: '24px', borderRadius: '50%',
      background: 'oklch(0.606 0.25 292.717 / 0.15)', color: 'oklch(0.606 0.25 292.717)',
      fontSize: 'var(--pp-font-size-xs)', fontWeight: 600,
    }}>
      {initials}
    </span>
  );
}

function MarketRenderer(props: CustomCellRendererProps<Contact, string>) {
  const code = props.value;
  if (!code) return null;
  const flag = COUNTRY_FLAGS[code] ?? '';
  return <span style={{ fontSize: 'var(--pp-font-size-sm)' }}>{flag} {code}</span>;
}

function DMRenderer(props: CustomCellRendererProps<Contact, boolean>) {
  if (props.value) return <Check className="size-4" style={{ color: 'var(--pp-color-success-500)' }} />;
  return <span style={{ color: 'var(--pp-color-muted)' }}>—</span>;
}

function ICPRenderer(props: CustomCellRendererProps<Contact, number | null>) {
  const score = props.value;
  if (score == null) return <span style={{ color: 'var(--pp-color-neutral-400)' }}>—</span>;
  const filled = '\u2605'.repeat(score);
  const empty = '\u2605'.repeat(5 - score);
  return (
    <span style={{ fontSize: 'var(--pp-font-size-sm)', letterSpacing: '-1px' }}>
      <span style={{ color: 'var(--pp-color-warning-500)' }}>{filled}</span>
      <span style={{ color: 'var(--pp-color-neutral-300)' }}>{empty}</span>
    </span>
  );
}

const LEAD_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  Contacted: { bg: '#FAECE7', text: '#712B13' },
  Engaged: { bg: '#FAEEDA', text: '#633806' },
  'MQL Ready': { bg: '#EEEDFE', text: '#3C3489' },
  Graduated: { bg: '#EAF3DE', text: '#27500A' },
};

function LeadStatusRenderer(props: CustomCellRendererProps<Contact, string | null>) {
  const status = props.value;
  if (!status) {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', padding: '1px 8px',
        borderRadius: '9999px', fontSize: '11px', fontWeight: 500,
        background: '#F1EFE8', color: '#5F5E5A',
      }}>
        No lead
      </span>
    );
  }
  const c = LEAD_STATUS_COLORS[status] ?? { bg: '#F1EFE8', text: '#5F5E5A' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '1px 8px',
      borderRadius: '9999px', fontSize: '11px', fontWeight: 500,
      background: c.bg, color: c.text,
    }}>
      {status}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------

const checkboxCol: ColDef<Contact> = {
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

export const contactColumnDefs: ColDef<Contact>[] = [
  checkboxCol,
  {
    headerName: '',
    width: 40,
    editable: false,
    sortable: false,
    filter: false,
    cellRenderer: AvatarRenderer,
  },
  {
    field: 'full_name',
    headerName: 'Name',
    width: 150,
    editable: false,
    pinned: 'left',
    cellStyle: { ...contactDefaultColDef.cellStyle, fontWeight: 600, color: 'var(--pp-color-primary)', textDecoration: 'underline', textUnderlineOffset: '2px', cursor: 'pointer' },
  },
  {
    field: 'company_name',
    headerName: 'Company',
    width: 130,
    editable: false,
    cellStyle: { ...contactDefaultColDef.cellStyle, color: 'var(--pp-color-muted)' },
  },
  {
    field: 'title_role',
    headerName: 'Title',
    width: 120,
  },
  {
    field: 'market',
    headerName: 'CTY',
    width: 50,
    editable: false,
    cellRenderer: MarketRenderer,
  },
  {
    field: 'is_decision_maker',
    headerName: 'DM?',
    width: 45,
    cellRenderer: DMRenderer,
    cellEditor: 'agSelectCellEditor',
    cellEditorParams: { values: ['Yes', 'No'] },
    valueFormatter: (params) => params.value ? 'Yes' : 'No',
    valueParser: (params) => params.newValue === 'Yes',
  },
  {
    field: 'department',
    headerName: 'Dept',
    width: 80,
    cellEditor: 'agSelectCellEditor',
    cellEditorParams: { values: [...CONTACT_DEPARTMENTS] },
    valueFormatter: (params) => params.value ?? '—',
  },
  {
    field: 'icp_score',
    headerName: 'ICP',
    width: 65,
    editable: false,
    cellRenderer: ICPRenderer,
  },
  {
    field: 'lead_status',
    headerName: 'Lead Status',
    width: 90,
    editable: false,
    cellRenderer: LeadStatusRenderer,
  },
  {
    field: 'email',
    headerName: 'Email',
    width: 180,
    cellStyle: { ...contactDefaultColDef.cellStyle, ...MONO, fontSize: 'var(--pp-font-size-xs)' },
  },
  {
    field: 'phone',
    headerName: 'Phone',
    width: 110,
    valueFormatter: (params) => params.value ?? '—',
  },
];
