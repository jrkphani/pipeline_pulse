/**
 * Currency Status Component
 * 
 * Shows the current status of exchange rates and provides manual refresh option
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import { currencyService, CacheStatus } from '@/services/currencyService';

export const CurrencyStatus: React.FC = () => {
  const [cacheStatus, setCacheStatus] = useState<CacheStatus | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchCacheStatus = async () => {
    try {
      const status = await currencyService.getCacheStatus();
      setCacheStatus(status);
      setError(null);
    } catch (err) {
      setError('Failed to get currency status');
      console.error('Error fetching cache status:', err);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setError(null);
    
    try {
      const result = await currencyService.refreshRates();
      
      if (result.success) {
        setLastRefresh(new Date());
        await fetchCacheStatus(); // Refresh status
      } else {
        setError(result.message || 'Failed to refresh rates');
      }
    } catch (err) {
      setError('Failed to refresh exchange rates');
      console.error('Error refreshing rates:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCacheStatus();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'fresh': return 'bg-green-100 text-green-800';
      case 'stale': return 'bg-yellow-100 text-yellow-800';
      case 'empty': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'fresh': return <TrendingUp className="h-4 w-4" />;
      case 'stale': return <Clock className="h-4 w-4" />;
      case 'empty': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const formatLastUpdated = (dateString: string | null) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Less than 1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Exchange Rates</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-8 px-2"
          >
            <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {error ? (
          <div className="flex items-center space-x-2 text-red-600 text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        ) : cacheStatus ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getStatusIcon(cacheStatus.cache_status)}
                <Badge 
                  variant="secondary" 
                  className={getStatusColor(cacheStatus.cache_status)}
                >
                  {cacheStatus.cache_status.charAt(0).toUpperCase() + cacheStatus.cache_status.slice(1)}
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground">
                {cacheStatus.total_currencies} currencies
              </span>
            </div>
            
            <div className="text-xs text-muted-foreground">
              Last updated: {formatLastUpdated(cacheStatus.last_updated)}
            </div>
            
            {lastRefresh && (
              <div className="text-xs text-green-600">
                Refreshed: {lastRefresh.toLocaleTimeString()}
              </div>
            )}
            
            {cacheStatus.cache_status === 'stale' && (
              <div className="text-xs text-yellow-600">
                Rates are {cacheStatus.age_days} days old. Consider refreshing.
              </div>
            )}
            
            {cacheStatus.cache_status === 'empty' && (
              <div className="text-xs text-red-600">
                No cached rates. Using fallback rates.
              </div>
            )}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground">
            Loading currency status...
          </div>
        )}
      </CardContent>
    </Card>
  );
};
