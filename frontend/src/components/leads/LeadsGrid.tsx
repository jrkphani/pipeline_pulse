import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { AgGridReact } from '@ag-grid-community/react';
import { ClientSideRowModelModule } from 'ag-grid-community';
import type {
  GridReadyEvent,
  SelectionChangedEvent,
  RowClassParams,
  CellValueChangedEvent,
  GridApi,
} from '@ag-grid-community/core';
import { ChevronDown, Plus, Download, Upload, X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import '@/lib/ag-grid/pp-theme.css';

import {
  leadDefaultColDef,
  leadColumnDefs,
  LEAD_GROUP_FIELD_MAP,
  LEAD_GROUP_PILLS,
  buildInitialLeadGroupVisibility,
} from '@/lib/ag-grid/lead-column-defs';
import type { LeadColumnGroupId } from '@/lib/ag-grid/lead-column-defs';
import type { Lead, LeadsStats, LeadFilterState, LeadStage } from '@/types/leads';
import { EMPTY_LEAD_FILTER_STATE } from '@/types/leads';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Rows3, Rows4, StretchHorizontal } from 'lucide-react';
import { LeadStatsBar } from './toolbars/LeadStatsBar';
import { LeadDrilldownPanel } from '@/components/leads/LeadDrilldownPanel';
import { QuickActivityLogOverlay } from '@/components/leads/QuickActivityLogOverlay';
import type { QuickActivityEntry } from '@/components/leads/QuickActivityLogOverlay';
import { LeadImportPanel } from '@/components/leads/LeadImportPanel';
import { useLeadsNavStore } from '@/stores/leads-nav.store';
import { useInlineNewLead } from '@/hooks/useInlineNewLead';
import { exportLeadsToXlsx } from '@/lib/xlsx/lead-export';
import { toast } from '@/components/ui/use-toast';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface LeadsGridProps {
  leads: Lead[];
  stats: LeadsStats;
  onLeadUpdate?: (leadId: string, updates: Partial<Lead>) => void;
  onSelectionChange?: (selected: Lead[]) => void;
}

// ---------------------------------------------------------------------------
// Density config
// ---------------------------------------------------------------------------

type RowDensity = 'compact' | 'comfortable' | 'spacious';

const DENSITY_CONFIG: Record<RowDensity, { rowHeight: number; label: string; icon: typeof Rows3 }> = {
  compact: { rowHeight: 28, label: 'Compact', icon: Rows3 },
  comfortable: { rowHeight: 40, label: 'Comfortable', icon: Rows4 },
  spacious: { rowHeight: 52, label: 'Spacious', icon: StretchHorizontal },
};

const DENSITY_ORDER: RowDensity[] = ['compact', 'comfortable', 'spacious'];

// ---------------------------------------------------------------------------
// Pill colors for column groups
// ---------------------------------------------------------------------------

const PILL_COLORS: Record<string, { activeBg: string; activeText: string; activeBorder: string }> = {
  Identity: { activeBg: 'bg-[#E6F1FB]', activeText: 'text-[#0C447C]', activeBorder: 'border-[#85B7EB]' },
  'GTM & Source': { activeBg: 'bg-[#FAEEDA]', activeText: 'text-[#633806]', activeBorder: 'border-[#EF9F27]' },
  'ICP & Signals': { activeBg: 'bg-[#EEEDFE]', activeText: 'text-[#3C3489]', activeBorder: 'border-[#AFA9EC]' },
  Activity: { activeBg: 'bg-[#E1F5EE]', activeText: 'text-[#085041]', activeBorder: 'border-[#5DCAA5]' },
  Conversion: { activeBg: 'bg-[#EAF3DE]', activeText: 'text-[#27500A]', activeBorder: 'border-[#97C459]' },
};

// ---------------------------------------------------------------------------
// Filter chips
// ---------------------------------------------------------------------------

const LEAD_FILTER_CHIPS = ['SDR', 'GTM Motion', 'Status', 'Market'] as const;
type LeadChipName = typeof LEAD_FILTER_CHIPS[number];

const LEAD_KEY_MAP: Record<LeadChipName, keyof LeadFilterState> = {
  SDR: 'sdrs',
  'GTM Motion': 'gtmMotions',
  Status: 'statuses',
  Market: 'markets',
};

function toggleValue(arr: string[], value: string): string[] {
  return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
}

// ---------------------------------------------------------------------------
// LeadsGrid
// ---------------------------------------------------------------------------

