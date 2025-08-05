import React, { Suspense } from 'react';
import { Outlet } from '@tanstack/react-router';
import { AppSidebar } from '../app-sidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '../ui/sidebar';
import { LoadingSpinner } from '../ui/loading-spinner';

export const Layout: React.FC = () => {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 px-4 border-b">
          <SidebarTrigger />
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Suspense 
            fallback={
              <div className="flex items-center justify-center p-8">
                <LoadingSpinner size="lg" />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};