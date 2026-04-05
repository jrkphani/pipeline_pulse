import { useState, useCallback, useRef } from 'react';
import { X, Upload } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { parseLeadsFromBuffer } from '@/lib/xlsx/import';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Lead } from '@/types/leads';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface LeadImportPanelProps {
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LeadImportPanel({ onClose }: LeadImportPanelProps) {
  const [parsedLeads, setParsedLeads] = useState<Partial<Lead>[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  const importMutation = useMutation({
    mutationFn: (leads: Partial<Lead>[]) =>
      apiClient.post<{ imported: number; skipped: number; errors: string[] }>('/leads/import', { leads }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['leads'] });
      toast({ description: `Imported ${data.imported} leads${data.skipped > 0 ? `, skipped ${data.skipped} duplicates` : ''}` });
      onClose();
    },
    onError: (err: unknown) => {
      const detail = (err as { body?: { detail?: string } })?.body?.detail;
      toast({
        description: detail ?? 'Import failed — check your file format and try again',
        variant: 'destructive',
      });
    },
  });

  const handleFile = useCallback((file: File) => {
    setParseError(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const buffer = e.target?.result as ArrayBuffer;
      const result = parseLeadsFromBuffer(buffer);
      if (result.error) {
        setParseError(result.error);
      } else {
        setParsedLeads(result.leads);
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const missingRequired = parsedLeads.filter(
    (l) => !l.company_name || !l.contact_name || !l.email,
  ).length;

  return (
    <div className="flex w-[520px] shrink-0 flex-col border-l bg-background">
      {/* Header */}
      <div className="flex h-10 items-center justify-between border-b px-4">
        <span className="text-sm font-semibold">Import Leads</span>
        <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="size-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* Step 1: File drop zone */}
        {parsedLeads.length === 0 && (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors hover:border-primary/50 hover:bg-muted/20"
          >
            <Upload className="mb-2 size-8 text-muted-foreground" />
            <p className="text-sm font-medium">Drop Excel file here, or click to browse</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Accepts .xlsx or .csv. Required columns: Company, Contact, Email, Country, GTM Motion.
            </p>
            {fileName && <p className="mt-2 text-xs font-mono text-primary">{fileName}</p>}
            {parseError && <p className="mt-2 text-xs text-red-500">{parseError}</p>}
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.csv"
              onChange={handleFileInput}
              className="hidden"
            />
          </div>
        )}

        {/* Step 2: Preview table */}
        {parsedLeads.length > 0 && (
          <>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-medium">{parsedLeads.length} leads parsed from {fileName}</span>
              <button
                type="button"
                onClick={() => { setParsedLeads([]); setFileName(null); }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            </div>

            {missingRequired > 0 && (
              <div className="mb-3 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                {missingRequired} row{missingRequired !== 1 ? 's' : ''} missing required fields (company, contact, or email)
              </div>
            )}

            <div className="overflow-auto rounded border">
              <Table className="text-xs">
                <TableHeader>
                  <TableRow className="border-b bg-muted/30 hover:bg-muted/30">
                    <TableHead className="h-8 px-2 py-1.5 text-left font-medium">Lead ID</TableHead>
                    <TableHead className="h-8 px-2 py-1.5 text-left font-medium">Company</TableHead>
                    <TableHead className="h-8 px-2 py-1.5 text-left font-medium">Contact</TableHead>
                    <TableHead className="h-8 px-2 py-1.5 text-left font-medium">Country</TableHead>
                    <TableHead className="h-8 px-2 py-1.5 text-left font-medium">GTM</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedLeads.slice(0, 10).map((lead, i) => (
                    <TableRow key={i} className="border-b last:border-0 hover:bg-muted/20">
                      <TableCell className="px-2 py-1.5 font-mono">{lead.lead_id ?? '(auto)'}</TableCell>
                      <TableCell className="px-2 py-1.5 max-w-[120px] truncate">{lead.company_name ?? ''}</TableCell>
                      <TableCell className="px-2 py-1.5 max-w-[100px] truncate">{lead.contact_name ?? ''}</TableCell>
                      <TableCell className="px-2 py-1.5">{lead.country ?? '—'}</TableCell>
                      <TableCell className="px-2 py-1.5 max-w-[100px] truncate">{lead.gtm_motion ?? '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {parsedLeads.length > 10 && (
                <div className="px-2 py-1.5 text-xs text-muted-foreground border-t">
                  ...and {parsedLeads.length - 10} more
                </div>
              )}
            </div>

            {/* Step 3: Import button */}
            <Button
              className="mt-4 w-full"
              size="sm"
              disabled={parsedLeads.length === 0 || importMutation.isPending}
              onClick={() => importMutation.mutate(parsedLeads)}
            >
              {importMutation.isPending
                ? 'Importing...'
                : `Import ${parsedLeads.length} lead${parsedLeads.length !== 1 ? 's' : ''}`}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
