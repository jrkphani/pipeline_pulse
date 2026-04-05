import type { LeadMarket, ICPScore, LeadStage } from './leads';

// ---------------------------------------------------------------------------
// Contact
// ---------------------------------------------------------------------------

export const CONTACT_DEPARTMENTS = [
  'IT',
  'Finance',
  'Operations',
  'Engineering',
  'Sales',
  'Marketing',
  'HR',
  'C-Suite',
  'Other',
] as const;
export type ContactDepartment = (typeof CONTACT_DEPARTMENTS)[number];

export interface Contact {
  contact_id: string;
  account_id: string;
  company_name: string;

  // Identity
  full_name: string;
  first_name: string;
  last_name: string;
  title_role: string;
  email: string;
  phone: string | null;
  linkedin_url: string | null;

  // Classification
  is_decision_maker: boolean;
  department: ContactDepartment | string | null;
  market: LeadMarket;

  // Lead linkage
  lead_id: string | null;
  lead_status: LeadStage | null;
  icp_score: ICPScore | null;

  // Notes
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Stats for the contacts stats bar
export interface ContactsStats {
  total: number;
  decision_makers: number;
  with_active_lead: number;
  with_no_lead: number;
  recently_added: number;
}
