import { useCallback, useMemo, useRef, useState } from 'react';
import { AgGridReact } from '@ag-grid-community/react';
import { ClientSideRowModelModule } from 'ag-grid-community';
import type { GridReadyEvent, SelectionChangedEvent, RowClassParams, ColDef, ColGroupDef, CellValueChangedEvent, GridApi } from '@ag-grid-community/core';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import '@/lib/ag-grid/pp-theme.css';

import {
  defaultColDef,
  pipelineColumnDefs,
  allianceColumnDefs,
  financeColumnDefs,
  GROUP_FIELD_MAP,
} from '@/lib/ag-grid/column-defs';
import type { ColumnGroupId } from '@/lib/ag-grid/column-defs';
import { getGridConfig, toGridRole } from '@/lib/ag-grid/role-config';
import type { Deal, PipelineStats, UserRole, FilterState } from '@/types/index';
import { EMPTY_FILTER_STATE } from '@/types/index';
import { useUserRole } from '@/stores/index';
import { exportDealsToXlsx } from '@/lib/xlsx/export';
import { toast } from '@/components/ui/use-toast';
import { useInlineNewDeal, NewDealHintBar, NewDealSaveBar, NewDealAIPill } from './inline-new-deal';
import { REQUIRED_FIELDS } from './inline-new-deal/new-deal.types';
import {
  StatsBar,
  StructuralToolbar,
  FilterToolbar,
  BulkEditBar,
  WorkbookTabs,
  ReadOnlyBanner,
  buildInitialGroupVisibility,
  DENSITY_CONFIG,
  GROUP_PILLS,
} from './toolbars';
import type { RowDensity } from './toolbars';

// ---------------------------------------------------------------------------
// Props & types
// ---------------------------------------------------------------------------

export type PipelineTab = 'pipeline' | 'closed' | 'alliance';

export interface PipelineGridProps {
  deals: Deal[];
  stats: PipelineStats;
  activeTab: PipelineTab;
  userRole?: UserRole;
  onRowClick?: (deal: Deal) => void;
  onSelectionChange?: (selected: Deal[]) => void;
  onTabChange?: (tab: PipelineTab) => void;
}

// ---------------------------------------------------------------------------
// PipelineGrid — main component
// ---------------------------------------------------------------------------

