import axios from 'axios';

const API_BASE_URL = '/api';

// Types for Live Sync API
export interface SyncStatus {
  status: 'active' | 'idle' | 'error' | 'paused';
  is_active: boolean;
  current_progress: number;
  last_sync_time: string | null;
  records_synced: number;
  health_score: number;
  total_records: number;
  records_processed: number;
  sync_duration: string | null;
  current_stage: string | null;
}

export interface SyncActivity {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  timestamp: string;
  details?: string;
}

export interface SyncOverview {
  overall_health: 'healthy' | 'warning' | 'error';
  health_score: number;
  connection_status: 'connected' | 'disconnected' | 'partial';
  active_connections: number;
  success_rate: number;
  active_sync?: {
    progress: number;
    stage: string;
    records_processed: number;
    total_records: number;
    started_at: string;
  };
  recent_issues: Array<{
    severity: 'high' | 'medium' | 'low';
    message: string;
    timestamp: string;
  }>;
  total_records: number;
  last_sync_time: string | null;
  last_sync_records: number;
  pending_conflicts: number;
  avg_sync_time: string;
}

export interface SyncConflict {
  id: string;
  record_type: string;
  record_id: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
  created_at: string;
  local_data: any;
  remote_data: any;
  field_conflicts: Array<{
    field: string;
    local_value: any;
    remote_value: any;
  }>;
}

export interface SyncHistoryEntry {
  id: string;
  timestamp: string;
  status: 'success' | 'partial' | 'failed' | 'running';
  records_processed: number;
  duration: string;
  sync_type: 'manual' | 'scheduled' | 'webhook';
  details: string;
}

export interface SyncPerformance {
  avg_speed: number; // records per minute
  error_rate: number; // percentage
  api_response_time: number; // milliseconds
  cpu_usage: number; // percentage
  memory_usage: number; // MB
  network_io: number; // KB/s
  queue_size: number;
}

export interface SyncConfig {
  auto_sync_enabled: boolean;
  sync_interval_minutes: number;
  webhook_enabled: boolean;
  conflict_resolution_strategy: 'manual' | 'local_wins' | 'remote_wins';
}

export interface ConflictResolution {
  conflict_id: string;
  resolution: 'use_local' | 'use_remote' | 'merge' | 'skip';
  merged_data?: any;
}

export interface SyncResult {
  success: boolean;
  message: string;
  records_processed?: number;
  duration?: string;
  errors?: string[];
}

