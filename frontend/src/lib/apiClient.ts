import { config } from './config';
import type { 
  User, 
  Opportunity, 
  OpportunityCreate, 
  PaginatedResponse,
  DashboardMetrics,
  SyncSession,
  HealthStatus,
  O2RPhase,
  SyncStatus,
  Territory,
  Account
} from '../types';

// Authentication types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

// Query parameters
export interface OpportunityFilters {
  page?: number;
  pageSize?: number;
  healthStatus?: HealthStatus;
  territoryId?: number;
  phase?: O2RPhase;
  startDate?: string;
  endDate?: string;
  search?: string;
}

// Chart data query parameters
export interface ChartQueryParams {
  startDate?: string;
  endDate?: string;
  territoryId?: number;
  phase?: O2RPhase;
  groupBy?: 'day' | 'week' | 'month' | 'quarter';
}

// Dashboard chart data interfaces
export interface PipelineChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
  }[];
}

export interface O2RChartData {
  phase1: number;
  phase2: number;
  phase3: number;
  phase4: number;
  totalValue: number;
}

export interface HealthChartData {
  success: number;
  warning: number;
  danger: number;
  neutral: number;
}

export interface SyncHistoryResponse {
  sessions: SyncSession[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SyncStatusResponse {
  currentSession?: SyncSession;
  lastFullSync?: string;
  lastIncrementalSync?: string;
  isRunning: boolean;
  nextScheduledSync?: string;
  syncStats: {
    totalRecords: number;
    successfulRecords: number;
    failedRecords: number;
    lastSyncDuration?: number;
  };
}

export interface ApiError {
  message: string;
  detail?: string;
  statusCode: number;
  timestamp: string;
  path?: string;
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;
  private refreshToken: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.setupInterceptors();
  }

  setToken(token: string | null) {
    this.token = token;
  }

  setRefreshToken(refreshToken: string | null) {
    this.refreshToken = refreshToken;
  }

  private setupInterceptors() {
    // Response interceptor for handling token refresh
    this.interceptResponse = this.interceptResponse.bind(this);
  }

  private async interceptResponse(response: Response): Promise<Response> {
    if (response.status === 401 && this.refreshToken) {
      try {
        const refreshResponse = await fetch(`${this.baseURL}/api/v1/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken: this.refreshToken }),
        });

        if (refreshResponse.ok) {
          const { accessToken, refreshToken } = await refreshResponse.json();
          this.setToken(accessToken);
          this.setRefreshToken(refreshToken);
          
          // Store tokens in localStorage
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
          
          return response;
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
        // Clear tokens and redirect to login
        this.clearTokens();
        window.location.href = '/login';
      }
    }
    return response;
  }

  private clearTokens() {
    this.token = null;
    this.refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    skipAuth: boolean = false
  ): Promise<T> {
    const url = `${this.baseURL}/api/v1${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token && !skipAuth) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      let response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include', // Include cookies for session management
      });

      // Apply response interceptor
      response = await this.interceptResponse(response);

      // Handle empty responses (like logout)
      if (response.status === 204) {
        return {} as T;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const apiError: ApiError = {
          message: errorData.detail || errorData.message || `HTTP error! status: ${response.status}`,
          detail: errorData.detail,
          statusCode: response.status,
          timestamp: new Date().toISOString(),
          path: endpoint,
        };
        throw apiError;
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', { endpoint, error });
      throw error;
    }
  }

  // Authentication endpoints
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }, true); // Skip auth for login
    
