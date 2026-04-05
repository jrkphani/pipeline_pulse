// ---------------------------------------------------------------------------
// Filter Store — pending filter dispatch from command palette to grid
// ---------------------------------------------------------------------------
// When a filter-preset command is selected, the palette writes the filter here.
// The target page reads and clears it on mount to apply via AG Grid's filter API.
// ---------------------------------------------------------------------------

import { create } from 'zustand';

interface FilterState {
  pendingFilter: Record<string, unknown> | null;
}

interface FilterActions {
  setPendingFilter: (filter: Record<string, unknown>) => void;
  clearPendingFilter: () => void;
}

type FilterStore = FilterState & FilterActions;

export const useFilterStore = create<FilterStore>()((set) => ({
  pendingFilter: null,

  setPendingFilter: (filter) => set({ pendingFilter: filter }),
  clearPendingFilter: () => set({ pendingFilter: null }),
}));
