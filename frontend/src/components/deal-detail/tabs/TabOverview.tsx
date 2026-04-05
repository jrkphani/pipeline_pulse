import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DealDetailOverview, DealDetailAIFields } from '@/types/deal-detail';

interface TabOverviewProps {
  overview: DealDetailOverview;
  aiFields: DealDetailAIFields;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatSGD(value: number): string {
  return new Intl.NumberFormat('en-SG', { maximumFractionDigits: 0 }).format(value);
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function countryLabel(code: string): string {
  const map: Record<string, string> = {
    SG: 'Singapore', PH: 'Philippines', MY: 'Malaysia', ID: 'Indonesia', IN: 'India',
  };
  return map[code] ?? code;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TabOverview({ overview, aiFields }: TabOverviewProps) {
  return (
    <div>
      {/* Deal fields */}
      <section className="px-3 py-2.5 border-b">
        <h3 className="text-[8.5px] font-medium uppercase tracking-wider text-muted-foreground mb-2">
          Deal fields
        </h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          <Field label="Account" value={overview.account_name} />
          <Field label="Opportunity" value={overview.opportunity_name} />
          <Field label="Deal value" value={`SGD ${formatSGD(overview.deal_value_sgd)}`} mono />
          <Field label="Seller" value={overview.seller} />
          <Field label="GTM motion" value={overview.gtm_motion} />
          <Field label="Close date" value={formatDate(overview.close_date)} />
          <Field label="Funding type" value={overview.funding_type} />
          <Field label="Program" value={overview.program ?? '\u2014'} />
          <Field
            label="ACE ID"
            value={overview.ace_id ?? undefined}
            warning={overview.ace_status ?? undefined}
            mono
          />
          <Field
            label="Days in stage"
            value={`${overview.days_in_stage}d${overview.is_stalled ? ' \u2014 stalled' : ''}`}
            alert={overview.is_stalled}
            mono
          />
          <Field label="Lead source" value={overview.lead_source ?? '\u2014'} />
          <Field label="Country" value={countryLabel(overview.country)} />
        </div>
      </section>

      {/* AI fields */}
      {aiFields.fields.length > 0 && (
        <section className="px-3 py-2.5 border-b">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[8.5px] font-medium uppercase tracking-wider text-muted-foreground">
              AI fields &mdash; read only
            </h3>
            <span className="text-[7.5px] font-medium px-1.5 py-px rounded bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300">
              {aiFields.model_label} &middot; {aiFields.last_run}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {aiFields.fields.map((f) => (
              <AIField key={`${f.source}-${f.label}`} source={f.source} label={f.label} value={f.value} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Field atoms
// ---------------------------------------------------------------------------

interface FieldProps {
  label: string;
  value?: string;
  mono?: boolean;
  alert?: boolean;
  warning?: string;
}

function Field({ label, value, mono, alert, warning }: FieldProps) {
  return (
    <div className="flex flex-col gap-px">
      <span className="text-[9px] text-muted-foreground">{label}</span>
      {warning ? (
        <span className={cn('text-[11px] font-mono text-[10px] text-amber-700 dark:text-amber-400 flex items-center gap-1')}>
          <AlertTriangle className="h-3 w-3 shrink-0" />
          {warning}
        </span>
      ) : (
        <span className={cn(
          'text-[11px]',
          mono && 'font-mono',
          alert && 'text-red-600 dark:text-red-400 font-mono font-medium',
        )}>
          {value ?? '\u2014'}
        </span>
      )}
    </div>
  );
}

interface AIFieldProps {
  source: string;
  label: string;
  value: string;
}

function AIField({ source, label, value }: AIFieldProps) {
  // Check if value looks like a warning/partial
  const isPartial = value.toLowerCase().includes('partial') || value.toLowerCase().includes('medium');

  return (
    <div className="flex flex-col gap-px px-2 py-1.5 bg-muted/50 rounded">
      <span className="text-[7.5px] font-medium px-1 py-px rounded bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300 self-start mb-0.5">
        {source}
      </span>
      <span className="text-[9px] text-muted-foreground">{label}</span>
      <span className={cn(
        'text-[11px]',
        isPartial && 'text-amber-700 dark:text-amber-400',
      )}>
        {value}
      </span>
    </div>
  );
}
