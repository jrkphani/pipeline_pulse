import { useCallback, useRef, useState } from 'react';
import type { AgGridReact } from '@ag-grid-community/react';
import type { Lead } from '@/types/leads';

// ---------------------------------------------------------------------------
// Required fields for a new lead
// ---------------------------------------------------------------------------

const REQUIRED_LEAD_FIELDS: (keyof Lead)[] = [
  'company_name',
  'contact_name',
  'country',
  'gtm_motion',
  'assigned_sdr',
];

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface UseInlineNewLeadReturn {
  isActive: boolean;
  draft: Partial<Lead>;
  canSave: boolean;
  missingCount: number;
  pinnedBottomRowData: Partial<Lead>[];
  startNewLead: () => void;
  discardNewLead: () => void;
  saveNewLead: () => void;
  onCellValueChangedInPinned: (field: keyof Lead, value: unknown) => void;
}

export function useInlineNewLead(
  gridRef: React.RefObject<AgGridReact<Lead> | null>,
  onSave: (draft: Partial<Lead>) => void,
): UseInlineNewLeadReturn {
  const [isActive, setIsActive] = useState(false);
  const [draft, setDraft] = useState<Partial<Lead>>({});

  const draftRef = useRef(draft);
  draftRef.current = draft;

  const startNewLead = useCallback(() => {
    setDraft({});
    setIsActive(true);
    setTimeout(() => {
      gridRef.current?.api?.startEditingCell({
        rowIndex: 0,
        colKey: 'company_name',
        rowPinned: 'bottom',
      });
    }, 50);
  }, [gridRef]);

  const discardNewLead = useCallback(() => {
    setIsActive(false);
    setDraft({});
    gridRef.current?.api?.stopEditing(true);
  }, [gridRef]);

  const saveNewLead = useCallback(() => {
    const current = draftRef.current;
    const missing = REQUIRED_LEAD_FIELDS.filter((f) => !current[f]);
    if (missing.length > 0) return;
    onSave(current);
    setIsActive(false);
    setDraft({});
  }, [onSave]);

  const canSave = REQUIRED_LEAD_FIELDS.every((f) => Boolean(draft[f]));
  const missingCount = REQUIRED_LEAD_FIELDS.filter((f) => !draft[f]).length;

  const pinnedBottomRowData: Partial<Lead>[] = isActive ? [draft] : [];

  const onCellValueChangedInPinned = useCallback(
    (field: keyof Lead, value: unknown) => {
      setDraft((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  return {
    isActive,
    draft,
    canSave,
    missingCount,
    pinnedBottomRowData,
    startNewLead,
    discardNewLead,
    saveNewLead,
    onCellValueChangedInPinned,
  };
}
