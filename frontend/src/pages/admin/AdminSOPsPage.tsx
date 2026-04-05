import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useSOPs } from '@/hooks/useAdmin';
import { USER_ROLE_LABELS } from '@/types/auth';
import type { SOPEntry } from '@/types/admin';
import { cn } from '@/lib/utils';

function statusBadge(status: SOPEntry['status']) {
  if (status === 'active') return <Badge variant="secondary" className="bg-green-50 text-green-700 text-[9px]">Active</Badge>;
  if (status === 'draft') return <Badge variant="secondary" className="bg-amber-50 text-amber-700 text-[9px]">Draft</Badge>;
  return <Badge variant="secondary" className="text-[9px]">Not started</Badge>;
}

function roleBadge(role: SOPEntry['editor_role']) {
  if (!role) return <span className="text-[9px] text-muted-foreground">—</span>;
  const colors: Record<string, string> = {
    sales_ops: 'bg-emerald-50 text-emerald-700',
    admin: 'bg-red-50 text-red-700',
  };
  return (
    <Badge variant="secondary" className={cn('text-[8px]', colors[role] ?? '')}>
      {USER_ROLE_LABELS[role] ?? role}
    </Badge>
  );
}

export function AdminSOPsPage() {
  const { data: sops, isLoading } = useSOPs();
  const [selected, setSelected] = useState<SOPEntry | null>(null);
  const [editTab, setEditTab] = useState<'edit' | 'preview' | 'diff'>('edit');

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  return (
    <div>
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h1 className="text-sm font-medium">SOP Registry</h1>
          <p className="text-xs text-muted-foreground">
            /admin/sops · {sops?.length ?? 0} SOP files · S3: pipeline-pulse-sops
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
            Sales Ops ✓ direct
          </Badge>
          <Button variant="outline" size="sm">Audit Log</Button>
          <Button size="sm">Edit Selected</Button>
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agent</TableHead>
              <TableHead>File</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Last Edited</TableHead>
              <TableHead>Editor</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sops?.map((sop: SOPEntry) => (
              <TableRow
                key={sop.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => setSelected(sop)}
              >
                <TableCell className="font-medium">{sop.agent}</TableCell>
                <TableCell className="text-[9px] text-muted-foreground">{sop.file}</TableCell>
                <TableCell>{sop.version}</TableCell>
                <TableCell className="text-[9px]">{sop.last_edited}</TableCell>
                <TableCell className="text-[9px]">{roleBadge(sop.editor_role)}</TableCell>
                <TableCell className="text-[9px]">{sop.editor_name}</TableCell>
                <TableCell>{statusBadge(sop.status)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* SOP Edit Sheet */}
      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="w-[400px] sm:max-w-[400px]" onOpenAutoFocus={(e) => e.preventDefault()}>
          <SheetHeader>
            <SheetTitle className="text-xs">{selected?.file}</SheetTitle>
            <p className="text-[9px] text-muted-foreground">
              {selected?.version} · {selected?.status} · {selected?.last_edited} · edited by {selected?.editor_name}
            </p>
          </SheetHeader>

          {/* Edit/Preview/Diff tabs */}
          <div className="mt-3 flex gap-1.5 border-b pb-2">
            {(['edit', 'preview', 'diff'] as const).map((tab) => (
              <span
                key={tab}
                className={cn(
                  'cursor-pointer rounded px-2 py-1 text-[9px] capitalize',
                  editTab === tab ? 'bg-primary text-white' : 'border text-muted-foreground',
                )}
                onClick={() => setEditTab(tab)}
              >
                {tab}
              </span>
            ))}
          </div>

          {/* Info banner */}
          <div className="mt-3 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-[9px] text-emerald-700">
            Sales Ops can save & publish directly — no approval required for SOPs.
          </div>

          {/* Content */}
          <Textarea
            className="mt-3 h-40 font-mono text-[10px] leading-relaxed"
            defaultValue={selected?.content ?? '# SOP Content\n\nNo content yet.'}
          />

          {/* Audit log */}
          {selected?.audit_log && selected.audit_log.length > 0 && (
            <div className="mt-4">
              <div className="mb-1.5 text-[9px] font-medium text-muted-foreground">Audit log</div>
              {selected.audit_log.map((entry, i) => (
                <div
                  key={i}
                  className="flex gap-1.5 border-b py-1 text-[9px] last:border-0"
                >
                  <span className="min-w-[80px] text-muted-foreground">{entry.timestamp}</span>
                  {roleBadge(entry.role)}
                  <span className="ml-1">{entry.action}</span>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="mt-4 flex gap-2">
            <Button size="sm">Save & Publish</Button>
            <Button variant="outline" size="sm" onClick={() => setSelected(null)}>
              Discard
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
