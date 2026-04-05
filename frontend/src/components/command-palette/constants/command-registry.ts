// ---------------------------------------------------------------------------
// Command Registry — static commands for the palette
// ---------------------------------------------------------------------------
// Commands are always visible when query matches their label prefix.
// They do not respect RLS (no record-level sensitivity).
// Ordered: navigation → creation → filter_preset
// ---------------------------------------------------------------------------

import type { PaletteCommand } from '../types';

export const COMMANDS: PaletteCommand[] = [
  // ── Navigation ──────────────────────────────────────────────────────────
  {
    id: 'nav-pipeline',
    label: 'Go to My Pipeline',
    category: 'navigation',
    icon: 'LayoutGrid',
    route: '/pipeline',
  },
  {
    id: 'nav-accounts',
    label: 'Go to Accounts',
    category: 'navigation',
    icon: 'Building2',
    route: '/accounts',
  },
  {
    id: 'nav-contacts',
    label: 'Go to Contacts',
    category: 'navigation',
    icon: 'Users',
    route: '/contacts',
  },
  {
    id: 'nav-channels',
    label: 'Go to Channels',
    category: 'navigation',
    icon: 'Radio',
    route: '/channels',
  },
  {
    id: 'nav-revenue',
    label: 'Go to Revenue',
    category: 'navigation',
    icon: 'TrendingUp',
    route: '/revenue',
  },
  {
    id: 'nav-velocity',
    label: 'Go to Velocity',
    category: 'navigation',
    icon: 'Gauge',
    route: '/velocity',
  },
  {
    id: 'nav-closed',
    label: 'Go to Closed',
    category: 'navigation',
    icon: 'CheckCircle2',
    route: '/closed',
  },
  {
    id: 'nav-admin',
    label: 'Go to Settings',
    category: 'navigation',
    icon: 'Settings',
    route: '/admin',
  },

  // ── Record Creation ─────────────────────────────────────────────────────
  {
    id: 'create-opportunity',
    label: 'New Opportunity',
    category: 'creation',
    icon: 'Plus',
  },
  {
    id: 'create-lead',
    label: 'New Lead',
    category: 'creation',
    icon: 'UserPlus',
  },
  {
    id: 'create-account',
    label: 'New Account',
    category: 'creation',
    icon: 'Building',
  },
  {
    id: 'create-contact',
    label: 'New Contact',
    category: 'creation',
    icon: 'UserRoundPlus',
  },
  {
    id: 'create-activity',
    label: 'Log Activity',
    category: 'creation',
    icon: 'ClipboardEdit',
  },

  // ── Filter Presets ──────────────────────────────────────────────────────
  {
    id: 'filter-stale',
    label: 'Show Stale Opportunities (>60 days)',
    category: 'filter_preset',
    icon: 'Clock',
    route: '/pipeline',
    filter: { stale_days_gt: 60 },
  },
  {
    id: 'filter-high-value',
    label: 'Show High-Value Pipeline (SGD Core >500K)',
    category: 'filter_preset',
    icon: 'DollarSign',
    route: '/pipeline',
    filter: { sgd_core_gt: 500_000 },
  },
  {
    id: 'filter-my-open',
    label: 'Show My Open Opportunities',
    category: 'filter_preset',
    icon: 'User',
    route: '/pipeline',
    filter: { my_open: true },
  },
  {
    id: 'filter-unassigned-leads',
    label: 'Show Unassigned Leads',
    category: 'filter_preset',
    icon: 'UserX',
    route: '/pipeline',
    filter: { unassigned_leads: true },
  },
  {
    id: 'filter-quarter-closings',
    label: "Show This Quarter's Closings",
    category: 'filter_preset',
    icon: 'CalendarCheck',
    route: '/pipeline',
    filter: { this_quarter_closings: true },
  },
];

/** Match commands whose label starts with the query (case-insensitive) */
export function filterCommands(query: string): PaletteCommand[] {
  if (!query) return [];
  const q = query.toLowerCase();
  return COMMANDS.filter((cmd) => cmd.label.toLowerCase().includes(q));
}
