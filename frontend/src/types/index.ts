export type HealthStatus = 'success' | 'warning' | 'danger' | 'neutral';

export type O2RPhase = 1 | 2 | 3 | 4;

export type SyncStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export interface Opportunity {
  id: number;
  name: string;
  amountLocal: number;
  amountSgd: number;
  localCurrency: string;
  probability: number;
  phase: O2RPhase;
  healthStatus: HealthStatus;
  territoryId: number;
  accountId: number;
  proposalDate?: string;
  kickoffDate?: string;
  completionDate?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  updatedBy: number;
}

export interface OpportunityCreate {
  name: string;
  amountLocal: number;
  localCurrency: string;
  probability: number;
  phase: O2RPhase;
  territoryId: number;
  accountId: number;
  proposalDate?: string;
  kickoffDate?: string;
  completionDate?: string;
}

export interface Territory {
  id: number;
  name: string;
  region: string;
  managerId: number;
  createdAt: string;
  updatedAt: string;
}

export interface Account {
  id: number;
  name: string;
  industry: string;
  type: string;
  territoryId: number;
  createdAt: string;
  updatedAt: string;
}

export interface SyncSession {
  id: string;
  status: SyncStatus;
  type: 'full' | 'incremental';
  startedAt: string;
  completedAt?: string;
  recordsProcessed: number;
  recordsSuccessful: number;
  recordsFailed: number;
  errorMessage?: string;
}

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}