// API Service Class
class LiveSyncApiService {
  private async makeRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
    try {
      const response = await axios({
        url: `${API_BASE_URL}${endpoint}`,
        method: options?.method || 'GET',
        data: options?.body,
        headers: {
          'Content-Type': 'application/json',
          ...(options?.headers as Record<string, string>),
        },
      });
      
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error(error.message || 'An error occurred');
    }
  }

  // Sync Status Operations
  async getSyncStatus(): Promise<SyncStatus> {
    return this.makeRequest<SyncStatus>('/sync/status/current');
  }

  async getSyncOverview(): Promise<SyncOverview> {
    return this.makeRequest<SyncOverview>('/sync/health');
  }

  async getSyncActivities(limit = 50): Promise<SyncActivity[]> {
    return this.makeRequest<SyncActivity[]>(`/sync/activities?limit=${limit}`);
  }

  // Sync Control Operations
  async triggerManualSync(): Promise<SyncResult> {
    return this.makeRequest<SyncResult>('/sync/manual', {
      method: 'POST',
    });
  }

  async pauseSync(): Promise<{ success: boolean; message: string }> {
    return this.makeRequest('/sync/pause', {
      method: 'POST',
    });
  }

  async resumeSync(): Promise<{ success: boolean; message: string }> {
    return this.makeRequest('/sync/resume', {
      method: 'POST',
    });
  }

  async stopSync(): Promise<{ success: boolean; message: string }> {
    return this.makeRequest('/sync/stop', {
      method: 'POST',
    });
  }

  // Configuration Operations
  async getSyncConfig(): Promise<SyncConfig> {
    return this.makeRequest<SyncConfig>('/sync/config');
  }

  async updateSyncConfig(config: Partial<SyncConfig>): Promise<{ success: boolean; message: string }> {
    return this.makeRequest('/sync/config', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  // Conflict Management
  async getSyncConflicts(): Promise<SyncConflict[]> {
    return this.makeRequest<SyncConflict[]>('/sync/conflicts');
  }

  async getConflictDetails(conflictId: string): Promise<SyncConflict> {
    return this.makeRequest<SyncConflict>(`/sync/conflicts/${conflictId}`);
  }

  async resolveConflict(resolution: ConflictResolution): Promise<{ success: boolean; message: string }> {
    return this.makeRequest(`/sync/conflicts/${resolution.conflict_id}/resolve`, {
      method: 'POST',
      body: JSON.stringify(resolution),
    });
  }

  async resolveAllConflicts(strategy: 'use_local' | 'use_remote'): Promise<SyncResult> {
    return this.makeRequest('/sync/conflicts/resolve-all', {
      method: 'POST',
      body: JSON.stringify({ strategy }),
    });
  }

  // History and Analytics
  async getSyncHistory(limit = 100, offset = 0): Promise<SyncHistoryEntry[]> {
    return this.makeRequest<SyncHistoryEntry[]>(`/sync/history?limit=${limit}&offset=${offset}`);
  }

  async getSyncPerformance(): Promise<SyncPerformance> {
    return this.makeRequest<SyncPerformance>('/sync/performance');
  }

  async getHealthAnalytics(timeframe: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<{
    health_trend: Array<{ timestamp: string; score: number }>;
    error_distribution: Array<{ type: string; count: number }>;
    performance_metrics: Array<{ timestamp: string; avg_speed: number; error_rate: number }>;
  }> {
    return this.makeRequest(`/sync/analytics/health?timeframe=${timeframe}`);
  }

  // Connection Management
  async testConnection(): Promise<{ 
    success: boolean; 
    message: string; 
    connection_details: {
      zoho_status: 'connected' | 'disconnected' | 'error';
      api_response_time: number;
      rate_limit_remaining: number;
    };
  }> {
    return this.makeRequest('/sync/connection/test');
  }

  async refreshConnection(): Promise<{ success: boolean; message: string }> {
    return this.makeRequest('/sync/connection/refresh', {
      method: 'POST',
    });
  }

  // Data Operations
  async getDataSummary(): Promise<{
    total_records: number;
    records_by_type: Record<string, number>;
    last_updated: string;
    data_freshness: number; // minutes since last update
  }> {
    return this.makeRequest('/sync/dashboard-data');
  }

  async validateData(): Promise<{
    validation_results: Array<{
      record_type: string;
      total_records: number;
      valid_records: number;
      invalid_records: number;
      issues: Array<{ field: string; issue: string; count: number }>;
    }>;
  }> {
    return this.makeRequest('/sync/data/validate');
  }

  // Webhook Management
  async getWebhookStatus(): Promise<{
    enabled: boolean;
    webhook_url: string;
    last_received: string | null;
    events_received_today: number;
  }> {
    return this.makeRequest('/sync/webhooks/status');
  }

  async configureWebhooks(config: {
    enabled: boolean;
    events: string[];
  }): Promise<{ success: boolean; message: string; webhook_url?: string }> {
    return this.makeRequest('/sync/webhooks/configure', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  // Export Operations
  async exportSyncData(format: 'csv' | 'json' | 'xlsx' = 'csv'): Promise<{
    download_url: string;
    expires_at: string;
  }> {
    return this.makeRequest(`/sync/export?format=${format}`, {
      method: 'POST',
    });
  }

  async exportSyncLogs(
    start_date: string,
    end_date: string,
    format: 'csv' | 'json' = 'csv'
  ): Promise<{
    download_url: string;
    expires_at: string;
  }> {
    return this.makeRequest('/sync/export/logs', {
      method: 'POST',
      body: JSON.stringify({ start_date, end_date, format }),
    });
  }
}

// Export singleton instance
export const liveSyncApi = new LiveSyncApiService();