import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { DealDetail, DealDetailTab, DealDetailOverview } from '@/types/deal-detail';
import { apiClient } from '@/lib/api-client';
import { DealStickyHeader } from './DealStickyHeader';
import { DualTrackCompact } from './DualTrackCompact';
import { RaciRow } from './RaciRow';
import { DealTabNav } from './DealTabNav';
import { TabPlaceholder } from './TabPlaceholder';
import { TabOverview } from './tabs/TabOverview';
import { TabTimeline } from './tabs/TabTimeline';
import { TabQTree } from './tabs/TabQTree';
import { TabSolutionFit } from './tabs/TabSolutionFit';
import { DealEditPanel } from './DealEditPanel';
import { DealActionPanel } from './DealActionPanel';

interface DealDetailShellProps {
  deal: DealDetail;
  onBack: () => void;
}

/**
 * DealDetailShell — layout orchestrator for the deal detail page.
 *
 * Structure:
 *   Sticky zone (header + dual track + RACI)
 *   Body (vertical tab nav | tab content)
 */
export function DealDetailShell({ deal, onBack }: DealDetailShellProps) {
  const [activeTab, setActiveTab] = useState<DealDetailTab>('overview');
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [actionOpen, setActionOpen] = useState(false);

  const editMutation = useMutation({
    mutationFn: (patch: Partial<DealDetailOverview>) =>
      apiClient.patch<DealDetail>(`/deals/${deal.deal_id}`, patch),
    onSuccess: (updated) => {
      queryClient.setQueryData(['deal-detail', deal.deal_id], updated);
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });

  const actionMutation = useMutation({
    mutationFn: () =>
      apiClient.post<{ ok: boolean }>(`/deals/${deal.deal_id}/actions`, {
        action_label: deal.action_label,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal-detail', deal.deal_id] });
    },
  });

  const handleEdit = useCallback(() => setEditOpen(true), []);
  const handleAction = useCallback(() => setActionOpen(true), []);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Sticky zone */}
      <div className="shrink-0">
        <DealStickyHeader deal={deal} onBack={onBack} onEdit={handleEdit} onAction={handleAction} />
        <DualTrackCompact
          dualTrack={deal.dual_track}
          presalesBands={deal.presales_bands}
        />
        <RaciRow members={deal.raci} actions={deal.raci_actions} />
      </div>

      {/* Body: tab nav + content */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <DealTabNav
          deal={deal}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Tab content area */}
        <div className="flex-1 overflow-y-auto min-w-0">
          <TabContent deal={deal} activeTab={activeTab} />
        </div>
      </div>

      <DealEditPanel
        open={editOpen}
        deal={deal}
        onClose={() => setEditOpen(false)}
        onSave={(patch) => editMutation.mutateAsync(patch)}
      />
      <DealActionPanel
        open={actionOpen}
        deal={deal}
        onClose={() => setActionOpen(false)}
        onConfirm={() => actionMutation.mutateAsync()}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab content router
// ---------------------------------------------------------------------------

function TabContent({ deal, activeTab }: { deal: DealDetail; activeTab: DealDetailTab }) {
  switch (activeTab) {
    case 'overview':
      return <TabOverview overview={deal.overview} aiFields={deal.ai_fields} />;

    case 'timeline':
      return <TabTimeline events={deal.timeline} />;

    case 'qtree':
      return <TabQTree groups={deal.qtree_groups} />;

    case 'solution-fit':
      return <TabSolutionFit solutionFit={deal.solution_fit} />;

    default: {
      // Remaining tabs use placeholder
      const placeholder = deal.placeholder_tabs[activeTab];
      if (placeholder) {
        return <TabPlaceholder tab={placeholder} />;
      }
      return (
        <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">
          {activeTab}
        </div>
      );
    }
  }
}
