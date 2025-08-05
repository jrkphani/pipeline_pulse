import * as React from "react"
import { useAuthStore } from "@/stores/useAuthStore"
import {
  IconChartBar,
  IconBuilding,
  IconDatabase,
  IconGitBranch,
  IconHelp,
  IconHome,
  IconRefresh,
  IconSearch,
  IconSettings,
  IconTrendingUp,
  IconWallet,
} from "@tabler/icons-react"

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
      icon: IconHome,
    },
    {
      title: "Pipeline",
      url: "/pipeline",
      icon: IconGitBranch,
    },
    {
      title: "Analytics",
      url: "/analytics",
      icon: IconChartBar,
    },
    {
      title: "Accounts", 
      url: "/accounts",
      icon: IconBuilding,
    },
    {
      title: "O2R Tracker",
      url: "/o2r",
      icon: IconTrendingUp,
    },
    {
      title: "Financial Intelligence",
      url: "/finance",
      icon: IconWallet,
    },
  ],
  navOperations: [
    {
      name: "Sync Control",
      icon: IconRefresh,
      url: "/sync",
    },
    {
      name: "Bulk Operations",
      icon: IconDatabase,
      url: "/bulk",
    },
    {
      name: "Administration",
      icon: IconSettings,
      url: "/admin",
    },
  ],
  navSecondary: [
    {
      title: "Search",
      url: "/search",
      icon: IconSearch,
    },
    {
      title: "Help & Support",
      url: "/help",
      icon: IconHelp,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuthStore();

  // Use actual user data or fallback to demo data
  const userData = user ? {
    name: user.name || `${user.firstName} ${user.lastName}`,
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
