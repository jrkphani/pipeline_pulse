import { useState } from 'react';
import { ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DualTrack, TrackNodeStatus, PresalesBand } from '@/types/deal-detail';
import { PresalesBands } from './PresalesBands';

interface DualTrackCompactProps {
  dualTrack: DualTrack;
  presalesBands: PresalesBand[];
}

// ---- Commercial track node styles ----

const NODE_CLASSES: Record<TrackNodeStatus, string> = {
  done: 'bg-violet-500 border-violet-500',
  current: 'bg-violet-500 border-violet-500 ring-[3px] ring-violet-100 dark:ring-violet-900',
  pending: 'bg-background border-border',
  locked: 'bg-background border-dashed border-border',
};

const LINE_CLASSES: Record<'done' | 'pending', string> = {
  done: 'bg-violet-500',
  pending: 'bg-border',
};

// ---- Presales dot styles ----

function presalesDotClass(band: DualTrack['presales_bands'][number], idx: number): string {
  if (band.status === 'done') return 'bg-green-700 dark:bg-green-500';
  if (band.status === 'active') {
    if (idx < band.completed) return 'bg-amber-500';
    if (idx === band.completed) return 'bg-amber-500 ring-2 ring-amber-100 dark:ring-amber-900';
    return 'bg-border';
  }
  return 'bg-border';
}

function presalesSummary(band: DualTrack['presales_bands'][number]): { label: string; color: string } {
  if (band.status === 'done') return { label: `${band.completed}/${band.total} \u2713`, color: 'text-green-700 dark:text-green-500' };
  if (band.status === 'active') return { label: `${band.completed}/${band.total} active`, color: 'text-amber-700 dark:text-amber-400' };
  return { label: `0/${band.total}`, color: 'text-muted-foreground' };
}

export function DualTrackCompact({ dualTrack, presalesBands }: DualTrackCompactProps) {
  const [expanded, setExpanded] = useState(false);
  const { commercial_nodes, presales_bands, current_step_label, next_gate, stall_days } = dualTrack;

  return (
    <>
      {/* Compact bar — always visible */}
      <button
        type="button"
        className="w-full cursor-pointer border-b bg-muted/50 px-3 py-2 text-left hover:bg-muted/80 transition-colors"
        onClick={() => setExpanded((p) => !p)}
      >
        {/* Commercial track */}
        <div className="flex items-center gap-1 mb-1">
          <span className="text-[8px] font-medium uppercase tracking-wider px-1.5 py-px rounded bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300 shrink-0">
            Commercial
          </span>
          <div className="flex-1 flex items-center gap-0">
            {commercial_nodes.map((node, i) => (
              <div key={node.label} className="contents">
                <div className={cn('w-2.5 h-2.5 rounded-full border-[1.5px] shrink-0', NODE_CLASSES[node.status])} />
                {i < commercial_nodes.length - 1 && (
                  <div className={cn(
                    'h-[1.5px] flex-1',
                    node.status === 'done' && commercial_nodes[i + 1].status !== 'pending'
                      ? LINE_CLASSES.done
                      : LINE_CLASSES.pending,
                  )} />
                )}
              </div>
            ))}
          </div>
          <span className="text-[9px] text-muted-foreground ml-1.5 shrink-0 flex items-center gap-1">
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {expanded ? 'collapse presales' : 'expand presales'}
          </span>
        </div>

        {/* Stage labels */}
        <div className="flex pl-[70px] mb-0.5">
          {commercial_nodes.map((node) => (
            <span
              key={node.label}
              className={cn(
                'flex-1 text-[8px] text-center',
                node.status === 'current' ? 'text-violet-700 dark:text-violet-300 font-medium' :
                node.status === 'done' ? 'text-muted-foreground' : 'text-muted-foreground/60',
              )}
            >
              {node.label}
            </span>
          ))}
        </div>

        {/* Presales track */}
        <div className="flex items-start mt-0.5">
          <span className="text-[8px] font-medium uppercase tracking-wider px-1.5 py-px rounded bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 shrink-0 mt-px">
            Presales
          </span>
          <div className="flex-1 flex items-start">
            {presales_bands.map((band) => {
              const summary = presalesSummary(band);
              return (
                <div key={band.band_number} className="flex-1 flex flex-col items-center">
                  <div className="flex gap-0.5">
                    {Array.from({ length: band.total }, (_, i) => (
                      <div
                        key={i}
                        className={cn('w-1.5 h-1.5 rounded-full shrink-0', presalesDotClass(band, i))}
                      />
                    ))}
                  </div>
                  <span className={cn('text-[7px]', summary.color)}>{summary.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Status line */}
        <div className="flex items-center gap-1.5 mt-1 text-[8.5px] text-muted-foreground">
          <span className="text-amber-700 dark:text-amber-400 font-medium">
            Current: {current_step_label}
          </span>
          <span className="text-border">&middot;</span>
          <span>Next gate: {next_gate}</span>
          {stall_days != null && (
            <>
              <span className="ml-auto text-red-600 dark:text-red-400 font-medium flex items-center gap-0.5">
                <AlertTriangle className="h-2.5 w-2.5" />
                {stall_days}d stalled
              </span>
            </>
          )}
        </div>
      </button>

      {/* Expandable presales bands accordion */}
      {expanded && presalesBands.length > 0 && (
        <div className="border-b">
          <PresalesBands bands={presalesBands} />
        </div>
      )}
    </>
  );
}
