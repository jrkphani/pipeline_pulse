import React from 'react';
import { LoadingSpinner } from '../ui/loading-spinner';

interface LoadingScreenProps {
  message?: string;
  showLogo?: boolean;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = 'Verifying session...', 
  showLogo = true 
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-pp-neutral-50">
      <div className="flex flex-col items-center gap-6 text-center">
        {showLogo && (
          <div className="flex items-center justify-center w-[120px] h-[48px] bg-pp-primary-500 text-pp-primary-50 text-lg font-bold rounded-md">
            Pipeline Pulse
          </div>
        )}
        
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner className="h-8 w-8 text-pp-primary-500" />
          <p className="text-pp-neutral-600 text-sm">{message}</p>
        </div>
      </div>
    </div>
  );
};