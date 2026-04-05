import { useState, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  Check,
  ChevronLeft,
  Building2,
  Users,
  Target,
  Zap,
  PenLine,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Account } from '@/types/accounts';
import type { Contact } from '@/types/contacts';
import type { Lead } from '@/types/leads';
import type { Deal } from '@/types/index';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { renderICPStars } from '@/lib/ag-grid/lead-cell-renderers';

// ---------------------------------------------------------------------------
// Tab types
// ---------------------------------------------------------------------------

type AccountTab = 'overview' | 'contacts' | 'leads' | 'deals' | 'notes';

const TABS: { id: AccountTab; label: string; icon: typeof Building2; badge?: (a: Account) => number }[] = [
  { id: 'overview', label: 'Overview', icon: Building2 },
  { id: 'contacts', label: 'Contacts', icon: Users, badge: (a) => a.contact_count },
  { id: 'leads', label: 'Leads', icon: Target, badge: (a) => a.open_lead_count },
  { id: 'deals', label: 'Deals', icon: Zap, badge: (a) => a.open_deal_count },
  { id: 'notes', label: 'Notes', icon: PenLine },
];

// ---------------------------------------------------------------------------
// Tier badge
// ---------------------------------------------------------------------------

const TIER_COLORS: Record<string, { bg: string; text: string }> = {
  A: { bg: '#E1F5EE', text: '#085041' },
  B: { bg: '#FAEEDA', text: '#633806' },
  C: { bg: '#F1EFE8', text: '#5F5E5A' },
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AccountDetailShellProps {
  account: Account;
  contacts: Contact[];
  leads: Lead[];
  deals: Deal[];
  onBack: () => void;
  onUpdate?: (updates: Partial<Account>) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AccountDetailShell({ account, contacts, leads, deals, onBack, onUpdate }: AccountDetailShellProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AccountTab>('contacts');
  const [notes, setNotes] = useState(account.notes ?? '');

  const tierColors = account.strategic_tier ? TIER_COLORS[account.strategic_tier] : null;

  const handleNotesBlur = useCallback(() => {
    onUpdate?.({ notes: notes || null });
  }, [notes, onUpdate]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header strip */}
      <div className="flex h-12 shrink-0 items-center gap-3 border-b bg-muted/20 px-4">
        <button type="button" onClick={onBack} className="flex items-center text-muted-foreground hover:text-foreground">
          <ChevronLeft className="size-4" />
        </button>
        <span className="rounded px-2 py-0.5 font-mono text-xs font-medium bg-muted/50 text-muted-foreground">
          {account.account_id}
        </span>
        <span className="text-sm font-semibold">{account.company_name}</span>

        {/* Market badge */}
        <span className="rounded-full px-2 py-0.5 text-[11px] font-medium bg-[#E6F1FB] text-[#0C447C]">
          {account.market}
        </span>

        {/* Tier badge */}
        {tierColors && (
          <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ backgroundColor: tierColors.bg, color: tierColors.text }}>
            Tier {account.strategic_tier}
          </span>
        )}

        <div className="flex-1" />

        {/* Pipeline summary */}
        <span className="font-mono text-xs font-medium" style={{ color: 'var(--pp-color-success-700)' }}>
          S$ {account.pipeline_sgd.toLocaleString('en-SG')}
        </span>
        <span className="text-[11px] text-muted-foreground">{account.open_deal_count} deals</span>
        <span className="text-[11px] text-muted-foreground">{account.open_lead_count} leads</span>
      </div>

      {/* Body */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Vertical tab nav */}
        <div className="flex w-12 shrink-0 flex-col items-center gap-1 border-r bg-muted/10 py-3">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const badgeCount = tab.badge?.(account);
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                title={tab.label}
                className={cn(
                  'relative flex size-9 items-center justify-center rounded-md transition-colors',
                  isActive ? 'bg-[#EEEDFE] text-[#3C3489]' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                )}
              >
                <tab.icon className="size-4" />
                {badgeCount != null && badgeCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex size-3.5 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-white">
                    {badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto min-w-0">
          {activeTab === 'overview' && <OverviewTab account={account} />}
          {activeTab === 'contacts' && <ContactsTab contacts={contacts} />}
          {activeTab === 'leads' && <LeadsTab leads={leads} />}
          {activeTab === 'deals' && <DealsTab deals={deals} />}
          {activeTab === 'notes' && (
            <div className="p-6">
              <h3 className="text-sm font-semibold mb-3">Notes</h3>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={handleNotesBlur} placeholder="Account notes..." className="min-h-[200px] text-sm" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Overview tab
// ---------------------------------------------------------------------------

function OverviewTab({ account }: { account: Account }) {
  return (
    <div className="grid grid-cols-2 gap-4 p-6">
      <div className="rounded-lg border p-4 space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Account Profile</h4>
        <Row label="Account ID" value={account.account_id} mono />
        <Row label="Company" value={account.company_name} />
        <Row label="Market" value={account.market} />
        <Row label="Industry" value={account.industry ?? '—'} />
        <Row label="Website" value={account.website ?? '—'} />
        <Row label="Created" value={account.created_at} />
      </div>
      <div className="rounded-lg border p-4 space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ownership & Strategy</h4>
        <Row label="Strategic Tier" value={account.strategic_tier ?? '—'} />
        {account.tier_set_by && <Row label="Tier set by" value={`${account.tier_set_by} on ${account.tier_set_date}`} />}
        <Row label="Named AE" value={account.named_ae ?? '—'} />
        <Row label="Sourcing SDR" value={account.sourcing_sdr ?? '—'} />
        <div className="pt-2 border-t">
          <div className="text-lg font-mono font-semibold" style={{ color: 'var(--pp-color-success-700)' }}>
            S$ {account.pipeline_sgd.toLocaleString('en-SG')}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {account.open_lead_count} open leads &middot; {account.open_deal_count} open deals
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn('font-medium', mono && 'font-mono text-xs')}>{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Contacts tab
// ---------------------------------------------------------------------------

function ContactsTab({ contacts }: { contacts: Contact[] }) {
  const navigate = useNavigate();
  if (contacts.length === 0) {
    return <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">No contacts linked to this account</div>;
  }
  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold mb-3">Contacts ({contacts.length})</h3>
      <Table className="text-xs">
        <TableHeader>
          <TableRow className="border-b bg-muted/30 hover:bg-muted/30">
            <TableHead className="h-8 px-3 py-2 text-left font-medium text-muted-foreground">Contact</TableHead>
            <TableHead className="h-8 px-3 py-2 text-left font-medium text-muted-foreground">Title</TableHead>
            <TableHead className="h-8 px-3 py-2 text-left font-medium text-muted-foreground">DM?</TableHead>
            <TableHead className="h-8 px-3 py-2 text-left font-medium text-muted-foreground">ICP</TableHead>
            <TableHead className="h-8 px-3 py-2 text-left font-medium text-muted-foreground">Lead Status</TableHead>
            <TableHead className="h-8 px-3 py-2 text-left font-medium text-muted-foreground">Email</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.map((c) => (
            <TableRow key={c.contact_id} className="cursor-pointer hover:bg-muted/20 border-b" onClick={() => navigate({ to: '/contacts/$contactId', params: { contactId: c.contact_id } })}>
              <TableCell className="px-3 py-2 font-medium">{c.full_name}</TableCell>
              <TableCell className="px-3 py-2 text-muted-foreground">{c.title_role}</TableCell>
              <TableCell className="px-3 py-2">{c.is_decision_maker ? <Check className="size-4" style={{ color: 'var(--pp-color-success-500)' }} /> : '—'}</TableCell>
              <TableCell className="px-3 py-2">{renderICPStars(c.icp_score ?? null)}</TableCell>
              <TableCell className="px-3 py-2">{c.lead_status ?? <span className="rounded-full px-2 py-0.5 text-[10px]" style={{ background: 'var(--pp-gtm-default-bg)', color: 'var(--pp-gtm-default-text)' }}>No lead</span>}</TableCell>
              <TableCell className="px-3 py-2 font-mono text-[11px]">{c.email}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Leads tab
// ---------------------------------------------------------------------------

function LeadsTab({ leads }: { leads: Lead[] }) {
  const navigate = useNavigate();
  if (leads.length === 0) {
    return <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">No leads for this account</div>;
  }
  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold mb-3">Leads ({leads.length})</h3>
      <Table className="text-xs">
        <TableHeader>
          <TableRow className="border-b bg-muted/30 hover:bg-muted/30">
            <TableHead className="h-8 px-3 py-2 text-left font-medium text-muted-foreground">Lead ID</TableHead>
            <TableHead className="h-8 px-3 py-2 text-left font-medium text-muted-foreground">Contact</TableHead>
            <TableHead className="h-8 px-3 py-2 text-left font-medium text-muted-foreground">Status</TableHead>
            <TableHead className="h-8 px-3 py-2 text-left font-medium text-muted-foreground">GTM</TableHead>
            <TableHead className="h-8 px-3 py-2 text-left font-medium text-muted-foreground">SDR</TableHead>
            <TableHead className="h-8 px-3 py-2 text-right font-medium text-muted-foreground">Attempts</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((l) => (
            <TableRow key={l.lead_id} className="cursor-pointer hover:bg-muted/20 border-b" onClick={() => navigate({ to: '/demand-gen/leads/$leadId', params: { leadId: l.lead_id } })}>
              <TableCell className="px-3 py-2 font-mono text-[11px]" style={{ color: 'var(--pp-color-primary)', textDecoration: 'underline' }}>{l.lead_id}</TableCell>
              <TableCell className="px-3 py-2">{l.contact_name}</TableCell>
              <TableCell className="px-3 py-2">{l.lead_status}</TableCell>
              <TableCell className="px-3 py-2">{l.gtm_motion}</TableCell>
              <TableCell className="px-3 py-2 text-muted-foreground">{l.assigned_sdr}</TableCell>
              <TableCell className="px-3 py-2 text-right font-mono">{l.attempt_count}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Deals tab
// ---------------------------------------------------------------------------

function DealsTab({ deals }: { deals: Deal[] }) {
  const navigate = useNavigate();
  if (deals.length === 0) {
    return <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">No deals for this account</div>;
  }
  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold mb-3">Deals ({deals.length})</h3>
      <Table className="text-xs">
        <TableHeader>
          <TableRow className="border-b bg-muted/30 hover:bg-muted/30">
            <TableHead className="h-8 px-3 py-2 text-left font-medium text-muted-foreground">Deal ID</TableHead>
            <TableHead className="h-8 px-3 py-2 text-left font-medium text-muted-foreground">Opportunity</TableHead>
            <TableHead className="h-8 px-3 py-2 text-left font-medium text-muted-foreground">Stage</TableHead>
            <TableHead className="h-8 px-3 py-2 text-right font-medium text-muted-foreground">SGD Value</TableHead>
            <TableHead className="h-8 px-3 py-2 text-left font-medium text-muted-foreground">Close Date</TableHead>
            <TableHead className="h-8 px-3 py-2 text-left font-medium text-muted-foreground">Seller</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deals.map((d) => (
            <TableRow key={d.id} className="cursor-pointer hover:bg-muted/20 border-b" onClick={() => navigate({ to: '/pipeline/$dealId', params: { dealId: d.deal_id } })}>
              <TableCell className="px-3 py-2 font-mono text-[11px]" style={{ color: 'var(--pp-color-primary)', textDecoration: 'underline' }}>{d.deal_id}</TableCell>
              <TableCell className="px-3 py-2">{d.opportunity_name}</TableCell>
              <TableCell className="px-3 py-2">{d.sales_stage}</TableCell>
              <TableCell className="px-3 py-2 text-right font-mono">S$ {d.deal_value_sgd.toLocaleString('en-SG')}</TableCell>
              <TableCell className="px-3 py-2">{d.close_date}</TableCell>
              <TableCell className="px-3 py-2 text-muted-foreground">{d.seller}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
