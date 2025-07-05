import React from 'react';
import { Outlet } from '@tanstack/react-router';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-pp-neutral-50">
      <Outlet />
    </div>
  );
};