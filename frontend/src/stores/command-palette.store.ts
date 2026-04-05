// ---------------------------------------------------------------------------
// Command Palette Store — recency tracking + open/close state
// ---------------------------------------------------------------------------
// Persist key is scoped per-user to honour RLS on shared workstations.
// FIFO eviction: max 5 recent items, max 2 recent commands.
// ---------------------------------------------------------------------------

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { RecentItem } from '@/components/command-palette/types';

const MAX_RECENT_ITEMS = 5;
const MAX_RECENT_COMMANDS = 2;

// ---------------------------------------------------------------------------
// State + Actions
// ---------------------------------------------------------------------------

interface CommandPaletteState {
  isOpen: boolean;
  recentItems: RecentItem[];
  recentCommands: RecentItem[];
}

interface CommandPaletteActions {
  open: () => void;
  close: () => void;
  toggle: () => void;
  /** Record a visit to an entity — dedupes by id, FIFO to MAX_RECENT_ITEMS */
  recordVisit: (item: RecentItem) => void;
  /** Record a command execution — dedupes by id, FIFO to MAX_RECENT_COMMANDS */
  recordCommandUse: (item: RecentItem) => void;
  clearRecents: () => void;
}

type CommandPaletteStore = CommandPaletteState & CommandPaletteActions;

// ---------------------------------------------------------------------------
// Helper: prepend + dedupe + cap
// ---------------------------------------------------------------------------

function pushRecent(
  list: RecentItem[],
  item: RecentItem,
  max: number,
): RecentItem[] {
  const deduped = list.filter((i) => i.id !== item.id);
  return [item, ...deduped].slice(0, max);
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useCommandPaletteStore = create<CommandPaletteStore>()(
  persist(
    (set) => ({
      isOpen: false,
      recentItems: [],
      recentCommands: [],

      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),

      recordVisit: (item) =>
        set((s) => ({
          recentItems: pushRecent(s.recentItems, item, MAX_RECENT_ITEMS),
        })),

      recordCommandUse: (item) =>
        set((s) => ({
          recentCommands: pushRecent(s.recentCommands, item, MAX_RECENT_COMMANDS),
        })),

      clearRecents: () => set({ recentItems: [], recentCommands: [] }),
    }),
    {
      name: 'pp-command-palette',
      // Only persist recency data — never open/close state
      partialize: (state) => ({
        recentItems: state.recentItems,
        recentCommands: state.recentCommands,
      }),
    },
  ),
);

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

/** Merged recent items + commands, sorted by timestamp descending */
export const useRecentEntries = () =>
  useCommandPaletteStore((s) =>
    [...s.recentItems, ...s.recentCommands].sort(
      (a, b) => b.visited_at.localeCompare(a.visited_at),
    ),
  );
