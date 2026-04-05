import { useState } from 'react';
import { CheckCircle2, Lock, AlertTriangle } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import type { DealDetail } from '@/types/deal-detail';

interface DealActionPanelProps {
  open: boolean;
  deal: DealDetail;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

const ACTION_DESCRIPTIONS: Record<string, string> = {
  'Schedule discovery':
    'This will log a discovery scheduling request and notify the assigned presales consultant.',
  'Advance to Order Book':
    'Moving to Order Book confirms FR has been raised and commercial terms agreed. This action is logged in the timeline.',
  'Raise invoice':
    'This triggers the O2R revenue flow. Finance will be notified to raise the invoice against the PO.',
};

const formatSGD = (v: number) =>
  new Intl.NumberFormat('en-SG', { maximumFractionDigits: 0 }).format(v);

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

export function DealActionPanel({ open, deal, onClose, onConfirm }: DealActionPanelProps) {
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setDone(false);
      setError(null);
      onClose();
    }
  };

  const handleConfirm = async () => {
    setConfirming(true);
    setError(null);
    try {
      await onConfirm();
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setConfirming(false);
    }
  };

  const isProposal = deal.action_label === 'Submit proposal';
  const sf = deal.solution_fit;
  const blocked = isProposal && !sf.can_generate_proposal;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-[360px] sm:max-w-[360px] flex flex-col">
        <SheetHeader>
          <SheetTitle className="text-sm">{deal.action_label}</SheetTitle>
          <SheetDescription className="font-mono text-[10px]">{deal.deal_id}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 space-y-3">
          {done ? (
            <SuccessState actionLabel={deal.action_label} onClose={onClose} />
          ) : isProposal ? (
            <ProposalMode deal={deal} blocked={blocked} />
          ) : (
            <GenericMode deal={deal} />
          )}
        </div>

        {!done && (
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
              className={cn(
                'px-3 py-1.5 text-[11px] rounded-md font-medium',
                blocked
                  ? 'bg-muted text-muted-foreground cursor-not-allowed'
                  : 'bg-foreground text-background hover:opacity-90',
              )}
              disabled={blocked || confirming}
              onClick={handleConfirm}
            >
              {confirming ? 'Confirming\u2026' : `Confirm \u2014 ${deal.action_label}`}
            </button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// Mode A — Success
// ---------------------------------------------------------------------------

function SuccessState({ actionLabel, onClose }: { actionLabel: string; onClose: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-3">
      <CheckCircle2 className="h-8 w-8 text-emerald-500" />
      <p className="text-sm font-medium">Action recorded</p>
      <p className="text-[11px] text-muted-foreground text-center">
        &ldquo;{actionLabel}&rdquo; has been logged to the timeline.
      </p>
      <button
        type="button"
        className="mt-2 px-4 py-1.5 text-[11px] rounded-md border bg-muted text-foreground hover:bg-background transition-colors"
        onClick={onClose}
      >
        Close
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mode B — Proposal
// ---------------------------------------------------------------------------

function ProposalMode({ deal, blocked }: { deal: DealDetail; blocked: boolean }) {
  const sf = deal.solution_fit;

  const badgeColor =
    sf.score >= 80
      ? 'bg-emerald-100 text-emerald-800'
      : sf.score >= 50
        ? 'bg-amber-100 text-amber-800'
        : 'bg-red-100 text-red-800';

  const barColor =
    sf.score >= 80 ? 'bg-emerald-500' : sf.score >= 50 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <>
      {blocked && sf.blocked_reason && (
        <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] text-amber-800">
          <Lock className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>{sf.blocked_reason}</span>
        </div>
      )}

      {/* Solution Fit card */}
      <div className="rounded-md border px-3 py-2.5 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-medium text-muted-foreground">Solution Fit</span>
          <span className={cn('rounded-full px-2 py-0.5 text-[9px] font-medium', badgeColor)}>
            {sf.fit_label}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all', barColor)}
            style={{ width: `${sf.score}%` }}
          />
        </div>

        {/* 2x2 stats */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
          <StatPair label="Signals confirmed" value={`${sf.signals_confirmed}/${sf.signals_total}`} />
          <StatPair label="Q tree completion" value={`${sf.qtree_completion_pct}%`} />
          <StatPair label="Primary area" value={sf.primary_area} />
          <StatPair label="Stage" value={deal.stage_label} />
        </div>
      </div>

      {deal.is_stalled && (
        <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[10px] text-red-800">
          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>
            This opportunity has been stalled for {deal.days_in_stage} days. Resolve the blocker
            before submitting.
          </span>
        </div>
      )}

      <p className="text-[9.5px] text-muted-foreground">
        Submitting a proposal will generate a document from Solution Fit data and notify the AE for
        customer delivery.
      </p>
    </>
  );
}

// ---------------------------------------------------------------------------
// Mode C — Generic
// ---------------------------------------------------------------------------

function GenericMode({ deal }: { deal: DealDetail }) {
  const desc =
    ACTION_DESCRIPTIONS[deal.action_label] ??
    `This will log action \u201c${deal.action_label}\u201d against the opportunity.`;

  return (
    <>
      {/* Summary card */}
      <div className="rounded-md border px-3 py-2.5">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
          <StatPair label="Stage" value={deal.stage_label} />
          <StatPair label="Days in stage" value={String(deal.days_in_stage)} />
          <StatPair label="Seller" value={deal.overview.seller} />
          <StatPair label="Close date" value={formatDate(deal.overview.close_date)} />
        </div>
      </div>

      {deal.is_stalled && (
        <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] text-amber-800">
          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>
            This opportunity has been stalled for {deal.days_in_stage} days.
          </span>
        </div>
      )}

      <p className="text-[11px] text-muted-foreground">{desc}</p>
    </>
  );
}

// ---------------------------------------------------------------------------
// Shared
// ---------------------------------------------------------------------------

function StatPair({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-muted-foreground">{label}: </span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
