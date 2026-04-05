import type { UserRole } from '@/types/index';
import type { UserRole as AuthUserRole } from '@/types/auth';

// ---------------------------------------------------------------------------
// Auth → Grid role mapping
// ---------------------------------------------------------------------------

const AUTH_TO_GRID_ROLE: Record<AuthUserRole, UserRole> = {
  admin: 'admin',
  cro: 'cro',
  sales_manager: 'pm',
  sales_ops: 'admin',
  presales_manager: 'pm',
  ae: 'ae',
  sdr: 'sdr',
  presales_consultant: 'pc',
  presales_sa: 'sa',
  aws_alliance_manager: 'am',
  finance_manager: 'finance',
};

/** Map backend auth role to simplified grid role */
export function toGridRole(authRole: AuthUserRole): UserRole {
  return AUTH_TO_GRID_ROLE[authRole];
}

// ---------------------------------------------------------------------------
// Role-based grid configuration
// ---------------------------------------------------------------------------

export interface GridRoleConfig {
  /** Finance users see a fully read-only grid */
  isReadOnly: boolean;
  /** AM role lands on alliance tab by default */
  defaultTab: 'pipeline' | 'alliance';
  /** Bulk toolbar hidden for finance and SDR roles */
  showBulkToolbar: boolean;
  /** Only certain roles can create new deals */
  showNewDealButton: boolean;
  /** Finance gets a reduced column set; everyone else gets default */
  columnSet: 'finance' | 'default';
}

export function getGridConfig(role: UserRole): GridRoleConfig {
  return {
    isReadOnly: role === 'finance',
    defaultTab: role === 'am' ? 'alliance' : 'pipeline',
    showBulkToolbar: role !== 'finance' && role !== 'sdr',
    showNewDealButton: ['admin', 'ae', 'pc', 'cro', 'pm'].includes(role),
    columnSet: role === 'finance' ? 'finance' : 'default',
  };
}
