import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useQuery } from '@tanstack/react-query';
import { bulkUpdateApi } from '@/services/bulkUpdateApi';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  RefreshCw, 
  AlertCircle,
  Upload,
  Database
} from 'lucide-react';

interface SyncStatusProps {
  batchId: string;
  onRefresh: () => void;
}

export const SyncStatus: React.FC<SyncStatusProps> = ({ batchId, onRefresh }) => {
  const { data: batchStatus, isLoading, error } = useQuery({
    queryKey: ['batch-status', batchId],
    queryFn: () => bulkUpdateApi.getBatchStatus(batchId),
    refetchInterval: (data: any) => {
      // Auto-refresh every 3 seconds if sync is in progress
      return data?.batch_details?.sync_status === 'syncing' ? 3000 : false;
    },
    enabled: !!batchId
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin" />
            Loading Status...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-500">
        <CardHeader>
          <CardTitle className="text-red-700 flex items-center gap-2">
            <XCircle className="w-5 h-5" />
            Status Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load batch status. Please try refreshing.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const batch = batchStatus?.batch_details;
  const records = batchStatus?.record_statuses || [];

  if (!batch) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'synced':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'syncing':
      case 'in_progress':
        return <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />;
      case 'failed':
      case 'sync_failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      'completed': 'default',
      'synced': 'default',
      'syncing': 'secondary',
      'in_progress': 'secondary',
      'failed': 'destructive',
      'sync_failed': 'destructive',
      'pending': 'outline'
    };
    
    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const successRate = batch.total_records > 0 
    ? (batch.successful_updates / batch.total_records) * 100 
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon(batch.sync_status)}
            Update Status
          </div>
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </CardTitle>
        <CardDescription>
          Batch ID: {batchId}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Status Overview */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium">Database Update</span>
            </div>
            {getStatusBadge(batch.status)}
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium">CRM Sync</span>
            </div>
            {getStatusBadge(batch.sync_status)}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{batch.successful_updates} / {batch.total_records} records</span>
          </div>
          <Progress value={successRate} className="h-2" />
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-1">
            <div className="text-2xl font-bold text-green-600">{batch.successful_updates}</div>
            <div className="text-xs text-gray-600">Successful</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-red-600">{batch.failed_updates}</div>
            <div className="text-xs text-gray-600">Failed</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold">{batch.total_records}</div>
            <div className="text-xs text-gray-600">Total</div>
          </div>
        </div>

        {/* Field Information */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-sm font-medium">Field Updated:</div>
          <div className="text-sm text-gray-600">{batch.field_name}</div>
          <div className="text-sm font-medium mt-2">New Value:</div>
          <div className="text-sm text-gray-600 font-mono">{batch.field_value}</div>
        </div>

        {/* Timestamps */}
        <div className="text-xs text-gray-500 space-y-1">
          <div>Created: {new Date(batch.created_at).toLocaleString()}</div>
          <div>Updated: {new Date(batch.updated_at).toLocaleString()}</div>
          <div>By: {batch.created_by}</div>
        </div>

        {/* Error Details */}
        {batch.error_details && batch.error_details.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium">Errors occurred:</div>
              <ul className="mt-2 text-xs space-y-1">
                {batch.error_details.slice(0, 3).map((error: any, index: number) => (
                  <li key={index}>• {error.error || error.message || 'Unknown error'}</li>
                ))}
                {batch.error_details.length > 3 && (
                  <li>• ... and {batch.error_details.length - 3} more errors</li>
                )}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Success Message */}
        {batch.sync_status === 'synced' && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              🎉 All updates have been successfully synced to Zoho CRM!
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
