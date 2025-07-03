import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';

interface HealthIndicatorProps {
  score: number;
  trend?: 'up' | 'down' | 'stable';
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
  className?: string;
}

export const HealthIndicator: React.FC<HealthIndicatorProps> = ({
  score,
  trend,
  size = 'md',
  showDetails = false,
  className = ''
}) => {
  const getHealthStatus = (score: number) => {
    if (score >= 90) return 'excellent';
    if (score >= 80) return 'good';
    if (score >= 60) return 'fair';
    if (score >= 40) return 'poor';
    return 'critical';
  };

  const getHealthIcon = (status: string, size: string) => {
    const iconSize = size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-6 w-6' : 'h-4 w-4';
    
    switch (status) {
      case 'excellent':
        return <CheckCircle2 className={`${iconSize} text-green-500`} />;
      case 'good':
        return <CheckCircle2 className={`${iconSize} text-green-400`} />;
      case 'fair':
        return <AlertTriangle className={`${iconSize} text-yellow-500`} />;
      case 'poor':
        return <AlertTriangle className={`${iconSize} text-orange-500`} />;
      case 'critical':
        return <XCircle className={`${iconSize} text-red-500`} />;
      default:
        return <Clock className={`${iconSize} text-gray-500`} />;
    }
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'text-green-600';
      case 'good':
        return 'text-green-500';
      case 'fair':
        return 'text-yellow-600';
      case 'poor':
        return 'text-orange-600';
      case 'critical':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return '[&>div]:bg-green-500';
      case 'good':
        return '[&>div]:bg-green-400';
      case 'fair':
        return '[&>div]:bg-yellow-500';
      case 'poor':
        return '[&>div]:bg-orange-500';
      case 'critical':
        return '[&>div]:bg-red-500';
      default:
        return '[&>div]:bg-gray-400';
    }
  };

  const getHealthBadge = (status: string) => {
    switch (status) {
      case 'excellent':
        return <Badge variant="default" className="bg-green-500">Excellent</Badge>;
      case 'good':
        return <Badge variant="default" className="bg-green-400">Good</Badge>;
      case 'fair':
        return <Badge variant="default" className="bg-yellow-500">Fair</Badge>;
      case 'poor':
        return <Badge variant="default" className="bg-orange-500">Poor</Badge>;
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 text-red-500" />;
      case 'stable':
        return <Minus className="h-3 w-3 text-gray-500" />;
      default:
        return null;
    }
  };

  const getHealthMessage = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'System is performing optimally with no issues detected.';
      case 'good':
        return 'System is performing well with minor optimizations possible.';
      case 'fair':
        return 'System is functioning but may benefit from attention.';
      case 'poor':
        return 'System performance is degraded and requires attention.';
      case 'critical':
        return 'System has serious issues that need immediate attention.';
      default:
        return 'Health status unknown.';
    }
  };

  const status = getHealthStatus(score);

  if (size === 'sm') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {getHealthIcon(status, size)}
        <span className={`text-sm font-medium ${getHealthColor(status)}`}>
          {Math.round(score)}%
        </span>
        {trend && getTrendIcon(trend)}
      </div>
    );
  }

  if (size === 'lg') {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getHealthIcon(status, size)}
            <div>
              <h3 className={`text-xl font-bold ${getHealthColor(status)}`}>
                {Math.round(score)}%
              </h3>
              <p className="text-sm text-gray-600 capitalize">{status} Health</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getHealthBadge(status)}
            {trend && getTrendIcon(trend)}
          </div>
        </div>
        
        <Progress 
          value={Math.min(Math.max(score, 0), 100)} 
          className={`h-3 ${getProgressColor(status)}`}
        />
        
        {showDetails && (
          <p className="text-sm text-gray-600">
            {getHealthMessage(status)}
          </p>
        )}
      </div>
    );
  }

  // Default medium size
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getHealthIcon(status, size)}
          <span className={`font-medium ${getHealthColor(status)}`}>
            {Math.round(score)}%
          </span>
        </div>
        <div className="flex items-center gap-2">
          {getHealthBadge(status)}
          {trend && getTrendIcon(trend)}
        </div>
      </div>
      
      <Progress 
        value={Math.min(Math.max(score, 0), 100)} 
        className={`h-2 ${getProgressColor(status)}`}
      />
      
      {showDetails && (
        <p className="text-xs text-gray-600">
          {getHealthMessage(status)}
        </p>
      )}
    </div>
  );
};