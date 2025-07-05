import { createRouter, createRoute, createRootRoute, redirect, Outlet } from '@tanstack/react-router';
import { lazy } from 'react';
import { AuthLayout } from './components/layout/AuthLayout';
import { Layout } from './components/layout/Layout';
import { AuthCheckRoute } from './components/auth/AuthCheckRoute';
import LoginPage from './pages/auth/LoginPage';

// Lazy load dashboard components to prevent recharts from loading on login page
const ShowcasePage = lazy(() => import('./pages/showcase'));
const DashboardPage = lazy(() => import('./pages/dashboard'));
const ExecutiveDashboardPage = lazy(() => import('./pages/dashboard/executive'));
const SalesManagerDashboardPage = lazy(() => import('./pages/dashboard/sales'));
const OperationsDashboardPage = lazy(() => import('./pages/dashboard/operations'));

// Placeholder components for routes
const PlaceholderPage = ({ title, description }: { title: string; description: string }) => (
  <div className="container mx-auto px-4 py-8">
    <div className="max-w-2xl mx-auto text-center">
      <h1 className="text-3xl font-bold mb-4">{title}</h1>
      <p className="text-muted-foreground mb-6">{description}</p>
      <div className="bg-card border rounded-lg p-6">
        <p className="text-sm text-muted-foreground">
          This page is under development. The routing structure is in place and ready for implementation.
        </p>
      </div>
    </div>
  </div>
);

// Authentication context is now handled by AuthCheckRoute component

// Root route - minimal wrapper with outlet for child routes
const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

// Auth check route - handles initial authentication verification
const authCheckRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: '_authCheck',
  component: AuthCheckRoute,
});

// ==============================================
// AUTH ROUTES - No dashboard dependencies
// ==============================================

const authRoute = createRoute({
  getParentRoute: () => authCheckRoute,
  path: '/auth',
  component: AuthLayout,
});

const loginRoute = createRoute({
  getParentRoute: () => authRoute,
  path: '/login',
  component: LoginPage,
});

// ==============================================
// APP ROUTES - Require authentication
// ==============================================

const appRoute = createRoute({
  getParentRoute: () => authCheckRoute,
  id: '_app',
  component: Layout,
  // Authentication check is now handled by AuthCheckRoute
  // beforeLoad can focus on other concerns like role-based access
});

// Main navigation routes
const indexRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/',
  component: DashboardPage,
});

// Dashboard routes
const dashboardIndexRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/dashboard',
  component: DashboardPage,
});

const dashboardExecutiveRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/dashboard/executive',
  component: ExecutiveDashboardPage,
});

const dashboardSalesRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/dashboard/sales',
  component: SalesManagerDashboardPage,
});

const dashboardOperationsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/dashboard/operations',
  component: OperationsDashboardPage,
});

const dashboardCustomRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/dashboard/custom',
  component: () => <PlaceholderPage title="Custom Dashboard" description="Personalized dashboard view" />,
});

// Pipeline routes
const pipelineRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/pipeline',
  component: () => <PlaceholderPage title="Pipeline" description="Opportunity management and tracking" />,
});

const pipelineAllRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/pipeline/all',
  component: () => <PlaceholderPage title="All Opportunities" description="Complete opportunity pipeline" />,
});

const pipelineMyRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/pipeline/my',
  component: () => <PlaceholderPage title="My Opportunities" description="Your assigned opportunities" />,
});

const pipelineTerritoryRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/pipeline/territory/$territoryId',
  component: () => <PlaceholderPage title="Territory View" description="Territory-specific pipeline" />,
});

const pipelineServiceRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/pipeline/service/$serviceLine',
  component: () => <PlaceholderPage title="Service Line View" description="Service line pipeline" />,
});

const pipelineOpportunityRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/pipeline/opportunity/$opportunityId',
  component: () => <PlaceholderPage title="Opportunity Details" description="Detailed opportunity view" />,
});

const pipelineAnalyticsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/pipeline/analytics',
  component: () => <PlaceholderPage title="Pipeline Analytics" description="Pipeline performance analysis" />,
});

// O2R Tracker routes
const o2rRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/o2r',
  component: () => <PlaceholderPage title="O2R Tracker" description="Opportunity-to-Revenue tracking" />,
});

const o2rPhasesRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/o2r/phases',
  component: () => <PlaceholderPage title="O2R Phases" description="Four-phase progression overview" />,
});

const o2rPhaseRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/o2r/phase/$phaseId',
  component: () => <PlaceholderPage title="Phase Details" description="Phase-specific tracking" />,
});

const o2rHealthRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/o2r/health',
  component: () => <PlaceholderPage title="Health Dashboard" description="Deal health monitoring" />,
});