    // Store tokens
    this.setToken(response.accessToken);
    this.setRefreshToken(response.refreshToken);
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    
    return response;
  }

  async register(userData: RegisterData): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }, true); // Skip auth for register
    
    // Store tokens
    this.setToken(response.accessToken);
    this.setRefreshToken(response.refreshToken);
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    
    return response;
  }

  async logout(): Promise<void> {
    try {
      await this.request<void>('/auth/logout', {
        method: 'POST',
      });
    } finally {
      this.clearTokens();
    }
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  async refreshAccessToken(): Promise<LoginResponse> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }
    
    const response = await this.request<LoginResponse>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: this.refreshToken }),
    }, true);
    
    this.setToken(response.accessToken);
    this.setRefreshToken(response.refreshToken);
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    
    return response;
  }

  // Initialize tokens from localStorage
  initializeTokens() {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (accessToken) {
      this.setToken(accessToken);
    }
    if (refreshToken) {
      this.setRefreshToken(refreshToken);
    }
  }

  // Opportunities endpoints
  async getOpportunities(filters: OpportunityFilters = {}): Promise<PaginatedResponse<Opportunity>> {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.pageSize) params.append('page_size', filters.pageSize.toString());
    if (filters.healthStatus) params.append('health_status', filters.healthStatus);
    if (filters.territoryId) params.append('territory_id', filters.territoryId.toString());
    if (filters.phase) params.append('phase', filters.phase.toString());
    
    const queryString = params.toString();
    const endpoint = `/opportunities${queryString ? `?${queryString}` : ''}`;
    
    return this.request<PaginatedResponse<Opportunity>>(endpoint);
  }

  async getOpportunity(id: number): Promise<Opportunity> {
    return this.request<Opportunity>(`/opportunities/${id}`);
  }

  async createOpportunity(data: OpportunityCreate): Promise<Opportunity> {
    return this.request<Opportunity>('/opportunities', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateOpportunity(id: number, data: Partial<OpportunityCreate>): Promise<Opportunity> {
    return this.request<Opportunity>(`/opportunities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteOpportunity(id: number): Promise<void> {
    await this.request<void>(`/opportunities/${id}`, {
      method: 'DELETE',
    });
  }

  async bulkUpdateHealthStatus(opportunityIds: number[], healthStatus: HealthStatus): Promise<{ updated: number }> {
    return this.request<{ updated: number }>('/opportunities/bulk-update-health', {
      method: 'POST',
      body: JSON.stringify({
        opportunity_ids: opportunityIds,
        health_status: healthStatus,
      }),
    });
  }

  // Dashboard metrics endpoints
  async getDashboardMetrics(params?: ChartQueryParams): Promise<DashboardMetrics> {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('start_date', params.startDate);
    if (params?.endDate) queryParams.append('end_date', params.endDate);
    if (params?.territoryId) queryParams.append('territory_id', params.territoryId.toString());
    if (params?.phase) queryParams.append('phase', params.phase.toString());
    
    const queryString = queryParams.toString();
    const endpoint = `/dashboard/metrics${queryString ? `?${queryString}` : ''}`;
    
    return this.request<DashboardMetrics>(endpoint);
  }

  async getPipelineChartData(params?: ChartQueryParams): Promise<PipelineChartData> {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('start_date', params.startDate);
    if (params?.endDate) queryParams.append('end_date', params.endDate);
    if (params?.territoryId) queryParams.append('territory_id', params.territoryId.toString());
    if (params?.groupBy) queryParams.append('group_by', params.groupBy);
    
    const queryString = queryParams.toString();
    const endpoint = `/dashboard/pipeline-chart${queryString ? `?${queryString}` : ''}`;
    
    return this.request<PipelineChartData>(endpoint);
  }

  async getO2RChartData(params?: ChartQueryParams): Promise<O2RChartData> {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('start_date', params.startDate);
    if (params?.endDate) queryParams.append('end_date', params.endDate);
    if (params?.territoryId) queryParams.append('territory_id', params.territoryId.toString());
    
    const queryString = queryParams.toString();
    const endpoint = `/dashboard/o2r-chart${queryString ? `?${queryString}` : ''}`;
    
    return this.request<O2RChartData>(endpoint);
  }

  async getHealthChartData(params?: ChartQueryParams): Promise<HealthChartData> {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('start_date', params.startDate);
    if (params?.endDate) queryParams.append('end_date', params.endDate);
    if (params?.territoryId) queryParams.append('territory_id', params.territoryId.toString());
    
    const queryString = queryParams.toString();
    const endpoint = `/dashboard/health-chart${queryString ? `?${queryString}` : ''}`;
    
    return this.request<HealthChartData>(endpoint);
  }

  async getAttentionRequired(params?: { limit?: number; territoryId?: number }): Promise<Opportunity[]> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.territoryId) queryParams.append('territory_id', params.territoryId.toString());
    
    const queryString = queryParams.toString();
    const endpoint = `/dashboard/attention-required${queryString ? `?${queryString}` : ''}`;
    
    return this.request<Opportunity[]>(endpoint);
  }

  async syncDashboardData(): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/dashboard/sync', {
      method: 'POST',
    });
  }

  // Sync operations endpoints
  async triggerFullSync(): Promise<SyncSession> {
    return this.request<SyncSession>('/sync/full', {
      method: 'POST',
    });
  }

  async triggerIncrementalSync(): Promise<SyncSession> {
    return this.request<SyncSession>('/sync/incremental', {
      method: 'POST',
    });
  }

  async getSyncStatus(): Promise<SyncStatusResponse> {
    return this.request<SyncStatusResponse>('/sync/status');
  }

  async getSyncHistory(params?: {
    page?: number;
    limit?: number;
    status?: SyncStatus;
    type?: 'full' | 'incremental';
  }): Promise<SyncHistoryResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.type) queryParams.append('type', params.type);
    
    const queryString = queryParams.toString();
    const endpoint = `/sync/history${queryString ? `?${queryString}` : ''}`;
    
    return this.request<SyncHistoryResponse>(endpoint);
  }

  async getSyncSession(sessionId: string): Promise<SyncSession> {
    return this.request<SyncSession>(`/sync/sessions/${sessionId}`);
  }

  async cancelSync(sessionId: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/sync/sessions/${sessionId}/cancel`, {
      method: 'POST',
    });
  }

  async retryFailedSync(sessionId: string): Promise<SyncSession> {
    return this.request<SyncSession>(`/sync/sessions/${sessionId}/retry`, {
      method: 'POST',
    });
  }

  // User management endpoints
  async getUsers(filters: { page?: number; pageSize?: number } = {}): Promise<PaginatedResponse<User>> {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.pageSize) params.append('page_size', filters.pageSize.toString());
    
    const queryString = params.toString();
    const endpoint = `/users${queryString ? `?${queryString}` : ''}`;
    
    return this.request<PaginatedResponse<User>>(endpoint);
  }

  async getUser(id: number): Promise<User> {
    return this.request<User>(`/users/${id}`);
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    return this.request<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deactivateUser(id: number): Promise<void> {
    await this.request<void>(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  async getMyProfile(): Promise<User> {
    return this.request<User>('/users/me/profile');
  }

  async updateMyProfile(data: Partial<User>): Promise<User> {
    return this.request<User>('/users/me/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Territory endpoints
  async getTerritories(): Promise<Territory[]> {
    return this.request<Territory[]>('/territories');
  }

  async getTerritory(id: number): Promise<Territory> {
    return this.request<Territory>(`/territories/${id}`);
  }

  // Account endpoints
  async getAccounts(params?: {
    page?: number;
    limit?: number;
    territoryId?: number;
    search?: string;
  }): Promise<PaginatedResponse<Account>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.territoryId) queryParams.append('territory_id', params.territoryId.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    const queryString = queryParams.toString();
    const endpoint = `/accounts${queryString ? `?${queryString}` : ''}`;
    
    return this.request<PaginatedResponse<Account>>(endpoint);
  }

  async getAccount(id: number): Promise<Account> {
    return this.request<Account>(`/accounts/${id}`);
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string; version: string }> {
    return this.request<{ status: string; timestamp: string; version: string }>('/health');
  }

  // Generic methods for backward compatibility
  async get<T>(endpoint: string, params?: Record<string, string | number>): Promise<T> {
    let url = endpoint;
    if (params) {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        queryParams.append(key, value.toString());
      });
      const queryString = queryParams.toString();
      url = `${endpoint}${queryString ? `?${queryString}` : ''}`;
    }
    return this.request<T>(url, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Utility methods
  isAuthenticated(): boolean {
    return !!this.token;
  }

  getToken(): string | null {
    return this.token;
  }

  getRefreshToken(): string | null {
    return this.refreshToken;
  }
}

export const apiClient = new ApiClient(config.apiUrl);

// Initialize tokens on app startup
apiClient.initializeTokens();

// All types are already exported individually above