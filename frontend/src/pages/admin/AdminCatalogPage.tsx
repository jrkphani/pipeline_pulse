import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { useCatalog } from '@/hooks/useAdmin';
import type { CatalogEntry } from '@/types/admin';

export function AdminCatalogPage() {
  const { data: entries, isLoading } = useCatalog();
  const [selected, setSelected] = useState<CatalogEntry | null>(null);

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  return (
    <div>
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h1 className="text-sm font-medium">Solution Catalog</h1>
          <p className="text-xs text-muted-foreground">
            /admin/catalog · v2.1 · Solution Fit scoring source
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
            Sales Ops ✓
          </Badge>
          <Button size="sm">+ Add Entry</Button>
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Label</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-center">Pain Points</TableHead>
              <TableHead className="text-center">Signals</TableHead>
              <TableHead className="text-center">Combos</TableHead>
              <TableHead>Ver</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries?.map((e) => (
              <TableRow
                key={e.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => setSelected(e)}
              >
                <TableCell>{e.id}</TableCell>
                <TableCell className="font-medium">{e.label}</TableCell>
                <TableCell>{e.category}</TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary" className="text-[9px]">{e.pain_points}</Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary" className="text-[9px]">{e.signals}</Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary" className="text-[9px]">{e.combos}</Badge>
                </TableCell>
                <TableCell className="text-[9px] text-muted-foreground">{e.version}</TableCell>
                <TableCell>
                  <span className="cursor-pointer text-[9px] text-primary">Edit</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Edit Sheet */}
      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="w-[400px] sm:max-w-[400px]" onOpenAutoFocus={(e) => e.preventDefault()}>
          <SheetHeader>
            <SheetTitle className="text-xs">
              {selected?.id} — {selected?.label}
            </SheetTitle>
            <p className="text-[9px] text-muted-foreground">
              {selected?.category} · {selected?.version}
            </p>
          </SheetHeader>

          <div className="mt-4 space-y-3">
            <div>
              <Label className="text-[9px]">Label</Label>
              <Input defaultValue={selected?.label ?? ''} className="mt-1" />
            </div>
            <div>
              <Label className="text-[9px]">Category</Label>
              <Select defaultValue={selected?.category ?? 'Migration'}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Migration">Migration</SelectItem>
                  <SelectItem value="GenAI">GenAI</SelectItem>
                  <SelectItem value="Managed Svc">Managed Svc</SelectItem>
                  <SelectItem value="Modernization">Modernization</SelectItem>
                  <SelectItem value="Combination">Combination</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[9px]">ARR Potential</Label>
              <Input defaultValue={selected?.arr_potential ?? ''} className="mt-1" />
            </div>
            <div>
              <Label className="text-[9px]">Pain Points (one per line)</Label>
              <Textarea
                rows={4}
                className="mt-1 text-[10px]"
                defaultValue={selected?.pain_points_text ?? ''}
              />
            </div>
            <div>
              <Label className="text-[9px]">Signals (one per line)</Label>
              <Textarea
                rows={3}
                className="mt-1 text-[10px]"
                defaultValue={selected?.signals_text ?? ''}
              />
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <Button size="sm">Save & Version</Button>
            <Button variant="outline" size="sm" onClick={() => setSelected(null)}>
              Cancel
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
