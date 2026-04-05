import { cn } from '@/lib/utils';
import type { ContactsStats } from '@/types/contacts';

interface ContactsStatsBarProps {
  stats: ContactsStats;
}

export function ContactsStatsBar({ stats }: ContactsStatsBarProps) {
  return (
    <div className="flex h-10 shrink-0 items-center gap-4 border-b bg-muted/20 px-4 text-xs">
      <StatPill label="Total" value={stats.total} />
      <StatPill label="Decision Makers" value={stats.decision_makers} color="text-[#085041]" bg="bg-[#E1F5EE]" />
      <StatPill label="With lead" value={stats.with_active_lead} color="text-[#3C3489]" bg="bg-[#EEEDFE]" />
      {stats.with_no_lead > 0 && (
        <StatPill label="No lead" value={stats.with_no_lead} color="text-amber-700" bg="bg-amber-50" />
      )}
      <div className="flex-1" />
      <span className="text-muted-foreground">
        {stats.recently_added} added last 30d
      </span>
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
