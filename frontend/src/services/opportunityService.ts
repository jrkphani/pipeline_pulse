import { apiClient } from '../lib/apiClient';
import type { Opportunity, OpportunityCreate, PaginatedResponse } from '../types';

export class OpportunityService {
  private static readonly BASE_PATH = '/api/v1/opportunities';

  static async getOpportunities(params: {
    page?: number;
    limit?: number;
    healthStatus?: string;
    territoryId?: number;
    phase?: number;
  } = {}): Promise<PaginatedResponse<Opportunity>> {
    const searchParams = new URLSearchParams();
    
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.healthStatus) searchParams.append('health_status', params.healthStatus);
    if (params.territoryId) searchParams.append('territory_id', params.territoryId.toString());
    if (params.phase) searchParams.append('phase', params.phase.toString());

    const endpoint = `${this.BASE_PATH}?${searchParams.toString()}`;
    const response = await apiClient.get<PaginatedResponse<Opportunity>>(endpoint);
    
    return response.data;
  }

  static async getOpportunity(id: number): Promise<Opportunity> {
    const response = await apiClient.get<Opportunity>(`${this.BASE_PATH}/${id}`);
    return response.data;
  }

  static async createOpportunity(data: OpportunityCreate): Promise<Opportunity> {
    const response = await apiClient.post<Opportunity>(this.BASE_PATH, data);
    return response.data;
  }

  static async updateOpportunity(id: number, data: Partial<OpportunityCreate>): Promise<Opportunity> {
    const response = await apiClient.put<Opportunity>(`${this.BASE_PATH}/${id}`, data);
    return response.data;
  }

  static async deleteOpportunity(id: number): Promise<void> {
    await apiClient.delete<void>(`${this.BASE_PATH}/${id}`);
  }

  static async bulkUpdateHealthStatus(
    opportunityIds: number[],
    healthStatus: string
  ): Promise<{ updated: number }> {
    const response = await apiClient.post<{ updated: number }>(
      `${this.BASE_PATH}/bulk-update-health`,
      { opportunity_ids: opportunityIds, health_status: healthStatus }
    );
    return response.data;
  }
}