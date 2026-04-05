import { useCallback, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AgGridReact } from '@ag-grid-community/react';
import type { CellKeyDownEvent, CellPosition, TabToNextCellParams, RowClassParams } from '@ag-grid-community/core';

import { apiClient } from '@/lib/api-client';
import { toast } from '@/components/ui/use-toast';
import type { Deal } from '@/types/index';
import type { NewDealRow, NewDealPhase, AISuggestion, NewDealDraft } from './new-deal.types';
import { REQUIRED_FIELDS, TAB_FIELD_ORDER } from './new-deal.types';
import { inferFields } from '@/lib/inference/fieldInference';

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface UseInlineNewDealReturn {
  phase: NewDealPhase;
  isActive: boolean;
  canSave: boolean;
  draftDealValue: number;
  validationErrors: Set<string>;
  aiSuggestions: AISuggestion[] | null;
  aiAccountName: string | null;
  aiPriorDeals: number;
  pinnedBottomRowData: NewDealRow[];
  startNewDeal: () => void;
  discardNewDeal: () => void;
  saveNewDeal: () => void;
  acceptAISuggestions: () => void;
  dismissAISuggestions: () => void;
  handleCellValueChanged: (event: { data: Deal | undefined; colDef: { field?: string }; newValue: unknown; node: { rowPinned?: string | null } }) => void;
  onCellKeyDown: (event: CellKeyDownEvent<Deal>) => void;
  tabToNextCell: (params: TabToNextCellParams<Deal>) => CellPosition | null;
  getRowClass: (params: RowClassParams<Deal>) => string | undefined;
}

