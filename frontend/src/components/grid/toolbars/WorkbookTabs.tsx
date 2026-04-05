import { useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import type { PipelineTab } from '../PipelineGrid';
import type { UserRole } from '@/types/index';

const TABS: { id: PipelineTab; label: string; accent?: boolean }[] = [
  { id: 'pipeline', label: 'Pipeline' },
  { id: 'closed', label: 'Closed deals' },
  { id: 'alliance', label: 'Alliance View \u2605', accent: true },
];

interface WorkbookTabsProps {
  activeTab: PipelineTab;
  onTabChange?: (tab: PipelineTab) => void;
  userRole: UserRole;
}

export function WorkbookTabs({ activeTab, onTabChange, userRole }: WorkbookTabsProps) {
  const tabListRef = useRef<HTMLDivElement>(null);

  const visibleTabs = TABS.filter((tab) => tab.id !== 'alliance' || userRole === 'am');

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();

      const currentIdx = visibleTabs.findIndex((t) => t.id === activeTab);
      if (currentIdx === -1) return;

      const nextIdx =
        e.key === 'ArrowRight'
          ? (currentIdx + 1) % visibleTabs.length
          : (currentIdx - 1 + visibleTabs.length) % visibleTabs.length;

      const nextTab = visibleTabs[nextIdx];
      onTabChange?.(nextTab.id);

      // Move focus to the newly active tab button
      const buttons = tabListRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
      buttons?.[nextIdx]?.focus();
    },
    [activeTab, onTabChange, visibleTabs],
  );

  return (
    <div
      ref={tabListRef}
      role="tablist"
      aria-label="Pipeline views"
      onKeyDown={handleKeyDown}
      className="flex h-12 items-end border-t bg-muted/30 overflow-x-auto whitespace-nowrap [&::-webkit-scrollbar]:hidden md:h-16"
    >
      {visibleTabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onTabChange?.(tab.id)}
            className={cn(
              'relative flex h-full shrink-0 items-center px-4 text-xs font-medium transition-colors',
              'border-r border-border',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
              isActive
                ? 'bg-background text-primary'
                : 'text-muted-foreground hover:bg-background/50 hover:text-foreground',
              tab.accent && !isActive && 'text-[var(--pp-stage-4-text)]',
              tab.accent && isActive && 'text-[var(--pp-stage-4-text)]',
            )}
          >
            {tab.label}
            {isActive && !tab.accent && (
              <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary" />
            )}
            {tab.accent && isActive && (
              <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[var(--pp-stage-4-text)]" />
            )}
          </button>
        );
      })}
    </div>
  );
}