export function LeadsGrid({ leads, stats, onLeadUpdate, onSelectionChange }: LeadsGridProps) {
  const gridRef = useRef<AgGridReact<Lead>>(null);
  const gridWrapperRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [, setSelectedRows] = useState<Lead[]>([]);
  const [density, setDensity] = useState<RowDensity>('comfortable');
  const [filterState, setFilterState] = useState<LeadFilterState>(EMPTY_LEAD_FILTER_STATE);
  const [drillStage, setDrillStage] = useState<LeadStage | 'all' | null>(null);

  // Feature 1: Prev/Next nav store
  const setOrderedLeadIds = useLeadsNavStore((s) => s.setOrderedLeadIds);

  const handleLeadOpen = useCallback(
    (leadId: string) => {
      const displayedIds: string[] = [];
      gridRef.current?.api?.forEachNodeAfterFilterAndSort((node) => {
        if (node.data?.lead_id) displayedIds.push(node.data.lead_id);
      });
      setOrderedLeadIds(displayedIds);
      navigate({ to: '/demand-gen/leads/$leadId', params: { leadId } });
    },
    [navigate, setOrderedLeadIds],
  );

  // Feature 2: Quick activity log overlay
  const [quickLogLeadId, setQuickLogLeadId] = useState<string | null>(null);

  const quickLogMutation = useMutation({
    mutationFn: ({ leadId, entry }: { leadId: string; entry: QuickActivityEntry }) =>
      apiClient.patch<Lead>(`/leads/${leadId}`, { _quick_log: entry }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] });
    },
  });

  const handleQuickLog = useCallback(
    (leadId: string, entry: QuickActivityEntry) => {
      quickLogMutation.mutate({ leadId, entry });
      setQuickLogLeadId(null);
    },
    [quickLogMutation],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'l' && e.key !== 'L') return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(tag)) return;

      const selected = gridRef.current?.api?.getSelectedRows();
      if (!selected || selected.length !== 1) return;

      e.preventDefault();
      setQuickLogLeadId(selected[0].lead_id);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Feature 3: Inline new lead + import panel
  const [importPanelOpen, setImportPanelOpen] = useState(false);

  const createLeadMutation = useMutation({
    mutationFn: (draft: Partial<Lead>) =>
      apiClient.post<Lead>('/leads', draft),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] });
      toast({ description: 'Lead created' });
    },
    onError: () => {
      toast({ description: 'Failed to create lead', variant: 'destructive' });
    },
  });

  const inlineNewLead = useInlineNewLead(gridRef, (draft) => {
    createLeadMutation.mutate(draft);
  });

  // Group visibility
  const [groupVisibility, setGroupVisibility] = useState<Record<LeadColumnGroupId, boolean>>(
    buildInitialLeadGroupVisibility,
  );

  const toggleGroup = useCallback((groupId: LeadColumnGroupId) => {
    setGroupVisibility((prev) => {
      const next = { ...prev, [groupId]: !prev[groupId] };
      const fields = LEAD_GROUP_FIELD_MAP[groupId];
      const api: GridApi<Lead> | undefined = gridRef.current?.api;
      if (api && fields) {
        api.setColumnsVisible(fields as string[], next[groupId]);
      }
      return next;
    });
  }, []);

  const handleSetDensity = useCallback((d: RowDensity) => {
    setDensity(d);
    setTimeout(() => gridRef.current?.api?.resetRowHeights(), 0);
  }, []);

  // Filtered data
  const filteredRowData = useMemo(() => {
    let rows = leads;
    const { sdrs, gtmMotions, statuses, markets } = filterState;
    if (sdrs.length) rows = rows.filter((l) => sdrs.includes(l.assigned_sdr));
    if (gtmMotions.length) rows = rows.filter((l) => gtmMotions.includes(l.gtm_motion));
    if (statuses.length) rows = rows.filter((l) => statuses.includes(l.lead_status));
    if (markets.length) rows = rows.filter((l) => markets.includes(l.market));
    return rows;
  }, [leads, filterState]);

  const drilledLeads = useMemo(() => {
    if (!drillStage) return [];
    if (drillStage === 'all') return leads;
    return leads.filter((l) => l.lead_status === drillStage);
  }, [drillStage, leads]);

  // Filter options derived from data
  const filterOptions = useMemo<Record<LeadChipName, string[]>>(() => ({
    SDR: Array.from(new Set(leads.map((l) => l.assigned_sdr))).sort(),
    'GTM Motion': Array.from(new Set(leads.map((l) => l.gtm_motion))).sort(),
    Status: ['Contacted', 'Engaged', 'MQL Ready', 'Graduated'],
    Market: Array.from(new Set(leads.map((l) => l.market))).sort(),
  }), [leads]);

  const hasActiveFilters = Object.values(filterState).some((v) => v.length > 0);

  // Event handlers
  const onGridReady = useCallback((event: GridReadyEvent<Lead>) => {
    event.api.sizeColumnsToFit();
    for (const pill of LEAD_GROUP_PILLS) {
      if (!pill.defaultVisible) {
        const fields = LEAD_GROUP_FIELD_MAP[pill.id];
        if (fields) event.api.setColumnsVisible(fields as string[], false);
      }
    }
  }, []);

  const onSelectionChanged = useCallback(
    (event: SelectionChangedEvent<Lead>) => {
      const rows = event.api.getSelectedRows();
      setSelectedRows(rows);
      onSelectionChange?.(rows);
    },
    [onSelectionChange],
  );

  const onCellValueChanged = useCallback(
    (event: CellValueChangedEvent<Lead>) => {
      if (!event.data) return;
      const field = event.colDef.field as keyof Lead | undefined;
      if (!field) return;

      // Handle pinned bottom row (inline new lead)
      if (event.node.rowPinned === 'bottom') {
        inlineNewLead.onCellValueChangedInPinned(field, event.newValue);
        return;
      }

      const updates: Partial<Lead> = { [field]: event.newValue };

      // ICP score override tracking
      if (field === 'icp_score') {
        updates.icp_score_overridden = true;
      }

      onLeadUpdate?.(event.data.lead_id, updates);
    },
    [onLeadUpdate, inlineNewLead],
  );

  const getRowStyle = useCallback((params: RowClassParams<Lead>) => {
    if (params.data?.lead_status === 'Graduated') return { background: 'rgba(26,158,117,.04)' };
    if (params.data?.mql_ready_auto) return { background: 'rgba(83,74,183,.04)' };
    return undefined;
  }, []);

  const handleExport = useCallback(() => {
    exportLeadsToXlsx(filteredRowData);
    toast({ description: `Exported ${filteredRowData.length} leads to Excel` });
  }, [filteredRowData]);

  return (
    <div
      className="flex h-full flex-col overflow-hidden bg-background"
      style={{ '--rh': `${DENSITY_CONFIG[density].rowHeight}px` } as React.CSSProperties}
    >
      {/* Stats Bar */}
      <LeadStatsBar
        stats={stats}
        activeStage={drillStage}
        onStatClick={(stage) =>
          setDrillStage((prev) => (prev === stage ? null : stage))
        }
      />

      {/* Structural Toolbar — column group pills + density toggle */}
      <div className="flex h-9 items-center gap-2 border-b bg-muted/20 px-3">
        <span className="text-xs font-medium text-muted-foreground">Columns:</span>
        {LEAD_GROUP_PILLS.map((pill) => {
          const isActive = groupVisibility[pill.id];
          const colors = PILL_COLORS[pill.label];
          return (
            <button
              key={pill.id}
              onClick={() => toggleGroup(pill.id)}
              className={cn(
                'inline-flex h-6 items-center rounded-md border px-2 text-xs font-medium transition-colors',
                isActive && colors
                  ? `${colors.activeBg} ${colors.activeText} ${colors.activeBorder}`
                  : 'border-border bg-background text-muted-foreground hover:bg-muted/50',
              )}
            >
              {pill.label}
              <span className="ml-0.5 text-[10px] opacity-60">{isActive ? ' ◂' : ' ▸'}</span>
            </button>
          );
        })}

        <div className="flex-1" />

        <div className="flex items-center rounded-md border bg-muted/30 p-0.5">
          {DENSITY_ORDER.map((d) => {
            const Icon = DENSITY_CONFIG[d].icon;
            const isActive = density === d;
            return (
              <button
                key={d}
                onClick={() => handleSetDensity(d)}
                title={DENSITY_CONFIG[d].label}
                className={cn(
                  'inline-flex h-5 items-center gap-1 rounded px-1.5 text-xs transition-colors',
                  isActive ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="size-3" />
                {DENSITY_CONFIG[d].label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex h-9 items-center gap-2 border-b px-3">
        <span className="text-xs font-medium text-muted-foreground">Filter:</span>

        {LEAD_FILTER_CHIPS.map((chip) => {
          const key = LEAD_KEY_MAP[chip];
          const activeCount = filterState[key].length;
          const isActive = activeCount > 0;
          const options = filterOptions[chip];

          return (
            <DropdownMenu key={chip}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    'h-6 gap-1 rounded-md px-2 text-xs',
                    isActive && 'border-primary bg-primary/10 text-primary',
                  )}
                >
                  {chip}
                  {isActive && ` · ${activeCount}`}
                  <ChevronDown className="size-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto">
                {options.map((option) => (
                  <DropdownMenuCheckboxItem
                    key={option}
                    checked={filterState[key].includes(option)}
                    onSelect={(e) => e.preventDefault()}
                    onCheckedChange={() => {
                      setFilterState((prev) => ({
                        ...prev,
                        [key]: toggleValue(prev[key], option),
                      }));
                    }}
                  >
                    {option}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        })}

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setFilterState(EMPTY_LEAD_FILTER_STATE)}
          >
            <X className="size-3" />
            Clear
          </Button>
        )}

        <div className="flex-1" />

        <span className="text-xs text-muted-foreground">
          Showing {filteredRowData.length} of {leads.length} leads
        </span>

        <span className="text-[10px] text-muted-foreground font-mono hidden md:inline">
          L = log activity
        </span>

        <Button variant="outline" size="sm" className="ml-2 h-6 gap-1 text-xs" onClick={handleExport}>
          <Download className="size-3" />
          Export
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="h-6 gap-1 text-xs"
          onClick={() => setImportPanelOpen(true)}
        >
          <Upload className="size-3" />
          Import
        </Button>

        <Button size="sm" className="h-6 gap-1 text-xs" onClick={inlineNewLead.startNewLead}>
          <Plus className="size-3" />
          New Lead
        </Button>
      </div>

      {/* Drill-down Panel */}
      {drillStage !== null && (
        <LeadDrilldownPanel
          leads={drilledLeads}
          stageFilter={drillStage}
          onClose={() => setDrillStage(null)}
        />
      )}

      {/* Main content area: grid + optional import panel */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* AG Grid */}
        <div ref={gridWrapperRef} className="ag-theme-alpine ag-theme-pp relative w-full flex-1">
          <AgGridReact<Lead>
            ref={gridRef}
            modules={[ClientSideRowModelModule]}
            rowData={filteredRowData}
            columnDefs={leadColumnDefs}
            defaultColDef={leadDefaultColDef}
            rowHeight={DENSITY_CONFIG[density].rowHeight}
            headerHeight={36}
            rowSelection="multiple"
            suppressRowClickSelection
            onGridReady={onGridReady}
            onSelectionChanged={onSelectionChanged}
            onCellValueChanged={onCellValueChanged}
            getRowStyle={getRowStyle}
            getRowId={(params) => params.data.lead_id}
            animateRows
            suppressPaginationPanel
            undoRedoCellEditing
            undoRedoCellEditingLimit={20}
            context={{ onLeadOpen: handleLeadOpen }}
            pinnedBottomRowData={inlineNewLead.pinnedBottomRowData as Lead[]}
          />

          {/* Quick Activity Log Overlay */}
          {quickLogLeadId && (() => {
            const lead = leads.find((l) => l.lead_id === quickLogLeadId);
            if (!lead) return null;
            return (
              <QuickActivityLogOverlay
                lead={lead}
                anchorRef={gridWrapperRef}
                onSave={(entry) => handleQuickLog(lead.lead_id, entry)}
                onClose={() => setQuickLogLeadId(null)}
              />
            );
          })()}
        </div>

        {/* Import Panel */}
        {importPanelOpen && (
          <LeadImportPanel onClose={() => setImportPanelOpen(false)} />
        )}
      </div>

      {/* Inline New Lead Save Bar */}
      {inlineNewLead.isActive && (
        <div className="flex h-8 items-center gap-2 border-t px-3 text-xs bg-muted/30">
          <span className="font-medium">1 unsaved row</span>
          <span className="text-muted-foreground">
            &middot;{' '}
            {inlineNewLead.canSave
              ? 'All required fields complete'
              : `${inlineNewLead.missingCount} required field${inlineNewLead.missingCount !== 1 ? 's' : ''} missing`}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={inlineNewLead.discardNewLead}
              className="rounded border px-2.5 py-0.5 text-[11px] text-muted-foreground hover:text-foreground"
            >
              Esc &mdash; discard
            </button>
            <button
              type="button"
              onClick={inlineNewLead.saveNewLead}
              disabled={!inlineNewLead.canSave}
              className="rounded px-2.5 py-0.5 text-[11px] font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: inlineNewLead.canSave ? 'oklch(0.606 0.25 292.717)' : '#999' }}
            >
              Enter &mdash; save row
            </button>
          </div>
        </div>
      )}

      {/* Workbook Tabs */}
      <div className="flex h-12 items-end border-t bg-muted/30 overflow-x-auto whitespace-nowrap md:h-16">
        <button
          className="relative flex h-full shrink-0 items-center px-4 text-xs font-medium border-r border-border bg-background text-primary"
        >
          Leads
          <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary" />
        </button>
        <button
          onClick={() => navigate({ to: '/demand-gen/graduation' })}
          className="relative flex h-full shrink-0 items-center gap-1.5 px-4 text-xs font-medium border-r border-border text-muted-foreground hover:bg-background/50 hover:text-foreground"
        >
          Graduation Queue ★
          {stats.graduation_queue_count > 0 && (
            <span className="rounded-sm bg-[#EEEDFE] px-1.5 py-0.5 font-mono text-[10px] font-medium text-[#3C3489]">
              {stats.graduation_queue_count}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
