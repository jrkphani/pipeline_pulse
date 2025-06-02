export interface ZohoField {
  api_name: string;
  display_label: string;
  data_type: string;
  is_custom: boolean;
  is_read_only: boolean;
  is_required: boolean;
  has_picklist: boolean;
  picklist_values?: Array<{
    actual_value: string;
    display_value: string;
  }>;
  max_length?: number;
  validation_rules?: { [key: string]: any };
  is_system_field?: boolean;
}

export interface BulkUpdateRequest {
  field_name: string;
  field_value: any;
  record_ids: string[];
  updated_by: string;
}

export interface BulkUpdateResponse {
  success: boolean;
  batch_id: string;
  total_records: number;
  successful_updates: number;
  failed_updates: number;
  status: string;
  message: string;
}

export interface BatchStatus {
  batch_id: string;
  batch_details: {
    field_name: string;
    field_value: string;
    total_records: number;
    successful_updates: number;
    failed_updates: number;
    status: string;
    sync_status: string;
    created_at: string;
    updated_at: string;
    created_by: string;
    error_details?: Array<{
      error: string;
      message?: string;
    }>;
  };
  record_statuses: Array<{
    record_id: string;
    zoho_id: string;
    old_value: string;
    new_value: string;
    status: string;
    sync_status: string;
    error_message?: string;
  }>;
}

export interface Record {
  id: string;
  opportunity_name: string;
  account_name: string;
  stage: string;
  owner: string;
  amount: number;
  currency: string;
  closing_date: string;
  [key: string]: any;
}
