import { useNavigate } from '@tanstack/react-router';
import { cn } from '@/lib/utils';
import { STAGE_PILL_COLORS } from '@/lib/ag-grid/lead-cell-renderers';
import type { LeadsStats, LeadStage } from '@/types/leads';

interface LeadStatsBarProps {
  stats: LeadsStats;
  activeStage?: LeadStage | 'all' | null;
  onStatClick?: (stage: LeadStage | 'all') => void;
}

export function LeadStatsBar({ stats, activeStage, onStatClick }: LeadStatsBarProps) {
  const navigate = useNavigate();

  const items: Array<{
    label: string;
    value: string | number;
    className?: string;
    stage: LeadStage | 'all' | null;
    clickable: boolean;
  }> = [
    { label: 'Total leads', value: stats.total, stage: 'all', clickable: true },
    { label: 'Contacted', value: stats.contacted, stage: 'Contacted', clickable: true },
    {
      label: 'Engaged',
      value: stats.engaged,
      className: stats.engaged > 0 ? 'text-amber-600' : undefined,
      stage: 'Engaged',
      clickable: true,
    },
    {
      label: 'MQL Ready',
      value: stats.mql_ready,
      className: stats.mql_ready > 0 ? 'rounded-sm bg-[#EEEDFE] px-1.5 text-[#3C3489]' : undefined,
      stage: 'MQL Ready',
      clickable: true,
    },
    {
      label: 'Graduated',
      value: stats.graduated,
      className: stats.graduated > 0 ? 'text-[#0F6E56]' : undefined,
      stage: 'Graduated',
      clickable: true,
    },
    {
      label: 'Conv. rate',
      value: `${Math.round(stats.conversion_rate * 100)}%`,
      stage: null,
      clickable: false,
    },
  ];

  return (
    <div className="flex h-10 items-center gap-0 border-b bg-muted/30 px-3 text-sm">
      {items.map((item, i) => (
        <div key={item.label} className="flex items-center">
          {i > 0 && <div className="mx-3 h-4 w-px bg-border" />}
          {item.clickable ? (
            <button
              type="button"
              onClick={() => item.stage && onStatClick?.(item.stage)}
              className={cn(
                'flex items-center gap-0 border-none bg-transparent px-0',
                'cursor-pointer group',
                activeStage === item.stage
                  ? 'border-b-2'
                  : 'border-b-2 border-transparent',
              )}
              style={
                activeStage === item.stage && item.stage && item.stage !== 'all'
                  ? { borderBottomColor: STAGE_PILL_COLORS[item.stage as LeadStage]?.text }
                  : activeStage === 'all' && item.stage === 'all'
                    ? { borderBottomColor: '#534AB7' }
                    : {}
              }
            >
              <span className="text-muted-foreground">{item.label}</span>
              <span className={cn('ml-1.5 font-mono font-medium', item.className)}>
                {item.value}
              </span>
            </button>
          ) : (
            <>
              <span className="text-muted-foreground">{item.label}</span>
              <span className={cn('ml-1.5 font-mono font-medium', item.className)}>
                {item.value}
              </span>
            </>
          )}
        </div>
      ))}

      <div className="flex-1" />

      {stats.graduation_queue_count > 0 && (
        <button
          type="button"
          onClick={() => navigate({ to: '/demand-gen/graduation' })}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <span>Graduation Queue</span>
          <span className="cursor-pointer rounded-sm bg-[#EEEDFE] px-1.5 py-0.5 font-mono text-xs font-medium text-[#3C3489]">
            {stats.graduation_queue_count} ready ↗
          </span>
        </button>
      )}
    </div>
  );
}
