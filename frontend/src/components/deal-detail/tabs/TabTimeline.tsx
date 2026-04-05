import { cn } from '@/lib/utils';
import type { TimelineEvent, TimelineEventType } from '@/types/deal-detail';

interface TabTimelineProps {
  events: TimelineEvent[];
}

// ---------------------------------------------------------------------------
// Dot color by event type
// ---------------------------------------------------------------------------

const DOT_CLASS: Record<TimelineEventType, string> = {
  stall_alert: 'bg-red-600 dark:bg-red-500',
  meeting: 'bg-emerald-600 dark:bg-emerald-500',
  stage_change: 'bg-violet-500',
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TabTimeline({ events }: TabTimelineProps) {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <span className="text-[10px] font-medium">Stage history & meetings</span>
        <button
          type="button"
          className="px-2 py-0.5 border rounded text-[9.5px] bg-background text-muted-foreground hover:text-foreground transition-colors"
        >
          + Log meeting
        </button>
      </div>

      {/* Event list */}
      {events.map((event, i) => (
        <div key={event.id} className="flex gap-2.5 px-3 py-2 border-b">
          {/* Dot + connector */}
          <div className="flex flex-col items-center pt-0.5 shrink-0">
            <div className={cn('w-[9px] h-[9px] rounded-full', DOT_CLASS[event.type])} />
            {i < events.length - 1 && (
              <div className="w-px flex-1 min-h-[16px] bg-border mt-0.5" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className={cn(
              'text-[11px] font-medium mb-0.5',
              event.is_alert && 'text-red-600 dark:text-red-400',
            )}>
              {event.title}
            </div>
            <div className="text-[9.5px] text-muted-foreground mb-1">
              {formatDate(event.date)}
              {event.participants && <> &middot; {event.participants}</>}
              {event.context && <> &middot; {event.context}</>}
            </div>
            {event.note && (
              <div className={cn(
                'px-2 py-1 rounded text-[10px] leading-relaxed border-l-2',
                event.is_alert
                  ? 'bg-muted/50 text-muted-foreground border-l-red-400'
                  : 'bg-muted/50 text-muted-foreground border-l-emerald-200',
              )}>
                {event.note}
              </div>
            )}
          </div>
        </div>
      ))}

      {events.length === 0 && (
        <div className="flex items-center justify-center h-[120px] text-muted-foreground text-[10px]">
          No timeline events yet
        </div>
      )}
    </div>
  );
}
