import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SolutionFit } from '@/types/deal-detail';

interface TabSolutionFitProps {
  solutionFit: SolutionFit;
}

// ---------------------------------------------------------------------------
// Score ring color
// ---------------------------------------------------------------------------

function scoreColor(score: number): { text: string; border: string; bg: string } {
  if (score >= 80) return {
    text: 'text-green-700 dark:text-green-400',
    border: 'border-green-500',
    bg: 'bg-green-50 dark:bg-green-950',
  };
  if (score >= 50) return {
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-950',
  };
  return {
    text: 'text-red-600 dark:text-red-400',
    border: 'border-red-500',
    bg: 'bg-red-50 dark:bg-red-950',
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TabSolutionFit({ solutionFit: sf }: TabSolutionFitProps) {
  const colors = scoreColor(sf.score);

  return (
    <div>
      {/* Top summary bar */}
      <div className="flex items-center gap-3 px-3 py-3 border-b">
        {/* Score circle */}
        <div className={cn(
          'w-[38px] h-[38px] rounded-full flex items-center justify-center',
          'text-[9px] font-medium leading-tight text-center border-2 shrink-0',
          colors.bg, colors.border, colors.text,
        )}>
          {sf.fit_label.split(' ').map((w, i) => (
            <span key={i}>{i > 0 && <br />}{w}</span>
          ))}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-medium">
            {sf.fit_label} &mdash; {sf.primary_area}
          </div>
          <div className="text-[10px] text-muted-foreground">
            {sf.signals_confirmed} of {sf.signals_total} signals confirmed
            &middot; Q tree {sf.qtree_completion_pct}% complete
            {sf.score === 0 ? '' : ' \u00b7 TCO session required'}
          </div>
        </div>

        {/* Score number */}
        <div className="text-right shrink-0">
          <div className={cn('text-[18px] font-medium', colors.text)}>{sf.score}</div>
          <div className="text-[9px] text-muted-foreground">fit score / 100</div>
        </div>
      </div>

      {/* Capability chips */}
      {sf.capabilities.length > 0 && (
        <div className="flex gap-1 flex-wrap px-3 py-1.5 border-b">
          {sf.capabilities.map((cap) => (
            <span
              key={cap.name}
              className={cn(
                'px-2 py-0.5 rounded-full text-[9.5px] font-medium',
                cap.confirmed
                  ? 'bg-lime-100 text-lime-800 dark:bg-lime-950 dark:text-lime-400'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              {cap.name} {cap.confirmed ? '\u2713' : '\u2014'}
            </span>
          ))}
        </div>
      )}

      {/* Signal checklist */}
      {sf.signals.map((signal, i) => (
        <div
          key={i}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 text-[10.5px] border-b',
            i === sf.signals.length - 1 && 'border-b-0',
          )}
        >
          {signal.confirmed ? (
            <Check className="h-3 w-3 text-green-700 dark:text-green-500 shrink-0" />
          ) : (
            <X className="h-3 w-3 text-red-600 dark:text-red-400 shrink-0" />
          )}
          <span className={cn(!signal.confirmed && 'text-muted-foreground')}>
            {signal.text}
          </span>
          <span className="ml-auto text-[8.5px] text-muted-foreground shrink-0">
            {signal.source}
          </span>
        </div>
      ))}

      {/* CTA */}
      <div className="px-3 py-2.5 flex items-center gap-2">
        <button
          type="button"
          disabled={!sf.can_generate_proposal}
          className={cn(
            'px-3 py-1.5 rounded text-[11px] border-none',
            sf.can_generate_proposal
              ? 'bg-foreground text-background cursor-pointer hover:opacity-90'
              : 'bg-foreground/40 text-background opacity-45 cursor-not-allowed',
          )}
        >
          Generate Proposal & SOW
        </button>
        {sf.blocked_reason && (
          <div className="px-2 py-1 bg-muted border rounded text-[9.5px] text-muted-foreground">
            {sf.blocked_reason}
          </div>
        )}
      </div>
    </div>
  );
}
