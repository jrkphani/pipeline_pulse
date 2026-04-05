import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type {
  FunnelRecord,
  FunnelLeadRecord,
  FunnelDealRecord,
} from '@/mocks/mock-reports';
import { renderICPStars } from '@/lib/ag-grid/lead-cell-renderers';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface FunnelDrilldownPanelProps {
  stageLabel: string;
  stageColor: string;
  unit: 'leads' | 'deals';
  records: FunnelRecord[];
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Helpers (local — not exported)
// ---------------------------------------------------------------------------

const renderFunnelICP = renderICPStars;

function renderFunnelNTI(record: FunnelLeadRecord): JSX.Element {
  const icon = (v: boolean) =>
    v
      ? <span style={{ color: 'var(--pp-health-green)' }}>✓</span>
      : <span className="text-muted-foreground">─</span>;
  return (
    <span>
      N{icon(record.n_signal)} T{icon(record.t_signal)} I{icon(record.i_signal)}
    </span>
  );
}

interface FieldCellProps {
  label: string;
  value?: string;
  children?: React.ReactNode;
}

function FieldCell({ label, value, children }: FieldCellProps) {
  return (
    <div>
      <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="text-xs text-foreground">{children ?? value ?? '—'}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Expanded row — lead
// ---------------------------------------------------------------------------

function LeadExpandedRow({
  record,
  stageColor,
}: {
  record: FunnelLeadRecord;
  stageColor: string;
}) {
  return (
    <div className="pl-3 pt-2" style={{ borderLeft: `2px solid ${stageColor}` }}>
      <div className="mb-3 grid grid-cols-3 gap-x-4 gap-y-2">
        <FieldCell label="Company" value={record.company_name} />
        <FieldCell label="Contact" value={record.contact_name} />
        <FieldCell label="ICP score">{renderFunnelICP(record.icp_score)}</FieldCell>

        <FieldCell label="GTM motion" value={record.gtm_motion} />
        <FieldCell label="N signal">
          {record.n_signal
            ? <span className="text-[#3B6D11]">✓ Need confirmed</span>
            : <span className="text-muted-foreground">─ Pending</span>}
        </FieldCell>
        <FieldCell label="T signal">
          {record.t_signal
            ? <span className="text-[#3B6D11]">✓ Timeline confirmed</span>
            : <span className="text-muted-foreground">─ Pending</span>}
        </FieldCell>

        <FieldCell label="I signal">
          {record.i_signal
            ? <span className="text-[#3B6D11]">✓ DM confirmed</span>
            : <span className="text-muted-foreground">─ Pending</span>}
        </FieldCell>
        <FieldCell label="Last activity">
          {record.last_activity_date
            ? format(parseISO(record.last_activity_date), 'dd MMM')
            : '—'}
        </FieldCell>
        <div />
      </div>

      <div className="mt-2 flex gap-2 border-t border-border pt-2">
        <button
          type="button"
          className="rounded-md bg-[#534AB7] px-3 py-1 text-xs font-medium text-white hover:bg-[#3C3489]"
          onClick={() =>
            window.open(
              `/demand-gen/leads/${record.lead_id}?from=lead-to-close`,
              '_blank',
            )
          }
        >
          Open Lead ↗
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Expanded row — deal
// ---------------------------------------------------------------------------

function DealExpandedRow({
  record,
  stageColor,
}: {
  record: FunnelDealRecord;
  stageColor: string;
}) {
  const daysColor =
    record.days_in_stage > 21
      ? 'text-[#A32D2D] font-medium'
      : record.days_in_stage > 14
        ? 'text-[#854F0B] font-medium'
        : 'text-[#3B6D11] font-medium';

  return (
    <div className="pl-3 pt-2" style={{ borderLeft: `2px solid ${stageColor}` }}>
      <div className="mb-3 grid grid-cols-3 gap-x-4 gap-y-2">
        <FieldCell label="Account" value={record.account_name} />
        <FieldCell label="GTM motion" value={record.gtm_motion} />
        <FieldCell label="SGD value">
          <span className="font-mono text-xs">
            SGD {record.value_sgd.toLocaleString()}
          </span>
        </FieldCell>

        <FieldCell label="Stage" value={record.stage} />
        <FieldCell label="Seller" value={record.seller} />
        <FieldCell label="Days at stage">
          {record.days_in_stage > 0
            ? <span className={daysColor}>{record.days_in_stage}d</span>
            : '—'}
        </FieldCell>

        <div />
        <div />
        <div />
      </div>

      <div className="mt-2 flex gap-2 border-t border-border pt-2">
        <button
          type="button"
          className="rounded-md bg-[#534AB7] px-3 py-1 text-xs font-medium text-white hover:bg-[#3C3489]"
          onClick={() =>
            window.open(
              `/pipeline/${record.deal_id}?from=lead-to-close`,
              '_blank',
            )
          }
        >
          Open Deal ↗
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function FunnelDrilldownPanel({
  stageLabel,
  stageColor,
  unit,
  records,
  onClose,
}: FunnelDrilldownPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) =>
    setExpandedId((prev) => (prev === id ? null : id));

  const getId = (r: FunnelRecord) =>
    r.type === 'lead' ? r.lead_id : r.deal_id;

  return (
    <div className="animate-slide-down overflow-hidden rounded-md border border-border">
      {/* Header */}
      <div
        className="flex h-10 items-center justify-between border-b border-border px-3"
        style={{
          background: `${stageColor}26`,
          borderLeft: `2px solid ${stageColor}`,
        }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold" style={{ color: stageColor }}>
            {stageLabel}
          </span>
          <span className="rounded-full border border-border bg-background px-2 py-0.5 font-mono text-[10px]">
            {records.length}
          </span>
          <span className="rounded bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {unit === 'leads' ? 'leads' : 'deals'}
          </span>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Table */}
      <div className="max-h-64 overflow-y-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-muted/30">
            <TableRow>
              <TableHead className="w-4 border-b border-border px-3 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground" />
              {unit === 'leads' ? (
                <>
                  <TableHead className="border-b border-border px-3 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Company</TableHead>
                  <TableHead className="border-b border-border px-3 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Contact</TableHead>
                  <TableHead className="border-b border-border px-3 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">ICP</TableHead>
                  <TableHead className="border-b border-border px-3 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">N·T·I</TableHead>
                  <TableHead className="border-b border-border px-3 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Last activity</TableHead>
                </>
              ) : (
                <>
                  <TableHead className="border-b border-border px-3 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Account</TableHead>
                  <TableHead className="border-b border-border px-3 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">GTM motion</TableHead>
                  <TableHead className="border-b border-border px-3 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">SGD value</TableHead>
                  <TableHead className="border-b border-border px-3 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Days at stage</TableHead>
                  <TableHead className="border-b border-border px-3 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Seller</TableHead>
                </>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="px-3 py-6 text-center text-xs text-muted-foreground">
                  No records at this stage.
                </TableCell>
              </TableRow>
            ) : (
              records.map((record) => {
                const id = getId(record);
                const isExpanded = expandedId === id;

                return record.type === 'lead' ? (
                  <LeadRows
                    key={id}
                    record={record}
                    isExpanded={isExpanded}
                    stageColor={stageColor}
                    onToggle={() => toggleExpand(id)}
                  />
                ) : (
                  <DealRows
                    key={id}
                    record={record}
                    isExpanded={isExpanded}
                    stageColor={stageColor}
                    onToggle={() => toggleExpand(id)}
                  />
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Row fragments
// ---------------------------------------------------------------------------

function LeadRows({
  record,
  isExpanded,
  stageColor,
  onToggle,
}: {
  record: FunnelLeadRecord;
  isExpanded: boolean;
  stageColor: string;
  onToggle: () => void;
}) {
  return (
    <>
      <TableRow
        className="cursor-pointer border-b border-border transition-colors hover:bg-muted/30"
        onClick={onToggle}
      >
        <TableCell className="w-4 py-2 pl-3 pr-1 text-[10px] text-primary">
          {isExpanded ? '▼' : '▶'}
        </TableCell>
        <TableCell className="px-3 py-2 text-xs">
          <span className="font-medium">{record.company_name}</span>
        </TableCell>
        <TableCell className="px-3 py-2 text-xs text-muted-foreground">
          {record.contact_name}
        </TableCell>
        <TableCell className="px-3 py-2 text-xs">{renderFunnelICP(record.icp_score)}</TableCell>
        <TableCell className="px-3 py-2 text-xs">{renderFunnelNTI(record)}</TableCell>
        <TableCell className="px-3 py-2 text-xs text-muted-foreground">
          {record.last_activity_date
            ? format(parseISO(record.last_activity_date), 'dd MMM')
            : '—'}
        </TableCell>
      </TableRow>
      {isExpanded && (
        <TableRow className="border-b border-border bg-muted/10">
          <TableCell colSpan={6} className="px-4 pb-3 pt-0">
            <LeadExpandedRow record={record} stageColor={stageColor} />
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

function DealRows({
  record,
  isExpanded,
  stageColor,
  onToggle,
}: {
  record: FunnelDealRecord;
  isExpanded: boolean;
  stageColor: string;
  onToggle: () => void;
}) {
  const daysColor =
    record.days_in_stage > 21
      ? 'text-[#A32D2D] font-medium'
      : record.days_in_stage > 14
        ? 'text-[#854F0B] font-medium'
        : 'text-[#3B6D11] font-medium';

  return (
    <>
      <TableRow
        className="cursor-pointer border-b border-border transition-colors hover:bg-muted/30"
        onClick={onToggle}
      >
        <TableCell className="w-4 py-2 pl-3 pr-1 text-[10px] text-primary">
          {isExpanded ? '▼' : '▶'}
        </TableCell>
        <TableCell className="px-3 py-2 text-xs font-medium">{record.account_name}</TableCell>
        <TableCell className="px-3 py-2 text-xs text-muted-foreground">{record.gtm_motion}</TableCell>
        <TableCell className="px-3 py-2 font-mono text-xs">
          SGD {record.value_sgd.toLocaleString()}
        </TableCell>
        <TableCell className="px-3 py-2 text-xs">
          {record.days_in_stage > 0
            ? <span className={daysColor}>{record.days_in_stage}d</span>
            : '—'}
        </TableCell>
        <TableCell className="px-3 py-2 text-xs text-muted-foreground">{record.seller}</TableCell>
      </TableRow>
      {isExpanded && (
        <TableRow className="border-b border-border bg-muted/10">
          <TableCell colSpan={6} className="px-4 pb-3 pt-0">
            <DealExpandedRow record={record} stageColor={stageColor} />
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
