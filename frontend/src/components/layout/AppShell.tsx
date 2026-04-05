/**
 * AppShell — root layout for every authenticated page.
 *
 * Responsibilities:
 * 1. Wraps the entire app in SidebarProvider so all children can call useSidebar()
 * 2. Renders AppSidebar (left) + SidebarInset (right: TopBar + page content)
 * 3. Calls useMe() on mount to verify the JWT cookie is still valid and hydrate
 *    the user into the auth store. If the cookie has expired, useMe's 401 will
 *    trigger the api-client redirect to /auth/login automatically.
 */
import { Outlet, useNavigate, useRouterState } from '@tanstack/react-router';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { TopBar } from './TopBar';
import { TopBarSlotProvider } from './TopBarSlot';
import { CommandPalette } from '@/components/command-palette/CommandPalette';
import { useMe } from '@/hooks/useAuth';
import { useSequentialShortcuts } from '@/hooks/useSequentialShortcuts';
import { useRequestNewDeal } from '@/stores';

/**
 * WF17 §6.6 — sequential "Go To" and action shortcuts.
 * Lives inside AppShell so it has access to the router context.
 *
 *   G P  → Pipeline
 *   G D  → Dashboard
 *   N D  → New Deal (signals PipelineGrid via ui.store)
 */
function GlobalSequentialShortcuts() {
  const navigate = useNavigate();
  const requestNewDeal = useRequestNewDeal();

  useSequentialShortcuts([
    { sequence: 'gp', handler: () => void navigate({ to: '/pipeline' }) },
    { sequence: 'gd', handler: () => void navigate({ to: '/pipeline' }) }, // Dashboard route → update when /dashboard exists
    { sequence: 'nd', handler: requestNewDeal },
  ]);

  return null;
}

function AuthVerifier() {
  // Runs in the background — verifies httpOnly cookie is still valid.
  // On 401 the api-client redirects; on success it keeps the store fresh.
  useMe();
  return null;
}

export function AppShell() {
  const { location } = useRouterState();
  const isDetailRoute = /^\/pipeline\/[^/]+/.test(location.pathname);

  return (
    <TopBarSlotProvider>
      <SidebarProvider defaultOpen={false} {...(isDetailRoute ? { open: false } : {})}>
        {/* Background auth verification — no render output */}
        <AuthVerifier />

        {/* WF17 §6.6 sequential keyboard shortcuts — no render output */}
        <GlobalSequentialShortcuts />

        {/* Command palette — portal, no layout impact */}
        <CommandPalette />

        {/* Left: collapsible sidebar nav */}
        <AppSidebar />

        {/* Right: main content area */}
        <SidebarInset>
          {/* Top bar (no page-specific actions at layout level — pages inject via context) */}
          <TopBar />

          {/* Page content */}
          <main className="flex flex-1 flex-col overflow-hidden">
            <Outlet />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TopBarSlotProvider>
  );
}
