import * as XLSX from 'xlsx';
import type { Lead } from '@/types/leads';

interface LeadExcelRow {
  'Lead ID': string;
  'Company': string;
  'Contact': string;
  'Title': string;
  'Country': string;
  'GTM Motion': string;
  'Source': string;
  'ICP Score': string;
  'Lead Status': string;
  'Meeting Booked': string;
  'DM Confirmed': string;
  'Pain Point': string;
  'Budget': string;
  'Timeline': string;
  'SDR': string;
  'Attempts': number;
  'Last Activity': string;
  'MQL Approved By': string;
  'Deal ID': string;
}

function toExcelRow(lead: Lead): LeadExcelRow {
  return {
    'Lead ID': lead.lead_id,
    'Company': lead.company_name,
    'Contact': lead.contact_name,
    'Title': lead.title_role,
    'Country': lead.country,
    'GTM Motion': lead.gtm_motion,
    'Source': lead.lead_source_type,
    'ICP Score': lead.icp_score != null ? `${lead.icp_score}/5` : '—',
    'Lead Status': lead.lead_status,
    'Meeting Booked': lead.meeting_booked ? 'Yes' : 'No',
    'DM Confirmed': lead.dm_icp_confirmed ?? '—',
    'Pain Point': lead.pain_point_confirmed ? 'Yes' : 'No',
    'Budget': lead.budget_indicator ?? '—',
    'Timeline': lead.timeline ?? '—',
    'SDR': lead.assigned_sdr,
    'Attempts': lead.attempt_count,
    'Last Activity': lead.last_activity_date ?? '—',
    'MQL Approved By': lead.mql_approved_by ?? '—',
    'Deal ID': lead.deal_id ?? '—',
  };
}

export function exportLeadsToXlsx(
  leads: Lead[],
  filename: string = 'leads-export',
): void {
  const rows = leads.map(toExcelRow);
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Leads');
  XLSX.writeFile(wb, `${filename}-${new Date().toISOString().slice(0, 10)}.xlsx`);
}
