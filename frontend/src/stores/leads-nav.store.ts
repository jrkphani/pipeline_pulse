import { create } from 'zustand';

interface LeadsNavState {
  /** Ordered list of lead_ids matching the grid's current sort+filter */
  orderedLeadIds: string[];
  setOrderedLeadIds: (ids: string[]) => void;
  clearNav: () => void;
}

export const useLeadsNavStore = create<LeadsNavState>((set) => ({
  orderedLeadIds: [],
  setOrderedLeadIds: (ids) => set({ orderedLeadIds: ids }),
  clearNav: () => set({ orderedLeadIds: [] }),
}));
