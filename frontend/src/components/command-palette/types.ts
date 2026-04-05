// ---------------------------------------------------------------------------
// Command Palette — Type Definitions
// ---------------------------------------------------------------------------

/** Entity types searchable via the command palette */
export const ENTITY_TYPES = [
  'opportunity',
  'account',
  'contact',
  'lead',
  'team_member',
  'page',
] as const;
export type EntityType = (typeof ENTITY_TYPES)[number];

/** Command categories — rendered in this priority order */
export type CommandCategory = 'navigation' | 'creation' | 'filter_preset';

// ---------------------------------------------------------------------------
// Search Results
// ---------------------------------------------------------------------------

/** Metadata varies per entity type — kept as a loose record for flexibility */
export interface SearchResultItem {
  id: string;
  entity_type: EntityType;
  label: string;
  sub_label: string | null;
  meta: Record<string, string | number | null>;
  /** ISO timestamp of last user interaction — drives recency sort */
  visited_at: string | null;
}

/** API response groups results by entity type */
export interface EntityResultGroup {
  entity_type: EntityType;
  items: SearchResultItem[];
}

export interface SearchResponse {
  groups: EntityResultGroup[];
}

// ---------------------------------------------------------------------------
// Commands (static, client-side)
// ---------------------------------------------------------------------------

export interface PaletteCommand {
  id: string;
  label: string;
  category: CommandCategory;
  /** Icon name from lucide-react */
  icon: string;
  /** Route path for navigation commands */
  route?: string;
  /** Filter payload for filter-preset commands */
  filter?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Recency Store Types
// ---------------------------------------------------------------------------

export interface RecentItem {
  id: string;
  entity_type: EntityType | 'command';
  label: string;
  sub_label: string | null;
  /** Route to navigate to when selected */
  route: string;
  /** ISO timestamp */
  visited_at: string;
}
