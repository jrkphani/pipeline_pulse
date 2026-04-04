import { createRouter, createRoute, createRootRoute, Outlet } from '@tanstack/react-router';

// Placeholder — routes will be built out in subsequent sessions
const rootRoute = createRootRoute({
  component: () => (
    <div className="flex min-h-screen flex-col">
      <Outlet />
    </div>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-foreground">Pipeline Pulse</h1>
        <p className="mt-2 text-muted-foreground">v2.0 — Foundation ready</p>
      </div>
    </div>
  ),
});

const routeTree = rootRoute.addChildren([indexRoute]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
