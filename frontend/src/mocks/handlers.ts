import { http, HttpResponse, delay } from 'msw';
import { MOCK_DEALS, makeDealFromDraft, recomputeStats } from './mock-deals';
import type { NewDealDraftInput } from './mock-deals';
import { getDealDetail, RICH_DETAILS } from './mock-deal-detail';
import type { DealDetailOverview, TimelineEvent } from '@/types/deal-detail';
import type { LeadSource, GTMMotion } from '@/types/index';
import { MOCK_SEARCH_ITEMS } from './mock-search';
import { MOCK_REPORTS } from './mock-reports';
import { adminHandlers } from './mock-admin';
import type { EntityType, EntityResultGroup, SearchResponse } from '@/components/command-palette/types';
import type { Lead } from '@/types/leads';
import type { Account } from '@/types/accounts';
import type { Contact } from '@/types/contacts';
import {
  MOCK_LEADS,
  MOCK_LEAD_ACTIVITIES,
  computeLeadsStats,
  computeMQLGate,
  isMQLReady,
  computeLeadStatus,
} from './mock-leads';
import { MOCK_ACCOUNTS, computeAccountsStats } from './mock-accounts';
import { MOCK_CONTACTS, computeContactsStats } from './mock-contacts';

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

export const handlers = [
  ...adminHandlers,

  // Auth endpoints → pass through to the real backend (no mock)
  http.post('/api/v1/auth/login', () => { return; }),
  http.get('/api/v1/auth/me', () => { return; }),
  http.post('/api/v1/auth/logout', () => { return; }),

  http.get('/api/v1/deals', () => {
    return HttpResponse.json({ deals: MOCK_DEALS, stats: recomputeStats() });
  }),

  http.post('/api/v1/deals', async ({ request }) => {
    const draft = (await request.json()) as NewDealDraftInput;
    const deal = makeDealFromDraft(draft);
    MOCK_DEALS.push(deal);
    return HttpResponse.json({ deal }, { status: 201 });
  }),

  http.get('/api/v1/deals/:dealId', ({ params }) => {
    const { dealId } = params;
    if (typeof dealId !== 'string') {
      return HttpResponse.json({ detail: 'Invalid deal ID' }, { status: 400 });
    }
    const detail = getDealDetail(dealId, MOCK_DEALS);
    if (!detail) {
      return HttpResponse.json({ detail: 'Deal not found' }, { status: 404 });
    }
    return HttpResponse.json(detail);
  }),

  // ---------------------------------------------------------------------------
  // Reports — aggregated analytics data
  // ---------------------------------------------------------------------------

  http.get('/api/v1/reports', async ({ request }) => {
    const url = new URL(request.url);
    const gtm = url.searchParams.get('gtm');
    const timeframe = url.searchParams.get('timeframe');
    
    if (timeframe) {
      console.debug('[MSW] timeframe filter deferred to real backend:', timeframe);
    }
    
    await delay(150);
    
    let reports = { ...MOCK_REPORTS };
    
    if (gtm && gtm !== 'All GTM') {
      let strictMotion = gtm;
      let looseMotion = gtm;
      if (gtm === 'AWS SAP') {
        strictMotion = 'SAP Migration';
        looseMotion = 'SAP Mig.';
      } else if (gtm === 'VMware Exit') {
        strictMotion = 'VMware Exit';
        looseMotion = 'VMware';
      }
      
      reports = {
         ...reports,
         health: {
           ...reports.health,
           gtmPipeline: reports.health.gtmPipeline.filter(p => p.name === looseMotion)
         },
         funnel: {
           ...reports.funnel,
           gtmConversion: reports.funnel.gtmConversion.filter(c => c.motion === strictMotion),
           stageRecords: Object.fromEntries(
             Object.entries(reports.funnel.stageRecords).map(([stage, records]) => [
               stage,
               records.filter(r => r.gtm_motion === strictMotion)
             ])
           )
         }
      };
    }

    return HttpResponse.json(reports);
  }),

  // ---------------------------------------------------------------------------
  // Command Palette — search endpoint
  // ---------------------------------------------------------------------------

  http.get('/api/v1/search', async ({ request }) => {
    if (!currentUser) {
      return HttpResponse.json({ detail: 'Not authenticated' }, { status: 401 });
    }

    const url = new URL(request.url);
    const q = (url.searchParams.get('q') ?? '').toLowerCase();

    // Simulate network latency
    await delay(200);

    if (!q) {
      return HttpResponse.json({ groups: [] } satisfies SearchResponse);
    }

    // Strict prefix match on label (mimics ILIKE 'abc%')
    const matched = MOCK_SEARCH_ITEMS.filter((item) =>
      item.label.toLowerCase().startsWith(q) ||
      (item.sub_label && item.sub_label.toLowerCase().startsWith(q)),
    );

    // Group by entity_type
    const groupMap = new Map<EntityType, EntityResultGroup>();
    for (const item of matched) {
      if (!groupMap.has(item.entity_type)) {
        groupMap.set(item.entity_type, { entity_type: item.entity_type, items: [] });
      }
      groupMap.get(item.entity_type)!.items.push(item);
    }

    const response: SearchResponse = { groups: Array.from(groupMap.values()) };
    return HttpResponse.json(response);
  }),

  // ---------------------------------------------------------------------------
  // Leads — CRUD endpoints
  // ---------------------------------------------------------------------------

  http.get('/api/v1/leads', () => {
    return HttpResponse.json({
      leads: MOCK_LEADS,
      stats: computeLeadsStats(MOCK_LEADS),
    });
  }),

  http.get('/api/v1/leads/:leadId', ({ params }) => {
    const { leadId } = params;
    const lead = MOCK_LEADS.find((l) => l.lead_id === leadId);
    if (!lead) {
      return HttpResponse.json({ detail: 'Lead not found' }, { status: 404 });
    }
    return HttpResponse.json(lead);
  }),

  http.patch('/api/v1/leads/:leadId', async ({ params, request }) => {
    const { leadId } = params;
    const idx = MOCK_LEADS.findIndex((l) => l.lead_id === leadId);
    if (idx === -1) {
      return HttpResponse.json({ detail: 'Lead not found' }, { status: 404 });
    }
    const body = (await request.json()) as Partial<Lead> & { _quick_log?: { channel: string; outcome: string; next_action: string; next_action_date: string | null } };
    const lead = MOCK_LEADS[idx];

    // Handle quick activity log
    if (body._quick_log) {
      const { channel, outcome, next_action, next_action_date } = body._quick_log;
      const newActivity = {
        activity_id: `AL-${lead.lead_id}-QL-${MOCK_LEAD_ACTIVITIES.length + 1}`,
        lead_id: lead.lead_id,
        company_name: lead.company_name,
        contact_name: lead.contact_name,
        date: new Date().toISOString().slice(0, 10),
        attempt_number: lead.attempt_count + 1,
        channel: channel as 'Call' | 'WhatsApp' | 'Email' | 'LinkedIn' | 'Meeting',
        outcome,
        notes: null,
        next_action: next_action || null,
        next_action_date: next_action_date || null,
        sdr_name: lead.assigned_sdr,
      };
      MOCK_LEAD_ACTIVITIES.push(newActivity);
      lead.attempt_count += 1;
      lead.last_activity_date = newActivity.date;
      if (!lead.first_contact_date) lead.first_contact_date = newActivity.date;
    } else {
      // Normal field patch
      const { _quick_log: _, ...patch } = body;
      Object.assign(lead, patch);
    }

    // Recompute MQL gate and status
    lead.mql_gate = computeMQLGate(lead);
    lead.mql_ready_auto = isMQLReady(lead.mql_gate);
    lead.lead_status = computeLeadStatus(lead);

    return HttpResponse.json(lead);
  }),

  http.post('/api/v1/leads', async ({ request }) => {
    const body = (await request.json()) as Partial<Lead>;
    const newId = `L-${body.country ?? 'SG'}-${String(MOCK_LEADS.length + 1).padStart(3, '0')}`;
    const newLead: Lead = {
      lead_id: newId,
      company_name: body.company_name ?? '',
      contact_name: body.contact_name ?? '',
      title_role: body.title_role ?? '',
      country: body.country ?? 'SG',
      email: body.email ?? '',
      phone: body.phone ?? null,
      gtm_motion: body.gtm_motion ?? 'SAP Migration',
      campaign_name: body.campaign_name ?? null,
      lead_source_type: body.lead_source_type ?? 'Cold Outbound',
      date_added: new Date().toISOString().slice(0, 10),
      assigned_sdr: body.assigned_sdr ?? '',
      receiving_seller: null,
      market: body.country ?? 'SG',
      attempt_count: 0,
      last_activity_date: null,
      first_contact_date: null,
      days_to_first_contact: null,
      meeting_booked: false,
      meeting_date: null,
      dm_icp_confirmed: null,
      pain_point_confirmed: false,
      budget_indicator: null,
      timeline: null,
      mql_gate: { meeting_booked: false, dm_confirmed: false, pain_point_confirmed: false, budget_indicator_filled: false, timeline_filled: false },
      mql_ready_auto: false,
      mql_approved_by: null,
      mql_date: null,
      lead_status: 'Contacted',
      days_to_mql: null,
      handoff_date: null,
      deal_id: null,
      icp_score: null,
      icp_score_overridden: false,
      notes: null,
    };
    MOCK_LEADS.push(newLead);
    return HttpResponse.json(newLead, { status: 201 });
  }),

  http.post('/api/v1/leads/import', async ({ request }) => {
    const body = (await request.json()) as { leads: Partial<Lead>[] };
    let imported = 0;
    let skipped = 0;
    for (const raw of body.leads) {
      if (!raw.email || MOCK_LEADS.some((l) => l.email === raw.email)) {
        skipped++;
        continue;
      }
      const gate = computeMQLGate(raw);
      const newLead: Lead = {
        lead_id: raw.lead_id ?? `L-IMP-${String(MOCK_LEADS.length + 1).padStart(3, '0')}`,
        company_name: raw.company_name ?? '',
        contact_name: raw.contact_name ?? '',
        title_role: raw.title_role ?? '',
        country: (raw.country ?? 'SG') as Lead['country'],
        email: raw.email,
        phone: raw.phone ?? null,
        gtm_motion: raw.gtm_motion ?? 'SAP Migration',
        campaign_name: raw.campaign_name ?? null,
        lead_source_type: raw.lead_source_type ?? 'Cold Outbound',
        date_added: raw.date_added ?? new Date().toISOString().slice(0, 10),
        assigned_sdr: raw.assigned_sdr ?? '',
        receiving_seller: raw.receiving_seller ?? null,
        market: (raw.market ?? 'SG') as Lead['market'],
        attempt_count: 0,
        last_activity_date: null,
        first_contact_date: null,
        days_to_first_contact: null,
        meeting_booked: false,
        meeting_date: null,
        dm_icp_confirmed: null,
        pain_point_confirmed: false,
        budget_indicator: null,
        timeline: null,
        mql_gate: gate,
        mql_ready_auto: isMQLReady(gate),
        mql_approved_by: null,
        mql_date: null,
        lead_status: 'Contacted',
        days_to_mql: null,
        handoff_date: null,
        deal_id: null,
        icp_score: null,
        icp_score_overridden: false,
        notes: null,
      };
      MOCK_LEADS.push(newLead);
      imported++;
    }
    return HttpResponse.json({ imported, skipped, errors: [] as string[] });
  }),

  http.get('/api/v1/leads/:leadId/activities', ({ params }) => {
    const { leadId } = params;
    const activities = MOCK_LEAD_ACTIVITIES.filter((a) => a.lead_id === leadId);
    return HttpResponse.json(activities);
  }),

  http.get('/api/v1/graduation-queue', () => {
    const leads = MOCK_LEADS.filter((l) => l.mql_ready_auto && !l.mql_approved_by);
    return HttpResponse.json({ leads, count: leads.length });
  }),

  // ---------------------------------------------------------------------------
  // Accounts — CRUD endpoints
  // ---------------------------------------------------------------------------

  http.get('/api/v1/accounts', () => {
    return HttpResponse.json({
      accounts: MOCK_ACCOUNTS,
      stats: computeAccountsStats(MOCK_ACCOUNTS),
    });
  }),

  http.get('/api/v1/accounts/:accountId', ({ params }) => {
    const { accountId } = params;
    const account = MOCK_ACCOUNTS.find((a) => a.account_id === accountId);
    if (!account) {
      return HttpResponse.json({ detail: 'Account not found' }, { status: 404 });
    }
    const contacts = MOCK_CONTACTS.filter((c) => c.account_id === accountId);
    const leads = MOCK_LEADS.filter(
      (l) => l.company_name === account.company_name && l.market === account.market,
    );
    const deals = MOCK_DEALS.filter(
      (d) => d.account_name === account.company_name && d.country === account.market,
    );
    return HttpResponse.json({ account, contacts, leads, deals });
  }),

  http.patch('/api/v1/accounts/:accountId', async ({ params, request }) => {
    const { accountId } = params;
    const idx = MOCK_ACCOUNTS.findIndex((a) => a.account_id === accountId);
    if (idx === -1) {
      return HttpResponse.json({ detail: 'Account not found' }, { status: 404 });
    }
    const patch = (await request.json()) as Partial<Account>;
    const account = MOCK_ACCOUNTS[idx];
    Object.assign(account, patch);
    account.updated_at = new Date().toISOString().slice(0, 10);
    return HttpResponse.json(account);
  }),

  http.post('/api/v1/accounts', async ({ request }) => {
    const body = (await request.json()) as Partial<Account>;
    const market = body.market ?? 'SG';
    const newAccount: Account = {
      account_id: `ACC-${market}-${String(MOCK_ACCOUNTS.length + 1).padStart(3, '0')}`,
      company_name: body.company_name ?? '',
      market,
      country: market,
      industry: body.industry ?? null,
      website: body.website ?? null,
      linkedin_url: body.linkedin_url ?? null,
      strategic_tier: body.strategic_tier ?? null,
      tier_set_by: null,
      tier_set_date: null,
      named_ae: body.named_ae ?? null,
      sourcing_sdr: body.sourcing_sdr ?? null,
      contact_count: 0,
      open_lead_count: 0,
      open_deal_count: 0,
      pipeline_sgd: 0,
      last_activity_date: null,
      notes: body.notes ?? null,
      created_at: new Date().toISOString().slice(0, 10),
      updated_at: new Date().toISOString().slice(0, 10),
    };
    MOCK_ACCOUNTS.push(newAccount);
    return HttpResponse.json(newAccount, { status: 201 });
  }),

  // ---------------------------------------------------------------------------
  // Contacts — CRUD endpoints
  // ---------------------------------------------------------------------------

  http.get('/api/v1/contacts', () => {
    return HttpResponse.json({
      contacts: MOCK_CONTACTS,
      stats: computeContactsStats(MOCK_CONTACTS),
    });
  }),

  http.get('/api/v1/contacts/:contactId', ({ params }) => {
    const { contactId } = params;
    const contact = MOCK_CONTACTS.find((c) => c.contact_id === contactId);
    if (!contact) {
      return HttpResponse.json({ detail: 'Contact not found' }, { status: 404 });
    }
    return HttpResponse.json(contact);
  }),

  http.patch('/api/v1/contacts/:contactId', async ({ params, request }) => {
    const { contactId } = params;
    const idx = MOCK_CONTACTS.findIndex((c) => c.contact_id === contactId);
    if (idx === -1) {
      return HttpResponse.json({ detail: 'Contact not found' }, { status: 404 });
    }
    const patch = (await request.json()) as Partial<Contact>;
    const contact = MOCK_CONTACTS[idx];
    Object.assign(contact, patch);
    contact.updated_at = new Date().toISOString().slice(0, 10);
    return HttpResponse.json(contact);
  }),

  http.post('/api/v1/contacts', async ({ request }) => {
    const body = (await request.json()) as Partial<Contact>;
    const market = body.market ?? 'SG';

    // Auto-create account if needed
    let accountId = body.account_id;
    if (!accountId && body.company_name) {
      let account = MOCK_ACCOUNTS.find(
        (a) => a.company_name === body.company_name && a.market === market,
      );
      if (!account) {
        account = {
          account_id: `ACC-${market}-${String(MOCK_ACCOUNTS.length + 1).padStart(3, '0')}`,
          company_name: body.company_name,
          market,
          country: market,
          industry: null,
          website: null,
          linkedin_url: null,
          strategic_tier: null,
          tier_set_by: null,
          tier_set_date: null,
          named_ae: null,
          sourcing_sdr: null,
          contact_count: 0,
          open_lead_count: 0,
          open_deal_count: 0,
          pipeline_sgd: 0,
          last_activity_date: null,
          notes: null,
          created_at: new Date().toISOString().slice(0, 10),
          updated_at: new Date().toISOString().slice(0, 10),
        };
        MOCK_ACCOUNTS.push(account);
      }
      accountId = account.account_id;
      account.contact_count += 1;
    }

    const firstName = body.first_name ?? '';
    const lastName = body.last_name ?? '';
    const newContact: Contact = {
      contact_id: `CON-${market}-${String(MOCK_CONTACTS.length + 1).padStart(3, '0')}`,
      account_id: accountId ?? '',
      company_name: body.company_name ?? '',
      full_name: body.full_name ?? `${firstName} ${lastName}`.trim(),
      first_name: firstName,
      last_name: lastName,
      title_role: body.title_role ?? '',
      email: body.email ?? '',
      phone: body.phone ?? null,
      linkedin_url: body.linkedin_url ?? null,
      is_decision_maker: body.is_decision_maker ?? false,
      department: body.department ?? null,
      market,
      lead_id: null,
      lead_status: null,
      icp_score: null,
      notes: body.notes ?? null,
      created_at: new Date().toISOString().slice(0, 10),
      updated_at: new Date().toISOString().slice(0, 10),
    };
    MOCK_CONTACTS.push(newContact);
    return HttpResponse.json(newContact, { status: 201 });
  }),

  // ---------------------------------------------------------------------------
  // Deal Detail — PATCH (edit) and POST actions
  // ---------------------------------------------------------------------------

  http.patch('/api/v1/deals/:dealId', async ({ params, request }) => {
    const { dealId } = params;
    if (typeof dealId !== 'string') {
      return HttpResponse.json({ detail: 'Invalid deal ID' }, { status: 400 });
    }
    const patch = (await request.json()) as Partial<DealDetailOverview>;
    const deal = MOCK_DEALS.find((d) => d.deal_id === dealId);
    if (!deal) {
      return HttpResponse.json({ detail: 'Deal not found' }, { status: 404 });
    }

    // Map editable fields onto the grid-level deal
    if (patch.opportunity_name !== undefined) deal.opportunity_name = patch.opportunity_name;
    if (patch.deal_value_sgd !== undefined) {
      deal.deal_value_sgd = patch.deal_value_sgd;
      deal.deal_value_usd = Math.round((patch.deal_value_sgd / 1.348) * 100) / 100;
    }
    if (patch.close_date !== undefined) deal.close_date = patch.close_date;
    if (patch.seller !== undefined) deal.seller = patch.seller;
    if (patch.country !== undefined) deal.country = patch.country;
    if (patch.gtm_motion !== undefined) deal.gtm_motion = patch.gtm_motion as GTMMotion;
    if (patch.lead_source !== undefined) deal.lead_source = patch.lead_source as LeadSource | null;
    if (patch.ace_id !== undefined) deal.ace_id = patch.ace_id;

    // Update rich detail if it exists
    if (RICH_DETAILS[dealId]) {
      Object.assign(RICH_DETAILS[dealId].overview, patch);
      if (patch.opportunity_name !== undefined) {
        RICH_DETAILS[dealId].opportunity_name = patch.opportunity_name;
        RICH_DETAILS[dealId].display_name = `${RICH_DETAILS[dealId].account_name} \u00b7 ${patch.opportunity_name}`;
      }
    }

    const detail = getDealDetail(dealId, MOCK_DEALS);
    return HttpResponse.json(detail);
  }),

  http.post('/api/v1/deals/:dealId/actions', async ({ params, request }) => {
    const { dealId } = params;
    if (typeof dealId !== 'string') {
      return HttpResponse.json({ detail: 'Invalid deal ID' }, { status: 400 });
    }
    const body = (await request.json()) as { action_label: string };

    if (RICH_DETAILS[dealId]) {
      const newEvent: TimelineEvent = {
        id: `tl-action-${Date.now()}`,
        type: 'stage_change',
        title: `Action logged \u2014 ${body.action_label}`,
        date: new Date().toISOString().slice(0, 10),
        participants: null,
        context: 'Manual \u2014 via Pipeline Pulse',
        note: null,
        is_alert: false,
      };
      RICH_DETAILS[dealId].timeline.unshift(newEvent);
    }

    return HttpResponse.json({ ok: true, action_label: body.action_label });
  }),

  http.post('/api/v1/leads/:leadId/approve-mql', async ({ params, request }) => {
    const { leadId } = params;
    const idx = MOCK_LEADS.findIndex((l) => l.lead_id === leadId);
    if (idx === -1) {
      return HttpResponse.json({ detail: 'Lead not found' }, { status: 404 });
    }
    const body = (await request.json()) as { ae_assigned?: string; pc_assigned?: string };
    const lead = MOCK_LEADS[idx];
    lead.mql_approved_by = 'CRO';
    lead.mql_date = new Date().toISOString().slice(0, 10);
    lead.receiving_seller = body.ae_assigned ?? null;
    lead.lead_status = 'Graduated';
    lead.handoff_date = new Date().toISOString().slice(0, 10);
    // Generate deal ID
    const dealCount = MOCK_LEADS.filter((l) => l.deal_id != null).length;
    lead.deal_id = `D-${lead.country}-${String(dealCount + 1).padStart(3, '0')}`;
    return HttpResponse.json(lead);
  }),
];
