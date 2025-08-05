import React, { useEffect } from 'react';
import { Outlet, useRouter } from '@tanstack/react-router';
import { useAuthStore } from '../../stores/useAuthStore';
import { LoadingScreen } from './LoadingScreen';

/**
 * AuthCheckRoute is the top-level route component that handles the initial authentication check.
 * It displays a loading screen while verifying the session and then either:
 * - Allows access to authenticated routes
 * - Redirects to login for unauthenticated users
 * 
 * This prevents the flash of dashboard components during auth verification.
 */
export const AuthCheckRoute: React.FC = () => {
  const router = useRouter();
  const { isAuthenticated, isLoading, initializeAuth } = useAuthStore();

  useEffect(() => {
    // Initialize authentication on component mount
    initializeAuth();
  }, [initializeAuth]);

  // Handle navigation in useEffect to avoid render-time state updates
  useEffect(() => {
    if (isLoading) return; // Don't navigate while loading

    const currentPath = router.state.location.pathname;
    const isAuthRoute = currentPath.startsWith('/auth/');
    
    // If not authenticated and not on an auth route, redirect to login
    if (!isAuthenticated && !isAuthRoute) {
      router.navigate({ 
        to: '/auth/login',
        search: { redirect: currentPath },
        replace: true
      });
      return;
    }

    // If authenticated and on an auth route, redirect to dashboard
    if (isAuthenticated && isAuthRoute) {
      router.navigate({ to: '/', replace: true });
      return;
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading screen while checking authentication
  if (isLoading) {
    return <LoadingScreen message="Verifying session..." />;
  }

  const currentPath = router.state.location.pathname;
  const isAuthRoute = currentPath.startsWith('/auth/');

  // Show loading while navigation is happening
  if ((!isAuthenticated && !isAuthRoute) || (isAuthenticated && isAuthRoute)) {
    return <LoadingScreen message={isAuthenticated ? "Redirecting to dashboard..." : "Redirecting to login..."} />;
  }

  // Authentication state is resolved, render the child routes
  return <Outlet />;
};