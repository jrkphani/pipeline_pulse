import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import type { DealDetail, DealDetailOverview } from '@/types/deal-detail';
import type { Country } from '@/types/index';

interface DealEditPanelProps {
  open: boolean;
  deal: DealDetail;
  onClose: () => void;
  onSave: (patch: Partial<DealDetailOverview>) => Promise<void>;
}

const INPUT_CLASS =
  'w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-[11px] focus:outline-none focus:ring-1 focus:ring-ring';

const COUNTRIES: Country[] = ['SG', 'PH', 'MY', 'ID', 'IN'];

export function DealEditPanel({ open, deal, onClose, onSave }: DealEditPanelProps) {
  const [form, setForm] = useState<Partial<DealDetailOverview>>(() => ({ ...deal.overview }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when panel opens with new deal
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose();
    } else {
      setForm({ ...deal.overview });
      setError(null);
      setSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save — check your connection and try again');
    } finally {
      setSaving(false);
    }
  };

  const set = <K extends keyof DealDetailOverview>(key: K, value: DealDetailOverview[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-[360px] sm:max-w-[360px] flex flex-col">
        <SheetHeader>
          <SheetTitle className="text-sm">Edit opportunity</SheetTitle>
          <SheetDescription className="font-mono text-[10px]">{deal.deal_id}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 space-y-3">
          {/* Opportunity name */}
          <Field label="Opportunity name">
            <input
              type="text"
              className={INPUT_CLASS}
              value={form.opportunity_name ?? ''}
              onChange={(e) => set('opportunity_name', e.target.value)}
            />
          </Field>

          {/* Deal value + Close date */}
          <div className="grid grid-cols-2 gap-2">
            <Field label="Deal value SGD">
              <input
                type="number"
                className={`${INPUT_CLASS} font-mono`}
                value={form.deal_value_sgd ?? ''}
                onChange={(e) => set('deal_value_sgd', Number(e.target.value))}
              />
            </Field>
            <Field label="Close date">
              <input
                type="date"
                className={INPUT_CLASS}
                value={form.close_date ?? ''}
                onChange={(e) => set('close_date', e.target.value)}
              />
            </Field>
          </div>

          {/* Seller + Country */}
          <div className="grid grid-cols-2 gap-2">
            <Field label="Seller">
              <input
                type="text"
                className={INPUT_CLASS}
                value={form.seller ?? ''}
                onChange={(e) => set('seller', e.target.value)}
              />
            </Field>
            <Field label="Country">
              <select
                className={INPUT_CLASS}
                value={form.country ?? 'SG'}
                onChange={(e) => set('country', e.target.value as Country)}
              >
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>
          </div>

          {/* GTM motion */}
          <Field label="GTM motion">
            <input
              type="text"
              className={INPUT_CLASS}
              value={form.gtm_motion ?? ''}
              onChange={(e) => set('gtm_motion', e.target.value)}
            />
          </Field>

          {/* Funding type + Program */}
          <div className="grid grid-cols-2 gap-2">
            <Field label="Funding type">
              <input
                type="text"
                className={INPUT_CLASS}
                value={form.funding_type ?? ''}
                onChange={(e) => set('funding_type', e.target.value)}
              />
            </Field>
            <Field label="Program">
              <input
                type="text"
                className={INPUT_CLASS}
                value={form.program ?? ''}
                onChange={(e) => set('program', e.target.value)}
              />
            </Field>
          </div>

          {/* Lead source + ACE ID */}
          <div className="grid grid-cols-2 gap-2">
            <Field label="Lead source">
              <input
                type="text"
                className={INPUT_CLASS}
                value={form.lead_source ?? ''}
                onChange={(e) => set('lead_source', e.target.value)}
              />
            </Field>
            <Field
              label="ACE ID"
              hint="AWS Partner Central opportunity ID. Find it in APN Partner Central under your linked deal."
            >
              <input
                type="text"
                className={`${INPUT_CLASS} font-mono`}
                placeholder="e.g. ACE-12345"
                value={form.ace_id ?? ''}
                onChange={(e) => set('ace_id', e.target.value)}
              />
            </Field>
          </div>

          {/* Read-only notice */}
          <div className="rounded-md bg-muted/50 px-3 py-2 text-[9.5px] text-muted-foreground leading-relaxed">
            AI fields, presales bands, timeline and Q tree are system-managed — not editable here.
          </div>
        </div>

        <SheetFooter className="flex-row items-center gap-2">
          {error && (
            <span className="flex-1 text-[10px] text-red-600">{error}</span>
          )}
          <SheetClose asChild>
            <button
              type="button"
              className="px-3 py-1.5 text-[11px] rounded-md bg-muted text-foreground border"
            >
              Cancel
            </button>
          </SheetClose>
          <button
            type="button"
            className="px-3 py-1.5 text-[11px] rounded-md bg-foreground text-background font-medium hover:opacity-90 disabled:opacity-50"
            disabled={saving}
            onClick={handleSave}
          >
            {saving ? 'Saving\u2026' : 'Save changes'}
          </button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[9px] uppercase tracking-wider text-muted-foreground mb-1">
        {label}
      </span>
      {children}
      {hint && (
        <span className="mt-0.5 block text-[9px] text-muted-foreground/70 leading-tight">{hint}</span>
      )}
    </label>
  );
}
