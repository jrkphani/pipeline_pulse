---
name: pp-ag-grid-patterns
description: Mandatory AG Grid Community patterns for Pipeline Pulse v2 — theme, virtual scroll, frozen columns, inline editing, health rendering, keyboard parity, and export rules.
version: 1.0.0
---

# AG Grid Patterns (Pipeline Pulse v2)

This skill defines the mandatory AG Grid Community configuration for all grid instances in Pipeline Pulse. These are non-negotiable compliance requirements from the v2 architecture.

## Prohibited Libraries

The following are **banned** — reject any PR or implementation that introduces them:

- `@tanstack/react-table` — AG Grid Community is the sole grid engine
- `papaparse` — SheetJS CE (`xlsx`) is the only export/import library
- AG Grid Enterprise modules — Community edition only
- Any pagination component used with AG Grid

## Theme: ag-theme-pp

All grids use a custom theme class `ag-theme-pp` that maps design tokens:

```css
.ag-theme-pp {
  --ag-row-height: var(--pp-grid-row-height, 30px);
  --ag-header-height: var(--pp-grid-header-height, 32px);
  --ag-font-size: var(--pp-font-size-sm);
  --ag-font-family: var(--pp-font-family);
  --ag-foreground-color: var(--pp-neutral-900);
  --ag-background-color: var(--pp-neutral-50);
  --ag-header-background-color: var(--pp-neutral-100);
  --ag-odd-row-background-color: var(--pp-neutral-50);
  --ag-row-border-color: var(--pp-neutral-200);
  --ag-selected-row-background-color: var(--pp-primary-50);
  --ag-range-selection-background-color: rgba(var(--pp-primary-rgb), 0.1);
  --ag-range-selection-border-color: var(--pp-primary-500);
}
```

**Rules:**
- Never set AG Grid CSS variables to hardcoded values — always map through `var(--pp-*)`
- The `ag-theme-pp` class must wrap every `<AgGridReact>` instance

## Grid Configuration (Required)

Every grid instance must include these properties:

```tsx
const defaultGridOptions: GridOptions = {
  // Row model — virtual scroll, no pagination
  rowModelType: 'clientSide',
  suppressPaginationPanel: true,

  // Row dimensions
  rowHeight: 30,
  headerHeight: 32,

  // Editing
  undoRedoCellEditing: true,
  undoRedoCellEditingLimit: 20,

  // Selection & range
  enableRangeSelection: true,
  enableFillHandle: true,
  rowSelection: 'multiple',
  suppressRowClickSelection: true,

  // Status bar (always visible)
  statusBar: {
    statusPanels: [
      {
        statusPanel: 'agTotalAndFilteredRowCountComponent',
        align: 'left',
      },
      {
        statusPanel: 'agAggregationComponent',
        align: 'right',
      },
    ],
  },

  // Clipboard
  enableCellTextSelection: true,
  ensureDomOrder: true,

  // Suppress unwanted features
  suppressExcelExport: true,   // Use SheetJS CE instead
  suppressCsvExport: true,     // Use SheetJS CE instead
};
```

## Frozen Columns

The following columns must be pinned (frozen) on every deal-related grid:

```tsx
const frozenColumns: ColDef[] = [
  {
    field: 'dealId',
    headerName: 'Deal ID',
    pinned: 'left',
    lockPinned: true,
    width: 100,
  },
  {
    field: 'accountName',
    headerName: 'Account Name',
    pinned: 'left',
    lockPinned: true,
    width: 180,
  },
  {
    field: 'opportunityName',
    headerName: 'Opportunity Name',
    pinned: 'left',
    lockPinned: true,
    width: 220,
  },
];
```

The frozen column group must have a subtle right shadow:

```css
.ag-theme-pp .ag-pinned-left-cols-container {
  box-shadow: var(--pp-grid-frozen-shadow, 2px 0 4px rgba(0, 0, 0, 0.08));
}
```

## Health Rendering

Health status is rendered as **cell background tints only** — never as floating badges, icons, or `<StatusBadge>` components inside cells.

