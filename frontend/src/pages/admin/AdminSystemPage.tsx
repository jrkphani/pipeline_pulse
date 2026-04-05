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
import { useSystemHealth } from '@/hooks/useAdmin';
import type { QueueStatus, PerformanceMetric } from '@/types/admin';

const STATUS_COLORS: Record<string, string> = {
  ok: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  active: 'bg-amber-50 text-amber-700 border-amber-200',
  down: 'bg-red-50 text-red-700 border-red-200',
};

export function AdminSystemPage() {
  const { data, isLoading } = useSystemHealth();

  if (isLoading) {
    return (
      <div>
        <PageHeader />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const queues = data?.queues ?? [];
  const performance = data?.performance ?? [];

  return (
    <div>
      <PageHeader />

      <div className="grid grid-cols-2 gap-3">
        {/* Card 1: Queue */}
        <Card className="p-4">
          <div className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground mb-2">
            Queue
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Queue</TableHead>
                <TableHead>Pending</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {queues.map((q: QueueStatus) => (
                <TableRow key={q.name}>
                  <TableCell className="font-medium">{q.name}</TableCell>
                  <TableCell className="tabular-nums">{q.pending}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={STATUS_COLORS[q.status] ?? STATUS_COLORS.ok}
                    >
                      {q.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {/* Card 2: Performance */}
        <Card className="p-4">
          <div className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground mb-2">
            Performance
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead>p95</TableHead>
                <TableHead>SLA</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {performance.map((p: PerformanceMetric) => (
                <TableRow key={p.metric}>
                  <TableCell className="font-medium">{p.metric}</TableCell>
                  <TableCell className="tabular-nums">{p.p95}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                      {p.sla}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}

function PageHeader() {
  return (
    <div className="mb-3 flex items-start justify-between">
      <div>
        <h1 className="text-sm font-medium">System Health</h1>
        <p className="text-xs text-muted-foreground">/admin/system</p>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
          Sales Ops ✓
        </Badge>
      </div>
    </div>
  );
}
