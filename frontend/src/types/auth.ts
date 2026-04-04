// Auth & User types — mirrors backend schemas exactly

export type UserRole =
  | 'admin'
  | 'cro'
  | 'sales_manager'
  | 'presales_manager'
  | 'ae'
  | 'sdr'
  | 'presales_consultant'
  | 'presales_sa'
  | 'aws_alliance_manager'
  | 'finance_manager';

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  cro: 'CRO',
  sales_manager: 'Sales Manager',
  presales_manager: 'Presales Manager',
  ae: 'Account Executive',
  sdr: 'SDR',
  presales_consultant: 'Presales Consultant',
  presales_sa: 'Presales SA',
  aws_alliance_manager: 'AWS Alliance Manager',
  finance_manager: 'Finance Manager',
};

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
  updated_at: string;
  last_login: string | null;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface ApiError {
  error: string;
  status_code?: number;
  details?: unknown;
}
