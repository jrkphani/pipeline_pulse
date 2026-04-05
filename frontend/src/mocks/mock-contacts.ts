import type { Contact, ContactsStats, ContactDepartment } from '@/types/contacts';
import type { LeadMarket } from '@/types/leads';
import { MOCK_LEADS } from './mock-leads';
import { MOCK_ACCOUNTS } from './mock-accounts';

// ---------------------------------------------------------------------------
// Derive department from title
// ---------------------------------------------------------------------------

function deriveDepartment(title: string): ContactDepartment {
  const t = title.toLowerCase();
  if (t.includes('cto') || t.includes('ciso') || t.includes('it') || t.includes('infra')) return 'IT';
  if (t.includes('cfo') || t.includes('finance')) return 'Finance';
  if (t.includes('ceo') || t.includes('coo') || t.includes('vp') || t.includes('head') || t.includes('director')) return 'C-Suite';
  if (t.includes('engineer') || t.includes('developer')) return 'Engineering';
  if (t.includes('cloud') || t.includes('digital')) return 'IT';
  if (t.includes('sales')) return 'Sales';
  if (t.includes('marketing')) return 'Marketing';
  if (t.includes('operations') || t.includes('ops')) return 'Operations';
  return 'Other';
}

// ---------------------------------------------------------------------------
// Build contacts from leads
// ---------------------------------------------------------------------------

function resolveAccountId(companyName: string, market: LeadMarket): string {
  const acc = MOCK_ACCOUNTS.find(
    (a) => a.company_name === companyName && a.market === market,
  );
  return acc?.account_id ?? 'ACC-UNKNOWN';
}

const leadContacts: Contact[] = MOCK_LEADS.map((lead, i) => ({
  contact_id: `CON-${lead.market}-${String(i + 1).padStart(3, '0')}`,
  account_id: resolveAccountId(lead.company_name, lead.market),
  company_name: lead.company_name,
  full_name: lead.contact_name,
  first_name: lead.contact_name.split(' ')[0],
  last_name: lead.contact_name.split(' ').slice(1).join(' '),
  title_role: lead.title_role,
  email: lead.email,
  phone: lead.phone,
  linkedin_url: null,
  is_decision_maker: lead.dm_icp_confirmed === 'Decision Maker',
  department: deriveDepartment(lead.title_role),
  market: lead.market,
  lead_id: lead.lead_id,
  lead_status: lead.lead_status,
  icp_score: lead.icp_score,
  notes: null,
  created_at: lead.date_added,
  updated_at: lead.last_activity_date ?? lead.date_added,
}));

// ---------------------------------------------------------------------------
// Standalone contacts (no linked lead)
// ---------------------------------------------------------------------------

const standaloneContacts: Contact[] = [
  {
    contact_id: 'CON-SG-099',
    account_id: 'ACC-SG-099',
    company_name: 'Standard Chartered',
    full_name: 'Michelle Koh',
    first_name: 'Michelle',
    last_name: 'Koh',
    title_role: 'VP Cloud Infrastructure',
    email: 'michelle.koh@sc.com',
    phone: '+65 9111 2233',
    linkedin_url: null,
    is_decision_maker: true,
    department: 'IT',
    market: 'SG',
    lead_id: null,
    lead_status: null,
    icp_score: null,
    notes: 'Met at AWS Summit SG 2026',
    created_at: '2026-03-15',
    updated_at: '2026-03-15',
  },
  {
    contact_id: 'CON-MY-099',
    account_id: 'ACC-MY-099',
    company_name: 'Maxis Berhad',
    full_name: 'Tan Wei Ming',
    first_name: 'Tan',
    last_name: 'Wei Ming',
    title_role: 'Head of Digital',
    email: 'weiming.tan@maxis.com.my',
    phone: '+60 12 888 9999',
    linkedin_url: null,
    is_decision_maker: false,
    department: 'C-Suite',
    market: 'MY',
    lead_id: null,
    lead_status: null,
    icp_score: null,
    notes: 'Referral from AWS AM - interested in GenAI POC',
    created_at: '2026-03-20',
    updated_at: '2026-03-20',
  },
  {
    contact_id: 'CON-SG-100',
    account_id: 'ACC-SG-099',
    company_name: 'Standard Chartered',
    full_name: 'Priya Nair',
    first_name: 'Priya',
    last_name: 'Nair',
    title_role: 'CISO',
    email: 'priya.nair@sc.com',
    phone: '+65 9444 5566',
    linkedin_url: null,
    is_decision_maker: true,
    department: 'IT',
    market: 'SG',
    lead_id: null,
    lead_status: null,
    icp_score: null,
    notes: null,
    created_at: '2026-03-15',
    updated_at: '2026-03-15',
  },
];

export const MOCK_CONTACTS: Contact[] = [...leadContacts, ...standaloneContacts];

// ---------------------------------------------------------------------------
// Stats computation
// ---------------------------------------------------------------------------

export function computeContactsStats(contacts: Contact[]): ContactsStats {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const cutoff = thirtyDaysAgo.toISOString().slice(0, 10);

  return {
    total: contacts.length,
    decision_makers: contacts.filter((c) => c.is_decision_maker).length,
    with_active_lead: contacts.filter((c) => c.lead_id != null).length,
    with_no_lead: contacts.filter((c) => c.lead_id == null).length,
    recently_added: contacts.filter((c) => c.created_at >= cutoff).length,
  };
}
