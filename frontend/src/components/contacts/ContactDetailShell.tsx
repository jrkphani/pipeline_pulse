import { useState, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ChevronLeft, User, Target, PenLine } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Contact } from '@/types/contacts';
import { Textarea } from '@/components/ui/textarea';
import { renderICPStars } from '@/lib/ag-grid/lead-cell-renderers';

// ---------------------------------------------------------------------------
// Tab types
// ---------------------------------------------------------------------------

type ContactTab = 'overview' | 'lead' | 'notes';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ContactDetailShellProps {
  contact: Contact;
  onBack: () => void;
  onUpdate?: (updates: Partial<Contact>) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ContactDetailShell({ contact, onBack, onUpdate }: ContactDetailShellProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ContactTab>('overview');
  const [notes, setNotes] = useState(contact.notes ?? '');

  const hasLead = contact.lead_id != null;

  const tabs: { id: ContactTab; label: string; icon: typeof User; show: boolean }[] = [
    { id: 'overview', label: 'Overview', icon: User, show: true },
    { id: 'lead', label: 'Lead', icon: Target, show: hasLead },
    { id: 'notes', label: 'Notes', icon: PenLine, show: true },
  ];

  const handleNotesBlur = useCallback(() => {
    onUpdate?.({ notes: notes || null });
  }, [notes, onUpdate]);

  // ICP stars
  const icpStars = contact.icp_score
    ? '\u2605'.repeat(contact.icp_score) + '\u2606'.repeat(5 - contact.icp_score)
    : null;

  // Lead status colors
  const statusColors: Record<string, { bg: string; text: string }> = {
    Contacted: { bg: '#FAECE7', text: '#712B13' },
    Engaged: { bg: '#FAEEDA', text: '#633806' },
    'MQL Ready': { bg: '#EEEDFE', text: '#3C3489' },
    Graduated: { bg: '#EAF3DE', text: '#27500A' },
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex h-12 shrink-0 items-center gap-3 border-b bg-muted/20 px-4">
        <button type="button" onClick={onBack} className="flex items-center text-muted-foreground hover:text-foreground">
          <ChevronLeft className="size-4" />
        </button>

        {/* Avatar */}
        <div className="flex size-8 items-center justify-center rounded-full text-xs font-semibold" style={{ background: 'oklch(0.606 0.25 292.717 / 0.15)', color: 'oklch(0.606 0.25 292.717)' }}>
          {contact.first_name?.[0]}{contact.last_name?.[0]}
        </div>

        <span className="text-sm font-semibold">{contact.full_name}</span>
        <span className="text-sm text-muted-foreground">{contact.title_role}</span>

        <button
          type="button"
          onClick={() => navigate({ to: '/accounts/$accountId', params: { accountId: contact.account_id } })}
          className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
        >
          {contact.company_name}
        </button>

        <div className="flex-1" />

        {icpStars && <span className="text-sm" style={{ color: 'var(--pp-color-warning-500)', letterSpacing: '-1px' }}>{icpStars}</span>}

        {contact.lead_status && (() => {
          const c = statusColors[contact.lead_status] ?? { bg: '#F1EFE8', text: '#5F5E5A' };
          return (
            <span className="rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ backgroundColor: c.bg, color: c.text }}>
              {contact.lead_status}
            </span>
          );
        })()}
      </div>

      {/* Body */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Vertical tabs */}
        <div className="flex w-12 shrink-0 flex-col items-center gap-1 border-r bg-muted/10 py-3">
          {tabs.filter((t) => t.show).map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                title={tab.label}
                className={cn(
                  'flex size-9 items-center justify-center rounded-md transition-colors',
                  isActive ? 'bg-[#EEEDFE] text-[#3C3489]' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                )}
              >
                <tab.icon className="size-4" />
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-w-0">
          {activeTab === 'overview' && <OverviewTab contact={contact} />}
          {activeTab === 'lead' && hasLead && (
            <div className="p-6">
              <h3 className="text-sm font-semibold mb-3">Linked Lead</h3>
              <div className="rounded-lg border p-4 space-y-3">
                <Row label="Lead ID" value={contact.lead_id!} mono />
                <Row label="Status" value={contact.lead_status ?? '—'} />
                <Row label="ICP Score" value={contact.icp_score ? `${contact.icp_score}/5` : '—'} />
                <button
                  type="button"
                  onClick={() => navigate({ to: '/demand-gen/leads/$leadId', params: { leadId: contact.lead_id! } })}
                  className="text-xs text-primary underline underline-offset-2"
                >
                  View full lead detail
                </button>
              </div>
            </div>
          )}
          {activeTab === 'notes' && (
            <div className="p-6">
              <h3 className="text-sm font-semibold mb-3">Notes</h3>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={handleNotesBlur} placeholder="Contact notes..." className="min-h-[200px] text-sm" />
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

function OverviewTab({ contact }: { contact: Contact }) {
  const navigate = useNavigate();
  return (
    <div className="grid grid-cols-2 gap-4 p-6">
      <div className="rounded-lg border p-4 space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contact Details</h4>
        <Row label="Full Name" value={contact.full_name} />
        <Row label="Title" value={contact.title_role} />
        <Row label="Department" value={contact.department ?? '—'} />
        <Row label="Email" value={contact.email} />
        <Row label="Phone" value={contact.phone ?? '—'} />
        <Row label="Decision Maker" value={contact.is_decision_maker ? 'Yes' : 'No'} />
      </div>
      <div className="rounded-lg border p-4 space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Account & Lead</h4>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Company</span>
          <button
            type="button"
            onClick={() => navigate({ to: '/accounts/$accountId', params: { accountId: contact.account_id } })}
            className="font-medium text-primary underline underline-offset-2"
          >
            {contact.company_name}
          </button>
        </div>
        <Row label="Market" value={contact.market} />
        {contact.lead_id ? (
          <>
            <Row label="Lead ID" value={contact.lead_id} mono />
            <Row label="Lead Status" value={contact.lead_status ?? '—'} />
            <Row label="ICP Score" value={renderICPStars(contact.icp_score ?? null)} />
          </>
        ) : (
          <div className="pt-2">
            <span className="rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ background: 'var(--pp-gtm-default-bg)', color: 'var(--pp-gtm-default-text)' }}>No linked lead</span>
          </div>
        )}
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
