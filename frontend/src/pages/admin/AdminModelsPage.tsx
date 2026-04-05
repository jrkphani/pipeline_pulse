import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useModelConfigs } from '@/hooks/useAdmin';
import type { ModelConfig } from '@/types/admin';
import { cn } from '@/lib/utils';

const MODEL_COLORS: Record<string, string> = {
  haiku: 'bg-emerald-50 text-emerald-700',
  sonnet: 'bg-primary/10 text-primary',
  opus: 'bg-amber-50 text-amber-700',
};

export function AdminModelsPage() {
  const { data: models, isLoading } = useModelConfigs();

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  return (
    <div>
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h1 className="text-sm font-medium">Model Config</h1>
          <p className="text-xs text-muted-foreground">
            /admin/model-config · {models?.length ?? 0} AI use cases
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
            Sales Ops ✓
          </Badge>
        </div>
      </div>

      {/* Cost banner */}
      <div className="mb-3 rounded border border-primary/30 bg-primary/5 px-3 py-2 text-[10px] text-primary">
        Cost vs all-Sonnet baseline: <strong>−38%</strong> · 14 Haiku · 8 Sonnet · 3 Opus
      </div>

      {/* Table */}
      <Card className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Use Case</TableHead>
              <TableHead>Agent</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>Override</TableHead>
              <TableHead>Quality Gate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {models?.map((m: ModelConfig) => (
              <TableRow key={m.use_case}>
                <TableCell>{m.use_case}</TableCell>
                <TableCell className="text-muted-foreground">{m.agent}</TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={cn('text-[9px] capitalize', MODEL_COLORS[m.model])}
                  >
                    {m.model.charAt(0).toUpperCase() + m.model.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Select defaultValue={m.model}>
                    <SelectTrigger className="h-6 w-24 text-[9px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {m.allowed_overrides.map((o: string) => (
                        <SelectItem key={o} value={o} className="text-[10px] capitalize">
                          {o.charAt(0).toUpperCase() + o.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-[9px] text-muted-foreground">{m.quality_gate}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
