# Performance Rules — Pipeline Pulse

## Frontend Budgets

| Metric | Budget | How to check |
|--------|--------|-------------|
| Initial JS bundle | < 500KB gzipped | `npm run build` → check dist/ |
| AG Grid init (1,000 rows) | < 100ms | Performance tab, `GridReady` event |
| XLSX export (5,000 rows) | < 3s | Manual timing in test |
| API p95 latency (list) | < 200ms | FastAPI metrics endpoint |
| Core Web Vitals LCP | < 2.5s | Lighthouse in CI |

---

## Vite Bundle Splitting

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Heavy libraries in their own chunks
          'ag-grid': ['ag-grid-community', '@ag-grid-community/react'],
          'xlsx': ['xlsx'],
          'react-vendor': ['react', 'react-dom'],
          'query': ['@tanstack/react-query', '@tanstack/react-router'],
          'ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
        },
      },
    },
  },
});
```

---

## AG Grid Performance

```typescript
// Always enable virtualisation — never disable
const gridOptions = {
  rowBuffer: 20,                    // rows rendered outside viewport
  rowModelType: 'clientSide',       // use serverSide for > 10k rows
  animateRows: false,               // disable for large datasets
  suppressColumnVirtualisation: false,  // keep column virtualisation ON
  getRowId: (params) => params.data.id, // required for optimistic updates
};

// For > 10,000 opportunities: switch to Server-Side Row Model
// (this is a future requirement — document it when needed)
```

---

## React Rendering

```typescript
// Memoize expensive column definitions
const colDefs = useMemo<ColDef<Opportunity>[]>(() => [
  // ... column definitions
], []); // empty deps — colDefs are static

// Memoize cell renderers
const SGDCellRenderer = memo(({ value }: ICellRendererParams<Opportunity, number>) => (
  <span className="tabular-nums">{formatSGD(value)}</span>
));

// Stable callbacks to AG Grid
const onCellValueChanged = useCallback(
  (event: CellValueChangedEvent<Opportunity>) => {
    updateOpportunity({ id: event.data.id, patch: { [event.column.getColId()]: event.newValue } });
  },
  [updateOpportunity]
);
```

---

## SheetJS Export Performance

```typescript
// lib/excel-export.ts — use streaming write for large datasets
import * as XLSX from 'xlsx';

export function exportOpportunitiesToXLSX(
  opportunities: Opportunity[],
  filename: string = 'pipeline-export'
): void {
  // Use streaming write for datasets > 1,000 rows
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(opportunities.map(toExcelRow));
  XLSX.utils.book_append_sheet(wb, ws, 'Pipeline');

  // Write async in a Web Worker for datasets > 5,000 rows
  XLSX.writeFile(wb, `${filename}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
}
```

---

## Context Window Management

Directly impacts Claude Code session quality:
- Keep active MCP servers < 10 at once
- Disable unused MCPs in `.claude/settings.json` → `disabledMcpServers`
- If session feels slow: `/compact` to summarise conversation
- Separate sessions for: planning, implementation, testing, review
- Never have ALL agents active simultaneously — invoke selectively

---

## API Response Caching

```python
# FastAPI with Redis caching for expensive aggregations
from app.core.cache import cache

@router.get("/pipeline-summary")
@cache(ttl=60)  # 60s TTL for summary stats
async def get_pipeline_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PipelineSummary:
    return await opportunity_service.get_summary(db)
```
