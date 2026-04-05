import * as XLSX from 'xlsx';
import type { Deal } from '@/types/index';

// ---------------------------------------------------------------------------
// Column mapping — Deal → human-readable flat row for Excel export
// ---------------------------------------------------------------------------

interface ExcelRow {
  'Deal ID': string;
  'Account Name': string;
  'Opportunity': string;
  'Country': string;
  'Seller': string;
  'GTM Motion': string;
  'Funding': string;
  'Sales Stage': string;
  'Deal Value (SGD)': string;
  'Total FY': string;
  'Close Date': string;
  'Days in Stage': number;
  'Presales Stage': string;
  'PS Days': string;
  'Stage Status': string;
  'Action Bucket': string;
  'SOW ID': string;
  'TCO': string;
  'Effort Est.': string;
  'FR ID': string;
  'PO ID': string;
  'Closure': string;
  'Sales Action': string;
  'PS Action': string;
  'Owner': string;
  'Notes': string;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function toExcelRow(deal: Deal): ExcelRow {
  return {
    'Deal ID': deal.deal_id,
    'Account Name': deal.account_name,
    'Opportunity': deal.opportunity_name,
    'Country': deal.country,
    'Seller': deal.seller,
    'GTM Motion': deal.gtm_motion,
    'Funding': deal.funding_flag,
    'Sales Stage': deal.sales_stage,
    'Deal Value (SGD)': deal.deal_value_sgd.toLocaleString('en-SG'),
    'Total FY': deal.total_fy.toLocaleString('en-SG'),
    'Close Date': formatDate(deal.close_date),
    'Days in Stage': deal.days_in_stage,
    'Presales Stage': deal.presales_stage ?? '—',
    'PS Days': deal.ps_days_in_stage != null ? `${deal.ps_days_in_stage}` : '—',
    'Stage Status': deal.stage_status ?? '—',
    'Action Bucket': deal.action_bucket ?? '—',
    'SOW ID': deal.sow_id ?? '—',
    'TCO': deal.tco,
    'Effort Est.': deal.effort_est,
    'FR ID': deal.fr_id ?? '—',
    'PO ID': deal.po_id ?? '—',
    'Closure': deal.closure_confirmed ?? '—',
    'Sales Action': deal.weekly_sales_action ?? '—',
    'PS Action': deal.presales_action ?? '—',
    'Owner': deal.action_owner ?? '—',
    'Notes': deal.deal_notes ?? '—',
  };
}

// ---------------------------------------------------------------------------
// Public API — single entry point for all XLSX exports
// ---------------------------------------------------------------------------

export function exportDealsToXlsx(
  deals: Deal[],
  filename: string = 'pipeline-export',
): void {
  const rows = deals.map(toExcelRow);
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Pipeline');
  XLSX.writeFile(wb, `${filename}-${new Date().toISOString().slice(0, 10)}.xlsx`);
}
