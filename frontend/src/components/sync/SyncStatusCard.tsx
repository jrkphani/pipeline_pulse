import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, AlertTriangle, XCircle, Clock } from 'lucide-react';

interface SyncStatusCardProps {
  title: string;
  status: 'healthy' | 'warning' | 'error' | 'unknown';
  value: number;
  icon?: React.ReactNode;
  description?: string;
  suffix?: string;
  showProgress?: boolean;
}

export const SyncStatusCard: React.FC<SyncStatusCardProps> = ({
  title,
  status,
  value,
  icon,
  description,
  suffix = '',
  showProgress = false,
}) => {
  const getStatusIcon = () => {
    if (icon) return icon;
    
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'healthy':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getProgressColor = () => {
    switch (status) {
      case 'healthy':
        return '[&>div]:bg-green-500';
      case 'warning':
        return '[&>div]:bg-yellow-500';
      case 'error':
        return '[&>div]:bg-red-500';
      default:
        return '';
    }
  };

  const getBorderColor = () => {
    switch (status) {
      case 'healthy':
        return 'border-l-4 border-l-green-500';
      case 'warning':
        return 'border-l-4 border-l-yellow-500';
      case 'error':
        return 'border-l-4 border-l-red-500';
      default:
        return 'border-l-4 border-l-gray-300';
    }
  };

  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${getBorderColor()}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-700">
            {title}
          </CardTitle>
          {getStatusIcon()}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline gap-1">
          <span className={`text-2xl font-bold ${getStatusColor()}`}>
            {typeof value === 'number' ? Math.round(value) : value}
          </span>
          {suffix && (
            <span className="text-sm text-gray-500 font-medium">
              {suffix}
            </span>
          )}
        </div>
        
        {showProgress && (
          <Progress 
            value={Math.min(Math.max(value, 0), 100)} 
            className={`h-2 ${getProgressColor()}`}
          />
        )}
        
        {description && (
          <p className="text-xs text-gray-500 mt-2">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
};