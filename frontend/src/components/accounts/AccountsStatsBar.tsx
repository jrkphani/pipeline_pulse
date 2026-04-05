import { cn } from '@/lib/utils';
import type { AccountsStats } from '@/types/accounts';

interface AccountsStatsBarProps {
  stats: AccountsStats;
}

const formatSGD = (v: number) => `S$ ${v.toLocaleString('en-SG')}`;

export function AccountsStatsBar({ stats }: AccountsStatsBarProps) {
  return (
    <div className="flex h-10 shrink-0 items-center gap-4 border-b bg-muted/20 px-4 text-xs">
      <StatPill label="Total" value={stats.total} />
      <StatPill label="Tier A" value={stats.tier_a} color="text-[#085041]" bg="bg-[#E1F5EE]" />
      <StatPill label="Tier B" value={stats.tier_b} color="text-[#633806]" bg="bg-[#FAEEDA]" />
      <StatPill label="Tier C" value={stats.tier_c} color="text-[#5F5E5A]" bg="bg-[#F1EFE8]" />
      <StatPill label="Untiered" value={stats.untiered} />
      <div className="flex-1" />
      <span className="font-mono text-xs font-medium" style={{ color: 'var(--pp-color-success-700)' }}>
        {formatSGD(stats.total_pipeline_sgd)}
      </span>
      {stats.accounts_with_no_pipeline > 0 && (
        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
          {stats.accounts_with_no_pipeline} with no pipeline
        </span>
      )}
    </div>
  );
}

function StatPill({ label, value, color, bg }: { label: string; value: number; color?: string; bg?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1', color)}>
      <span className="text-muted-foreground">{label}</span>
      <span className={cn('rounded-sm px-1.5 py-0.5 font-mono font-medium', bg ?? 'bg-muted/50')}>
        {value}
      </span>
    </span>
  );
}
