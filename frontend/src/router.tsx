import {
  createRouter,
  createRoute,
  createRootRoute,
  redirect,
  Outlet,
} from '@tanstack/react-router';
import { useAuthStore } from '@/stores/auth.store';

// Layout
import { AppShell } from './components/layout/AppShell';

// Auth
import { LoginPage } from './pages/auth/LoginPage';

// Pages
import { PipelinePage } from './pages/pipeline/PipelinePage';
import { DealDetailPage } from './pages/pipeline/deal-detail/DealDetailPage';
import { AccountsPage } from './pages/accounts/AccountsPage';
import { AccountDetailPage } from './pages/accounts/AccountDetailPage';
import { ContactsPage } from './pages/contacts/ContactsPage';
import { ContactDetailPage } from './pages/contacts/ContactDetailPage';
import { LeadsPage } from './pages/leads/LeadsPage';
import { LeadDetailPage } from './pages/leads/LeadDetailPage';
import { GraduationQueuePage } from './pages/leads/graduation/GraduationQueuePage';
import { ChannelsPage } from './pages/channels/ChannelsPage';
import { RevenuePage } from './pages/revenue/RevenuePage';
import { VelocityPage } from './pages/velocity/VelocityPage';
import { PipelineHealthPage } from './pages/pipeline-health/PipelineHealthPage';
import { LeadToClosePage } from './pages/lead-to-close/LeadToClosePage';
import { WhiteSpacePage } from './pages/white-space/WhiteSpacePage';

// Admin
import { AdminShell } from './pages/admin/AdminShell';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminRefDataPage } from './pages/admin/AdminRefDataPage';
import { AdminQTreePage } from './pages/admin/AdminQTreePage';
import { AdminFXRatesPage } from './pages/admin/AdminFXRatesPage';
import { AdminDocAIPage } from './pages/admin/AdminDocAIPage';
import { AdminImportPage } from './pages/admin/AdminImportPage';
import { AdminSystemPage } from './pages/admin/AdminSystemPage';
import { AdminSOPsPage } from './pages/admin/AdminSOPsPage';
import { AdminModelsPage } from './pages/admin/AdminModelsPage';
import { AdminCatalogPage } from './pages/admin/AdminCatalogPage';
import { AdminTemplatesPage } from './pages/admin/AdminTemplatesPage';

// ---------------------------------------------------------------------------
// Root route — bare outlet, no layout
// ---------------------------------------------------------------------------

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

// ---------------------------------------------------------------------------
// / → redirect based on auth state
// ---------------------------------------------------------------------------

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState();
    throw redirect({ to: isAuthenticated ? '/pipeline' : '/auth/login' });
  },
});

// ---------------------------------------------------------------------------
// /auth/login — redirect to /pipeline if already authenticated
// ---------------------------------------------------------------------------

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/login',
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState();
    if (isAuthenticated) {
      throw redirect({ to: '/pipeline' });
    }
  },
  component: LoginPage,
});

// ---------------------------------------------------------------------------
// Authenticated layout — guards every child route
// ---------------------------------------------------------------------------

const authenticatedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: '_authenticated',
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) {
      throw redirect({ to: '/auth/login' });
    }
  },
  component: AppShell,
});

// ---------------------------------------------------------------------------
// Authenticated child routes
// ---------------------------------------------------------------------------

const pipelineRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/pipeline',
  component: PipelinePage,
});

const dealDetailRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/pipeline/$dealId',
  component: DealDetailPage,
});

const accountsRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/accounts',
  component: AccountsPage,
});

const accountDetailRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/accounts/$accountId',
  component: AccountDetailPage,
});

const contactsRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/contacts',
  component: ContactsPage,
});

const contactDetailRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/contacts/$contactId',
  component: ContactDetailPage,
});

// /demand-gen/leads — main leads grid
const demandGenLeadsRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/demand-gen/leads',
  component: LeadsPage,
});

// /demand-gen/leads/$leadId — lead detail
const leadDetailRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/demand-gen/leads/$leadId',
  component: () => {
    const { leadId } = leadDetailRoute.useParams();
    return <LeadDetailPage leadId={leadId} />;
  },
});

// /demand-gen/graduation — graduation queue
const graduationQueueRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/demand-gen/graduation',
  component: GraduationQueuePage,
});

// /leads → redirect to /demand-gen/leads
const leadsRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/leads',
  beforeLoad: () => {
    throw redirect({ to: '/demand-gen/leads' });
  },
});

const channelsRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/channels',
  component: ChannelsPage,
});

const revenueRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/revenue',
  component: RevenuePage,
});

const velocityRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/velocity',
  component: VelocityPage,
});

const pipelineHealthRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/pipeline-health',
  component: PipelineHealthPage,
});

const leadToCloseRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/lead-to-close',
  component: LeadToClosePage,
});

const whiteSpaceRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/white-space',
  component: WhiteSpacePage,
});

// ---------------------------------------------------------------------------
// Admin layout — nested under authenticated, role-gated
// ---------------------------------------------------------------------------

const adminRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/admin',
  beforeLoad: () => {
    const { user } = useAuthStore.getState();
    const role = user?.role;
    if (role !== 'admin' && role !== 'sales_ops') {
      throw redirect({ to: '/pipeline' });
    }
  },
  component: AdminShell,
});

const adminIndexRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/admin/users' });
  },
});

const adminUsersRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/users',
  component: AdminUsersPage,
});

const adminRefDataRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/reference-data',
  component: AdminRefDataPage,
});

const adminQTreeRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/q-tree',
  component: AdminQTreePage,
});

const adminFXRatesRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/fx-rates',
  component: AdminFXRatesPage,
});

const adminDocAIRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/doc-ai',
  component: AdminDocAIPage,
});

const adminImportRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/import',
  component: AdminImportPage,
});

const adminSystemRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/system',
  component: AdminSystemPage,
});

const adminSOPsRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/sops',
  component: AdminSOPsPage,
});

const adminModelsRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/model-config',
  component: AdminModelsPage,
});

const adminCatalogRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/catalog',
  component: AdminCatalogPage,
});

const adminTemplatesRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/templates',
  component: AdminTemplatesPage,
});

// ---------------------------------------------------------------------------
// Route tree + router
// ---------------------------------------------------------------------------

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  authenticatedRoute.addChildren([
    pipelineRoute,
    dealDetailRoute,
    accountsRoute,
    accountDetailRoute,
    contactsRoute,
    contactDetailRoute,
    leadsRoute,
    demandGenLeadsRoute,
    leadDetailRoute,
    graduationQueueRoute,
    channelsRoute,
    revenueRoute,
    velocityRoute,
    pipelineHealthRoute,
    leadToCloseRoute,
    whiteSpaceRoute,
    adminRoute.addChildren([
      adminIndexRoute,
      adminUsersRoute,
      adminRefDataRoute,
      adminQTreeRoute,
      adminFXRatesRoute,
      adminDocAIRoute,
      adminImportRoute,
      adminSystemRoute,
      adminSOPsRoute,
      adminModelsRoute,
      adminCatalogRoute,
      adminTemplatesRoute,
    ]),
  ]),
]);

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',   // preload on hover/focus for instant nav
  defaultPreloadStaleTime: 0,
});

// TanStack Router type registration — enables full type safety on Link + navigate
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
