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
import { STAGE_PILL_COLORS, renderICPStars } from '@/lib/ag-grid/lead-cell-renderers';
import type { Lead, LeadStage } from '@/types/leads';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface LeadDrilldownPanelProps {
  leads: Lead[];
  stageFilter: LeadStage | 'all';
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const renderICP = renderICPStars;

function renderNTI(lead: Lead): JSX.Element {
  const n = lead.pain_point_confirmed;
  const t = lead.timeline !== null;
  const i = lead.dm_icp_confirmed === 'Decision Maker';

  const icon = (active: boolean) =>
    active
      ? <span className="text-[#3B6D11]">✓</span>
      : <span className="text-muted-foreground">─</span>;

  return (
    <span>
      N{icon(n)} T{icon(t)} I{icon(i)}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LeadDrilldownPanel({ leads, stageFilter, onClose }: LeadDrilldownPanelProps) {
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);

  const headerColors =
    stageFilter === 'all'
      ? { bg: 'hsl(var(--muted))', text: 'hsl(var(--muted-foreground))' }
      : STAGE_PILL_COLORS[stageFilter];

  const toggleExpand = (leadId: string) => {
    setExpandedLeadId((prev) => (prev === leadId ? null : leadId));
  };

  return (
    <div
      className="animate-slide-down mx-3 mb-1 overflow-hidden rounded-md border border-border"
      style={{ borderLeftWidth: '2px', borderLeftColor: headerColors.text }}
    >
      {/* Header */}
      <div
        className="flex h-10 items-center justify-between px-3"
        style={{ backgroundColor: headerColors.bg }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold" style={{ color: headerColors.text }}>
            {stageFilter === 'all' ? 'All leads' : `${stageFilter} leads`}
          </span>
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-mono font-medium"
            style={{ backgroundColor: 'white', color: headerColors.text }}
          >
            {leads.length}
          </span>
          {stageFilter !== 'all' && (
            <span
              className="rounded px-1.5 py-0.5 text-[10px] font-medium"
              style={{ backgroundColor: headerColors.bg, color: headerColors.text }}
            >
              {stageFilter}
            </span>
          )}
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Table */}
      <div className="max-h-64 overflow-y-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-muted/30 hover:bg-muted/30">
            <TableRow>
              <TableHead className="w-4 border-b border-border px-3 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground" />
              <TableHead className="border-b border-border px-3 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Company &middot; Contact
              </TableHead>
              <TableHead className="border-b border-border px-3 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Stage
              </TableHead>
              <TableHead className="border-b border-border px-3 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                ICP
              </TableHead>
              <TableHead className="border-b border-border px-3 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                N &middot; T &middot; I
              </TableHead>
              <TableHead className="border-b border-border px-3 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Last activity
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="px-3 py-6 text-center text-xs text-muted-foreground">
                  No leads at this stage.
                </TableCell>
              </TableRow>
            ) : (
              leads.map((lead) => {
                const isExpanded = expandedLeadId === lead.lead_id;
                const stageColor = STAGE_PILL_COLORS[lead.lead_status] ?? { bg: '#F1EFE8', text: '#5F5E5A' };

                return (
                  <LeadDrilldownRow
                    key={lead.lead_id}
                    lead={lead}
                    isExpanded={isExpanded}
                    stageColor={stageColor}
                    onToggle={() => toggleExpand(lead.lead_id)}
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
// Row sub-component (keeps the main component cleaner)
// ---------------------------------------------------------------------------

interface LeadDrilldownRowProps {
  lead: Lead;
  isExpanded: boolean;
  stageColor: { bg: string; text: string };
  onToggle: () => void;
}

function LeadDrilldownRow({ lead, isExpanded, stageColor, onToggle }: LeadDrilldownRowProps) {
  return (
    <>
      {/* Row A — summary */}
      <TableRow
        className="cursor-pointer border-b border-border transition-colors hover:bg-muted/30"
        onClick={onToggle}
      >
        <TableCell className="w-4 py-2 pl-3 pr-1 text-[10px] text-primary">
          {isExpanded ? '▼' : '▶'}
        </TableCell>
        <TableCell className="px-3 py-2 text-xs">
          <span className="font-medium">{lead.company_name}</span>
          <span className="ml-1 text-muted-foreground">&middot; {lead.contact_name}</span>
        </TableCell>
        <TableCell className="px-3 py-2">
          <span
            className="whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-medium"
            style={{ backgroundColor: stageColor.bg, color: stageColor.text }}
          >
            {lead.lead_status}
          </span>
        </TableCell>
        <TableCell className="px-3 py-2 text-xs">{renderICP(lead.icp_score)}</TableCell>
        <TableCell className="px-3 py-2 font-mono text-xs">{renderNTI(lead)}</TableCell>
        <TableCell className="px-3 py-2 text-xs text-muted-foreground">
          {lead.last_activity_date
            ? format(parseISO(lead.last_activity_date), 'dd MMM')
            : '—'}
        </TableCell>
      </TableRow>

      {/* Row B — expanded detail */}
      {isExpanded && (
        <TableRow className="border-b border-border bg-muted/10">
          <TableCell colSpan={6} className="px-4 pb-3 pt-0">
            <div
              className="rounded-sm pl-3"
              style={{ borderLeft: `2px solid ${stageColor.text}` }}
            >
              <div className="pt-2">
                {/* 3-column field grid */}
                <div className="mb-3 grid grid-cols-3 gap-x-4 gap-y-2">
                  <FieldCell label="Company" value={lead.company_name} />
                  <FieldCell label="Contact" value={lead.contact_name} />
                  <FieldCell label="ICP score">
                    {renderICP(lead.icp_score)}
                  </FieldCell>

                  <FieldCell label="GTM motion" value={lead.gtm_motion} />
                  <FieldCell label="N signal">
                    {lead.pain_point_confirmed
                      ? <span className="text-[#3B6D11]">✓ Need confirmed</span>
                      : <span className="text-muted-foreground">─ Pending</span>}
                  </FieldCell>
                  <FieldCell label="T signal">
                    {lead.timeline !== null
                      ? <span className="text-[#3B6D11]">✓ Timeline confirmed</span>
                      : <span className="text-muted-foreground">─ Pending</span>}
                  </FieldCell>

                  <FieldCell label="I signal">
                    {lead.dm_icp_confirmed === 'Decision Maker'
                      ? <span className="text-[#3B6D11]">✓ DM confirmed</span>
                      : <span className="text-muted-foreground">─ Pending</span>}
                  </FieldCell>
                  <FieldCell label="Last activity">
                    {lead.last_activity_date
                      ? format(parseISO(lead.last_activity_date), 'dd MMM yyyy')
                      : '—'}
                  </FieldCell>
                  <div />
                </div>

                {/* Action buttons */}
                <div className="mt-2 flex gap-2 border-t border-border pt-2">
                  <button
                    type="button"
                    className="rounded-md bg-[#534AB7] px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-[#3C3489]"
                    onClick={() => window.open(`/demand-gen/leads/${lead.lead_id}`, '_blank')}
                  >
                    Open Lead ↗
                  </button>
                  {lead.deal_id != null && (
                    <button
                      type="button"
                      className="rounded-md border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                      onClick={() => window.open(`/pipeline/${lead.deal_id}`, '_blank')}
                    >
                      Open Opportunity ↗
                    </button>
                  )}
                </div>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Field cell helper
// ---------------------------------------------------------------------------

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
