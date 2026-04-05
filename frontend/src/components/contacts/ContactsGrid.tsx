import { useCallback, useMemo, useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { AgGridReact } from '@ag-grid-community/react';
import { ClientSideRowModelModule } from 'ag-grid-community';
import type { GridReadyEvent, CellValueChangedEvent, RowClickedEvent } from '@ag-grid-community/core';
import { ChevronDown, Download, Plus, X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import '@/lib/ag-grid/pp-theme.css';

import { contactDefaultColDef, contactColumnDefs } from '@/lib/ag-grid/contact-column-defs';
import type { Contact, ContactsStats } from '@/types/contacts';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ContactsStatsBar } from './ContactsStatsBar';
import { NewContactPanel } from './NewContactPanel';
import { apiClient } from '@/lib/api-client';
import { toast } from '@/components/ui/use-toast';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ContactsGridProps {
  contacts: Contact[];
  stats: ContactsStats;
}

// ---------------------------------------------------------------------------
// Filter state
// ---------------------------------------------------------------------------

interface ContactFilterState {
  markets: string[];
  departments: string[];
  isDm: string[];
  leadStatuses: string[];
}

const EMPTY_FILTER: ContactFilterState = { markets: [], departments: [], isDm: [], leadStatuses: [] };

const FILTER_CHIPS = ['Market', 'Department', 'Is DM', 'Lead Status'] as const;
type ChipName = typeof FILTER_CHIPS[number];

const KEY_MAP: Record<ChipName, keyof ContactFilterState> = {
  Market: 'markets',
  Department: 'departments',
  'Is DM': 'isDm',
  'Lead Status': 'leadStatuses',
};

function toggle(arr: string[], v: string): string[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ContactsGrid({ contacts, stats }: ContactsGridProps) {
  const gridRef = useRef<AgGridReact<Contact>>(null);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [filterState, setFilterState] = useState<ContactFilterState>(EMPTY_FILTER);
  const [showNewPanel, setShowNewPanel] = useState(false);

  const updateContact = useMutation({
    mutationFn: ({ contactId, updates }: { contactId: string; updates: Partial<Contact> }) =>
      apiClient.patch<Contact>(`/contacts/${contactId}`, updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contacts'] }),
  });

  const filteredRows = useMemo(() => {
    let rows = contacts;
    const { markets, departments, isDm, leadStatuses } = filterState;
    if (markets.length) rows = rows.filter((c) => markets.includes(c.market));
    if (departments.length) rows = rows.filter((c) => departments.includes(c.department ?? ''));
    if (isDm.length) {
      const wantDm = isDm.includes('Yes');
      const wantNonDm = isDm.includes('No');
      rows = rows.filter((c) => (wantDm && c.is_decision_maker) || (wantNonDm && !c.is_decision_maker));
    }
    if (leadStatuses.length) rows = rows.filter((c) => leadStatuses.includes(c.lead_status ?? 'No lead'));
    return rows;
  }, [contacts, filterState]);

  const filterOptions = useMemo<Record<ChipName, string[]>>(() => ({
    Market: Array.from(new Set(contacts.map((c) => c.market))).sort(),
    Department: Array.from(new Set(contacts.map((c) => c.department).filter(Boolean) as string[])).sort(),
    'Is DM': ['Yes', 'No'],
    'Lead Status': ['Contacted', 'Engaged', 'MQL Ready', 'Graduated', 'No lead'],
  }), [contacts]);

  const hasFilters = Object.values(filterState).some((v) => v.length > 0);

  const onGridReady = useCallback((e: GridReadyEvent<Contact>) => {
    e.api.sizeColumnsToFit();
  }, []);

  const onCellValueChanged = useCallback((e: CellValueChangedEvent<Contact>) => {
    if (!e.data) return;
    const field = e.colDef.field;
    if (!field) return;
    updateContact.mutate({ contactId: e.data.contact_id, updates: { [field]: e.newValue } as Partial<Contact> });
  }, [updateContact]);

  const onRowClicked = useCallback((e: RowClickedEvent<Contact>) => {
    if (!e.data) return;
    if (e.event && (e.event.target as HTMLElement).closest('.ag-cell-edit-wrapper')) return;
    navigate({ to: '/contacts/$contactId', params: { contactId: e.data.contact_id } });
  }, [navigate]);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      <ContactsStatsBar stats={stats} />

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
        <span className="text-xs text-muted-foreground">{filteredRows.length} of {contacts.length} contacts</span>
        <Button variant="outline" size="sm" className="ml-2 h-6 gap-1 text-xs">
          <Download className="size-3" /> Export
        </Button>
        <Button size="sm" className="h-6 gap-1 text-xs" onClick={() => setShowNewPanel(true)}>
          <Plus className="size-3" /> New Contact
        </Button>
      </div>

      {/* Main content */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className="ag-theme-alpine ag-theme-pp relative w-full flex-1">
          <AgGridReact<Contact>
            ref={gridRef}
            modules={[ClientSideRowModelModule]}
            rowData={filteredRows}
            columnDefs={contactColumnDefs}
            defaultColDef={contactDefaultColDef}
            rowHeight={40}
            headerHeight={36}
            rowSelection="multiple"
            suppressRowClickSelection
            onGridReady={onGridReady}
            onCellValueChanged={onCellValueChanged}
            onRowClicked={onRowClicked}
            getRowId={(params) => params.data.contact_id}
            animateRows
            suppressPaginationPanel
          />
        </div>
        {showNewPanel && (
          <NewContactPanel
            contacts={contacts}
            onClose={() => setShowNewPanel(false)}
            onCreated={() => {
              setShowNewPanel(false);
              qc.invalidateQueries({ queryKey: ['contacts'] });
              qc.invalidateQueries({ queryKey: ['accounts'] });
              toast({ description: 'Contact created' });
            }}
          />
        )}
      </div>
    </div>
  );
}