export function PipelineGrid({
  deals,
  stats,
  activeTab,
  userRole: userRoleOverride,
  onRowClick,
  onSelectionChange,
  onTabChange,
}: PipelineGridProps) {
  const gridRef = useRef<AgGridReact<Deal>>(null);
  const gridWrapperRef = useRef<HTMLDivElement>(null);
  const [selectedRows, setSelectedRows] = useState<Deal[]>([]);
  const newDeal = useInlineNewDeal(gridRef);

  // ---- Density state ----
  const [density, setDensity] = useState<RowDensity>('comfortable');

  const handleSetDensity = useCallback((d: RowDensity) => {
    setDensity(d);
    setTimeout(() => gridRef.current?.api?.resetRowHeights(), 0);
  }, []);

  // ---- Group visibility state ----
  const [groupVisibility, setGroupVisibility] = useState<Record<ColumnGroupId, boolean>>(
    buildInitialGroupVisibility,
  );

  const toggleGroup = useCallback(
    (groupId: ColumnGroupId) => {
      setGroupVisibility((prev) => {
        const next = { ...prev, [groupId]: !prev[groupId] };
        const fields = GROUP_FIELD_MAP[groupId];
        const api: GridApi<Deal> | undefined = gridRef.current?.api;
        if (api && fields) {
          api.setColumnsVisible(fields, next[groupId]);
        }
        return next;
      });
    },
    [],
  );

  // Role
  const storeRole = useUserRole();
  const role: UserRole = userRoleOverride ?? (storeRole ? toGridRole(storeRole) : 'ae');
  const config = useMemo(() => getGridConfig(role), [role]);

  // ---- Filter state ----
  const [filterState, setFilterState] = useState<FilterState>(EMPTY_FILTER_STATE);

  // ---- Reactive row data (with filters applied) ----
  const filteredRowData = useMemo(() => {
    let rows = activeTab === 'alliance'
      ? deals.filter((d) => d.funding_flag === 'AWS Funded')
      : deals;

    const { stages, sellers, gtmMotions, fundingFlags } = filterState;
    if (stages.length)       rows = rows.filter((d) => stages.includes(d.sales_stage));
    if (sellers.length)      rows = rows.filter((d) => sellers.includes(d.seller));
    if (gtmMotions.length)   rows = rows.filter((d) => gtmMotions.includes(d.gtm_motion));
    if (fundingFlags.length) rows = rows.filter((d) => fundingFlags.includes(d.funding_flag));

    return rows;
  }, [deals, activeTab, filterState]);

  // ---- Reactive column defs ----
  const columnDefs = useMemo<(ColDef<Deal> | ColGroupDef<Deal>)[]>(() => {
    if (config.columnSet === 'finance') return financeColumnDefs;
    if (activeTab === 'alliance') return allianceColumnDefs;
    return pipelineColumnDefs;
  }, [activeTab, config.columnSet]);

  const effectiveDefaultColDef = useMemo(() => {
    if (config.isReadOnly) return { ...defaultColDef, editable: false };
    return defaultColDef;
  }, [config.isReadOnly]);

  // ---- Row styling ----
  const getRowStyle = useCallback(
    (params: RowClassParams<Deal>) => {
      if (activeTab === 'alliance' && params.data && params.data.ace_id == null) {
        return { borderLeft: '3px solid var(--pp-health-amber, #f59e0b)' };
      }
      return undefined;
    },
    [activeTab],
  );

  const mergedGetRowClass = useCallback(
    (params: RowClassParams<Deal>): string | undefined => newDeal.getRowClass(params),
    [newDeal],
  );

  // ---- Event handlers ----
  const onCellValueChanged = useCallback(
    (event: CellValueChangedEvent<Deal>) => newDeal.handleCellValueChanged(event),
    [newDeal],
  );

  const onGridReady = useCallback((event: GridReadyEvent<Deal>) => {
    event.api.sizeColumnsToFit();
    for (const pill of GROUP_PILLS) {
      if (!pill.defaultVisible) {
        const fields = GROUP_FIELD_MAP[pill.id];
        if (fields) event.api.setColumnsVisible(fields, false);
      }
    }
  }, []);

  const onSelectionChanged = useCallback(
    (event: SelectionChangedEvent<Deal>) => {
      const rows = event.api.getSelectedRows();
      setSelectedRows(rows);
      onSelectionChange?.(rows);
    },
    [onSelectionChange],
  );

  const handleRowClicked = useCallback(
    (event: { data: Deal | undefined }) => {
      if (!config.isReadOnly && event.data) onRowClick?.(event.data);
    },
    [config.isReadOnly, onRowClick],
  );

  const clearSelection = useCallback(() => {
    gridRef.current?.api?.deselectAll();
    setSelectedRows([]);
  }, []);

  // ---- Export ----
  const handleExportAll = useCallback(() => {
    exportDealsToXlsx(filteredRowData);
    toast({ description: `Exported ${filteredRowData.length} deals to Excel` });
  }, [filteredRowData]);

  const handleExportSelected = useCallback(() => {
    const data = selectedRows.length > 0 ? selectedRows : filteredRowData;
    exportDealsToXlsx(data);
    toast({ description: `Exported ${data.length} deals to Excel` });
  }, [selectedRows, filteredRowData]);

  const showBulkBar = config.showBulkToolbar && selectedRows.length > 0;
  const showStructuralToolbar = activeTab === 'pipeline' && !config.isReadOnly;

  return (
    <div
      className="flex h-full flex-col overflow-hidden bg-background"
      style={{ '--rh': `${DENSITY_CONFIG[density].rowHeight}px` } as React.CSSProperties}
    >
      <StatsBar stats={stats} deals={filteredRowData} activeTab={activeTab} userRole={role} />

      {showStructuralToolbar && (
        <StructuralToolbar
          groupVisibility={groupVisibility}
          onToggleGroup={toggleGroup}
          density={density}
          onSetDensity={handleSetDensity}
        />
      )}

      <FilterToolbar
        totalCount={deals.length}
        filteredCount={filteredRowData.length}
        showNewDealButton={config.showNewDealButton && !newDeal.isActive}
        isFinance={config.isReadOnly}
        onNewDeal={newDeal.startNewDeal}
        onExport={handleExportAll}
        deals={deals}
        filterState={filterState}
        onFilterChange={setFilterState}
      />

      <NewDealHintBar visible={newDeal.isActive} />
      {config.isReadOnly && <ReadOnlyBanner />}

      {showBulkBar && (
        <BulkEditBar
          selectedCount={selectedRows.length}
          onClear={clearSelection}
          onExport={handleExportSelected}
        />
      )}

      <div className="ag-theme-alpine ag-theme-pp relative w-full flex-1" ref={gridWrapperRef}>
        <AgGridReact<Deal>
          ref={gridRef}
          modules={[ClientSideRowModelModule]}
          rowData={filteredRowData}
          columnDefs={columnDefs}
          defaultColDef={effectiveDefaultColDef}
          rowHeight={DENSITY_CONFIG[density].rowHeight}
          headerHeight={36}
          rowSelection={config.isReadOnly ? undefined : 'multiple'}
          suppressRowClickSelection={config.isReadOnly}
          onGridReady={onGridReady}
          onRowClicked={handleRowClicked}
          onSelectionChanged={onSelectionChanged}
          onCellValueChanged={onCellValueChanged}
          onCellKeyDown={newDeal.onCellKeyDown}
          getRowStyle={getRowStyle}
          getRowClass={mergedGetRowClass}
          pinnedBottomRowData={newDeal.pinnedBottomRowData}
          tabToNextCell={newDeal.isActive ? newDeal.tabToNextCell : undefined}
          animateRows
          suppressPaginationPanel
          undoRedoCellEditing={!config.isReadOnly}
          undoRedoCellEditingLimit={20}
          suppressCellFocus={config.isReadOnly}
          statusBar={{
            statusPanels: [
              { statusPanel: 'agTotalAndFilteredRowCountComponent', align: 'left' },
              { statusPanel: 'agSelectedRowCountComponent', align: 'left' },
              { statusPanel: 'agAggregationComponent', align: 'right' },
            ],
          }}
        />

        <NewDealAIPill
          visible={newDeal.phase === 'ai-suggesting'}
          suggestions={newDeal.aiSuggestions ?? []}
          accountName={newDeal.aiAccountName ?? ''}
          priorDeals={newDeal.aiPriorDeals}
          gridWrapperRef={gridWrapperRef}
          onAcceptAll={newDeal.acceptAISuggestions}
          onDismiss={newDeal.dismissAISuggestions}
        />
      </div>

      <NewDealSaveBar
        visible={newDeal.isActive}
        canSave={newDeal.canSave}
        missingCount={REQUIRED_FIELDS.filter((f) => {
          const val = newDeal.pinnedBottomRowData[0]?.[f];
          if (typeof val === 'number') return val <= 0;
          return !val;
        }).length}
        onSave={newDeal.saveNewDeal}
        onDiscard={newDeal.discardNewDeal}
      />

      <WorkbookTabs activeTab={activeTab} onTabChange={onTabChange} userRole={role} />
    </div>
  );
}
