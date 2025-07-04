import { createRouter, createRoute, createRootRoute } from '@tanstack/react-router';
import React from 'react';
import { Layout } from './components/layout/Layout';

const rootRoute = createRootRoute({
  component: () => <Layout />,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => {
    throw new Error('Home page component not implemented');
  },
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: () => {
    throw new Error('Dashboard component not implemented');
  },
});

const opportunitiesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/opportunities',
  component: () => {
    throw new Error('Opportunities component not implemented');
  },
});

const syncRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/sync',
  component: () => {
    throw new Error('Sync operations component not implemented');
  },
});

const routeTree = rootRoute.addChildren([indexRoute, dashboardRoute, opportunitiesRoute, syncRoute]);

export const router = createRouter({ routeTree });