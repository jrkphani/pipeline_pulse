import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useTemplates } from '@/hooks/useAdmin';
import { USER_ROLE_LABELS } from '@/types/auth';
import type { TemplateEntry } from '@/types/admin';
import { cn } from '@/lib/utils';

function approvalBadge(approval: TemplateEntry['legal_approval']) {
  if (approval === 'approved') return <Badge variant="secondary" className="bg-green-50 text-green-700 text-[9px]">Approved</Badge>;
  if (approval === 'pending') return <Badge variant="secondary" className="bg-amber-50 text-amber-700 text-[9px]">Pending</Badge>;
  return <Badge variant="secondary" className="bg-red-50 text-red-700 text-[9px]">Required</Badge>;
}

function uploaderBadge(role: TemplateEntry['uploaded_by_role']) {
  if (!role) return <span className="text-muted-foreground">—</span>;
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

export function AdminTemplatesPage() {
  const { data: templates, isLoading } = useTemplates();

  const pendingCount = templates?.filter((t: TemplateEntry) => t.legal_approval === 'pending').length ?? 0;

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  return (
    <div>
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h1 className="text-sm font-medium">Template Library</h1>
          <p className="text-xs text-muted-foreground">
            /admin/templates · Legal approval required for Fixed sections
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
            Sales Ops ✓ + Legal gate
          </Badge>
          <Button size="sm">Upload New Version</Button>
        </div>
      </div>

      {/* Legal warning */}
      {pendingCount > 0 && (
        <div className="mb-3 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-[10px] text-amber-700">
          ⚠ {pendingCount} template{pendingCount > 1 ? 's' : ''} pending Legal approval —
          Proposal & SOW Agent blocked for these solution types until approved.
        </div>
      )}

      {/* Table */}
      <Card className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Template Name</TableHead>
              <TableHead>Solution</TableHead>
              <TableHead>Doc Type</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Uploaded by</TableHead>
              <TableHead>Legal Approval</TableHead>
              <TableHead>Uploaded</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates?.map((t: TemplateEntry) => (
              <TableRow key={t.name} className="cursor-pointer hover:bg-muted/50">
                <TableCell className="font-medium">{t.name}</TableCell>
                <TableCell>{t.solution}</TableCell>
                <TableCell>{t.doc_type}</TableCell>
                <TableCell>{t.version}</TableCell>
                <TableCell>{uploaderBadge(t.uploaded_by_role)}</TableCell>
                <TableCell>{approvalBadge(t.legal_approval)}</TableCell>
                <TableCell className="text-[9px]">{t.uploaded}</TableCell>
                <TableCell>
                  {t.uploaded_by_role ? (
                    <span className="cursor-pointer text-[9px] text-primary">Preview</span>
                  ) : (
                    <span className="text-[9px] text-muted-foreground">Upload first</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
