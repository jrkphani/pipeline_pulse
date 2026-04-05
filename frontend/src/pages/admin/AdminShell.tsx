import { Outlet } from '@tanstack/react-router';

export function AdminShell() {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <main className="flex-1 overflow-y-auto bg-muted/30 p-4">
        <Outlet />
      </main>
    </div>
  );
}