export function useInlineNewDeal(
  gridRef: React.RefObject<AgGridReact<Deal> | null>,
): UseInlineNewDealReturn {
  const [phase, setPhase] = useState<NewDealPhase>('idle');
  const [draft, setDraft] = useState<NewDealRow | null>(null);
  const [aiSuggestions, setAISuggestions] = useState<AISuggestion[] | null>(null);
  const [aiAccountName, setAIAccountName] = useState<string | null>(null);
  const [aiPriorDeals, setAIPriorDeals] = useState(0);
  const [validationErrors, setValidationErrors] = useState<Set<string>>(new Set());
  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const queryClient = useQueryClient();

  // ---- Derived state ----
  const isActive = phase !== 'idle';
  const draftDealValue = (draft?.deal_value_usd ?? 0) * 1.348; // approx SGD

  const canSave = isActive && REQUIRED_FIELDS.every((f) => {
    const val = draft?.[f];
    if (typeof val === 'number') return val > 0;
    return val != null && val !== '';
  });

  // ---- Mutation ----
  const createMutation = useMutation({
    mutationFn: async (draftData: Partial<NewDealDraft>) =>
      apiClient.post<{ deal: Deal }>('/deals', draftData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      toast({
        description: `Deal created \u00b7 ${data.deal.deal_id} \u00b7 ${data.deal.account_name}`,
      });
      resetState();
    },
    onError: () => {
      toast({ description: 'Failed to create deal. Please try again.', variant: 'destructive' });
      setPhase('ready');
    },
  });

  // ---- State management ----
  function resetState() {
    setPhase('idle');
    setDraft(null);
    setAISuggestions(null);
    setAIAccountName(null);
    setAIPriorDeals(0);
    setValidationErrors(new Set());
    if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
  }

  const startNewDeal = useCallback(() => {
    const newRow: NewDealRow = {
      __isNewRow: true,
      id: `draft-${Date.now()}`,
      deal_id: '',
      account_name: '',
      opportunity_name: '',
      country: 'SG',
      seller: '',
      seller_email: '',
      funding_flag: 'Customer Funded',
      gtm_motion: '' as Deal['gtm_motion'],
      deal_value_usd: undefined as unknown as number,
      deal_value_sgd: undefined as unknown as number,
      sales_stage: 'New Hunt',
      days_in_stage: 0,
      close_date: '',
    };
    setDraft(newRow);
    setPhase('editing');
    setValidationErrors(new Set());

    // Start editing the first cell after AG Grid renders the pinned row
    setTimeout(() => {
      gridRef.current?.api?.startEditingCell({
        rowIndex: 0,
        colKey: 'account_name',
        rowPinned: 'bottom',
      });
    }, 50);
  }, [gridRef]);

  const discardNewDeal = useCallback(() => {
    gridRef.current?.api?.stopEditing(true);
    resetState();
  }, [gridRef]);

  const saveNewDeal = useCallback(() => {
    if (!draft) return;

    // Validate required fields
    const errors = new Set<string>();
    for (const field of REQUIRED_FIELDS) {
      const val = draft[field];
      if (val == null || val === '' || (typeof val === 'number' && val <= 0)) {
        errors.add(field);
      }
    }
    if (errors.size > 0) {
      setValidationErrors(errors);
      return;
    }

    gridRef.current?.api?.stopEditing(false);
    setPhase('saving');
    createMutation.mutate({
      account_name: draft.account_name ?? '',
      opportunity_name: draft.opportunity_name ?? '',
      country: draft.country ?? 'SG',
      seller: draft.seller ?? '',
      seller_email: draft.seller_email ?? '',
      funding_flag: draft.funding_flag ?? 'Customer Funded',
      gtm_motion: draft.gtm_motion ?? 'Agentic AI',
      deal_value_usd: draft.deal_value_usd ?? 0,
      close_date: draft.close_date ?? '',
      sales_stage: draft.sales_stage ?? 'New Hunt',
    });
  }, [draft, gridRef, createMutation]);

  const acceptAISuggestions = useCallback(() => {
    if (!aiSuggestions || !draft) return;

    const updates: Partial<Deal> = {};
    for (const sug of aiSuggestions) {
      (updates as Record<string, unknown>)[sug.field] = sug.value;
    }

    const updatedDraft = { ...draft, ...updates };
    setDraft(updatedDraft);
    setAISuggestions(null);
    setPhase('editing');

    // Refresh grid pinned row to show updated values
    setTimeout(() => {
      gridRef.current?.api?.refreshCells({ force: true, rowNodes: [] });
    }, 0);
  }, [aiSuggestions, draft, gridRef]);

  const dismissAISuggestions = useCallback(() => {
    setAISuggestions(null);
    setPhase('editing');
  }, []);

  // ---- Cell value changed handler ----
  const handleCellValueChanged = useCallback(
    (event: { data: Deal | undefined; colDef: { field?: string }; newValue: unknown; node: { rowPinned?: string | null } }) => {
      if (event.node.rowPinned !== 'bottom' || !draft) return;

      const field = event.colDef.field;
      if (!field) return;

      const updatedDraft = { ...draft, [field]: event.newValue };

      // Update SGD value when USD changes
      if (field === 'deal_value_usd' && typeof event.newValue === 'number') {
        updatedDraft.deal_value_sgd = Math.round(event.newValue * 1.348);
      }

      setDraft(updatedDraft);

      // Clear validation error for this field
      if (validationErrors.has(field)) {
        const next = new Set(validationErrors);
        next.delete(field);
        setValidationErrors(next);
      }

      // Trigger AI suggestion after account_name is filled (300ms debounce)
      if (field === 'account_name' && typeof event.newValue === 'string' && event.newValue.length >= 2) {
        if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
        aiTimerRef.current = setTimeout(() => {
          const match = inferFields(event.newValue as string);
          if (match) {
            setAISuggestions(match.suggestions);
            setAIAccountName(event.newValue as string);
            setAIPriorDeals(match.priorDeals);
            setPhase('ai-suggesting');
          }
        }, 300);
      }
    },
    [draft, validationErrors],
  );

  // ---- Keyboard handler ----
  const onCellKeyDown = useCallback(
    (event: CellKeyDownEvent<Deal>) => {
      if (event.node.rowPinned !== 'bottom') return;

      const key = (event.event as KeyboardEvent | undefined)?.key;
      if (key === 'Enter' && !event.node.isRowPinned) return;

      if (key === 'Enter') {
        event.event?.preventDefault();
        // Stop current cell edit first, then save
        gridRef.current?.api?.stopEditing(false);
        setTimeout(() => saveNewDeal(), 0);
      } else if (key === 'Escape') {
        event.event?.preventDefault();
        discardNewDeal();
      }
    },
    [gridRef, saveNewDeal, discardNewDeal],
  );

  // ---- Tab navigation: constrain to editable fields in pinned row ----
  const tabToNextCell = useCallback(
    (params: TabToNextCellParams<Deal>): CellPosition | null => {
      // Only intercept when editing the pinned bottom row
      if (!isActive) return params.nextCellPosition;
      if (params.previousCellPosition?.rowPinned !== 'bottom') return params.nextCellPosition;

      const currentField = params.previousCellPosition?.column?.getId?.() ?? '';
      const currentIdx = TAB_FIELD_ORDER.indexOf(currentField);

      if (currentIdx === -1) return params.nextCellPosition;

      const nextIdx = params.backwards
        ? Math.max(0, currentIdx - 1)
        : Math.min(TAB_FIELD_ORDER.length - 1, currentIdx + 1);

      const nextField = TAB_FIELD_ORDER[nextIdx];
      if (!nextField) return params.nextCellPosition;

      const column = gridRef.current?.api?.getColumn(nextField);
      if (!column) return params.nextCellPosition;

      return {
        rowIndex: 0,
        rowPinned: 'bottom',
        column,
      } as CellPosition;
    },
    [isActive, gridRef],
  );

  // ---- Row class for styling ----
  const getRowClass = useCallback(
    (params: RowClassParams<Deal>): string | undefined => {
      const data = params.data as NewDealRow | Deal | undefined;
      if (data && '__isNewRow' in data && data.__isNewRow) {
        return 'pp-new-deal-row';
      }
      return undefined;
    },
    [],
  );

  // ---- Pinned row data ----
  const pinnedBottomRowData: NewDealRow[] = draft ? [draft] : [];

  return {
    phase,
    isActive,
    canSave,
    draftDealValue,
    validationErrors,
    aiSuggestions,
    aiAccountName,
    aiPriorDeals,
    pinnedBottomRowData,
    startNewDeal,
    discardNewDeal,
    saveNewDeal,
    acceptAISuggestions,
    dismissAISuggestions,
    handleCellValueChanged,
    onCellKeyDown,
    tabToNextCell,
    getRowClass,
  };
}
