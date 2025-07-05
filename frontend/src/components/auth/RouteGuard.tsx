import React from 'react';
import { useRouterState } from '@tanstack/react-router';
import { canAccessRoute, USER_ROLES } from '../../config/navigation';
import type { UserRole } from '../../types/navigation';
import { useAuthStore } from '../../stores/useAuthStore';
import { Button } from '../ui/button';
import { AlertTriangle, ArrowLeft } from 'lucide-react';

interface RouteGuardProps {
  children: React.ReactNode;
  userRole?: UserRole;
  requiredPermission?: string;
  fallbackComponent?: React.ReactNode;
}

interface UnauthorizedPageProps {
  userRole: UserRole;
  currentRoute: string;
  onGoBack: () => void;
}

// Helper to map user role string to UserRole object
const mapUserRole = (roleString: string): UserRole => {
  switch (roleString) {
    case 'admin':
      return USER_ROLES.ADMIN;
    case 'executive':
      return USER_ROLES.EXECUTIVE;
    case 'sales_manager':
      return USER_ROLES.SALES_LEADER;
    case 'operations_manager':
      return USER_ROLES.OPERATIONS_MANAGER;
    case 'analyst':
      return USER_ROLES.ANALYST;
    default:
      return USER_ROLES.ANALYST; // Default fallback
  }
};

const UnauthorizedPage: React.FC<UnauthorizedPageProps> = ({ 
  userRole, 
  currentRoute, 
  onGoBack 
}) => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-6">
          <AlertTriangle className="mx-auto h-16 w-16 text-yellow-500" />
        </div>
        
        <h1 className="text-3xl font-bold mb-4">Access Restricted</h1>
        
        <div className="bg-card border rounded-lg p-6 mb-6">
          <p className="text-muted-foreground mb-4">
            You don't have permission to access this page.
          </p>
          
          <div className="space-y-2 text-sm">
            <p><strong>Current Role:</strong> {userRole.name}</p>
            <p><strong>Requested Route:</strong> {currentRoute}</p>
          </div>
        </div>
        
        <div className="space-x-4">
          <Button onClick={onGoBack} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
          
          <Button asChild>
            <a href="/dashboard">Go to Dashboard</a>
          </Button>
        </div>
        
        <div className="mt-8 text-sm text-muted-foreground">
          <p>
            If you believe you should have access to this page, please contact your administrator.
          </p>
        </div>
      </div>
    </div>
  );
};

// LoadingPage is no longer used - handled by AuthCheckRoute

// LoginPage component is now handled by the separate login route
// This component no longer needs to render a login page since the router handles it

export const RouteGuard: React.FC<RouteGuardProps> = ({ 
  children, 
  userRole,
  requiredPermission,
  fallbackComponent 
}) => {
  const routerState = useRouterState();
  const { user } = useAuthStore();
  const currentRoute = routerState.location.pathname;
  
  // Authentication is now handled by AuthCheckRoute
  // This component focuses on role-based and permission-based authorization
  
  // Use provided userRole or get from auth context
  const effectiveUserRole = userRole || (user ? mapUserRole(user.role) : null);
  
  // Check role-based route access
  if (effectiveUserRole && !canAccessRoute(effectiveUserRole.id, currentRoute)) {
    const handleGoBack = () => {
      window.history.back();
    };
    
    return fallbackComponent || (
      <UnauthorizedPage 
        userRole={effectiveUserRole}
        currentRoute={currentRoute}
        onGoBack={handleGoBack}
      />
    );
  }
  
  // Check specific permission if required
  if (requiredPermission && effectiveUserRole) {
    const hasPermission = effectiveUserRole.permissions.includes(requiredPermission);
    
    if (!hasPermission) {
      const handleGoBack = () => {
        window.history.back();
      };
      
      return fallbackComponent || (
        <UnauthorizedPage 
          userRole={effectiveUserRole}
          currentRoute={currentRoute}
          onGoBack={handleGoBack}
        />
      );
    }
  }
  
  // User is authorized for this route
  return <>{children}</>;
};