import { AlertTriangle, Check } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import type { PresalesBand, BandStep, BandStatus } from '@/types/deal-detail';

interface PresalesBandsProps {
  bands: PresalesBand[];
}

// ---- Band header status badge ----

const STATUS_BADGE: Record<BandStatus, { label: string; className: string }> = {
  done: {
    label: '\u2713 Done',
    className: 'bg-lime-100 text-lime-800 dark:bg-lime-950 dark:text-lime-400',
  },
  active: {
    label: '\u25CF Active',
    className: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400',
  },
  pending: {
    label: 'Pending',
    className: 'bg-muted text-muted-foreground border border-border',
  },
};

// ---- Step dot ----

function stepDotClass(status: BandStep['status']): string {
  switch (status) {
    case 'done': return 'bg-green-700 dark:bg-green-500';
    case 'in_progress': return 'bg-amber-500';
    case 'current': return 'bg-amber-500 ring-[2.5px] ring-amber-100 dark:ring-amber-900';
    case 'pending': return 'bg-border';
  }
}

// ---- Band opacity for pending bands ----

function bandOpacity(band: PresalesBand): string {
  if (band.status === 'pending' && band.band_number === 4) return 'opacity-60';
  if (band.status === 'pending' && band.band_number >= 5) return 'opacity-40';
  return '';
}

export function PresalesBands({ bands }: PresalesBandsProps) {
  // Default open the active band
  const activeBandId = bands.find((b) => b.status === 'active')?.id;

  return (
    <Accordion
      type="single"
      collapsible
      defaultValue={activeBandId}
      className="border-none"
    >
      {bands.map((band) => {
        const badge = STATUS_BADGE[band.status];
        const completedCount = band.steps.filter((s) => s.status === 'done' || s.status === 'in_progress').length;
        const totalCount = band.steps.length;

        return (
          <AccordionItem
            key={band.id}
            value={band.id}
            className={cn(
              'border-b',
              bandOpacity(band),
              band.status === 'active' && 'border-l-[2.5px] border-l-amber-500',
            )}
          >
            <AccordionTrigger className="px-3 py-2 hover:bg-muted/50 hover:no-underline [&>svg]:h-3 [&>svg]:w-3">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className={cn('text-[8.5px] font-medium px-1.5 py-px rounded', badge.className)}>
                  {badge.label}
                </span>
                <span className={cn(
                  'text-[11px] font-medium',
                  band.status === 'active' && 'text-amber-800 dark:text-amber-300',
                  band.status === 'pending' && 'text-muted-foreground',
                )}>
                  {band.name}
                </span>
                <span className={cn(
                  'text-[9.5px]',
                  band.status === 'active' && band.steps.some((s) => s.blocker)
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-muted-foreground',
                )}>
                  {completedCount} / {totalCount}
                  {band.status === 'done' && band.total_days != null && ` complete \u00b7 ${band.total_days} days`}
                  {band.status === 'active' && band.steps.some((s) => s.blocker) && (
                    <> &middot; {band.steps.find((s) => s.status === 'current')?.name} pending</>
                  )}
                  {band.status === 'active' && band.steps.some((s) => s.blocker) && (
                    <span className="ml-1">
                      <AlertTriangle className="inline h-3 w-3 -mt-0.5" />
                    </span>
                  )}
                  {band.status === 'pending' && ` stages \u00b7 not started`}
                </span>
                {band.deliverable_summary && band.status === 'done' && (
                  <span className="text-[8.5px] px-1.5 py-px rounded bg-lime-100 text-lime-800 dark:bg-lime-950 dark:text-lime-400 ml-auto shrink-0">
                    {band.deliverable_summary}
                  </span>
                )}
              </div>
            </AccordionTrigger>

            {band.steps.length > 0 && (
              <AccordionContent className="px-3 pb-2 pt-0">
                <div className="flex flex-col pl-4">
                  {band.steps.map((step, i) => (
                    <StepRow key={step.name} step={step} isLast={i === band.steps.length - 1} />
                  ))}
                </div>
              </AccordionContent>
            )}
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}

// ---- Individual step row ----

function StepRow({ step, isLast }: { step: BandStep; isLast: boolean }) {
  const isCurrent = step.status === 'current';

  return (
    <div className={cn(
      'flex items-start gap-2 py-1.5',
      !isLast && 'border-b border-border/50',
      isCurrent && 'bg-muted/50 -mx-3 px-3 border-l-2 border-l-amber-500',
    )}>
      {/* Dot + connector line */}
      <div className="flex flex-col items-center pt-0.5 shrink-0">
        <div className={cn('w-[9px] h-[9px] rounded-full', stepDotClass(step.status))} />
        {!isLast && <div className="w-px flex-1 min-h-[12px] bg-border/50 mt-0.5" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className={cn(
          'text-[11px] font-medium',
          isCurrent && 'text-amber-800 dark:text-amber-300',
        )}>
          {step.name}
        </div>
        <div className="flex gap-2 flex-wrap text-[9.5px] text-muted-foreground">
          {step.owner && <span>{step.owner} ({step.owner_role})</span>}
          {step.sla_days != null && <span>SLA {step.sla_days}d</span>}
          {step.completed_at && <span>{step.completed_at}</span>}
          {step.deliverable && (
            <span className="text-[8.5px] px-1 py-px rounded bg-lime-100 text-lime-800 dark:bg-lime-950 dark:text-lime-400">
              {step.deliverable}
            </span>
          )}
        </div>
        {step.blocker && (
          <div className="text-[9px] text-red-600 dark:text-red-400 mt-0.5 flex items-center gap-1">
            <AlertTriangle className="h-2.5 w-2.5 shrink-0" />
            {step.blocker}
          </div>
        )}
        {step.unlock_hint && (
          <div className="text-[9px] text-violet-700 dark:text-violet-400 mt-0.5">
            {step.unlock_hint}
          </div>
        )}
      </div>

      {/* Done check */}
      {step.status === 'done' && (
        <Check className="h-3 w-3 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
      )}
    </div>
  );
}
