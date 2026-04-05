import { useState, useRef, useEffect, useCallback } from 'react';
import { Check } from 'lucide-react';
import type { Lead, LeadActivity } from '@/types/leads';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface QuickActivityEntry {
  channel: LeadActivity['channel'];
  outcome: string;
  next_action: string;
  next_action_date: string | null;
}

interface QuickActivityLogOverlayProps {
  lead: Lead;
  anchorRef: React.RefObject<HTMLDivElement | null>;
  onSave: (entry: QuickActivityEntry) => void;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Channel options
// ---------------------------------------------------------------------------

const CHANNELS: LeadActivity['channel'][] = ['Call', 'WhatsApp', 'Email', 'LinkedIn', 'Meeting'];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function QuickActivityLogOverlay({ lead, onSave, onClose }: QuickActivityLogOverlayProps) {
  const [channel, setChannel] = useState<LeadActivity['channel']>('Call');
  const [outcome, setOutcome] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [nextActionDate, setNextActionDate] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const channelRef = useRef<HTMLSelectElement>(null);

  // Auto-focus channel select on mount
  useEffect(() => {
    channelRef.current?.focus();
  }, []);

  // Close on Esc
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    }
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  const handleSave = useCallback(() => {
    if (!outcome.trim()) return;

    const entry: QuickActivityEntry = {
      channel,
      outcome: outcome.trim(),
      next_action: nextAction.trim(),
      next_action_date: nextActionDate || null,
    };

    onSave(entry);
    setShowSuccess(true);
    setTimeout(() => onClose(), 800);
  }, [channel, outcome, nextAction, nextActionDate, onSave, onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && outcome.trim()) {
        e.preventDefault();
        handleSave();
      }
    },
    [outcome, handleSave],
  );

  if (showSuccess) {
    return (
      <div
        className="absolute right-3 top-3 z-50 flex w-[340px] items-center justify-center rounded-lg border bg-background p-4 shadow-lg"
      >
        <span className="inline-flex items-center gap-1 text-sm font-medium text-green-700">Activity logged &middot; {lead.lead_id} &middot; {lead.company_name} <Check className="size-4" /></span>
      </div>
    );
  }

  return (
    <div
      className="absolute right-3 top-3 z-50 w-[340px] rounded-lg border bg-background p-3 shadow-lg"
    >
      {/* Header */}
      <div className="mb-3 flex items-center gap-2">
        <span className="font-mono text-[11px] text-muted-foreground">{lead.lead_id}</span>
        <span className="text-[11px] font-medium truncate">{lead.company_name}</span>
      </div>

      {/* Channel */}
      <div className="mb-2">
        <label className="mb-0.5 block text-[11px] font-medium text-muted-foreground">Channel:</label>
        <select
          ref={channelRef}
          value={channel}
          onChange={(e) => setChannel(e.target.value as LeadActivity['channel'])}
          onKeyDown={handleKeyDown}
          className="h-7 w-full rounded border bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {CHANNELS.map((ch) => (
            <option key={ch} value={ch}>{ch}</option>
          ))}
        </select>
      </div>

      {/* Outcome */}
      <div className="mb-2">
        <label className="mb-0.5 block text-[11px] font-medium text-muted-foreground">Outcome:</label>
        <input
          type="text"
          value={outcome}
          onChange={(e) => setOutcome(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. No answer / Connected — follow up"
          className="h-7 w-full rounded border bg-background px-2 text-xs placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Next Action */}
      <div className="mb-2">
        <label className="mb-0.5 block text-[11px] font-medium text-muted-foreground">Next step:</label>
        <input
          type="text"
          value={nextAction}
          onChange={(e) => setNextAction(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. Try again Wed AM"
          className="h-7 w-full rounded border bg-background px-2 text-xs placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Next Action Date */}
      <div className="mb-3">
        <label className="mb-0.5 block text-[11px] font-medium text-muted-foreground">Date:</label>
        <input
          type="date"
          value={nextActionDate}
          onChange={(e) => setNextActionDate(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-7 w-full rounded border bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Save button */}
      <button
        type="button"
        onClick={handleSave}
        disabled={!outcome.trim()}
        className="h-8 w-full rounded text-xs font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        style={{ background: outcome.trim() ? 'oklch(0.606 0.25 292.717)' : '#999' }}
      >
        Save activity
      </button>

      {/* Keyboard hints */}
      <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
        Esc to cancel &middot; Enter to save
      </p>
    </div>
  );
}
