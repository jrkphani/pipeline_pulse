import * as React from "react"
import { useAuthStore } from "@/stores/useAuthStore"
import {
  BarChart3,
  Building2,
  CircuitBoard,
  Database,
  FileBarChart,
  GitBranch,
  HelpCircle,
  Home,
  LineChart,
  RefreshCw,
  Search,
  Settings,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

// Navigation data structure
const navigationData = {
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      icon: Home,
    },
    {
      title: "Pipeline",
      url: "/pipeline",
      icon: GitBranch,
      items: [
        {
          title: "All Opportunities",
          url: "/pipeline/all",
        },
        {
          title: "My Opportunities",
          url: "/pipeline/my",
        },
        {
          title: "Analytics",
          url: "/pipeline/analytics",
        },
      ],
    },
    {
      title: "O2R Tracker",
      url: "/o2r",
      icon: TrendingUp,
      items: [
        {
          title: "Phases",
          url: "/o2r/phases",
        },
        {
          title: "Health Dashboard",
          url: "/o2r/health",
        },
        {
          title: "Attention Required",
          url: "/o2r/attention",
        },
        {
          title: "Milestones",
          url: "/o2r/milestones",
        },
      ],
    },
    {
      title: "GTM Motion",
      url: "/gtm",
      icon: Building2,
      items: [
        {
          title: "Customer Journey",
          url: "/gtm/journey",
        },
        {
          title: "Playbooks",
          url: "/gtm/playbooks",
        },
        {
          title: "AWS Alignment",
          url: "/gtm/aws",
        },
      ],
    },
    {
      title: "Financial Intelligence",
      url: "/finance",
      icon: Wallet,
      items: [
        {
          title: "Revenue Dashboard",
          url: "/finance/revenue",
        },
        {
          title: "Currency Management",
          url: "/finance/currency",
        },
        {
          title: "Forecasting",
          url: "/finance/forecast",
        },
      ],
    },
    {
      title: "Analytics",
      url: "/analytics",
      icon: BarChart3,
      items: [
        {
          title: "Executive Reports",
          url: "/analytics/executive",
        },
        {
          title: "Sales Performance",
          url: "/analytics/sales",
        },
        {
          title: "Pipeline Analytics",
          url: "/analytics/pipeline",
        },
      ],
    },
  ],
  navOperations: [
    {
      title: "Sync Control",
      icon: RefreshCw,
      url: "/sync",
      items: [
        {
          title: "Dashboard",
          url: "/sync/dashboard",
        },
        {
          title: "Manual Sync",
          url: "/sync/manual",
        },
        {
          title: "History",
          url: "/sync/history",
        },
      ],
    },
    {
      title: "Bulk Operations",
      icon: Database,
      url: "/bulk",
      items: [
        {
          title: "Bulk Update",
          url: "/bulk/update",
        },
        {
          title: "Bulk Import",
          url: "/bulk/import",
        },
        {
          title: "History",
          url: "/bulk/history",
        },
      ],
    },
    {
      title: "Administration",
      icon: Settings,
      url: "/admin",
      items: [
        {
          title: "Users",
          url: "/admin/users",
        },
        {
          title: "Configuration",
          url: "/admin/config",
        },
        {
          title: "System Health",
          url: "/admin/health",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Search",
      url: "/search",
      icon: Search,
    },
    {
      title: "Help & Support",
      url: "/help",
      icon: HelpCircle,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuthStore();

  // Use actual user data or fallback to demo data
  const userData = user ? {
    name: user.name,
    email: user.email,
    avatar: "/avatars/demo.jpg", // TODO: Add user avatar support
  } : {
    name: "Demo User",
    email: "demo@pipelinepulse.com", 
    avatar: "/avatars/demo.jpg",
  };

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href="/" className="flex items-center gap-2 p-2">
                <div className="flex items-center justify-center w-5 h-5 bg-pp-primary-500 text-pp-primary-50 text-xs font-bold rounded">
                  PP
                </div>
                <span className="text-base font-semibold text-pp-primary-600">Pipeline Pulse</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navigationData.navMain} />
        <NavDocuments items={navigationData.navOperations} />
        <NavSecondary items={navigationData.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  )
}
