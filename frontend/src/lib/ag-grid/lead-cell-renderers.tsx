import type { CustomCellRendererProps } from '@ag-grid-community/react';
import { useNavigate } from '@tanstack/react-router';
import { Check } from 'lucide-react';
import type { Lead, LeadStage, LeadMarket } from '@/types/leads';

// ---------------------------------------------------------------------------
// Shared helpers
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
// 1. LeadIdCellRenderer — clickable link, color by stage
// ---------------------------------------------------------------------------

const LEAD_ID_COLORS: Record<LeadStage, string> = {
  Graduated: 'var(--pp-lead-graduated-text)',
  'MQL Ready': 'var(--pp-lead-mql-text)',
  Engaged: 'inherit',
  Contacted: 'var(--pp-lead-contacted-text)',
};

export function LeadIdCellRenderer(props: CustomCellRendererProps<Lead, string>) {
  const navigate = useNavigate();
  const leadId = props.value;
  const stage = props.data?.lead_status ?? 'Contacted';
  if (!leadId) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const ctx = props.context as { onLeadOpen?: (id: string) => void } | undefined;
    if (ctx?.onLeadOpen) {
      ctx.onLeadOpen(leadId);
    } else {
      navigate({ to: '/demand-gen/leads/$leadId', params: { leadId } });
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      style={{
        ...MONO,
        fontSize: 'var(--pp-font-size-xs)',
        color: LEAD_ID_COLORS[stage],
        textDecoration: 'underline',
        textUnderlineOffset: '2px',
        background: 'transparent',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
      }}
    >
      {leadId}
    </button>
  );
}

// ---------------------------------------------------------------------------
// 2. LeadStageCellRenderer — 4-segment progress bar + stage pill
// ---------------------------------------------------------------------------

const SEGMENT_COLORS = [
  'var(--pp-lead-seg-1)',
  'var(--pp-lead-seg-2)',
  'var(--pp-lead-seg-3)',
  'var(--pp-lead-seg-4)',
];
const INACTIVE_SEGMENT = 'var(--pp-lead-seg-inactive)';

const STAGE_INDEX: Record<LeadStage, number> = {
  Contacted: 1,
  Engaged: 2,
  'MQL Ready': 3,
  Graduated: 4,
};

export const STAGE_PILL_COLORS: Record<LeadStage, { bg: string; text: string }> = {
  Contacted:   { bg: 'var(--pp-lead-contacted-bg)', text: 'var(--pp-lead-contacted-text)' },
  Engaged:     { bg: 'var(--pp-lead-engaged-bg)',   text: 'var(--pp-lead-engaged-text)' },
  'MQL Ready': { bg: 'var(--pp-lead-mql-bg)',       text: 'var(--pp-lead-mql-text)' },
  Graduated:   { bg: 'var(--pp-lead-graduated-bg)', text: 'var(--pp-lead-graduated-text)' },
};

export function LeadStageCellRenderer(props: CustomCellRendererProps<Lead, LeadStage>) {
  const navigate = useNavigate();
  const stage = props.value ?? 'Contacted';
  const level = STAGE_INDEX[stage];
  const dealId = props.data?.deal_id;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--pp-space-1)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--pp-space-1)' }}>
        <div
          style={{ display: 'flex', gap: 'var(--pp-space-0.5)' }}
          role="progressbar"
          aria-label="Lead stage progress"
          aria-valuemin={1}
          aria-valuemax={4}
          aria-valuenow={level}
          aria-valuetext={`${stage} (${level} of 4)`}
        >
          {SEGMENT_COLORS.map((color, i) => (
            <div
              key={i}
              style={{
                width: '16px',
                height: '4px',
                borderRadius: '2px',
                background: i < level ? color : INACTIVE_SEGMENT,
              }}
            />
          ))}
        </div>
        <span style={varPill(
          `--pp-lead-${stage === 'MQL Ready' ? 'mql' : stage.toLowerCase()}-bg`,
          `--pp-lead-${stage === 'MQL Ready' ? 'mql' : stage.toLowerCase()}-text`,
        )}>{stage}</span>
      </div>
      {stage === 'Graduated' && dealId && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            navigate({ to: '/pipeline/$dealId', params: { dealId } });
          }}
          style={{
            ...varPill('--pp-lead-graduated-bg', '--pp-lead-graduated-text'),
            cursor: 'pointer',
            border: 'none',
          }}
        >
          {dealId} ↗
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3. NTICPSignalRenderer — three signal dots (Need / Timeline / ICP)
// ---------------------------------------------------------------------------

