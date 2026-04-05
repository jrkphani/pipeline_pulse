import { useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { Lead, BudgetIndicator, TimelineOption, DMICPOption } from '@/types/leads';
import { BUDGET_INDICATORS, TIMELINE_OPTIONS, DM_ICP_OPTIONS } from '@/types/leads';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface QTreePanelProps {
  lead: Lead;
  onUpdate: (updates: Partial<Lead>) => void;
}

// ---------------------------------------------------------------------------
// AI Nudge logic
// ---------------------------------------------------------------------------

function getAINudge(lead: Lead): string | null {
  if (lead.mql_ready_auto) return null;
  if (lead.dm_icp_confirmed !== 'Decision Maker') {
    return 'Contact is an Influencer — suggest reaching DM via warm intro through AWS AM';
  }
  if (!lead.meeting_booked) {
    return 'No meeting yet — propose a 30-min executive briefing';
  }
  if (lead.timeline == null) {
    return 'Timeline unknown — recommend discovery call to qualify urgency';
  }
  if (lead.budget_indicator == null) {
    return 'Budget unconfirmed — use ROI/TCO framing in next touchpoint';
  }
  if (!lead.pain_point_confirmed) {
    return 'Pain point not confirmed — schedule deep-dive workshop';
  }
  return null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function QTreePanel({ lead, onUpdate }: QTreePanelProps) {
  const gate = lead.mql_gate;
  const criteriaCount = [
    gate.pain_point_confirmed,
    gate.timeline_filled,
    gate.dm_confirmed,
    gate.budget_indicator_filled,
    gate.meeting_booked,
  ].filter(Boolean).length;

  const progressPct = (criteriaCount / 5) * 100;
  const nudge = useMemo(() => getAINudge(lead), [lead]);

  const handleTogglePainPoint = useCallback(() => {
    onUpdate({ pain_point_confirmed: !lead.pain_point_confirmed });
  }, [lead.pain_point_confirmed, onUpdate]);

  const handleTimelineChange = useCallback(
    (value: string) => {
      onUpdate({ timeline: (value === '__clear' ? null : value) as TimelineOption | null });
    },
    [onUpdate],
  );

  const handleDMChange = useCallback(
    (value: string) => {
      onUpdate({ dm_icp_confirmed: (value === '__clear' ? null : value) as DMICPOption | null });
    },
    [onUpdate],
  );

  const handleBudgetChange = useCallback(
    (value: string) => {
      onUpdate({ budget_indicator: (value === '__clear' ? null : value) as BudgetIndicator | null });
    },
    [onUpdate],
  );

  const handleMeetingToggle = useCallback(() => {
    onUpdate({
      meeting_booked: !lead.meeting_booked,
      meeting_date: !lead.meeting_booked ? new Date().toISOString().slice(0, 10) : null,
    });
  }, [lead.meeting_booked, onUpdate]);

  return (
    <div className="space-y-6 p-6">
      {/* MQL Gate Progress */}
      <div className="rounded-lg border bg-muted/20 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">
            {criteriaCount} of 5 criteria met
          </span>
          <span className="text-sm font-mono text-muted-foreground">
            {Math.round(progressPct)}%
          </span>
        </div>
        <Progress value={progressPct} className="h-2" />
      </div>

      {/* IAT Qualification */}
      <div className="space-y-1">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          IAT Qualification
        </h3>

        {/* 1. Need / Pain point */}
        <CriterionRow
          met={gate.pain_point_confirmed}
          label="Need / Pain point confirmed"
        >
          <button
            type="button"
            onClick={handleTogglePainPoint}
            className={cn(
              'mt-1 rounded border px-3 py-1 text-xs font-medium transition-colors',
              lead.pain_point_confirmed
                ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                : 'border-border bg-background text-muted-foreground hover:bg-muted/50',
            )}
          >
            {lead.pain_point_confirmed ? 'Confirmed ✓' : 'Not confirmed — click to confirm'}
          </button>
        </CriterionRow>

        {/* 2. Timeline */}
        <CriterionRow met={gate.timeline_filled} label="Timeline confirmed">
          <Select
            value={lead.timeline ?? '__clear'}
            onValueChange={handleTimelineChange}
          >
            <SelectTrigger className="mt-1 h-8 w-56 text-xs">
              <SelectValue placeholder="Select timeline" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__clear">— Not set —</SelectItem>
              {TIMELINE_OPTIONS.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CriterionRow>

        {/* 3. DM / Influencer */}
        <CriterionRow met={gate.dm_confirmed} label="DM / Influencer identified">
          <Select
            value={lead.dm_icp_confirmed ?? '__clear'}
            onValueChange={handleDMChange}
          >
            <SelectTrigger className="mt-1 h-8 w-56 text-xs">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__clear">— Not set —</SelectItem>
              {DM_ICP_OPTIONS.map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CriterionRow>

        {/* 4. Budget */}
        <CriterionRow met={gate.budget_indicator_filled} label="Budget indicator">
          <Select
            value={lead.budget_indicator ?? '__clear'}
            onValueChange={handleBudgetChange}
          >
            <SelectTrigger className="mt-1 h-8 w-56 text-xs">
              <SelectValue placeholder="Select budget" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__clear">— Not set —</SelectItem>
              {BUDGET_INDICATORS.map((b) => (
                <SelectItem key={b} value={b}>{b}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CriterionRow>

        {/* 5. Meeting booked */}
        <CriterionRow met={gate.meeting_booked} label="Meeting booked">
          <button
            type="button"
            onClick={handleMeetingToggle}
            className={cn(
              'mt-1 rounded border px-3 py-1 text-xs font-medium transition-colors',
              lead.meeting_booked
                ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                : 'border-border bg-background text-muted-foreground hover:bg-muted/50',
            )}
          >
            {lead.meeting_booked ? `Booked ✓ · ${lead.meeting_date ?? ''}` : 'No — click to book'}
          </button>
        </CriterionRow>
      </div>

      {/* AI Nudge */}
      {nudge && (
        <div className="rounded-lg border border-[#AFA9EC] bg-[#EEEDFE] p-4">
          <div className="flex items-start gap-2">
            <span className="text-sm">✦</span>
            <div>
              <p className="text-sm font-medium text-[#3C3489]">AI Nudge</p>
              <p className="mt-1 text-xs text-[#3C3489]/80">{nudge}</p>
            </div>
          </div>
        </div>
      )}

      {/* Next Action */}
      <div className="rounded-lg border bg-muted/10 p-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Next Action
        </h4>
        <p className="text-sm text-foreground">
          {lead.mql_ready_auto
            ? 'Lead is MQL Ready — awaiting CRO/AE approval in Graduation Queue'
            : 'Continue qualification activities'}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Criterion row sub-component
// ---------------------------------------------------------------------------

interface CriterionRowProps {
  met: boolean;
  label: string;
  children: React.ReactNode;
}

function CriterionRow({ met, label, children }: CriterionRowProps) {
  return (
    <div className="flex gap-3 rounded-md border bg-background p-3">
      <div
        className={cn(
          'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-bold',
          met
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-red-100 text-red-600',
        )}
      >
        {met ? '✓' : '○'}
      </div>
      <div className="flex-1">
        <span className="text-sm font-medium">{label}</span>
        {children}
      </div>
    </div>
  );
}
