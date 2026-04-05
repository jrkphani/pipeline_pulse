import { Badge } from '@/components/ui/badge';
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
import { useDocAI } from '@/hooks/useAdmin';
import type { DocAIField } from '@/types/admin';

export function AdminDocAIPage() {
  const { data: fields, isLoading } = useDocAI();

  if (isLoading) {
    return (
      <div>
        <PageHeader />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader />

      <Card className="p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Doc Type</TableHead>
              <TableHead>Field</TableHead>
              <TableHead>Acceptance %</TableHead>
              <TableHead>Samples</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Floor %</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(fields ?? []).map((f: DocAIField) => (
              <TableRow key={`${f.doc_type}-${f.field}`}>
                <TableCell className="font-medium">{f.doc_type}</TableCell>
                <TableCell>{f.field}</TableCell>
                <TableCell className="tabular-nums">{f.acceptance_pct}%</TableCell>
                <TableCell className="tabular-nums">{f.samples}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      f.status === 'ok'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-red-50 text-red-700 border-red-200'
                    }
                  >
                    {f.status === 'ok' ? 'OK' : 'Below floor'}
                  </Badge>
                </TableCell>
                <TableCell className="tabular-nums">{f.floor_pct}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <p className="mt-3 text-[10px] text-muted-foreground">
          Fields below acceptance floor will trigger a retrain recommendation.
        </p>
      </Card>
    </div>
  );
}

function PageHeader() {
  return (
    <div className="mb-3 flex items-start justify-between">
      <div>
        <h1 className="text-sm font-medium">Doc AI Monitor</h1>
        <p className="text-xs text-muted-foreground">
          /admin/doc-ai &middot; Acceptance floor: 85%
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
          Sales Ops ✓
        </Badge>
      </div>
    </div>
  );
}
