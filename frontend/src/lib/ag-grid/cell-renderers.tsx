import type { CustomCellRendererProps } from '@ag-grid-community/react';
import { useNavigate } from '@tanstack/react-router';
import type {
  Deal,
  SalesStage,
  FundingFlag,
  StageStatus,
  TriState,
} from '@/types/index';

// ---------------------------------------------------------------------------
// Shared pill helper
// ---------------------------------------------------------------------------

function pillStyle(bg: string, text: string): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '1px 8px',
    borderRadius: '9999px',
    fontSize: '12px',
    fontWeight: 500,
    lineHeight: '20px',
    whiteSpace: 'nowrap',
    backgroundColor: bg,
    color: text,
  };
}

function varPill(bgVar: string, textVar: string): React.CSSProperties {
  return pillStyle(`var(${bgVar})`, `var(${textVar})`);
}

const MONO: React.CSSProperties = {
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontWeight: 500,
};

// ---------------------------------------------------------------------------
// 1. SalesStage badge — text-based stages from Excel
// ---------------------------------------------------------------------------

const STAGE_COLORS: Record<SalesStage, { bg: string; text: string }> = {
  'New Hunt':            { bg: 'var(--pp-stage-1-bg)', text: 'var(--pp-stage-1-text)' },
  'Qualified':           { bg: 'var(--pp-stage-2-bg)', text: 'var(--pp-stage-2-text)' },
  'Proposal Submitted':  { bg: 'var(--pp-stage-3-bg)', text: 'var(--pp-stage-3-text)' },
  'FR Raised':           { bg: 'var(--pp-stage-4-bg)', text: 'var(--pp-stage-4-text)' },
  'Order Book':          { bg: 'var(--pp-stage-5-bg)', text: 'var(--pp-stage-5-text)' },
  'Closed Won':          { bg: '#E1F5EE', text: '#085041' },
  'Lost':                { bg: '#FEE2E2', text: '#991B1B' },
};

export function SalesStageCellRenderer(props: CustomCellRendererProps<Deal, SalesStage>) {
  const stage = props.value;
  if (!stage) return null;
  const c = STAGE_COLORS[stage] ?? { bg: 'transparent', text: 'inherit' };
  return <span style={pillStyle(c.bg, c.text)}>{stage}</span>;
}

// ---------------------------------------------------------------------------
// 2. PresalesStage — plain text with optional PS prefix
// ---------------------------------------------------------------------------

export function PresalesStageCellRenderer(props: CustomCellRendererProps<Deal, string>) {
  const stage = props.value;
  if (!stage) return <span style={{ color: 'var(--pp-color-muted)' }}>—</span>;
  return <span style={{ fontSize: 'var(--pp-font-size-sm)' }}>{stage}</span>;
}

// ---------------------------------------------------------------------------
// 3. SGD Value
// ---------------------------------------------------------------------------

export function SGDValueCellRenderer(props: CustomCellRendererProps<Deal, number>) {
  const value = props.value;
  if (value == null) return null;
  return (
    <span style={{ ...MONO, display: 'inline-flex', width: '100%', justifyContent: 'flex-end' }}>
      SGD {value.toLocaleString('en-SG')}
    </span>
  );
}

// ---------------------------------------------------------------------------
// 4. Days in Stage — color coded by health
// ---------------------------------------------------------------------------

export function DaysInStageCellRenderer(props: CustomCellRendererProps<Deal, number>) {
  const days = props.value;
  if (days == null) return null;
  const health = props.data?.stage_health ?? 'green';
  const isStalled = props.data?.is_stalled ?? false;
  return (
    <span style={{ ...MONO, color: `var(--pp-health-${health})` }}>
      {isStalled && '⚑ '}{days}d
    </span>
  );
}

// ---------------------------------------------------------------------------
// 5. PS Days in Stage — color coded by PS health
// ---------------------------------------------------------------------------

export function PSDaysInStageCellRenderer(props: CustomCellRendererProps<Deal, number | null>) {
  const days = props.value;
  if (days == null) return <span style={{ color: 'var(--pp-color-muted)' }}>—</span>;
  const health = props.data?.ps_stage_health ?? 'green';
  return (
    <span style={{ ...MONO, color: `var(--pp-health-${health})` }}>
      {days}d
    </span>
  );
}

// ---------------------------------------------------------------------------
// 6. Funding Flag badge (AWS Funded / Customer Funded)
// ---------------------------------------------------------------------------

export function FundingFlagCellRenderer(props: CustomCellRendererProps<Deal, FundingFlag>) {
  const flag = props.value;
  if (!flag) return null;
  const key = flag === 'AWS Funded' ? 'aws' : 'customer';
  return <span style={varPill(`--pp-fund-${key}-bg`, `--pp-fund-${key}-text`)}>{flag === 'AWS Funded' ? 'AWS' : 'Customer'}</span>;
}

