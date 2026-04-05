import { useCallback, useMemo, useRef, useState } from 'react';
import { AgGridReact } from '@ag-grid-community/react';
import { ClientSideRowModelModule } from 'ag-grid-community';
import type {
  ColDef,
  GridReadyEvent,
  CellValueChangedEvent,
  SelectionChangedEvent,
} from '@ag-grid-community/core';
import { Download } from 'lucide-react';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import '@/lib/ag-grid/pp-theme.css';

import type { Lead } from '@/types/leads';
import {
  LeadIdCellRenderer,
  ICPStarRenderer,
  NTICPSignalRenderer,
  CompanyContactCellRenderer,
  GTMMotionBadgeRenderer,
} from '@/lib/ag-grid/lead-cell-renderers';
import { Button } from '@/components/ui/button';
import { exportLeadsToXlsx } from '@/lib/xlsx/lead-export';
import { toast } from '@/components/ui/use-toast';

// ---------------------------------------------------------------------------
// AE / PC mock options
// ---------------------------------------------------------------------------

const AE_OPTIONS = ['Tracy T.', 'Sarah Chen', 'Mike Loh', 'Deepak R.'];
const PC_OPTIONS = ['Jason W.', 'Priya M.', 'Alvin T.', 'Ravi Kumar'];

// ---------------------------------------------------------------------------
// Local state for assignments (not persisted to lead model)
// ---------------------------------------------------------------------------

