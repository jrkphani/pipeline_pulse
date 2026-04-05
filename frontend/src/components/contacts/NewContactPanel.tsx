import { useState, useCallback, useMemo } from 'react';
import { X } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Contact } from '@/types/contacts';
import type { LeadMarket } from '@/types/leads';
import { LEAD_MARKETS } from '@/types/leads';
import { CONTACT_DEPARTMENTS } from '@/types/contacts';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface NewContactPanelProps {
  contacts: Contact[];
  onClose: () => void;
  onCreated: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function NewContactPanel({ contacts, onClose, onCreated }: NewContactPanelProps) {
  const [companySearch, setCompanySearch] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [title, setTitle] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [isDm, setIsDm] = useState(false);
  const [market, setMarket] = useState<LeadMarket>('SG');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Unique company names for combobox
  const companies = useMemo(() => {
    const set = new Map<string, { name: string; market: LeadMarket }>();
    for (const c of contacts) {
      const key = `${c.company_name}::${c.market}`;
      if (!set.has(key)) set.set(key, { name: c.company_name, market: c.market });
    }
    return Array.from(set.values());
  }, [contacts]);

  const filteredCompanies = useMemo(() => {
    if (!companySearch) return [];
    const q = companySearch.toLowerCase();
    return companies.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 8);
  }, [companySearch, companies]);

  const createMutation = useMutation({
    mutationFn: (body: Partial<Contact>) => apiClient.post<Contact>('/contacts', body),
    onSuccess: () => onCreated(),
  });

  const handleSave = useCallback(() => {
    if (!email.trim()) return;
    createMutation.mutate({
      company_name: selectedCompany ?? companySearch,
      first_name: firstName,
      last_name: lastName,
      full_name: `${firstName} ${lastName}`.trim(),
      title_role: title,
      email: email.trim(),
      phone: phone || null,
      department: department || null,
      is_decision_maker: isDm,
      market,
    });
  }, [selectedCompany, companySearch, firstName, lastName, title, email, phone, department, isDm, market, createMutation]);

  return (
    <div className="flex w-[440px] shrink-0 flex-col border-l bg-background">
      <div className="flex h-10 items-center justify-between border-b px-4">
        <span className="text-sm font-semibold">New Contact</span>
        <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="size-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Company (searchable combobox) */}
        <div className="relative">
          <label className="mb-0.5 block text-[11px] font-medium text-muted-foreground">Company *</label>
          <Input
            value={selectedCompany ?? companySearch}
            onChange={(e) => {
              setCompanySearch(e.target.value);
              setSelectedCompany(null);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="Search or type new company"
            className="h-8 text-xs"
          />
          {showSuggestions && filteredCompanies.length > 0 && (
            <div className="absolute z-50 mt-1 w-full rounded border bg-background shadow-lg max-h-40 overflow-y-auto">
              {filteredCompanies.map((c) => (
                <button
                  key={`${c.name}::${c.market}`}
                  type="button"
                  className="block w-full px-3 py-1.5 text-left text-xs hover:bg-muted/50"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setSelectedCompany(c.name);
                    setCompanySearch(c.name);
                    setMarket(c.market);
                    setShowSuggestions(false);
                  }}
                >
                  {c.name} <span className="text-muted-foreground">({c.market})</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-0.5 block text-[11px] font-medium text-muted-foreground">First Name</label>
            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="h-8 text-xs" />
          </div>
          <div>
            <label className="mb-0.5 block text-[11px] font-medium text-muted-foreground">Last Name</label>
            <Input value={lastName} onChange={(e) => setLastName(e.target.value)} className="h-8 text-xs" />
          </div>
        </div>

        <div>
          <label className="mb-0.5 block text-[11px] font-medium text-muted-foreground">Title</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-8 text-xs" />
        </div>

        <div>
          <label className="mb-0.5 block text-[11px] font-medium text-muted-foreground">Email *</label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-8 text-xs" />
        </div>

        <div>
          <label className="mb-0.5 block text-[11px] font-medium text-muted-foreground">Phone</label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-8 text-xs" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-0.5 block text-[11px] font-medium text-muted-foreground">Department</label>
            <select value={department} onChange={(e) => setDepartment(e.target.value)} className="h-8 w-full rounded border bg-background px-2 text-xs">
              <option value="">—</option>
              {CONTACT_DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-0.5 block text-[11px] font-medium text-muted-foreground">Market</label>
            <select value={market} onChange={(e) => setMarket(e.target.value as LeadMarket)} className="h-8 w-full rounded border bg-background px-2 text-xs">
              {LEAD_MARKETS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        <label className="flex items-center gap-2 text-xs">
          <input type="checkbox" checked={isDm} onChange={(e) => setIsDm(e.target.checked)} className="rounded" />
          Decision Maker
        </label>
      </div>

      <div className="border-t p-4">
        <Button className="w-full" size="sm" onClick={handleSave} disabled={!email.trim() || createMutation.isPending}>
          {createMutation.isPending ? 'Saving...' : 'Save Contact'}
        </Button>
      </div>
    </div>
  );
}
