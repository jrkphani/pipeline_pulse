import { Import } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function AdminImportPage() {
  return (
    <div>
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h1 className="text-sm font-medium">Excel Import</h1>
          <p className="text-xs text-muted-foreground">
            /admin/import &middot; One-time migration wizard
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
            Sales Ops ✓
          </Badge>
        </div>
      </div>

      <div className="flex justify-center pt-12">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Import className="h-7 w-7 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Upload Deal Tracker</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Upload &rarr; dry-run diff &rarr; confirm &rarr; exception report
              </p>
            </div>
            <Button size="sm">Choose .xlsx file</Button>
            <p className="text-[10px] text-muted-foreground">
              Last import: 24 Mar 2026 &middot; 274 deals &middot; 0 exceptions
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
