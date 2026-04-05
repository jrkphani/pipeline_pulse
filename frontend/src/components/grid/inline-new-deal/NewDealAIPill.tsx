import { useEffect, useRef, useState } from 'react';
import type { AISuggestion } from './new-deal.types';

interface NewDealAIPillProps {
  visible: boolean;
  suggestions: AISuggestion[];
  accountName: string;
  priorDeals: number;
  gridWrapperRef: React.RefObject<HTMLDivElement | null>;
  onAcceptAll: () => void;
  onDismiss: () => void;
}

export function NewDealAIPill({
  visible,
  suggestions,
  accountName,
  priorDeals,
  gridWrapperRef,
  onAcceptAll,
  onDismiss,
}: NewDealAIPillProps) {
  const pillRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 36 });

  useEffect(() => {
    if (!visible || !gridWrapperRef.current) return;

    const wrapper = gridWrapperRef.current;
    const pinnedRow = wrapper.querySelector('.ag-floating-bottom .ag-row');
    if (!pinnedRow) return;

    const wrapperRect = wrapper.getBoundingClientRect();
    const rowRect = pinnedRow.getBoundingClientRect();
    setPosition({
      top: rowRect.bottom - wrapperRect.top + 2,
      left: 36,
    });
  }, [visible, gridWrapperRef]);

  if (!visible || suggestions.length === 0) return null;

  return (
    <div
      ref={pillRef}
      className="absolute z-10 min-w-[240px] rounded-md border p-2.5 shadow-md"
      style={{
        top: position.top,
        left: position.left,
        background: 'var(--background, #fff)',
        borderColor: 'var(--pp-accent-border)',
      }}
    >
      {/* Header */}
      <div
        className="mb-1.5 flex items-center gap-1 text-[10px] font-medium"
        style={{ color: 'var(--pp-accent-text)' }}
      >
        <span className="font-semibold">AI</span>
        <span>Field Inference Agent &mdash; suggestions from account history</span>
      </div>

      {/* Suggestions */}
      {suggestions.map((sug, i) => (
        <div
          key={sug.field}
          className="flex items-center gap-2 py-1"
          style={{ borderTop: i > 0 ? '1px solid var(--border, #e5e5e5)' : 'none' }}
        >
          <span className="w-[70px] shrink-0 text-[10px] text-muted-foreground">
            {sug.label}
          </span>
          <span className="text-[11px] font-medium">{sug.value}</span>
          {i === 0 && (
            <button
              onClick={onAcceptAll}
              className="ml-auto rounded px-1.5 py-0.5 text-[9px] font-medium text-white"
              style={{ background: 'var(--pp-accent-border)' }}
            >
              Accept all
            </button>
          )}
        </div>
      ))}

      {/* Footer */}
      <div className="mt-1.5 text-[9px] text-muted-foreground">
        Based on {priorDeals} prior deal{priorDeals !== 1 ? 's' : ''} with {accountName} &middot; Tab to continue
      </div>

      {/* Dismiss */}
      <button
        onClick={onDismiss}
        className="absolute right-1.5 top-1.5 text-[10px] text-muted-foreground hover:text-foreground"
        aria-label="Dismiss suggestions"
      >
        &times;
      </button>
    </div>
  );
}
