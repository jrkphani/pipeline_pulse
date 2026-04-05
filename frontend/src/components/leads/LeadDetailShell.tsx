import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  ChevronLeft,
  ChevronRight,
  User,
  TreeDeciduous,
  Clock,
  PenLine,
} from 'lucide-react';
import { useLeadsNavStore } from '@/stores/leads-nav.store';
import { cn } from '@/lib/utils';
import type { Lead, LeadActivity } from '@/types/leads';
import { QTreePanel } from './QTreePanel';
import { ActivityLog } from './ActivityLog';
import { ICPStarRenderer, STAGE_PILL_COLORS } from '@/lib/ag-grid/lead-cell-renderers';
import type { CustomCellRendererProps } from '@ag-grid-community/react';
import { Textarea } from '@/components/ui/textarea';

// ---------------------------------------------------------------------------
// Tab types
// ---------------------------------------------------------------------------

type LeadTab = 'overview' | 'qtree' | 'activity' | 'notes';

const TABS: { id: LeadTab; label: string; icon: typeof User }[] = [
  { id: 'overview', label: 'Overview', icon: User },
  { id: 'qtree', label: 'Q-Tree', icon: TreeDeciduous },
  { id: 'activity', label: 'Activity', icon: Clock },
  { id: 'notes', label: 'Notes', icon: PenLine },
];

// ---------------------------------------------------------------------------
// Progress bar segments (same as LeadStageCellRenderer)
// ---------------------------------------------------------------------------

const SEGMENT_COLORS = ['#D85A30', '#BA7517', '#534AB7', '#1D9E75'];
const INACTIVE_SEGMENT = '#D3D1C7';
const STAGE_INDEX: Record<string, number> = {
  Contacted: 1,
  Engaged: 2,
  'MQL Ready': 3,
  Graduated: 4,
};


// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface LeadDetailShellProps {
  lead: Lead;
  activities: LeadActivity[];
  onBack: () => void;
  onUpdate?: (updates: Partial<Lead>) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LeadDetailShell({ lead, activities, onBack, onUpdate }: LeadDetailShellProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<LeadTab>('qtree');
  const [notes, setNotes] = useState(lead.notes ?? '');

  // Prev/Next navigation
  const orderedLeadIds = useLeadsNavStore((s) => s.orderedLeadIds);
  const currentIndex = orderedLeadIds.indexOf(lead.lead_id);
  const prevId = currentIndex > 0 ? orderedLeadIds[currentIndex - 1] : null;
  const nextId = currentIndex < orderedLeadIds.length - 1 ? orderedLeadIds[currentIndex + 1] : null;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(tag)) return;
      if (e.key === 'ArrowLeft' && prevId) {
        navigate({ to: '/demand-gen/leads/$leadId', params: { leadId: prevId } });
      }
      if (e.key === 'ArrowRight' && nextId) {
        navigate({ to: '/demand-gen/leads/$leadId', params: { leadId: nextId } });
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [prevId, nextId, navigate]);

  const stageLevel = STAGE_INDEX[lead.lead_status] ?? 1;
  const stageColors = STAGE_PILL_COLORS[lead.lead_status] ?? { bg: '#F1EFE8', text: '#5F5E5A' };

  const handleUpdate = useCallback(
    (updates: Partial<Lead>) => {
      onUpdate?.(updates);
    },
    [onUpdate],
  );

  const handleNotesBlur = useCallback(() => {
    onUpdate?.({ notes: notes || null });
  }, [notes, onUpdate]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header strip */}
      <div className="flex h-12 shrink-0 items-center gap-3 border-b bg-muted/20 px-4">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
        </button>

        {/* Prev */}
        {prevId && (
          <button
            type="button"
            onClick={() => navigate({ to: '/demand-gen/leads/$leadId', params: { leadId: prevId } })}
            className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground"
            title="Previous lead (←)"
          >
            <ChevronLeft className="size-3" />
            Prev
          </button>
        )}

        {/* Position indicator */}
        {orderedLeadIds.length > 0 && (
          <span className="text-[10px] font-mono text-muted-foreground tabular-nums">
            {currentIndex + 1} / {orderedLeadIds.length}
          </span>
        )}

        {/* Next */}
        {nextId && (
          <button
            type="button"
            onClick={() => navigate({ to: '/demand-gen/leads/$leadId', params: { leadId: nextId } })}
            className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground"
            title="Next lead (→)"
          >
            Next
            <ChevronRight className="size-3" />
          </button>
        )}

        <span
          className="rounded px-2 py-0.5 font-mono text-xs font-medium"
          style={{ backgroundColor: stageColors.bg, color: stageColors.text }}
        >
          {lead.lead_id}
        </span>

        <span className="text-sm font-semibold">{lead.company_name}</span>
        <span className="text-sm text-muted-foreground">
          {lead.contact_name} · {lead.title_role}
        </span>

        <div className="flex-1" />

        {/* ICP Stars (display only) */}
        <ICPStarRenderer
          {...{ value: lead.icp_score, data: lead } as CustomCellRendererProps<Lead, number | null>}
        />

        {/* Stage progress */}
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {SEGMENT_COLORS.map((color, i) => (
              <div
                key={i}
                style={{
                  width: '14px',
                  height: '4px',
                  borderRadius: '2px',
                  background: i < stageLevel ? color : INACTIVE_SEGMENT,
                }}
              />
            ))}
          </div>
          <span
            className="rounded-full px-2 py-0.5 text-[11px] font-medium"
            style={{ backgroundColor: stageColors.bg, color: stageColors.text }}
          >
            {lead.lead_status}
          </span>
        </div>

        {lead.deal_id && (
          <button
            type="button"
            onClick={() => navigate({ to: '/pipeline/$dealId', params: { dealId: lead.deal_id! } })}
            className="rounded-full px-2 py-0.5 text-[11px] font-medium cursor-pointer"
            style={{ backgroundColor: 'var(--pp-color-graduated-bg)', color: '#27500A' }}
          >
            {lead.deal_id} ↗
          </button>
        )}
      </div>

      {/* Body: tab nav + content */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Vertical tab nav */}
        <div className="flex w-12 shrink-0 flex-col items-center gap-1 border-r bg-muted/10 py-3">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                title={tab.label}
                className={cn(
                  'flex size-9 items-center justify-center rounded-md transition-colors',
                  isActive
                    ? 'bg-[#EEEDFE] text-[#3C3489]'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                )}
              >
                <tab.icon className="size-4" />
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto min-w-0">
          <TabContent
            tab={activeTab}
            lead={lead}
            activities={activities}
            notes={notes}
            onNotesChange={setNotes}
            onNotesBlur={handleNotesBlur}
            onUpdate={handleUpdate}
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab content router
// ---------------------------------------------------------------------------

