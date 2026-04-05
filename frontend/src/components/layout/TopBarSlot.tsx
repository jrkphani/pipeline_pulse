/**
 * TopBarSlot — lets pages inject content into the TopBar right-side area.
 *
 * Usage in a page:
 *   <TopBarActions><FxBadge /></TopBarActions>
 *
 * TopBar reads and renders whatever the nearest page set.
 */
import { createContext, useContext, useState, type ReactNode } from 'react';

interface TopBarSlotState {
  actions: ReactNode;
  setActions: (node: ReactNode) => void;
}

const TopBarSlotContext = createContext<TopBarSlotState>({
  actions: null,
  setActions: () => {},
});

export function TopBarSlotProvider({ children }: { children: ReactNode }) {
  const [actions, setActions] = useState<ReactNode>(null);
  return (
    <TopBarSlotContext.Provider value={{ actions, setActions }}>
      {children}
    </TopBarSlotContext.Provider>
  );
}

/** Read current actions — used by TopBar */
export function useTopBarActions(): ReactNode {
  return useContext(TopBarSlotContext).actions;
}

/** Set actions — used by pages */
export function useSetTopBarActions() {
  return useContext(TopBarSlotContext).setActions;
}
