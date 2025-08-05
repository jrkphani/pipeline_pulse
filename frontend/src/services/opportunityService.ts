import { apiClient } from '../lib/apiClient';
import type { Opportunity, OpportunityCreate, PaginatedResponse } from '../types';

export class OpportunityService {

  static async getOpportunities(params: {
    page?: number;
    limit?: number;
    healthStatus?: string;
    territoryId?: number;
    phase?: number;
  } = {}): Promise<PaginatedResponse<Opportunity>> {
    return apiClient.getOpportunities({
      page: params.page,
      pageSize: params.limit,
      healthStatus: params.healthStatus as any,
      territoryId: params.territoryId,
      phase: params.phase as any,
    });
  }

  static async getOpportunity(id: number): Promise<Opportunity> {
    return apiClient.getOpportunity(id);
  }

  static async createOpportunity(data: OpportunityCreate): Promise<Opportunity> {
    return apiClient.createOpportunity(data);
  }

  static async updateOpportunity(id: number, data: Partial<OpportunityCreate>): Promise<Opportunity> {
    return apiClient.updateOpportunity(id, data);
  }

  static async deleteOpportunity(id: number): Promise<void> {
    return apiClient.deleteOpportunity(id);
  }

  static async bulkUpdateHealthStatus(
    opportunityIds: number[],
    healthStatus: string
  ): Promise<{ updated: number }> {
    return apiClient.bulkUpdateHealthStatus(opportunityIds, healthStatus as any);
  }
}