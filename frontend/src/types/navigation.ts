import type { LucideIcon } from 'lucide-react';

export interface NavigationItem {
  name: string;
  href: string;
  icon: LucideIcon;
  description?: string;
  badge?: string;
  children?: NavigationItem[];
}

export interface NavigationSection {
  title: string;
  items: NavigationItem[];
}

export interface BreadcrumbItem {
  name: string;
  href?: string;
  current?: boolean;
}

export interface UserRole {
  id: string;
  name: string;
  permissions: string[];
}

export interface NavigationConfig {
  sections: NavigationSection[];
  roleBasedAccess: Record<string, string[]>; // role -> allowed routes
}

export interface HeaderConfig {
  showSearch: boolean;
  showNotifications: boolean;
  showUserMenu: boolean;
  showSyncStatus: boolean;
  showBreadcrumbs: boolean;
}

export interface SyncStatus {
  isActive: boolean;
  lastSync: Date | null;
  hasErrors: boolean;
  errorCount: number;
  nextSync: Date | null;
}

export interface NotificationItem {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    href: string;
  };
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    currency: string;
    timezone: string;
  };
}