// ---------------------------------------------------------------------------
// Persona-Weighted Result Ranking
// ---------------------------------------------------------------------------
// Weight is applied at result-group ordering level only.
// Within each group, strict recency (visited_at desc) applies.
// No score blending across groups.
// ---------------------------------------------------------------------------

import type { UserRole } from '@/types/auth';
import type { EntityType, EntityResultGroup } from '../types';

/**
 * Lower number = higher priority for that role.
 * Roles not listed here fall back to a generic order.
 */
const RANKING_MATRIX: Partial<Record<UserRole, Record<EntityType, number>>> = {
  sdr: {
    lead: 1,
    contact: 2,
    account: 3,
    opportunity: 4,
    team_member: 5,
    page: 6,
  },
  ae: {
    opportunity: 1,
    account: 2,
    contact: 3,
    lead: 4,
    team_member: 5,
    page: 6,
  },
  presales_sa: {
    account: 1,
    opportunity: 2,
    contact: 3,
    team_member: 4,
    lead: 5,
    page: 6,
  },
  presales_consultant: {
    account: 1,
    opportunity: 2,
    contact: 3,
    team_member: 4,
    lead: 5,
    page: 6,
  },
  aws_alliance_manager: {
    account: 1,
    contact: 2,
    opportunity: 3,
    team_member: 4,
    lead: 5,
    page: 6,
  },
  finance_manager: {
    opportunity: 1,
    account: 2,
    page: 3,
    team_member: 4,
    contact: 5,
    lead: 6,
  },
  sales_manager: {
    opportunity: 1,
    account: 2,
    contact: 3,
    lead: 4,
    team_member: 5,
    page: 6,
  },
  presales_manager: {
    account: 1,
    opportunity: 2,
    contact: 3,
    team_member: 4,
    lead: 5,
    page: 6,
  },
  cro: {
    opportunity: 1,
    account: 2,
    contact: 3,
    lead: 4,
    team_member: 5,
    page: 6,
  },
  admin: {
    opportunity: 1,
    account: 2,
    contact: 3,
    lead: 4,
    team_member: 5,
    page: 6,
  },
};

/** Default weight when role has no specific ranking */
const DEFAULT_WEIGHTS: Record<EntityType, number> = {
  opportunity: 1,
  account: 2,
  contact: 3,
  lead: 4,
  team_member: 5,
  page: 6,
};

function getWeight(role: UserRole | null, entityType: EntityType): number {
  if (role && RANKING_MATRIX[role]) {
    return RANKING_MATRIX[role]![entityType] ?? 99;
  }
  return DEFAULT_WEIGHTS[entityType] ?? 99;
}

/**
 * Sort entity result groups by persona weight, then sort items within each
 * group by recency (visited_at descending). Empty groups are filtered out.
 */
export function rankResults(
  groups: EntityResultGroup[],
  role: UserRole | null,
): EntityResultGroup[] {
  return groups
    .filter((g) => g.items.length > 0)
    .sort((a, b) => getWeight(role, a.entity_type) - getWeight(role, b.entity_type))
    .map((group) => ({
      ...group,
      items: [...group.items].sort((a, b) => {
        // Recency sort: most recent first, nulls last
        if (!a.visited_at && !b.visited_at) return 0;
        if (!a.visited_at) return 1;
        if (!b.visited_at) return -1;
        return b.visited_at.localeCompare(a.visited_at);
      }),
    }));
}