export function NTICPSignalRenderer(props: CustomCellRendererProps<Lead>) {
  const data = props.data;
  if (!data) return null;

  const dots = [
    { active: data.pain_point_confirmed, title: 'Need/Pain confirmed' },
    { active: data.timeline != null, title: 'Timeline confirmed' },
    { active: data.dm_icp_confirmed === 'Decision Maker', title: 'ICP/DM confirmed' },
  ];

  return (
    <div style={{ display: 'inline-flex', gap: 'var(--pp-space-1)', alignItems: 'center' }}>
      {dots.map((dot, i) => (
        <div
          key={i}
          title={dot.title}
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: dot.active ? 'var(--pp-color-success-500)' : 'var(--pp-color-neutral-400)',
          }}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 4. ICPStarRenderer — 1–5 star rating
// ---------------------------------------------------------------------------

/** Shared star display for use outside AG Grid (drilldown panels, detail shells). */
export function renderICPStars(score: number | null, overridden = false): JSX.Element {
  if (score == null) {
    return <span style={{ color: 'var(--pp-color-neutral-400)', fontSize: 'var(--pp-font-size-sm)' }}>—</span>;
  }

  const filled = '★'.repeat(score);
  const empty = '★'.repeat(5 - score);

  return (
    <span style={{ fontSize: 'var(--pp-font-size-sm)', letterSpacing: '-1px' }}>
      <span style={{ color: 'var(--pp-color-warning-500)' }}>{filled}</span>
      <span style={{ color: 'var(--pp-color-neutral-300)' }}>{empty}</span>
      {overridden && <span style={{ color: 'var(--pp-color-primary-500)', fontSize: 'var(--pp-font-size-xs)', verticalAlign: 'super' }}>·</span>}
    </span>
  );
}

export function ICPStarRenderer(props: CustomCellRendererProps<Lead, number | null>) {
  return renderICPStars(props.value ?? null, props.data?.icp_score_overridden ?? false);
}

// ---------------------------------------------------------------------------
// 5. MeetingBadgeRenderer — checkmark or dash
// ---------------------------------------------------------------------------

export function MeetingBadgeRenderer(props: CustomCellRendererProps<Lead, boolean>) {
  const booked = props.value;
  if (booked) {
    return <Check className="size-4" style={{ color: 'var(--pp-color-success-500)' }} />;
  }
  return <span style={{ color: 'var(--pp-color-muted)' }}>—</span>;
}

// ---------------------------------------------------------------------------
// 6. CTYBadgeRenderer — market badge
// ---------------------------------------------------------------------------

const MARKET_COLORS: Record<LeadMarket, { bg: string; text: string }> = {
  SG: { bg: 'var(--pp-lead-market-sg-bg)', text: 'var(--pp-lead-market-sg-text)' },
  MY: { bg: 'var(--pp-lead-market-my-bg)', text: 'var(--pp-lead-market-my-text)' },
  PH: { bg: 'var(--pp-lead-market-ph-bg)', text: 'var(--pp-lead-market-ph-text)' },
  ID: { bg: 'var(--pp-lead-market-id-bg)', text: 'var(--pp-lead-market-id-text)' },
  IN: { bg: 'var(--pp-lead-market-in-bg)', text: 'var(--pp-lead-market-in-text)' },
};

const COUNTRY_FLAGS: Record<string, string> = {
  SG: '🇸🇬', PH: '🇵🇭', MY: '🇲🇾', ID: '🇮🇩', IN: '🇮🇳',
};

export function CTYBadgeRenderer(props: CustomCellRendererProps<Lead, LeadMarket>) {
  const code = props.value;
  if (!code) return null;
  const colors = MARKET_COLORS[code] ?? { bg: 'var(--pp-gtm-default-bg)', text: 'var(--pp-gtm-default-text)' };
  const flag = COUNTRY_FLAGS[code] ?? '';
  return <span style={pillStyle(colors.bg, colors.text)}>{flag} {code}</span>;
}

// ---------------------------------------------------------------------------
// 7. CompanyContactCellRenderer — 2-line cell
// ---------------------------------------------------------------------------

export function CompanyContactCellRenderer(props: CustomCellRendererProps<Lead, string>) {
  const data = props.data;
  if (!data) return null;
  return (
    <div style={{ lineHeight: '1.3' }}>
      <div style={{ fontWeight: 500, fontSize: 'var(--pp-font-size-sm)', color: 'var(--color-text-primary, inherit)' }}>
        {data.company_name}
      </div>
      <div style={{ fontSize: 'var(--pp-font-size-xs)', color: 'var(--pp-color-muted)', marginTop: '1px' }}>
        {data.contact_name} · {data.title_role}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 8. GTMMotionBadgeRenderer — colored pill for GTM Motion
// ---------------------------------------------------------------------------

const GTM_COLORS: Record<string, { bg: string; text: string }> = {
  'SAP Migration':  { bg: 'var(--pp-gtm-sap-bg)',     text: 'var(--pp-gtm-sap-text)' },
  'SCA GenAI':      { bg: 'var(--pp-gtm-genai-bg)',    text: 'var(--pp-gtm-genai-text)' },
  'VMware Exit':    { bg: 'var(--pp-gtm-vmware-bg)',   text: 'var(--pp-gtm-vmware-text)' },
  'MAP Lite':       { bg: 'var(--pp-gtm-map-bg)',      text: 'var(--pp-gtm-map-text)' },
  'Agentic AI':     { bg: 'var(--pp-gtm-agentic-bg)',  text: 'var(--pp-gtm-agentic-text)' },
  'Reconcile AI':   { bg: 'var(--pp-gtm-default-bg)',  text: 'var(--pp-gtm-default-text)' },
};

export function GTMMotionBadgeRenderer(props: CustomCellRendererProps<Lead, string>) {
  const motion = props.value;
  if (!motion) return null;
  const colors = GTM_COLORS[motion] ?? { bg: 'var(--pp-gtm-default-bg)', text: 'var(--pp-gtm-default-text)' };
  return <span style={pillStyle(colors.bg, colors.text)}>{motion}</span>;
}