```tsx
const healthCellClassRules: CellClassRules = {
  'pp-cell-health-green': (params) => params.value === 'Green',
  'pp-cell-health-yellow': (params) => params.value === 'Yellow',
  'pp-cell-health-red': (params) => params.value === 'Red',
  'pp-cell-health-blocked': (params) => params.value === 'Blocked',
};
```

```css
.ag-theme-pp .pp-cell-health-green {
  background-color: var(--pp-success-50);
}
.ag-theme-pp .pp-cell-health-yellow {
  background-color: var(--pp-warning-50);
}
.ag-theme-pp .pp-cell-health-red {
  background-color: var(--pp-danger-50);
}
.ag-theme-pp .pp-cell-health-blocked {
  background-color: var(--pp-neutral-200);
}
```

**Prohibited:** Using `cellRenderer` to render `<StatusBadge>`, `<Chip>`, `<Tag>`, or any component inside health cells. Cell class rules are the only allowed mechanism.

## Keyboard Parity

The grid must support full spreadsheet keyboard navigation:

| Key | Action |
|-----|--------|
| `Tab` | Move to next editable cell |
| `Shift+Tab` | Move to previous editable cell |
| `Enter` | Start editing / confirm edit and move down |
| `Escape` | Cancel editing |
| `Arrow keys` | Navigate cells |
| `Ctrl+Home` | Jump to first cell (A1) |
| `Ctrl+End` | Jump to last cell |
| `Ctrl+F` | Open grid quick-filter / browser find |
| `Ctrl+C` | Copy selected range |
| `Ctrl+V` | Paste into selected range |
| `Ctrl+Z` | Undo cell edit |
| `Ctrl+Shift+Z` | Redo cell edit |
| `Delete` | Clear selected cell(s) |

AG Grid Community provides most of these by default. Ensure none are suppressed and that custom key handlers do not interfere.

## Export — SheetJS CE Only

All data export uses SheetJS CE (`xlsx` package). Never use AG Grid's built-in export or `papaparse`.

```tsx
import * as XLSX from 'xlsx';

function exportToExcel(gridApi: GridApi, filename: string): void {
  const rowData: Record<string, unknown>[] = [];
  gridApi.forEachNodeAfterFilterAndSort((node) => {
    if (node.data) rowData.push(node.data);
  });

  const worksheet = XLSX.utils.json_to_sheet(rowData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Pipeline');
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}
```

**Rules:**
- Export respects current filter and sort state
- Column headers use display names, not field keys
- Currency columns formatted with 2 decimal places
- Date columns formatted as YYYY-MM-DD

## Inline Cell Editing

- All editable cells use AG Grid's built-in cell editors
- Custom cell editors only when business logic requires it (e.g., currency input, date picker)
- `valueSetter` validates input before committing
- Failed validation shows a tooltip, does not reject the keystroke silently
- Edit events trigger optimistic update via TanStack Query mutation

## Column State Persistence

- Column widths, sort order, filter state, and column visibility are persisted to `localStorage`
- Key format: `pp-grid-state-{gridId}`
- Restore on mount via `columnApi.applyColumnState()`
- Reset button clears saved state and applies defaults

## Compliance Checklist

Before approving any PR that touches a grid:

- [ ] Uses `ag-theme-pp` class, not `ag-theme-alpine` or other built-in themes
- [ ] `suppressPaginationPanel: true` is set
- [ ] `rowModelType: 'clientSide'` (virtual scroll, no server-side pagination)
- [ ] Status bar configured with row count + aggregation
- [ ] Deal ID, Account Name, Opportunity Name are pinned left
- [ ] Health column uses `cellClassRules`, not `cellRenderer`
- [ ] Export uses SheetJS CE, not AG Grid export or papaparse
- [ ] `enableRangeSelection`, `enableFillHandle`, `undoRedoCellEditing` all true
- [ ] No `@tanstack/react-table` imports anywhere in the codebase
- [ ] Keyboard navigation not suppressed
