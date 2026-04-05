import { useCallback, useMemo, useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { AgGridReact } from '@ag-grid-community/react';
import { ClientSideRowModelModule } from 'ag-grid-community';
import type { GridReadyEvent, CellValueChangedEvent, RowClickedEvent } from '@ag-grid-community/core';
import { Download } from 'lucide-react';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import '@/lib/ag-grid/pp-theme.css';

import { accountDefaultColDef, accountColumnDefs } from '@/lib/ag-grid/account-column-defs';
import type { Account, AccountsStats } from '@/types/accounts';
import type { StrategicTier } from '@/types/accounts';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, X } from 'lucide-react';
import { AccountsStatsBar } from './AccountsStatsBar';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AccountsGridProps {
  accounts: Account[];
  stats: AccountsStats;
  onAccountUpdate?: (accountId: string, updates: Partial<Account>) => void;
}

// ---------------------------------------------------------------------------
// Filter state
// ---------------------------------------------------------------------------

interface AccountFilterState {
  tiers: string[];
  markets: string[];
  namedAes: string[];
  industries: string[];
}

const EMPTY_FILTER: AccountFilterState = { tiers: [], markets: [], namedAes: [], industries: [] };

const FILTER_CHIPS = ['Tier', 'Market', 'Named AE', 'Industry'] as const;
type ChipName = typeof FILTER_CHIPS[number];

const KEY_MAP: Record<ChipName, keyof AccountFilterState> = {
  Tier: 'tiers',
  Market: 'markets',
  'Named AE': 'namedAes',
  Industry: 'industries',
};

function toggle(arr: string[], v: string): string[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AccountsGrid({ accounts, stats, onAccountUpdate }: AccountsGridProps) {
  const gridRef = useRef<AgGridReact<Account>>(null);
  const navigate = useNavigate();
  const [filterState, setFilterState] = useState<AccountFilterState>(EMPTY_FILTER);

  const filteredRows = useMemo(() => {
    let rows = accounts;
    const { tiers, markets, namedAes, industries } = filterState;
    if (tiers.length) rows = rows.filter((a) => tiers.includes(a.strategic_tier ?? ''));
    if (markets.length) rows = rows.filter((a) => markets.includes(a.market));
    if (namedAes.length) rows = rows.filter((a) => namedAes.includes(a.named_ae ?? ''));
    if (industries.length) rows = rows.filter((a) => industries.includes(a.industry ?? ''));
    return rows;
  }, [accounts, filterState]);

  const filterOptions = useMemo<Record<ChipName, string[]>>(() => ({
    Tier: ['A', 'B', 'C'],
    Market: Array.from(new Set(accounts.map((a) => a.market))).sort(),
    'Named AE': Array.from(new Set(accounts.map((a) => a.named_ae).filter(Boolean) as string[])).sort(),
    Industry: Array.from(new Set(accounts.map((a) => a.industry).filter(Boolean) as string[])).sort(),
  }), [accounts]);

  const hasFilters = Object.values(filterState).some((v) => v.length > 0);

  const onGridReady = useCallback((e: GridReadyEvent<Account>) => {
    e.api.sizeColumnsToFit();
  }, []);

  const onCellValueChanged = useCallback((e: CellValueChangedEvent<Account>) => {
    if (!e.data) return;
    const field = e.colDef.field;
    if (!field) return;
    onAccountUpdate?.(e.data.account_id, { [field]: e.newValue });
  }, [onAccountUpdate]);

  const onRowClicked = useCallback((e: RowClickedEvent<Account>) => {
    if (!e.data) return;
    // Don't navigate if a cell editor is active
    if (e.event && (e.event.target as HTMLElement).closest('.ag-cell-edit-wrapper')) return;
    navigate({ to: '/accounts/$accountId', params: { accountId: e.data.account_id } });
  }, [navigate]);

  const getRowStyle = useCallback((params: { data?: Account }) => {
    if (params.data?.strategic_tier === 'A') return { borderLeft: '3px solid #1D9E75' };
    if (params.data?.strategic_tier === 'B') return { borderLeft: '3px solid #BA7517' };
    return undefined;
  }, []);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      <AccountsStatsBar stats={stats} />

      {/* Filter toolbar */}
      <div className="flex h-9 items-center gap-2 border-b px-3">
        <span className="text-xs font-medium text-muted-foreground">Filter:</span>
        {FILTER_CHIPS.map((chip) => {
          const key = KEY_MAP[chip];
          const count = filterState[key].length;
          const options = filterOptions[chip];
          return (
            <DropdownMenu key={chip}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className={cn('h-6 gap-1 rounded-md px-2 text-xs', count > 0 && 'border-primary bg-primary/10 text-primary')}>
                  {chip}{count > 0 && ` \u00b7 ${count}`}
                  <ChevronDown className="size-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto">
                {options.map((opt) => (
                  <DropdownMenuCheckboxItem key={opt} checked={filterState[key].includes(opt)} onSelect={(e) => e.preventDefault()} onCheckedChange={() => setFilterState((p) => ({ ...p, [key]: toggle(p[key], opt) }))}>
                    {opt}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        })}
        {hasFilters && (
          <Button variant="ghost" size="sm" className="h-6 gap-1 px-2 text-xs text-muted-foreground" onClick={() => setFilterState(EMPTY_FILTER)}>
            <X className="size-3" /> Clear
          </Button>
        )}
        <div className="flex-1" />
        <span className="text-xs text-muted-foreground">{filteredRows.length} of {accounts.length} accounts</span>
        <Button variant="outline" size="sm" className="ml-2 h-6 gap-1 text-xs">
          <Download className="size-3" /> Export
        </Button>
      </div>

      {/* AG Grid */}
      <div className="ag-theme-alpine ag-theme-pp relative w-full flex-1">
        <AgGridReact<Account>
          ref={gridRef}
          modules={[ClientSideRowModelModule]}
          rowData={filteredRows}
          columnDefs={accountColumnDefs}
          defaultColDef={accountDefaultColDef}
          rowHeight={40}
          headerHeight={36}
          rowSelection="multiple"
          suppressRowClickSelection
          onGridReady={onGridReady}
          onCellValueChanged={onCellValueChanged}
          onRowClicked={onRowClicked}
          getRowStyle={getRowStyle}
          getRowId={(params) => params.data.account_id}
          animateRows
          suppressPaginationPanel
        />
      </div>
    </div>
  );
}