function TabContent({
  tab,
  lead,
  activities,
  notes,
  onNotesChange,
  onNotesBlur,
  onUpdate,
}: {
  tab: LeadTab;
  lead: Lead;
  activities: LeadActivity[];
  notes: string;
  onNotesChange: (v: string) => void;
  onNotesBlur: () => void;
  onUpdate: (updates: Partial<Lead>) => void;
}) {
  switch (tab) {
    case 'overview':
      return <OverviewTab lead={lead} />;
    case 'qtree':
      return <QTreePanel lead={lead} onUpdate={onUpdate} />;
    case 'activity':
      return (
        <div className="p-4">
          <h3 className="text-sm font-semibold mb-3">Activity Log</h3>
          <ActivityLog activities={activities} />
        </div>
      );
    case 'notes':
      return (
        <div className="p-6">
          <h3 className="text-sm font-semibold mb-3">Notes</h3>
          <Textarea
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            onBlur={onNotesBlur}
            placeholder="Add notes about this lead..."
            className="min-h-[200px] text-sm"
          />
        </div>
      );
  }
}

// ---------------------------------------------------------------------------
// Overview tab
// ---------------------------------------------------------------------------

function OverviewTab({ lead }: { lead: Lead }) {
  return (
    <div className="grid grid-cols-2 gap-4 p-6">
      {/* Identity & Contact */}
      <div className="rounded-lg border p-4 space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Identity & Contact
        </h4>
        <InfoRow label="Lead ID" value={lead.lead_id} mono />
        <InfoRow label="Company" value={lead.company_name} />
        <InfoRow label="Contact" value={lead.contact_name} />
        <InfoRow label="Title" value={lead.title_role} />
        <InfoRow label="Country" value={lead.country} />
        <InfoRow label="Email" value={lead.email} />
        <InfoRow label="Phone" value={lead.phone ?? '—'} />
        <InfoRow label="Date Added" value={lead.date_added} />
      </div>

      {/* Ownership & Campaign */}
      <div className="rounded-lg border p-4 space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Ownership & Campaign
        </h4>
        <InfoRow label="GTM Motion" value={lead.gtm_motion} />
        <InfoRow label="Campaign" value={lead.campaign_name ?? '—'} />
        <InfoRow label="Source" value={lead.lead_source_type} />
        <InfoRow label="SDR" value={lead.assigned_sdr} />
        <InfoRow label="Receiving Seller" value={lead.receiving_seller ?? '—'} />
        <InfoRow label="Market" value={lead.market} />
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn('font-medium', mono && 'font-mono text-xs')}>{value}</span>
    </div>
  );
}
