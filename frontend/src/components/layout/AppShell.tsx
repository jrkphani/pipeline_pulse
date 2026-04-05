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
import { Outlet, useRouterState } from '@tanstack/react-router';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { TopBar } from './TopBar';
import { TopBarSlotProvider } from './TopBarSlot';
import { CommandPalette } from '@/components/command-palette/CommandPalette';
import { useMe } from '@/hooks/useAuth';

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
