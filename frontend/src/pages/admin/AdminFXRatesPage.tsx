import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useFXRates } from '@/hooks/useAdmin';
import type { FXRate } from '@/types/admin';

export function AdminFXRatesPage() {
  const { data: rates, isLoading } = useFXRates();

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
              <TableHead>From</TableHead>
              <TableHead>To</TableHead>
              <TableHead>Rate</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead>Changed by</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(rates ?? []).map((rate: FXRate) => (
              <TableRow key={`${rate.from}-${rate.to}`}>
                <TableCell className="font-medium">{rate.from}</TableCell>
                <TableCell>{rate.to}</TableCell>
                <TableCell>
                  <Input
                    type="number"
                    defaultValue={rate.rate}
                    step="0.0001"
                    className="h-7 w-[65px] text-xs"
                  />
                </TableCell>
                <TableCell className="text-xs">{rate.source}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{rate.updated}</TableCell>
                <TableCell className="text-xs">{rate.changed_by}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      rate.status === 'fresh'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }
                  >
                    {rate.status === 'fresh' ? 'Fresh' : rate.stale_label ?? '7d old'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function PageHeader() {
  return (
    <div className="mb-3 flex items-start justify-between">
      <div>
        <h1 className="text-sm font-medium">FX Rates</h1>
        <p className="text-xs text-muted-foreground">
          /admin/fx-rates &middot; Auto-sync daily 06:00 SGT
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
          Sales Ops ✓
        </Badge>
        <Button size="sm">Sync API Now</Button>
      </div>
    </div>
  );
}
