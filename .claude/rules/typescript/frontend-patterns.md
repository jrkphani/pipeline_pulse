# TypeScript Rules — Pipeline Pulse Frontend

> Extends: rules/common/coding-style.md
> Stack: React 18.3 · Vite 5 · Zustand 4.5 · AG Grid Community · React Query 5 · Tailwind 3.4

---

## Compiler Settings (tsconfig.json)

These are non-negotiable — never loosen:
```json
{
  "strict": true,
  "noUncheckedIndexedAccess": true,
  "noImplicitReturns": true,
  "exactOptionalPropertyTypes": true
}
```

---

## AG Grid Typing

Always parameterise AG Grid generics with the row type:

```typescript
import type { ColDef, GridReadyEvent, CellValueChangedEvent } from 'ag-grid-community';
import { AgGridReact } from '@ag-grid-community/react';

// WRONG — loses type safety
const colDefs: ColDef[] = [];

// RIGHT — fully typed
const colDefs: ColDef<Opportunity>[] = [
  {
    field: 'sgd_core',
    headerName: 'SGD Core (S$)',
    pinned: 'left',
    editable: true,
    cellEditor: 'agNumberCellEditor',
    valueFormatter: ({ value }: { value: number }) => formatSGD(value),
    filter: 'agNumberColumnFilter',
    type: 'numericColumn',
  },
];

// Grid event handlers
const onGridReady = (event: GridReadyEvent<Opportunity>) => {
  event.api.sizeColumnsToFit();
};

const onCellValueChanged = (event: CellValueChangedEvent<Opportunity>) => {
  const { data, colDef, newValue } = event;
  // data is fully typed as Opportunity
};
```

---

## Zustand Store Typing

```typescript
// opportunity.store.ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Opportunity } from '@/types/opportunity';

interface OpportunityState {
  opportunities: Opportunity[];
  selectedIds: Set<string>;
  isLoading: boolean;
}

interface OpportunityActions {
  setOpportunities: (opps: Opportunity[]) => void;
  updateOpportunity: (id: string, patch: Partial<Opportunity>) => void;
  toggleSelection: (id: string) => void;
  clearSelection: () => void;
}

type OpportunityStore = OpportunityState & OpportunityActions;

export const useOpportunityStore = create<OpportunityStore>()(
  immer((set) => ({
    // State
    opportunities: [],
    selectedIds: new Set(),
    isLoading: false,

    // Actions
    setOpportunities: (opps) =>
      set((draft) => { draft.opportunities = opps; }),

    updateOpportunity: (id, patch) =>
      set((draft) => {
        const idx = draft.opportunities.findIndex((o) => o.id === id);
        if (idx !== -1) Object.assign(draft.opportunities[idx], patch);
      }),

    toggleSelection: (id) =>
      set((draft) => {
        draft.selectedIds.has(id)
          ? draft.selectedIds.delete(id)
          : draft.selectedIds.add(id);
      }),

    clearSelection: () =>
      set((draft) => { draft.selectedIds.clear(); }),
  }))
);

// Selector hooks — prevent unnecessary re-renders
export const useOpportunities = () =>
  useOpportunityStore((s) => s.opportunities);

export const useSelectedOpportunityIds = () =>
  useOpportunityStore((s) => s.selectedIds);
```

---

## React Query 5 Patterns

```typescript
// hooks/useOpportunities.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { Opportunity, OpportunityPatch } from '@/types/opportunity';

const OPPORTUNITIES_KEY = ['opportunities'] as const;

export function useOpportunities() {
  return useQuery({
    queryKey: OPPORTUNITIES_KEY,
    queryFn: () => apiClient.get<Opportunity[]>('/opportunities').then((r) => r.data),
    staleTime: 30_000,    // 30s — grid doesn't need real-time for list
  });
}

export function useUpdateOpportunity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: OpportunityPatch }) =>
      apiClient.patch<Opportunity>(`/opportunities/${id}`, patch).then((r) => r.data),

    // Optimistic update
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: OPPORTUNITIES_KEY });
      const previous = qc.getQueryData<Opportunity[]>(OPPORTUNITIES_KEY);
      qc.setQueryData<Opportunity[]>(OPPORTUNITIES_KEY, (old) =>
        old?.map((o) => (o.id === id ? { ...o, ...patch } : o)) ?? []
      );
      return { previous };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(OPPORTUNITIES_KEY, ctx.previous);
      }
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: OPPORTUNITIES_KEY });
    },
  });
}
```

---

## Component Patterns

```typescript
// Named export for components (not default for shared components)
// Exception: pages always use default export for lazy loading

// Props interface co-located with component
interface PipelineGridProps {
  className?: string;
  onSelectionChange?: (ids: string[]) => void;
}

export function PipelineGrid({ className, onSelectionChange }: PipelineGridProps) {
  // Separate concerns: data fetching, store sync, grid config
  const { data: opportunities, isLoading } = useOpportunities();
  const setOpportunities = useOpportunityStore((s) => s.setOpportunities);

  useEffect(() => {
    if (opportunities) setOpportunities(opportunities);
  }, [opportunities, setOpportunities]);

  return (
    <div className={cn('h-full w-full', className)}>
      {isLoading ? <GridSkeleton /> : (
        <AgGridReact<Opportunity>
          rowData={opportunities}
          columnDefs={colDefs}
          // ... rest of config
        />
      )}
    </div>
  );
}
```

---

## Import Order (enforced by ESLint)

```typescript
// 1. Node built-ins
import path from 'path';

// 2. External packages
import { useQuery } from '@tanstack/react-query';
import { AgGridReact } from '@ag-grid-community/react';

// 3. Internal absolute (@/)
import { useOpportunities } from '@/hooks/useOpportunities';
import { formatSGD } from '@/lib/format';

// 4. Relative
import { columnDefs } from './column-defs';

// 5. Types (always last, import type)
import type { Opportunity } from '@/types/opportunity';
```

---

## Forbidden Patterns

```typescript
// No default export for shared components
export default function PipelineGrid() {}  // ❌ — use named export

// No inline styles — use cn() + Tailwind
<div style={{ marginTop: '16px' }} />  // ❌

// No any
const data: any = response;  // ❌

// No non-null assertion without comment
const value = data!.sgd_core;  // ❌ without: // safe: validated by Zod schema

// No direct Zustand state mutation
store.opportunities.push(newOpp);  // ❌ — use set() with immer

// No AG Grid Enterprise
import { LicenseManager } from '@ag-grid-enterprise/core';  // ❌ BLOCKER
```
