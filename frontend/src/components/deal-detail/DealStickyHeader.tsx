import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DealDetail } from '@/types/deal-detail';

interface DealStickyHeaderProps {
  deal: DealDetail;
  onBack: () => void;
  onEdit: () => void;
  onAction: () => void;
}

// Badge color map for stage
const STAGE_BADGE_CLASS: Record<string, string> = {
  '1': 'bg-orange-50 text-orange-800 dark:bg-orange-950 dark:text-orange-300',
  '2': 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  '3': 'bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  '4': 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  '5': 'bg-lime-50 text-lime-800 dark:bg-lime-950 dark:text-lime-300',
};

function getStageBadgeClass(stageLabel: string): string {
  const num = stageLabel.charAt(0);
  return STAGE_BADGE_CLASS[num] ?? 'bg-muted text-muted-foreground';
}

export function DealStickyHeader({ deal, onBack, onEdit, onAction }: DealStickyHeaderProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap px-3 py-2 border-b bg-background">
      {/* Back button */}
      <button
        type="button"
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] shrink-0',
          'bg-muted text-muted-foreground hover:bg-background hover:text-foreground transition-colors',
        )}
        onClick={onBack}
      >
        <ArrowLeft className="h-3 w-3" />
        Pipeline
      </button>

      {/* Deal ID */}
      <span className="font-mono text-[9.5px] text-muted-foreground shrink-0">
        {deal.deal_id}
      </span>

      {/* Deal name */}
      <span className="text-[13px] font-medium flex-1 min-w-0 truncate">
        {deal.display_name}
      </span>

      {/* Stage badge */}
      <span className={cn(
        'inline-flex rounded-full px-2 py-0.5 text-[9px] font-medium shrink-0',
        getStageBadgeClass(deal.stage_label),
      )}>
        {deal.stage_label}
      </span>

      {/* Funding badge */}
      <span className="inline-flex rounded-full px-2 py-0.5 text-[9px] font-medium shrink-0 bg-violet-50 text-violet-800 dark:bg-violet-950 dark:text-violet-300">
        {deal.funding_flag === 'AWS Funded' ? 'AWS' : 'Customer'}
      </span>

      {/* Program badge (if applicable) */}
      {deal.program_badge && (
        <span className="inline-flex rounded-full px-2 py-0.5 text-[9px] font-medium shrink-0 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          {deal.program_badge}
        </span>
      )}

      {/* Days indicator */}
      <span className={cn(
        'font-mono text-[9.5px] font-medium shrink-0',
        deal.is_stalled ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground',
      )}>
        {deal.days_in_stage}d
        {deal.is_stalled && (
          <AlertTriangle className="inline h-3 w-3 ml-0.5 -mt-0.5" />
        )}
      </span>

      {/* Action buttons */}
      <div className="flex gap-1.5 shrink-0">
        <button
          type="button"
          className="px-2 py-1 text-[10px] border rounded bg-muted text-foreground hover:bg-background transition-colors"
          onClick={onEdit}
        >
          Edit opportunity
        </button>
        <button
          type="button"
          className="px-2.5 py-1 text-[10px] rounded bg-foreground text-background font-medium hover:opacity-90 transition-opacity"
          onClick={onAction}
        >
          {deal.action_label}
        </button>
      </div>
    </div>
  );
}
