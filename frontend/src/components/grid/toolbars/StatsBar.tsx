import { cn } from '@/lib/utils';
import type { Deal, PipelineStats, UserRole } from '@/types/index';
import type { PipelineTab } from '../PipelineGrid';

function fmtSGD(value: number): string {
  return `SGD ${value.toLocaleString('en-SG')}`;
}

interface StatsBarProps {
  stats: PipelineStats;
  deals: Deal[];
  activeTab: PipelineTab;
  userRole?: UserRole;
}

export function StatsBar({ stats, deals, activeTab, userRole }: StatsBarProps) {
  const items: { label: string; value: string; accent?: boolean }[] = [];

  if (userRole === 'finance') {
    items.push(
      { label: 'Total pipeline', value: fmtSGD(stats.total_pipeline_sgd) },
      { label: 'Invoiced', value: fmtSGD(0) },
      { label: 'Overdue', value: '0' },
    );
  } else if (activeTab === 'alliance') {
    const cosellTotal = deals.reduce((sum, d) => sum + d.deal_value_sgd, 0);
    const dualFunded = deals.filter((d) => d.funding_type?.includes('MAP')).length;
    const withAce = deals.filter((d) => d.ace_id != null).length;
    const withMap = deals.filter((d) => d.map_status != null).length;
    const mapPct = deals.length > 0 ? Math.round((withMap / deals.length) * 100) : 0;
    items.push(
      { label: 'Co-sell pipeline', value: fmtSGD(cosellTotal) },
      { label: 'Dual-funded', value: String(dualFunded) },
      { label: 'ACE complete', value: `${withAce}/${deals.length}` },
      { label: 'MAP utilisation', value: `${mapPct}%` },
    );
  } else {
    items.push(
      { label: 'Total pipeline', value: fmtSGD(stats.total_pipeline_sgd) },
      { label: 'Weighted forecast', value: fmtSGD(stats.weighted_forecast_sgd) },
      { label: 'Deals', value: String(stats.deal_count) },
      { label: 'Stalled', value: String(stats.stalled_count), accent: stats.stalled_count > 0 },
    );
  }

  return (
    <div className="flex h-10 items-center gap-0 border-b bg-muted/30 px-3 text-sm">
      {items.map((item, i) => (
        <div key={item.label} className="flex items-center">
          {i > 0 && <div className="mx-3 h-4 w-px bg-border" />}
          <span className="text-muted-foreground">{item.label}</span>
          <span
            className={cn(
              'ml-1.5 font-mono font-medium',
              item.accent && 'rounded-sm bg-red-100 px-1.5 text-red-700',
            )}
          >
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}
