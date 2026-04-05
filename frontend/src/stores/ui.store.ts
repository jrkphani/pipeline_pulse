/**
 * ui.store.ts — lightweight signals for cross-component UI actions.
 *
 * Currently used by:
 *   - N D keyboard shortcut (AppShell) → PipelineGrid startNewDeal
 *
 * Pattern: increment a counter to signal "trigger this action now".
 * Consumers useEffect on the counter and fire their local handler.
 * This avoids prop-drilling and keeps the store serialisable.
 */
import { create } from 'zustand';

interface UIStore {
  /** Bumped each time the user requests a new deal via keyboard shortcut */
  newDealRequest: number;
  requestNewDeal: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  newDealRequest: 0,
  requestNewDeal: () => set((s) => ({ newDealRequest: s.newDealRequest + 1 })),
}));

export const useNewDealRequest = () => useUIStore((s) => s.newDealRequest);
export const useRequestNewDeal = () => useUIStore((s) => s.requestNewDeal);