interface GraduationRow extends Lead {
  ae_assigned: string | null;
  pc_assigned: string | null;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface GraduationQueueGridProps {
  leads: Lead[];
  onApprove: (vars: { leadId: string; ae_assigned: string; pc_assigned: string }) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function GraduationQueueGrid({ leads, onApprove }: GraduationQueueGridProps) {
  const gridRef = useRef<AgGridReact<GraduationRow>>(null);
  const [, setSelectedRows] = useState<GraduationRow[]>([]);

  const rowData = useMemo<GraduationRow[]>(
    () => leads.map((l) => ({ ...l, ae_assigned: null, pc_assigned: null })),
    [leads],
  );

  const [localRows, setLocalRows] = useState<GraduationRow[]>(rowData);

  // Sync when leads prop changes
  useMemo(() => {
    setLocalRows(rowData);
  }, [rowData]);

  // Column defs
  const columnDefs = useMemo<ColDef<GraduationRow>[]>(() => [
    {
      headerCheckboxSelection: true,
      checkboxSelection: true,
      width: 40,
      maxWidth: 40,
      editable: false,
      sortable: false,
      filter: false,
      resizable: false,
    },
    {
      field: 'lead_id',
      headerName: 'Lead ID',
      width: 78,
      cellRenderer: LeadIdCellRenderer,
      editable: false,
    },
    {
      field: 'company_name',
      headerName: 'Company · Contact',
      width: 155,
      cellRenderer: CompanyContactCellRenderer,
      editable: false,
    },
    {
      field: 'gtm_motion',
      headerName: 'GTM · SDR',
      width: 110,
      cellRenderer: (params: { data: GraduationRow | undefined }) => {
        if (!params.data) return null;
        return (
          <div style={{ lineHeight: '1.3' }}>
            <div><GTMMotionBadgeRenderer {...params as never} /></div>
            <div style={{ fontSize: 'var(--pp-font-size-xs)', color: 'var(--pp-color-muted)', marginTop: '1px' }}>
              {params.data.assigned_sdr}
            </div>
          </div>
        );
      },
      editable: false,
    },
    {
      field: 'icp_score',
      headerName: 'ICP ★',
      width: 65,
      cellRenderer: ICPStarRenderer,
      editable: false,
    },
    {
      headerName: 'N·T·I',
      width: 58,
      cellRenderer: NTICPSignalRenderer,
      editable: false,
      sortable: false,
      filter: false,
      valueGetter: () => null,
    },
    {
      field: 'ae_assigned',
      headerName: 'AE Assigned',
      width: 130,
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: { values: AE_OPTIONS },
      cellStyle: (params) => ({
        display: 'flex',
        alignItems: 'center',
        borderLeft: params.value ? '2px solid var(--pp-lead-seg-4)' : '2px solid transparent',
      }),
    },
    {
      field: 'pc_assigned',
      headerName: 'PC Assigned',
      width: 130,
      editable: true,
      cellEditor: 'agSelectCellEditor',
      cellEditorParams: { values: PC_OPTIONS },
      cellStyle: (params) => ({
        display: 'flex',
        alignItems: 'center',
        borderLeft: params.value ? '2px solid var(--pp-lead-seg-4)' : '2px solid transparent',
      }),
    },
    {
      headerName: 'Action',
      width: 110,
      editable: false,
      sortable: false,
      filter: false,
      cellRenderer: (params: { data: GraduationRow | undefined }) => {
        const row = params.data;
        if (!row) return null;
        const canApprove = row.ae_assigned && row.pc_assigned;
        const hint = !row.ae_assigned
          ? 'Assign AE first'
          : !row.pc_assigned
            ? 'Assign PC first'
            : '';

        if (!canApprove) {
          return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '1px' }}>
              <button
                disabled
                style={{
                  padding: '2px 10px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  background: 'var(--pp-color-neutral-100)',
                  color: 'var(--pp-color-neutral-400)',
                  border: 'none',
                  cursor: 'not-allowed',
                }}
              >
                Approve MQL
              </button>
              <span style={{ fontSize: '9px', color: 'var(--pp-color-warning-700)' }}>{hint}</span>
            </div>
          );
        }

        return (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onApprove({
                leadId: row.lead_id,
                ae_assigned: row.ae_assigned!,
                pc_assigned: row.pc_assigned!,
              });
            }}
            style={{
              padding: '2px 10px',
              borderRadius: '4px',
              fontSize: '11px',
              background: 'var(--pp-lead-seg-3)',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Approve MQL
          </button>
        );
      },
    },
  ], [onApprove]);

  const defaultColDef = useMemo<ColDef<GraduationRow>>(
    () => ({
      resizable: true,
      sortable: true,
      filter: true,
      singleClickEdit: false,
      stopEditingWhenCellsLoseFocus: true,
      cellStyle: { display: 'flex', alignItems: 'center' },
    }),
    [],
  );

  const onGridReady = useCallback((event: GridReadyEvent<GraduationRow>) => {
    event.api.sizeColumnsToFit();
  }, []);

  const onCellValueChanged = useCallback(
    (event: CellValueChangedEvent<GraduationRow>) => {
      if (!event.data) return;
      setLocalRows((prev) =>
        prev.map((r) =>
          r.lead_id === event.data!.lead_id
            ? { ...r, [event.colDef.field!]: event.newValue }
            : r,
        ),
      );
    },
    [],
  );

  const onSelectionChanged = useCallback((event: SelectionChangedEvent<GraduationRow>) => {
    setSelectedRows(event.api.getSelectedRows());
  }, []);

  const getRowStyle = useCallback((params: { data: GraduationRow | undefined }) => {
    if (!params.data) return undefined;
    if (params.data.ae_assigned && params.data.pc_assigned) {
      return { borderLeft: '2px solid var(--pp-lead-seg-4)' };
    }
    if (params.data.ae_assigned || params.data.pc_assigned) {
      return { borderLeft: '2px solid var(--pp-lead-seg-2)' };
    }
    return undefined;
  }, []);

  const handleExport = useCallback(() => {
    exportLeadsToXlsx(localRows, 'graduation-queue');
    toast({ description: `Exported ${localRows.length} leads to Excel` });
  }, [localRows]);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      {/* Context banner */}
      <div className="flex h-9 items-center gap-3 border-b px-4"
        style={{ background: 'var(--pp-accent-bg)', borderColor: 'var(--pp-accent-muted)' }}
      >
        <span className="text-xs font-medium" style={{ color: 'var(--pp-accent-text)' }}>
          Auto-filter: MQL Ready = Yes �� MQL Approved = null
        </span>
        <span className="text-xs" style={{ color: 'var(--pp-accent-text)', opacity: 0.6 }}>
          Assign AE + PC, then approve to create Deal ID
        </span>
      </div>

      {/* Toolbar */}
      <div className="flex h-9 items-center gap-2 border-b px-3">
        <span className="text-xs text-muted-foreground">
          {localRows.length} leads awaiting assignment
        </span>

        <div className="flex-1" />

        <Button variant="outline" size="sm" className="h-6 gap-1 text-xs" onClick={handleExport}>
          <Download className="size-3" />
          Export
        </Button>
      </div>

      {/* Grid */}
      <div className="ag-theme-alpine ag-theme-pp relative w-full flex-1">
        <AgGridReact<GraduationRow>
          ref={gridRef}
          modules={[ClientSideRowModelModule]}
          rowData={localRows}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          rowHeight={44}
          headerHeight={36}
          rowSelection="multiple"
          suppressRowClickSelection
          onGridReady={onGridReady}
          onCellValueChanged={onCellValueChanged}
          onSelectionChanged={onSelectionChanged}
          getRowStyle={getRowStyle}
          getRowId={(params) => params.data.lead_id}
          animateRows
          suppressPaginationPanel
        />
      </div>
    </div>
  );
}
