# AG Grid Community — Pipeline Pulse Patterns

> This skill documents AG Grid Community (MIT) patterns for Pipeline Pulse.
> Community Edition only. No Enterprise features. No license key.

---

## Module Registration

```typescript
// main.tsx — register once at app root
import { ModuleRegistry } from 'ag-grid-community';
import { ClientSideRowModelModule } from 'ag-grid-community';
import { ValidationModule } from 'ag-grid-community';

ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  ValidationModule,
]);
```

---

## Column Definition Reference

```typescript
import type { ColDef, ValueFormatterParams } from 'ag-grid-community';
import type { Opportunity } from '@/types/opportunity';

export const opportunityColumnDefs: ColDef<Opportunity>[] = [
  // SGD Core — always pinned left, always visible
  {
    field: 'sgd_core',
    headerName: 'SGD Core (S$)',
    pinned: 'left',
    lockPinned: true,
    lockVisible: true,
    editable: true,
    cellEditor: 'agNumberCellEditor',
    cellEditorParams: { precision: 2, min: 0 },
    valueFormatter: ({ value }: ValueFormatterParams<Opportunity, number>) =>
      formatSGD(value),
    filter: 'agNumberColumnFilter',
    type: 'numericColumn',
    width: 160,
  },

  // Stage — dropdown editor
  {
    field: 'stage',
    headerName: 'Stage',
    editable: true,
    cellEditor: 'agSelectCellEditor',
    cellEditorParams: {
      values: OPPORTUNITY_STAGES,
    },
    filter: 'agTextColumnFilter',
    width: 140,
  },

  // Custodian — read-only (changes via relay transfer, not direct edit)
  {
    field: 'custodian.full_name',
    headerName: 'Custodian',
    editable: false,
    filter: 'agTextColumnFilter',
    width: 160,
  },

  // Account name
  {
    field: 'account.name',
    headerName: 'Account',
    editable: false,
    filter: 'agTextColumnFilter',
    flex: 1,
    minWidth: 200,
  },

  // Close date — date editor
  {
    field: 'close_date',
    headerName: 'Close Date',
    editable: true,
    cellEditor: 'agDateStringCellEditor',
    valueFormatter: ({ value }: ValueFormatterParams<Opportunity, string>) =>
      value ? format(parseISO(value), 'dd MMM yyyy') : '—',
    filter: 'agDateColumnFilter',
    width: 140,
  },
];
```

---

## Grid Component Template

```typescript
import { useCallback, useMemo, useRef } from 'react';
import { AgGridReact } from '@ag-grid-community/react';
import type {
  GridReadyEvent,
  CellValueChangedEvent,
  GridApi,
  SelectionChangedEvent,
} from 'ag-grid-community';

export function PipelineGrid() {
  const gridApiRef = useRef<GridApi<Opportunity> | null>(null);
  const { data: opportunities } = useOpportunities();
  const { mutate: updateOpportunity } = useUpdateOpportunity();

  const colDefs = useMemo(() => opportunityColumnDefs, []);

  const defaultColDef = useMemo<ColDef<Opportunity>>(
    () => ({
      sortable: true,
      resizable: true,
      suppressHeaderMenuButton: false,
      filter: true,
    }),
    []
  );

  const onGridReady = useCallback((event: GridReadyEvent<Opportunity>) => {
    gridApiRef.current = event.api;
  }, []);

  const onCellValueChanged = useCallback(
    (event: CellValueChangedEvent<Opportunity>) => {
      updateOpportunity({
        id: event.data.id,
        patch: { [event.colDef.field!]: event.newValue },
      });
    },
    [updateOpportunity]
  );

  const onSelectionChanged = useCallback(
    (event: SelectionChangedEvent<Opportunity>) => {
      const selected = event.api.getSelectedRows();
      // Update Zustand selection store
    },
    []
  );

  return (
    <div className="ag-theme-quartz h-full w-full">
      <AgGridReact<Opportunity>
        ref={gridApiRef}
        rowData={opportunities ?? []}
        columnDefs={colDefs}
        defaultColDef={defaultColDef}
        rowSelection="multiple"
        suppressRowClickSelection
        getRowId={(params) => params.data.id}
        onGridReady={onGridReady}
        onCellValueChanged={onCellValueChanged}
        onSelectionChanged={onSelectionChanged}
        animateRows={false}
        rowBuffer={20}
      />
    </div>
  );
}
```

---

## Optimistic Update + Rollback

```typescript
// In the cell value changed handler — optimistic via React Query
const onCellValueChanged = useCallback(
  async (event: CellValueChangedEvent<Opportunity>) => {
    const { data, colDef, newValue, oldValue } = event;

    try {
      await updateAsync({ id: data.id, patch: { [colDef.field!]: newValue } });
    } catch {
      // Rollback: update the node directly in AG Grid
      const rowNode = gridApiRef.current?.getRowNode(data.id);
      if (rowNode) {
        rowNode.setDataValue(colDef.field!, oldValue);
      }
      toast.error('Failed to save change. Please try again.');
    }
  },
  [updateAsync]
);
```

---

## Keyboard Navigation

AG Grid Community handles these natively — ensure grid config doesn't break them:
- `Tab` / `Shift+Tab` — next/previous editable cell
- `Enter` — start editing / confirm edit
- `Escape` — cancel editing
- `Arrow keys` — navigate between cells
- `Ctrl+Home` / `Ctrl+End` — first/last cell

Ensure `suppressKeyboardEvent` is NOT set globally on defaultColDef.

---

## Theming (Tailwind + AG Grid Quartz)

```css
/* globals.css — AG Grid Quartz theme customisation */
.ag-theme-quartz {
  --ag-font-family: 'Inter', system-ui, sans-serif;
  --ag-font-size: 13px;
  --ag-row-height: 40px;
  --ag-header-height: 44px;
  --ag-border-color: hsl(var(--border));
  --ag-row-hover-color: hsl(var(--accent));
  --ag-selected-row-background-color: hsl(var(--accent));
  --ag-header-background-color: hsl(var(--muted));
  --ag-odd-row-background-color: transparent;
}
```

---

## Multi-Row Selection + Bulk Actions

```typescript
// Get selected IDs for bulk operations
const getSelectedIds = (): string[] => {
  return gridApiRef.current
    ?.getSelectedRows()
    .map((row) => row.id) ?? [];
};

// Programmatic selection
const selectAll = () => gridApiRef.current?.selectAll();
const clearSelection = () => gridApiRef.current?.deselectAll();
```
