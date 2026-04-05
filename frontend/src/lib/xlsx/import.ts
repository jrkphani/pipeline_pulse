/**
 * XLSX import utility — all SheetJS read logic lives here.
 * Components must never import XLSX directly.
 */
import * as XLSX from 'xlsx';
import type { Lead } from '@/types/leads';

// ---------------------------------------------------------------------------
// Column mapping: Excel header -> Lead field
// ---------------------------------------------------------------------------

const COLUMN_MAP: Record<string, keyof Lead> = {
  'Lead ID': 'lead_id',
  'Company Name': 'company_name',
  'Contact Name': 'contact_name',
  'Title / Role': 'title_role',
  'Country': 'country',
  'Email': 'email',
  'Phone / WhatsApp / Viber': 'phone',
  'GTM Motion': 'gtm_motion',
  'Campaign Name': 'campaign_name',
  'Lead Source Type': 'lead_source_type',
  'Date Added': 'date_added',
  'Assigned SDR': 'assigned_sdr',
  'Receiving Seller': 'receiving_seller',
  'Market': 'market',
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface ParseResult {
  leads: Partial<Lead>[];
  error: string | null;
}

/**
 * Parse an ArrayBuffer (from FileReader) into an array of partial Lead objects.
 */
export function parseLeadsFromBuffer(buffer: ArrayBuffer): ParseResult {
  try {
    const data = new Uint8Array(buffer);
    const wb = XLSX.read(data, { type: 'array' });

    // Try "Lead Summary" sheet first, then first sheet
    const sheetName = wb.SheetNames.includes('Lead Summary')
      ? 'Lead Summary'
      : wb.SheetNames[0];
    if (!sheetName) {
      return { leads: [], error: 'No sheets found in file' };
    }
    const ws = wb.Sheets[sheetName];
    if (!ws) {
      return { leads: [], error: 'Sheet is empty' };
    }

    // Parse to JSON — row 2 has headers in the 1CH tracker (row 1 is section headers)
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { header: 1 }) as unknown[][];

    // Find header row: try row index 1 first (0-indexed), then 0
    let headerRowIdx = 1;
    let headers = rows[headerRowIdx] as string[] | undefined;
    if (!headers || !headers.some((h) => typeof h === 'string' && Object.keys(COLUMN_MAP).includes(h))) {
      headerRowIdx = 0;
      headers = rows[0] as string[] | undefined;
    }
    if (!headers) {
      return { leads: [], error: 'Could not find header row' };
    }

    // Map columns
    const colMapping: { idx: number; field: keyof Lead }[] = [];
    for (let i = 0; i < headers.length; i++) {
      const header = String(headers[i] ?? '').trim();
      const mapped = COLUMN_MAP[header];
      if (mapped) colMapping.push({ idx: i, field: mapped });
    }

    if (colMapping.length === 0) {
      return { leads: [], error: 'No matching columns found. Expected headers like: Company Name, Contact Name, Email, etc.' };
    }

    // Parse data rows
    const leads: Partial<Lead>[] = [];
    for (let r = headerRowIdx + 1; r < rows.length; r++) {
      const row = rows[r] as unknown[];
      if (!row || row.length === 0) continue;

      const lead: Partial<Lead> = {};
      let hasData = false;
      for (const { idx, field } of colMapping) {
        const val = row[idx];
        if (val != null && val !== '') {
          (lead as Record<string, unknown>)[field] = String(val);
          hasData = true;
        }
      }
      if (hasData && lead.company_name) {
        leads.push(lead);
      }
    }

    return { leads, error: null };
  } catch {
    return { leads: [], error: 'Failed to parse file. Ensure it is a valid .xlsx or .csv file.' };
  }
}
