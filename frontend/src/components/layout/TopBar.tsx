/**
 * TopBar — sits at the top of every authenticated page inside SidebarInset.
 *
 * Contains: sidebar collapse trigger · breadcrumb · page title · right-side actions
 */
import type { ReactNode } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { Bell, Search } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTopBarActions } from './TopBarSlot';
import { useCommandPaletteStore } from '@/stores/command-palette.store';

// ---------------------------------------------------------------------------
// Route → breadcrumb label map
// ---------------------------------------------------------------------------

const ROUTE_LABELS: Record<string, string> = {
  '/pipeline': 'Pipeline',
  '/accounts': 'Accounts',
  '/contacts': 'Contacts',
  '/channels': 'Channels',
  '/revenue': 'Revenue',
  '/velocity': 'Velocity',
  '/closed': 'Closed',
  '/admin': 'Admin',
};

function useBreadcrumb(): { label: string; href: string }[] {
  const { location } = useRouterState();
  const pathname = location.pathname;

  // Build breadcrumb segments from path
  const segments = pathname.split('/').filter(Boolean);
  const crumbs: { label: string; href: string }[] = [];

  let built = '';
  for (const seg of segments) {
    built += `/${seg}`;
    const label =
      ROUTE_LABELS[built] ??
      seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' ');
    crumbs.push({ label, href: built });
  }

  return crumbs;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface TopBarProps {
  /** Optional right-side slot — passed from individual pages (e.g. export button) */
  actions?: ReactNode;
  className?: string;
}

export function TopBar({ actions: propActions, className }: TopBarProps) {
  const crumbs = useBreadcrumb();
  const slotActions = useTopBarActions();
  const actions = propActions ?? slotActions;

  return (
    <header
      className={cn(
        'flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4',
        className,
      )}
    >
      {/* Sidebar collapse / expand toggle */}
      <SidebarTrigger className="-ml-1" />

      <Separator orientation="vertical" className="h-4" />

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm">
        <span className="text-muted-foreground">1CloudHub</span>
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <span key={crumb.href} className="flex items-center gap-1">
              <span className="text-muted-foreground">/</span>
              {isLast ? (
                <span className="font-medium text-foreground">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  to={crumb.href}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {crumb.label}
                </Link>
              )}
            </span>
          );
        })}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right-side actions: search + page-specific slot + global notifications */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground"
          onClick={() => useCommandPaletteStore.getState().open()}
        >
          <Search className="size-4" />
          <span className="sr-only">Search (Cmd+K)</span>
        </Button>

        {actions}

        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground"
          aria-label="Notifications"
          aria-haspopup="dialog"
        >
          <Bell className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </header>
  );
}