const o2rAttentionRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/o2r/attention',
  component: () => <PlaceholderPage title="Attention Required" description="Items requiring immediate attention" />,
});

const o2rMilestonesRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/o2r/milestones',
  component: () => <PlaceholderPage title="Milestone Tracker" description="Key milestone tracking" />,
});

const o2rAnalyticsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/o2r/analytics',
  component: () => <PlaceholderPage title="O2R Analytics" description="Phase performance analytics" />,
});

const o2rConfigRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/o2r/config',
  component: () => <PlaceholderPage title="O2R Configuration" description="Phase configuration settings" />,
});

// GTM Motion routes
const gtmRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/gtm',
  component: () => <PlaceholderPage title="GTM Motion" description="Go-to-market motion tracking" />,
});

const gtmJourneyRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/gtm/journey',
  component: () => <PlaceholderPage title="Customer Journey" description="Customer journey mapping" />,
});

const gtmPlaybooksRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/gtm/playbooks',
  component: () => <PlaceholderPage title="Playbook Management" description="Sales playbook library" />,
});

const gtmAwsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/gtm/aws',
  component: () => <PlaceholderPage title="AWS Alignment" description="AWS partnership alignment" />,
});

const gtmExpansionRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/gtm/expansion',
  component: () => <PlaceholderPage title="Expansion Opportunities" description="Account expansion tracking" />,
});

const gtmActivitiesRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/gtm/activities',
  component: () => <PlaceholderPage title="Activity Management" description="Sales activity tracking" />,
});

// Financial Intelligence routes
const financeRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/finance',
  component: () => <PlaceholderPage title="Financial Intelligence" description="Financial insights and analytics" />,
});

const financeRevenueRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/finance/revenue',
  component: () => <PlaceholderPage title="Revenue Dashboard" description="Revenue tracking and analysis" />,
});

const financeCurrencyRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/finance/currency',
  component: () => <PlaceholderPage title="Currency Management" description="Multi-currency management" />,
});

const financeForecastRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/finance/forecast',
  component: () => <PlaceholderPage title="Forecasting" description="Revenue forecasting tools" />,
});

const financeRiskRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/finance/risk',
  component: () => <PlaceholderPage title="Risk Assessment" description="Financial risk analysis" />,
});

const financePaymentsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/finance/payments',
  component: () => <PlaceholderPage title="Payment Tracking" description="Payment status monitoring" />,
});

// Analytics routes
const analyticsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/analytics',
  component: () => <PlaceholderPage title="Analytics" description="Advanced analytics and reporting" />,
});

const analyticsExecutiveRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/analytics/executive',
  component: () => <PlaceholderPage title="Executive Reports" description="Executive-level reporting" />,
});

const analyticsSalesRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/analytics/sales',
  component: () => <PlaceholderPage title="Sales Performance" description="Sales team analytics" />,
});

const analyticsPipelineRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/analytics/pipeline',
  component: () => <PlaceholderPage title="Pipeline Analytics" description="Pipeline performance insights" />,
});

const analyticsServicesRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/analytics/services',
  component: () => <PlaceholderPage title="Service Line Analytics" description="Service line performance" />,
});

const analyticsCustomRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/analytics/custom',
  component: () => <PlaceholderPage title="Custom Reports" description="Custom report builder" />,
});

const analyticsExportRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/analytics/export',
  component: () => <PlaceholderPage title="Data Export" description="Data export utilities" />,
});

// Sync Control routes
const syncRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/sync',
  component: () => <PlaceholderPage title="Sync Control" description="Data synchronization management" />,
});

const syncDashboardRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/sync/dashboard',
  component: () => <PlaceholderPage title="Sync Dashboard" description="Synchronization overview" />,
});

const syncManualRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/sync/manual',
  component: () => <PlaceholderPage title="Manual Sync" description="Manual synchronization tools" />,
});

const syncHistoryRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/sync/history',
  component: () => <PlaceholderPage title="Sync History" description="Synchronization history log" />,
});

const syncConflictsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/sync/conflicts',
  component: () => <PlaceholderPage title="Conflict Resolution" description="Data conflict management" />,
});

const syncMappingsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/sync/mappings',
  component: () => <PlaceholderPage title="Field Mapping" description="Data field mapping configuration" />,
});

const syncMonitoringRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/sync/monitoring',
  component: () => <PlaceholderPage title="API Monitoring" description="API performance monitoring" />,
});

// Bulk Operations routes
const bulkRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/bulk',
  component: () => <PlaceholderPage title="Bulk Operations" description="Mass data operations" />,
});

const bulkUpdateRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/bulk/update',
  component: () => <PlaceholderPage title="Bulk Update" description="Mass data updates" />,
});

const bulkImportRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/bulk/import',
  component: () => <PlaceholderPage title="Bulk Import" description="Data import tools" />,
});

const bulkHistoryRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/bulk/history',
  component: () => <PlaceholderPage title="Operation History" description="Bulk operation history" />,
});

const bulkManagementRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/bulk/management',
  component: () => <PlaceholderPage title="Data Management" description="Data management tools" />,
});

// Administration routes
const adminRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/admin',
  component: () => <PlaceholderPage title="Administration" description="System administration" />,
});

const adminUsersRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/admin/users',
  component: () => <PlaceholderPage title="User Management" description="User account management" />,
});

const adminConfigRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/admin/config',
  component: () => <PlaceholderPage title="System Configuration" description="System settings" />,
});

const adminHealthRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/admin/health',
  component: () => <PlaceholderPage title="System Health" description="System health monitoring" />,
});

const adminAuditRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/admin/audit',
  component: () => <PlaceholderPage title="Audit Logs" description="System audit logs" />,
});

const adminIntegrationsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/admin/integrations',
  component: () => <PlaceholderPage title="Integration Management" description="Third-party integrations" />,
});

// Utility routes
const searchRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/search',
  component: () => <PlaceholderPage title="Search" description="Global search functionality" />,
});

const notificationsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/notifications',
  component: () => <PlaceholderPage title="Notifications" description="Notification center" />,
});

const profileRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/profile',
  component: () => <PlaceholderPage title="User Profile" description="Profile settings and preferences" />,
});

const helpRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/help',
  component: () => <PlaceholderPage title="Help & Support" description="Help documentation and support" />,
});

// Showcase route (for development)
const showcaseRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/showcase',
  component: ShowcasePage,
});

// Redirect from legacy /login route to new auth structure
const legacyLoginRoute = createRoute({
  getParentRoute: () => authCheckRoute,
  path: '/login',
  beforeLoad: () => {
    throw redirect({ to: '/auth/login' });
  },
  component: () => null,
});

// Build route tree with clear separation
const routeTree = rootRoute.addChildren([
  // Auth check route handles initial authentication verification
  authCheckRoute.addChildren([
    // Authentication routes (no dashboard dependencies)
    authRoute.addChildren([
      loginRoute,
    ]),
    
    // Legacy redirect
    legacyLoginRoute,
    
    // Main application routes (require authentication)
    appRoute.addChildren([
    indexRoute,
    
    // Dashboard routes
    dashboardIndexRoute,
    dashboardExecutiveRoute,
    dashboardSalesRoute,
    dashboardOperationsRoute,
    dashboardCustomRoute,
    
    // Pipeline routes
    pipelineRoute,
    pipelineAllRoute,
    pipelineMyRoute,
    pipelineTerritoryRoute,
    pipelineServiceRoute,
    pipelineOpportunityRoute,
    pipelineAnalyticsRoute,
    
    // O2R routes
    o2rRoute,
    o2rPhasesRoute,
    o2rPhaseRoute,
    o2rHealthRoute,
    o2rAttentionRoute,
    o2rMilestonesRoute,
    o2rAnalyticsRoute,
    o2rConfigRoute,
    
    // GTM routes
    gtmRoute,
    gtmJourneyRoute,
    gtmPlaybooksRoute,
    gtmAwsRoute,
    gtmExpansionRoute,
    gtmActivitiesRoute,
    
    // Finance routes
    financeRoute,
    financeRevenueRoute,
    financeCurrencyRoute,
    financeForecastRoute,
    financeRiskRoute,
    financePaymentsRoute,
    
    // Analytics routes
    analyticsRoute,
    analyticsExecutiveRoute,
    analyticsSalesRoute,
    analyticsPipelineRoute,
    analyticsServicesRoute,
    analyticsCustomRoute,
    analyticsExportRoute,
    
    // Sync routes
    syncRoute,
    syncDashboardRoute,
    syncManualRoute,
    syncHistoryRoute,
    syncConflictsRoute,
    syncMappingsRoute,
    syncMonitoringRoute,
    
    // Bulk operation routes
    bulkRoute,
    bulkUpdateRoute,
    bulkImportRoute,
    bulkHistoryRoute,
    bulkManagementRoute,
    
    // Admin routes
    adminRoute,
    adminUsersRoute,
    adminConfigRoute,
    adminHealthRoute,
    adminAuditRoute,
    adminIntegrationsRoute,
    
    // Utility routes
    searchRoute,
    notificationsRoute,
    profileRoute,
    helpRoute,
    
    // Development route
    showcaseRoute,
    ]),
  ]),
]);

export const router = createRouter({ 
  routeTree,
});