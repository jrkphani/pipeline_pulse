import { apiService } from './api';

export interface BulkUpdateRequest {
  field_name: string;
  field_value: any;
  record_ids: string[];
  updated_by: string;
}

export interface ZohoField {
  api_name: string;
  display_label: string;
  data_type: string;
  is_custom: boolean;
  is_read_only: boolean;
  is_required: boolean;
  has_picklist: boolean;
  picklist_values?: Array<{actual_value: string; display_value: string}>;
  max_length?: number;
}

class BulkUpdateApi {
  async getAllRecords(page = 1, limit = 100, search?: string) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search })
    });
    
    const response = await fetch(`/api/bulk-update/records?${params}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch records: ${response.statusText}`);
    }
    return response.json();
  }

  async getZohoFields(module = 'Deals') {
    const response = await fetch(`/api/crm/fields/${module}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch Zoho fields: ${response.statusText}`);
    }
    return response.json();
  }

  async getFieldValues(fieldName: string, module = 'Deals') {
    const response = await fetch(`/api/bulk-update/zoho/field/${fieldName}/values?module=${module}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch field values: ${response.statusText}`);
    }
    return response.json();
  }

  async bulkUpdateRecords(request: BulkUpdateRequest) {
    const response = await fetch('/api/bulk-update/bulk-update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update records');
    }
    return response.json();
  }

  async syncToCRM(batchId: string) {
    const response = await fetch('/api/bulk-update/sync-to-crm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ update_batch_id: batchId }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to sync to CRM');
    }
    return response.json();
  }

  async getBatchStatus(batchId: string) {
    const response = await fetch(`/api/bulk-update/batch/${batchId}/status`);
    if (!response.ok) {
      throw new Error(`Failed to get batch status: ${response.statusText}`);
    }
    return response.json();
  }
}

export const bulkUpdateApi = new BulkUpdateApi();
