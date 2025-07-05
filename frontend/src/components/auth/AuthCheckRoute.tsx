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

  // Show loading screen while checking authentication
  if (isLoading) {
    return <LoadingScreen message="Verifying session..." />;
  }

  // If not authenticated and not on an auth route, redirect to login
  const currentPath = router.state.location.pathname;
  const isAuthRoute = currentPath.startsWith('/auth/');
  
  if (!isAuthenticated && !isAuthRoute) {
    // Use setTimeout to avoid updating during render
    setTimeout(() => {
      router.navigate({ 
        to: '/auth/login',
        search: { redirect: currentPath }
      });
    }, 0);
    
    return <LoadingScreen message="Redirecting to login..." />;
  }

  // If authenticated and on an auth route, redirect to dashboard
  if (isAuthenticated && isAuthRoute) {
    setTimeout(() => {
      router.navigate({ to: '/' });
    }, 0);
    
    return <LoadingScreen message="Redirecting to dashboard..." />;
  }

  // Authentication state is resolved, render the child routes
  return <Outlet />;
};