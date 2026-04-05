/**
 * AppSidebar — Pipeline Pulse navigation sidebar.
 *
 * Built on shadcn/ui Sidebar primitives (sidebar-07 pattern).
 * - collapsible="icon" -> icon-only collapsed state
 * - SidebarRail -> click-to-toggle strip at sidebar edge
 * - tooltip on every SidebarMenuButton -> shows label on hover when collapsed
 * - Active route detection via TanStack Router's useRouterState.
 * - Superuser-only Admin section with collapsible sub-groups.
 */
import { Link, useRouterState } from '@tanstack/react-router';
import {
  BookOpen,
  Bot,
  Building2,
  ChevronRight,
  ChevronUp,
  ClipboardList,
  DollarSign,
  FileText,
  GitMerge,
  HeartPulse,
  Import,
  LayoutGrid,
  LogOut,
  Network,
  Package,
  ScanSearch,
  Search,
  Settings,
  Target,
  TreeDeciduous,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useCurrentUser, useIsSuperuser } from '@/stores/auth.store';
import { useLogout } from '@/hooks/useAuth';
import { USER_ROLE_LABELS } from '@/types/auth';

// ---------------------------------------------------------------------------
// Navigation item definitions
// ---------------------------------------------------------------------------

const DEMAND_GEN_NAV = [
  {
    label: 'Leads',
    href: '/demand-gen/leads',
    icon: Target,
    tooltip: 'Pre-SQL leads — nurture before graduating to opportunity',
  },
  {
    label: 'Graduation Queue',
    href: '/demand-gen/graduation',
    icon: TrendingUp,
    tooltip: 'MQL-approved leads awaiting AE/PC assignment',
    badge: true,
  },
] as const;

const PIPELINE_NAV = [
  {
    label: 'Opportunities',
    href: '/pipeline',
    icon: LayoutGrid,
    tooltip: 'Pipeline grid — all active opportunities',
  },
] as const;

const INSIGHTS_NAV = [
  {
    label: 'Velocity',
    href: '/velocity',
    icon: Zap,
    tooltip: 'Pipeline velocity & stage analytics',
  },
  {
    label: 'Channel Performance',
    href: '/channels',
    icon: Network,
    tooltip: 'Channel partner performance analysis',
  },
  {
    label: 'Rev vs Target',
    href: '/revenue',
    icon: TrendingUp,
    tooltip: 'Revenue vs target tracking',
  },
  {
    label: 'Pipeline Health',
    href: '/pipeline-health',
    icon: HeartPulse,
    tooltip: 'Pipeline health scoring & coverage',
  },
  {
    label: 'Lead-to-Close',
    href: '/lead-to-close',
    icon: GitMerge,
    tooltip: 'Lead-to-close funnel & conversion',
  },
  {
    label: 'White Space',
    href: '/white-space',
    icon: ScanSearch,
    tooltip: 'White space analysis & upsell potential',
  },
] as const;

const RECORDS_NAV = [
  {
    label: 'Accounts',
    href: '/accounts',
    icon: Building2,
    tooltip: 'Account management',
  },
  {
    label: 'Contacts',
    href: '/contacts',
    icon: Users,
    tooltip: 'Contact management',
  },
] as const;

const ADMIN_NAV = [
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Reference Data', href: '/admin/reference-data', icon: ClipboardList },
  { label: 'Q Tree', href: '/admin/q-tree', icon: TreeDeciduous },
  { label: 'FX Rates', href: '/admin/fx-rates', icon: DollarSign },
  { label: 'Doc AI', href: '/admin/doc-ai', icon: Search },
  { label: 'Import', href: '/admin/import', icon: Import },
  { label: 'System', href: '/admin/system', icon: Settings },
] as const;

