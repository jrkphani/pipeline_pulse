import { useEffect, useRef } from 'react';

// ---------------------------------------------------------------------------
// useSequentialShortcuts
//
// Handles two-key leader sequences (e.g. "G then P", "N then D") that cannot
// be expressed as a single keydown event.
//
// Spec: WF17 §6.6
//   G P  → Go to Pipeline
//   G D  → Go to Dashboard
//   N D  → New Deal (trigger inline new-deal row)
//
// How it works:
//   1. First keydown matches a leader key  → enter "pending" state, start timer
//   2. Second keydown within TIMEOUT_MS   → fire the associated handler
//   3. Any other key or timeout expiry    → cancel pending state silently
//
// Sequences are intentionally NOT fired when focus is inside an input,
// select, or textarea — matching the same guard as useGlobalShortcuts.
// ---------------------------------------------------------------------------

const TIMEOUT_MS = 800;

export interface SequentialShortcut {
  /** Two-character sequence, e.g. 'gp', 'gd', 'nd' (case-insensitive) */
  sequence: string;
  handler: () => void;
}

export function useSequentialShortcuts(shortcuts: SequentialShortcut[]) {
  // Pending leader key (lowercase single char), or null if not in sequence
  const pendingLeader = useRef<string | null>(null);
  const timeoutId = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (shortcuts.length === 0) return;

    // All unique leader keys derived from registered sequences
    const leaderKeys = new Set(shortcuts.map((s) => s.sequence[0].toLowerCase()));

    function clearPending() {
      if (timeoutId.current !== null) {
        clearTimeout(timeoutId.current);
        timeoutId.current = null;
      }
      pendingLeader.current = null;
    }

    function onKeyDown(e: KeyboardEvent) {
      // Never fire inside an editable element
      const tag = (e.target as HTMLElement)?.tagName;
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(tag)) {
        clearPending();
        return;
      }

      // Ignore modified keys (Cmd/Ctrl shortcuts handled by useGlobalShortcuts)
      if (e.metaKey || e.ctrlKey || e.altKey) {
        clearPending();
        return;
      }

      const key = e.key.toLowerCase();

      if (pendingLeader.current !== null) {
        // Phase 2: check if this key completes a sequence
        const candidate = pendingLeader.current + key;
        const match = shortcuts.find((s) => s.sequence.toLowerCase() === candidate);

        clearPending();

        if (match) {
          e.preventDefault();
          match.handler();
        }
        // If no match, silently discard — don't preventDefault so normal
        // typing still works (e.g. user typed 'g' then 'o' in search)
        return;
      }

      // Phase 1: check if this is a leader key
      if (leaderKeys.has(key)) {
        // Only capture if there's actually a registered sequence starting here
        const hasSequence = shortcuts.some((s) => s.sequence[0].toLowerCase() === key);
        if (!hasSequence) return;

        e.preventDefault();
        pendingLeader.current = key;

        // Auto-expire the pending state
        timeoutId.current = setTimeout(clearPending, TIMEOUT_MS);
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      clearPending();
    };
  }, [shortcuts]);
}