// ---------------------------------------------------------------------------
// 7. Stage Status badge (In Progress / Planned / Blocked / Not Planned)
// ---------------------------------------------------------------------------

const STATUS_COLORS: Record<StageStatus, { bg: string; text: string }> = {
  'In Progress':  { bg: '#E6F1FB', text: '#0C447C' },
  'Planned':      { bg: '#FAEEDA', text: '#633806' },
  'Blocked':      { bg: '#FEE2E2', text: '#991B1B' },
  'Not Planned':  { bg: '#F1EFE8', text: '#5F5E5A' },
};

export function StageStatusCellRenderer(props: CustomCellRendererProps<Deal, StageStatus>) {
  const status = props.value;
  if (!status) return <span style={{ color: 'var(--pp-color-muted)' }}>—</span>;
  const c = STATUS_COLORS[status];
  return <span style={pillStyle(c.bg, c.text)}>{status}</span>;
}

// ---------------------------------------------------------------------------
// 8. TriState (Yes / No / TBD) — compact colored text
// ---------------------------------------------------------------------------

export function TriStateCellRenderer(props: CustomCellRendererProps<Deal, TriState>) {
  const val = props.value;
  if (!val) return <span style={{ color: 'var(--pp-color-muted)' }}>—</span>;
  const color = val === 'Yes' ? 'var(--pp-health-green)'
    : val === 'No' ? 'var(--pp-health-red)'
    : 'var(--pp-health-amber)';
  return <span style={{ fontWeight: 500, fontSize: 'var(--pp-font-size-sm)', color }}>{val}</span>;
}

// ---------------------------------------------------------------------------
// 9. Closure Confirmed — status string with icon
// ---------------------------------------------------------------------------

export function ClosureConfirmedCellRenderer(props: CustomCellRendererProps<Deal, string | null>) {
  const val = props.value;
  if (!val) return <span style={{ color: 'var(--pp-color-muted)' }}>—</span>;
  const isConfirmed = val.startsWith('✓');
  const isAwaiting = val.startsWith('⏳');
  const color = isConfirmed ? 'var(--pp-health-green)'
    : isAwaiting ? 'var(--pp-health-amber)'
    : 'inherit';
  return <span style={{ fontSize: 'var(--pp-font-size-sm)', fontWeight: 500, color }}>{val}</span>;
}

// ---------------------------------------------------------------------------
// 10. ACE ID
// ---------------------------------------------------------------------------

export function ACEIdCellRenderer(props: CustomCellRendererProps<Deal, string | null>) {
  const aceId = props.value;
  if (!aceId) {
    return (
      <span style={{ color: 'var(--pp-health-amber)', fontSize: 'var(--pp-font-size-sm)' }}>
        ⚠ ACE incomplete
      </span>
    );
  }
  return <span style={{ ...MONO, fontSize: 'var(--pp-font-size-sm)' }}>{aceId}</span>;
}

// ---------------------------------------------------------------------------
// 11. Country flag
// ---------------------------------------------------------------------------

const COUNTRY_FLAGS: Record<string, string> = {
  SG: '🇸🇬', PH: '🇵🇭', MY: '🇲🇾', ID: '🇮🇩', IN: '🇮🇳',
};

export function CountryCellRenderer(props: CustomCellRendererProps<Deal, string>) {
  const code = props.value;
  if (!code) return null;
  const flag = COUNTRY_FLAGS[code] ?? '';
  return <span style={{ fontSize: 'var(--pp-font-size-sm)' }}>{flag} {code}</span>;
}

// ---------------------------------------------------------------------------
// 12. Nullable text — shows em-dash for null
// ---------------------------------------------------------------------------

export function NullableTextCellRenderer(props: CustomCellRendererProps<Deal, string | null>) {
  const val = props.value;
  if (!val) return <span style={{ color: 'var(--pp-color-muted)' }}>—</span>;
  return <span style={{ fontSize: 'var(--pp-font-size-sm)' }}>{val}</span>;
}

// ---------------------------------------------------------------------------
// 13. Deal ID — navigable link
// ---------------------------------------------------------------------------

export function DealIdCellRenderer(props: CustomCellRendererProps<Deal, string>) {
  const navigate = useNavigate();
  const dealId = props.value;
  if (!dealId) return null;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        navigate({ to: '/pipeline/$dealId', params: { dealId } });
      }}
      style={{
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: 'var(--pp-font-size-xs)',
        fontWeight: 500,
        color: 'var(--pp-color-primary)',
        textDecoration: 'underline',
        textUnderlineOffset: '2px',
        background: 'transparent',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
      }}
    >
      {dealId}
    </button>
  );
}
