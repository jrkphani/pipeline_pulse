// ---------------------------------------------------------------------------
// CommandPalette — main component (cmdk + Radix Dialog)
// ---------------------------------------------------------------------------
// Trigger: Cmd+K / Ctrl+K (global), or TopBar search icon.
// Pre-type: shows recent items + commands from Zustand store.
// Typed: debounced API search + client-side command matching.
// ---------------------------------------------------------------------------

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Command as Cmdk } from 'cmdk';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { useNavigate } from '@tanstack/react-router';
import {
  Search,
  LayoutGrid,
  Building2,
  Users,
  Radio,
  TrendingUp,
  Gauge,
  CheckCircle2,
  Settings,
  Plus,
  UserPlus,
  Building,
  UserRoundPlus,
  ClipboardEdit,
  Clock,
  DollarSign,
  User,
  UserX,
  CalendarCheck,
  Command,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';
import { useUserRole } from '@/stores/auth.store';
import { useCommandPaletteStore, useRecentEntries } from '@/stores/command-palette.store';
import { useFilterStore } from '@/stores/filter.store';
import { COMMANDS, filterCommands } from './constants/command-registry';
import { rankResults } from './utils/rank-results';
import { ResultRow } from './ResultRow';
import type { EntityResultGroup, PaletteCommand, RecentItem, SearchResultItem } from './types';

// ---------------------------------------------------------------------------
// Icon mapping for commands
// ---------------------------------------------------------------------------

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  LayoutGrid,
  Building2,
  Users,
  Radio,
  TrendingUp,
  Gauge,
  CheckCircle2,
  Settings,
  Plus,
  UserPlus,
  Building,
  UserRoundPlus,
  ClipboardEdit,
  Clock,
  DollarSign,
  User,
  UserX,
  CalendarCheck,
};

// ---------------------------------------------------------------------------
// Debounce hook
// ---------------------------------------------------------------------------

function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

// ---------------------------------------------------------------------------
// Entity group header labels
// ---------------------------------------------------------------------------

