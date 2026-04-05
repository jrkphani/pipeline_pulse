import { useState } from 'react';
import { ChevronDown, ChevronRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { QTreeGroup, QTreeQuestion, QStatus } from '@/types/deal-detail';

interface TabQTreeProps {
  groups: QTreeGroup[];
}

// ---------------------------------------------------------------------------
// Q status dot
// ---------------------------------------------------------------------------

function statusIcon(status: QStatus) {
  switch (status) {
    case 'answered':
      return (
        <div className="w-[13px] h-[13px] rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center shrink-0">
          <Check className="h-2 w-2 text-emerald-700 dark:text-emerald-400" />
        </div>
      );
    case 'active':
      return <div className="w-[13px] h-[13px] rounded-full bg-violet-500 shrink-0" />;
    case 'locked':
    case 'pending':
      return <div className="w-[13px] h-[13px] rounded-full bg-border shrink-0" />;
  }
}

// ---------------------------------------------------------------------------
// Summary color
// ---------------------------------------------------------------------------

function summaryClass(group: QTreeGroup): string {
  if (group.status === 'not_started') return 'text-muted-foreground';
  if (group.answered_count === group.total_count) return 'text-green-700 dark:text-green-500';
  return 'text-amber-700 dark:text-amber-400';
}

// ---------------------------------------------------------------------------
// Format datetime
// ---------------------------------------------------------------------------

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const time = d.toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${date}, ${time} SGT`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TabQTree({ groups }: TabQTreeProps) {
  // Track which groups are expanded (active groups default open)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    () => new Set(groups.filter((g) => g.status === 'active').map((g) => g.id)),
  );

  const toggleGroup = (id: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Compute overall progress for the header bar
  const activeGroups = groups.filter((g) => g.status === 'active');
  const totalQ = activeGroups.reduce((s, g) => s + g.total_count, 0);
  const answeredQ = activeGroups.reduce((s, g) => s + g.answered_count, 0);
  const pct = totalQ > 0 ? Math.round((answeredQ / totalQ) * 100) : 0;
  const topDomain = activeGroups[0];

  return (
    <div>
      {/* Progress header */}
      {topDomain && (
        <div className="px-3 py-2 border-b">
          <div className="flex items-center gap-1.5 mb-1.5 text-[9.5px] text-muted-foreground">
            <span className="w-[5px] h-[5px] rounded-full bg-emerald-500 inline-block" />
            Domain auto-detected: {topDomain.name.replace(' discovery', '')}
            {topDomain.domain_confidence != null && ` (${topDomain.domain_confidence}%)`}
            &middot; Bedrock Sonnet
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-violet-500 rounded-full transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[9.5px] text-muted-foreground whitespace-nowrap">
              <strong className="text-violet-700 dark:text-violet-300">{answeredQ} of {totalQ}</strong> questions answered
            </span>
          </div>
        </div>
      )}

      {/* Question groups */}
      {groups.map((group) => {
        const isExpanded = expandedGroups.has(group.id);
        const isNotStarted = group.status === 'not_started';

        return (
          <div key={group.id} className={cn(isNotStarted && 'opacity-50')}>
            {/* Group header */}
            <button
              type="button"
              className="flex w-full items-center gap-1.5 px-3 py-2 border-b hover:bg-muted/50 transition-colors text-left"
              onClick={() => toggleGroup(group.id)}
            >
              {isExpanded
                ? <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
                : <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
              }
              <span className="text-[11px] font-medium flex-1">{group.name}</span>
              <span className={cn('text-[9.5px]', summaryClass(group))}>
                {isNotStarted
                  ? 'Not started'
                  : `${group.answered_count} / ${group.total_count} answered`
                }
              </span>
            </button>

            {/* Questions */}
            {isExpanded && group.questions.length > 0 && (
              <div className="px-3 pb-2 pt-1">
                {group.questions.map((q) => (
                  <QuestionRow key={q.number} question={q} />
                ))}
              </div>
            )}
          </div>
        );
      })}

      {groups.length === 0 && (
        <div className="flex items-center justify-center h-[120px] text-muted-foreground text-[10px]">
          No Q tree available for this deal
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Individual question row
// ---------------------------------------------------------------------------

function QuestionRow({ question: q }: { question: QTreeQuestion }) {
  const isActive = q.status === 'active';
  const isLocked = q.status === 'locked';

  return (
    <div className={cn(
      'py-1.5 border-b border-border/50 last:border-b-0',
      isActive && 'bg-muted/50 -mx-3 px-3 border-l-2 border-l-violet-500',
      isLocked && 'opacity-50',
    )}>
      {/* Question row */}
      <div className="flex items-start gap-1.5 mb-0.5">
        <span className="text-[9px] text-muted-foreground font-mono w-[15px] shrink-0">
          Q{q.number}
        </span>
        <span className={cn(
          'text-[10.5px] flex-1 leading-relaxed',
          isActive && 'text-violet-700 dark:text-violet-300 font-medium',
          isLocked && 'text-muted-foreground',
        )}>
          {q.question}
        </span>
        {statusIcon(q.status)}
      </div>

      {/* AI hint (for active question) */}
      {isActive && q.ai_hint && (
        <div className="text-[8.5px] text-muted-foreground ml-5 mb-1">
          {q.ai_hint}
        </div>
      )}

      {/* Answer (for answered questions) */}
      {q.status === 'answered' && q.answer && (
        <>
          <div className="ml-5 px-2 py-1 rounded text-[10px] leading-relaxed bg-muted/50 text-muted-foreground border-l-2 border-l-emerald-200">
            {q.answer}
          </div>
          {q.answered_by && q.answered_at && (
            <div className="text-[8.5px] text-muted-foreground ml-5 mt-0.5">
              {q.answered_by} &middot; {formatTimestamp(q.answered_at)}
            </div>
          )}
        </>
      )}

      {/* Input area (for active question) */}
      {isActive && (
        <div className="ml-5 mt-1">
          <textarea
            rows={2}
            placeholder="Type your answer here\u2026"
            className={cn(
              'w-full text-[10.5px] border border-violet-500 rounded px-2 py-1.5',
              'bg-background text-foreground resize-none outline-none',
              'ring-2 ring-violet-100 dark:ring-violet-900',
              'placeholder:text-muted-foreground/60',
            )}
          />
        </div>
      )}

      {/* Unlock hint (for locked questions) */}
      {isLocked && q.unlock_hint && (
        <div className="text-[8.5px] text-muted-foreground ml-5">
          {q.unlock_hint}
        </div>
      )}
    </div>
  );
}
