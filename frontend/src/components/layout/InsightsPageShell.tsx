import { useCallback } from 'react';
import type { ReactNode } from 'react';
import * as XLSX from 'xlsx';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import {
  useReportsStore,
  GTM_MOTIONS,
  TIMEFRAMES,
  type GtmMotion,
  type Timeframe,
} from '@/stores/reports.store';

// ---------------------------------------------------------------------------
// Filter pill (extracted from ReportsPage)
// ---------------------------------------------------------------------------

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded border px-2.5 py-1 text-[11px] transition-colors',
        active
          ? 'border-primary/40 bg-primary/10 text-primary font-medium'
          : 'border-border bg-background text-muted-foreground hover:bg-muted/50',
      )}
    >
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// InsightsPageShell — reusable wrapper for all insight pages
// ---------------------------------------------------------------------------

interface InsightsPageShellProps {
  title: string;
  children: ReactNode;
}

export function InsightsPageShell({ title, children }: InsightsPageShellProps) {
  const { gtm, timeframe, setGtm, setTimeframe } = useReportsStore();

  const handleExport = useCallback(() => {
    const tables = document.querySelectorAll('table');
    if (tables.length === 0) {
      toast({ description: 'No tables found to export' });
      return;
    }
    
    const wb = XLSX.utils.book_new();
    tables.forEach((table, i) => {
      const ws = XLSX.utils.table_to_sheet(table);
      XLSX.utils.book_append_sheet(wb, ws, `Sheet${i + 1}`);
    });
    
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const date = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `pipeline-pulse-${slug}-${date}.xlsx`);
  }, [title]);

  const handleSaveView = useCallback(() => {
    const msg = `Saved: ${gtm} · ${timeframe ?? 'All periods'}`;
    toast({ description: msg });
  }, [gtm, timeframe]);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="shrink-0">
        <div className="flex items-center gap-3 px-4 py-3">
          <h1 className="text-lg font-semibold text-foreground">{title}</h1>
          <span className="text-xs text-muted-foreground">FY26-27</span>
        </div>
      </div>

      {/* Toolbar — filters + actions */}
      <div className="flex shrink-0 items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground">Filter:</span>
          {GTM_MOTIONS.map((motion) => (
            <FilterPill
              key={motion}
              label={motion}
              active={gtm === motion}
              onClick={() => setGtm(motion as GtmMotion)}
            />
          ))}
          {TIMEFRAMES.map((tf) => (
            <FilterPill
              key={tf}
              label={tf}
              active={timeframe === tf}
              onClick={() => setTimeframe(timeframe === tf ? null : (tf as Timeframe))}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="rounded border px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-muted/50"
          >
            Export .xlsx
          </button>
          <button
            type="button"
            onClick={handleSaveView}
            className="rounded bg-primary px-2.5 py-1 text-[11px] font-medium text-primary-foreground hover:bg-primary/90"
          >
            Save View
          </button>
        </div>
      </div>

      {/* Content — scrollable */}
      <div className="flex-1 overflow-y-auto bg-muted/30 p-4">
        {children}
      </div>
    </div>
  );
}
