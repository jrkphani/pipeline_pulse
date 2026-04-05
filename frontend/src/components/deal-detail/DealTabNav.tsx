import { useCallback, useMemo, useRef } from 'react';
import { cn } from '@/lib/utils';
import type { DealDetailTab, DealDetail } from '@/types/deal-detail';

// ---------------------------------------------------------------------------
// Tab definition — static shape, dynamic badges computed from deal data
// ---------------------------------------------------------------------------

interface TabDef {
  id: DealDetailTab;
  number: number;
  label: string;
  disabled?: boolean;
}

const TAB_DEFS: TabDef[] = [
  { id: 'overview', number: 1, label: 'Overview' },
  { id: 'timeline', number: 2, label: 'Timeline' },
  { id: 'qtree', number: 3, label: 'AI Q tree' },
  { id: 'solution-fit', number: 4, label: 'Solution Fit' },
  { id: 'tco', number: 5, label: 'TCO Session' },
  { id: 'documents', number: 6, label: 'Documents' },
  { id: 'revenue', number: 7, label: 'Revenue \u00b7 O2R' },
  { id: 'linked', number: 8, label: 'Linked records' },
  { id: 'proposal', number: 9, label: 'Proposal & SOW', disabled: true },
];

// ---------------------------------------------------------------------------
// Badge variants
// ---------------------------------------------------------------------------

type BadgeVariant = 'ok' | 'warn' | 'info' | 'dim';

interface Badge {
  label: string;
  variant: BadgeVariant;
}

const BADGE_CLASS: Record<BadgeVariant, string> = {
  ok: 'bg-lime-100 text-lime-800 dark:bg-lime-950 dark:text-lime-400',
  warn: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400',
  info: 'bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300',
  dim: 'opacity-40',
};

function computeBadge(tab: TabDef, deal: DealDetail): Badge | null {
  switch (tab.id) {
    case 'timeline':
      return deal.timeline.length > 0
        ? { label: String(deal.timeline.length), variant: 'ok' }
        : null;

    case 'qtree': {
      const groups = deal.qtree_groups.filter((g) => g.status === 'active');
      if (groups.length === 0) return null;
      const total = groups.reduce((s, g) => s + g.total_count, 0);
      const answered = groups.reduce((s, g) => s + g.answered_count, 0);
      if (total === 0) return null;
      const pct = Math.round((answered / total) * 100);
      return { label: `${pct}%`, variant: pct >= 100 ? 'ok' : 'warn' };
    }

    case 'solution-fit':
      return deal.solution_fit.score > 0
        ? { label: String(deal.solution_fit.score), variant: deal.solution_fit.score >= 80 ? 'ok' : 'warn' }
        : null;

    case 'documents':
      return { label: '2', variant: 'info' };

    case 'linked':
      return { label: 'dual', variant: 'info' };

    case 'proposal':
      return { label: 'locked', variant: 'dim' };

    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface DealTabNavProps {
  deal: DealDetail;
  activeTab: DealDetailTab;
  onTabChange: (tab: DealDetailTab) => void;
}

export function DealTabNav({ deal, activeTab, onTabChange }: DealTabNavProps) {
  const tabListRef = useRef<HTMLDivElement>(null);

  const enabledTabs = useMemo(
    () =>
      TAB_DEFS.filter(
        (tab) => !tab.disabled || deal.solution_fit.can_generate_proposal,
      ),
    [deal.solution_fit.can_generate_proposal],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
      e.preventDefault();

      const currentIdx = enabledTabs.findIndex((t) => t.id === activeTab);
      if (currentIdx === -1) return;

      const nextIdx =
        e.key === 'ArrowDown'
          ? (currentIdx + 1) % enabledTabs.length
          : (currentIdx - 1 + enabledTabs.length) % enabledTabs.length;

      const nextTab = enabledTabs[nextIdx];
      onTabChange(nextTab.id);

      const buttons = tabListRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]:not([disabled])');
      buttons?.[nextIdx]?.focus();
    },
    [activeTab, onTabChange, enabledTabs],
  );

  return (
    <nav
      ref={tabListRef}
      role="tablist"
      aria-label="Deal detail tabs"
      aria-orientation="vertical"
      onKeyDown={handleKeyDown}
      className="w-[130px] shrink-0 border-r bg-muted/30 overflow-y-auto"
    >
      {TAB_DEFS.map((tab) => {
        const isActive = activeTab === tab.id;
        const isDisabled = tab.disabled && !deal.solution_fit.can_generate_proposal;
        const badge = computeBadge(tab, deal);

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            disabled={isDisabled}
            className={cn(
              'flex w-full items-center gap-1.5 px-2.5 py-[7px] text-[10px] text-left border-l-2 border-l-transparent transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
              isActive && 'text-violet-700 dark:text-violet-300 font-medium border-l-violet-500 bg-background',
              !isActive && !isDisabled && 'text-muted-foreground hover:bg-background',
              isDisabled && 'opacity-40 cursor-default',
            )}
            onClick={() => !isDisabled && onTabChange(tab.id)}
          >
            <span className="text-[8.5px] text-muted-foreground w-[13px] text-right shrink-0">
              {tab.number}
            </span>
            <span className="flex-1 min-w-0 truncate">{tab.label}</span>
            {badge && (
              <span className={cn(
                'text-[7.5px] px-1 py-px rounded-full ml-auto shrink-0 whitespace-nowrap',
                BADGE_CLASS[badge.variant],
              )}>
                {badge.label}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