const GROUP_LABELS: Record<string, string> = {
  opportunity: 'Opportunities',
  account: 'Accounts',
  contact: 'Contacts',
  lead: 'Leads',
  team_member: 'Team Members',
  page: 'Pages',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CommandPalette() {
  const navigate = useNavigate();
  const role = useUserRole();
  const { isOpen, close, toggle, recordVisit, recordCommandUse } =
    useCommandPaletteStore();
  const recentEntries = useRecentEntries();
  const setPendingFilter = useFilterStore((s) => s.setPendingFilter);

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 200);
  const [searchGroups, setSearchGroups] = useState<EntityResultGroup[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // ── Global keyboard shortcut ──────────────────────────────────────────
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggle();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [toggle]);

  // ── API search on debounced query ─────────────────────────────────────
  useEffect(() => {
    if (!debouncedQuery) {
      setSearchGroups([]);
      return;
    }

    // Abort any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsSearching(true);
    apiClient
      .get<{ groups: EntityResultGroup[] }>(`/search?q=${encodeURIComponent(debouncedQuery)}`, {
        signal: controller.signal,
      })
      .then((data) => {
        if (!controller.signal.aborted) {
          setSearchGroups(rankResults(data.groups, role));
        }
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsSearching(false);
      });

    return () => controller.abort();
  }, [debouncedQuery, role]);

  // ── Reset on close ────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setSearchGroups([]);
    }
  }, [isOpen]);

  // ── Client-side command matching ──────────────────────────────────────
  const matchedCommands = useMemo(() => filterCommands(query), [query]);

  // ── Handlers ──────────────────────────────────────────────────────────
  const handleSelectEntity = useCallback(
    (item: SearchResultItem) => {
      const route = `/${item.entity_type === 'team_member' ? 'contacts' : item.entity_type === 'opportunity' ? 'pipeline' : item.entity_type + 's'}`;
      const recent: RecentItem = {
        id: item.id,
        entity_type: item.entity_type,
        label: item.label,
        sub_label: item.sub_label,
        route,
        visited_at: new Date().toISOString(),
      };
      recordVisit(recent);
      close();
      navigate({ to: route });
    },
    [navigate, recordVisit, close],
  );

  const handleSelectCommand = useCallback(
    (cmd: PaletteCommand) => {
      const recent: RecentItem = {
        id: cmd.id,
        entity_type: 'command',
        label: cmd.label,
        sub_label: null,
        route: cmd.route ?? '/pipeline',
        visited_at: new Date().toISOString(),
      };
      recordCommandUse(recent);

      // Apply filter if present
      if (cmd.filter) {
        setPendingFilter(cmd.filter);
      }

      close();

      if (cmd.route) {
        navigate({ to: cmd.route });
      }
    },
    [navigate, recordCommandUse, setPendingFilter, close],
  );

  const handleSelectRecent = useCallback(
    (entry: RecentItem) => {
      // Re-record the visit to bump timestamp
      if (entry.entity_type === 'command') {
        recordCommandUse({ ...entry, visited_at: new Date().toISOString() });
      } else {
        recordVisit({ ...entry, visited_at: new Date().toISOString() });
      }
      close();
      navigate({ to: entry.route });
    },
    [navigate, recordVisit, recordCommandUse, close],
  );

  // ── Pre-type vs typed state ───────────────────────────────────────────
  const showPreType = !query;
  const showResults = !!query;
  const hasResults = searchGroups.length > 0 || matchedCommands.length > 0;

  return (
    <Cmdk.Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) close();
      }}
      label="Command Palette"
      shouldFilter={false}
      loop
      overlayClassName="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
      contentClassName={cn(
        'fixed left-1/2 top-[20vh] z-[70] w-[640px] -translate-x-1/2',
        'rounded-xl border bg-popover shadow-2xl',
        'animate-in fade-in-0 zoom-in-95 duration-150',
      )}
    >
      {/* Accessible title (hidden) — required by Radix Dialog */}
      <VisuallyHidden.Root asChild>
        <DialogPrimitive.Title>Command Palette</DialogPrimitive.Title>
      </VisuallyHidden.Root>

      {/* Input row */}
      <div className="flex items-center gap-2 border-b px-4">
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <Cmdk.Input
          placeholder="Search or type a command..."
          value={query}
          onValueChange={setQuery}
          className={cn(
            'flex h-12 w-full bg-transparent text-base font-normal outline-none',
            'placeholder:text-muted-foreground',
          )}
        />
        <kbd className="hidden sm:inline-flex shrink-0 items-center gap-0.5 rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          <Command className="size-3" />K
        </kbd>
      </div>

      {/* Results list */}
      <Cmdk.List className="max-h-[min(400px,50vh)] overflow-y-auto p-2">
        {/* Loading */}
        {isSearching && (
          <Cmdk.Loading className="px-4 py-6 text-center text-sm text-muted-foreground">
            Searching...
          </Cmdk.Loading>
        )}

        {/* Empty state */}
        {showResults && !hasResults && !isSearching && (
          <Cmdk.Empty className="px-4 py-6 text-center text-sm text-muted-foreground">
            No results for &ldquo;{query}&rdquo;
          </Cmdk.Empty>
        )}

        {/* Pre-type: recent items */}
        {showPreType && recentEntries.length > 0 && (
          <Cmdk.Group heading="Recent">
            {recentEntries.map((entry) => (
              <Cmdk.Item
                key={entry.id}
                value={`recent-${entry.id}`}
                onSelect={() => handleSelectRecent(entry)}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2',
                  'text-sm aria-selected:bg-accent',
                )}
              >
                <span className="size-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
                <span className="flex-1 truncate">{entry.label}</span>
                <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground capitalize">
                  {entry.entity_type === 'command' ? 'Command' : entry.entity_type.replace('_', ' ')}
                </span>
              </Cmdk.Item>
            ))}
          </Cmdk.Group>
        )}

        {/* Pre-type: show all commands when empty */}
        {showPreType && recentEntries.length === 0 && (
          <Cmdk.Group heading="Commands">
            {COMMANDS.slice(0, 8).map((cmd) => {
              const Icon = ICON_MAP[cmd.icon];
              return (
                <Cmdk.Item
                  key={cmd.id}
                  value={cmd.id}
                  onSelect={() => handleSelectCommand(cmd)}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2',
                    'text-sm aria-selected:bg-accent',
                  )}
                >
                  {Icon ? <Icon className="size-4 shrink-0 text-muted-foreground" /> : null}
                  <span className="flex-1 truncate">{cmd.label}</span>
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground capitalize">
                    {cmd.category.replace('_', ' ')}
                  </span>
                </Cmdk.Item>
              );
            })}
          </Cmdk.Group>
        )}

        {/* Typed: entity groups */}
        {showResults &&
          searchGroups.map((group) => (
            <Cmdk.Group
              key={group.entity_type}
              heading={GROUP_LABELS[group.entity_type] ?? group.entity_type}
            >
              {group.items.map((item) => (
                <Cmdk.Item
                  key={item.id}
                  value={item.id}
                  onSelect={() => handleSelectEntity(item)}
                  className={cn(
                    'flex cursor-pointer items-center rounded-lg px-3 py-2',
                    'aria-selected:bg-accent',
                  )}
                >
                  <ResultRow item={item} />
                </Cmdk.Item>
              ))}
            </Cmdk.Group>
          ))}

        {/* Typed: matching commands */}
        {showResults && matchedCommands.length > 0 && (
          <Cmdk.Group heading="Commands">
            {matchedCommands.map((cmd) => {
              const Icon = ICON_MAP[cmd.icon];
              return (
                <Cmdk.Item
                  key={cmd.id}
                  value={cmd.id}
                  onSelect={() => handleSelectCommand(cmd)}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2',
                    'text-sm aria-selected:bg-accent',
                  )}
                >
                  {Icon ? <Icon className="size-4 shrink-0 text-muted-foreground" /> : null}
                  <span className="flex-1 truncate">{cmd.label}</span>
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground capitalize">
                    {cmd.category.replace('_', ' ')}
                  </span>
                </Cmdk.Item>
              );
            })}
          </Cmdk.Group>
        )}
      </Cmdk.List>

      {/* Footer hint */}
      <div className="flex items-center gap-4 border-t px-4 py-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <kbd className="rounded border bg-muted px-1 py-0.5 text-[10px]">↑↓</kbd>
          navigate
        </span>
        <span className="flex items-center gap-1">
          <kbd className="rounded border bg-muted px-1 py-0.5 text-[10px]">↵</kbd>
          select
        </span>
        <span className="flex items-center gap-1">
          <kbd className="rounded border bg-muted px-1 py-0.5 text-[10px]">Esc</kbd>
          close
        </span>
      </div>
    </Cmdk.Dialog>
  );
}