const AI_ADMIN_NAV = [
  { label: 'SOPs', href: '/admin/sops', icon: FileText, badge: 'v6' },
  { label: 'Models', href: '/admin/model-config', icon: Bot, badge: 'v6' },
  { label: 'Catalog', href: '/admin/catalog', icon: Package, badge: 'v6' },
  { label: 'Templates', href: '/admin/templates', icon: BookOpen, badge: 'v6' },
] as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AppSidebar() {
  const user = useCurrentUser();
  const isSuperuser = useIsSuperuser();
  const { mutate: logout } = useLogout();
  const { location } = useRouterState();
  const currentPath = location.pathname;

  const initials = user
    ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
    : '??';

  return (
    <Sidebar collapsible="icon">

      {/* Header — logo + branding (h-14 matches TopBar) */}
      <SidebarHeader className="h-14 flex-row items-center border-b border-sidebar-border p-2">
        <Link to="/pipeline" className="flex items-center gap-2.5 px-0.5">
          <img src="/logos/pp-icon-mark.svg" alt="Pipeline Pulse Icon" className="size-8 shrink-0" width={32} height={32} />
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold leading-none text-sidebar-foreground">
              Pipeline Pulse
            </span>
            <span className="mt-0.5 text-[10px] leading-none text-sidebar-foreground/60">
              1CloudHub Sales
            </span>
          </div>
        </Link>
      </SidebarHeader>

      {/* Content — scrollable nav groups */}
      <SidebarContent>

        {/* Demand Gen group */}
        <SidebarGroup>
          <SidebarGroupLabel>Demand Gen</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {DEMAND_GEN_NAV.map((item) => {
                const active = currentPath.startsWith(item.href);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.tooltip}
                    >
                      <Link to={item.href} aria-current={active ? 'page' : undefined}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Pipeline group */}
        <SidebarGroup>
          <SidebarGroupLabel>Pipeline</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {PIPELINE_NAV.map((item) => {
                const active = currentPath.startsWith(item.href);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.tooltip}
                    >
                      <Link to={item.href} aria-current={active ? 'page' : undefined}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Insights group */}
        <SidebarGroup>
          <SidebarGroupLabel>Insights</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {INSIGHTS_NAV.map((item) => {
                const active = currentPath.startsWith(item.href);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.tooltip}
                    >
                      <Link to={item.href} aria-current={active ? 'page' : undefined}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Records group */}
        <SidebarGroup>
          <SidebarGroupLabel>Records</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {RECORDS_NAV.map((item) => {
                const active = currentPath.startsWith(item.href);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.tooltip}
                    >
                      <Link to={item.href} aria-current={active ? 'page' : undefined}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin — superuser only */}
        {isSuperuser && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Admin</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>

                  {/* Admin sub-group */}
                  <Collapsible
                    asChild
                    defaultOpen={currentPath.startsWith('/admin')}
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton tooltip="Admin — system settings">
                          <Settings />
                          <span>Admin</span>
                          <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {ADMIN_NAV.map((item) => {
                            const active = currentPath === item.href;
                            return (
                              <SidebarMenuSubItem key={item.href}>
                                <SidebarMenuSubButton asChild isActive={active}>
                                  <Link to={item.href} aria-current={active ? 'page' : undefined}>
                                    <item.icon />
                                    <span>{item.label}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            );
                          })}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>

                  {/* AI Admin sub-group */}
                  <Collapsible
                    asChild
                    defaultOpen={currentPath.startsWith('/admin')}
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton tooltip="AI Admin — model and document config">
                          <Bot />
                          <span>AI Admin</span>
                          <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {AI_ADMIN_NAV.map((item) => {
                            const active = currentPath === item.href;
                            return (
                              <SidebarMenuSubItem key={item.href}>
                                <SidebarMenuSubButton asChild isActive={active}>
                                  <Link to={item.href} aria-current={active ? 'page' : undefined}>
                                    <item.icon />
                                    <span>{item.label}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              {item.badge && (
                                <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                              )}
                            </SidebarMenuSubItem>
                            );
                          })}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>

                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}

      </SidebarContent>

      {/* Footer — user avatar + logout dropdown */}
      <SidebarFooter className="h-16 border-t border-sidebar-border p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  tooltip={user?.full_name ?? 'Account'}
                >
                  <Avatar className="size-7 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-primary/10 text-xs font-semibold text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-1 flex-col text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate font-medium">
                      {user?.full_name ?? 'Loading\u2026'}
                    </span>
                    <span className="truncate text-xs text-sidebar-foreground/60">
                      {user ? USER_ROLE_LABELS[user.role] : ''}
                    </span>
                  </div>
                  <ChevronUp className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                className="w-56"
                side="top"
                align="end"
                sideOffset={4}
              >
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium leading-none">{user?.full_name}</p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-destructive"
                  onClick={() => logout()}
                >
                  <LogOut className="size-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      {/* Rail — thin click-to-toggle strip at sidebar edge */}
      <SidebarRail />

    </Sidebar>
  );
}
