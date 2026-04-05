import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export function LivePreviewTab() {
  const [selectedQ1, setSelectedQ1] = useState<string | null>('SAP S/4HANA (on-prem)');
  const [selectedQ2, setSelectedQ2] = useState<Set<string>>(new Set(['FI/CO', 'MM']));

  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <Select defaultValue="sap-presales">
          <SelectTrigger className="w-[360px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sap-presales">SAP Migration — Presales Discovery (PC · SA)</SelectItem>
            <SelectItem value="ai-sdr">Agentic AI — SDR First Call (SDR)</SelectItem>
            <SelectItem value="vmware-ae">VMware Exit — Sales Qualification (AE)</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-[10px] text-muted-foreground">
          As seen in /deals/:id Q Tree tab · auto-advance enabled
        </span>
      </div>

      <div className="max-w-lg">
        <div className="mb-1 text-[10px] text-muted-foreground">Section 1 of 4 · Question 1 of 5</div>
        <Progress value={8} className="mb-3 h-0.5" />
        <div className="mb-3 text-[10px] font-medium text-primary">Section 1: Current Landscape</div>

        {/* Q1 — single select */}
        <Card className="mb-2 p-3">
          <div className="mb-2 text-xs font-medium">Q1. What version of SAP are you currently running?</div>
          <p className="mb-2 text-[9px] text-muted-foreground">Select one — auto-advances on selection</p>
          {['SAP ECC 6.0', 'SAP S/4HANA (on-prem)', 'SAP BW/4HANA', 'Other (specify below)'].map((opt) => (
            <div
              key={opt}
              className={cn(
                'mb-1 flex cursor-pointer items-center gap-2 rounded border p-2 text-[11px]',
                selectedQ1 === opt && 'border-primary/50 bg-primary/5',
              )}
              onClick={() => setSelectedQ1(opt)}
            >
              <div
                className={cn(
                  'size-3 shrink-0 rounded-full border',
                  selectedQ1 === opt && 'border-primary shadow-[inset_0_0_0_3px_hsl(var(--primary))]',
                )}
              />
              {opt}
            </div>
          ))}
        </Card>

        {/* Q2 — multi select */}
        <Card className="p-3">
          <div className="mb-2 text-xs font-medium">Q2. Which SAP modules are active?</div>
          <p className="mb-2 text-[9px] text-muted-foreground">Select all that apply</p>
          {['FI / CO (Finance & Controlling)', 'MM (Materials Management)', 'SD (Sales & Distribution)', 'PP (Production Planning)'].map((opt) => {
            const key = opt.split(' ')[0];
            const checked = selectedQ2.has(key);
            return (
              <div
                key={opt}
                className={cn(
                  'mb-1 flex cursor-pointer items-center gap-2 rounded border p-2 text-[11px]',
                  checked && 'border-primary/50 bg-primary/5',
                )}
                onClick={() => {
                  setSelectedQ2((prev) => {
                    const next = new Set(prev);
                    if (next.has(key)) next.delete(key);
                    else next.add(key);
                    return next;
                  });
                }}
              >
                <div
                  className={cn(
                    'flex size-4 shrink-0 items-center justify-center rounded border text-[9px]',
                    checked && 'border-primary bg-primary text-white',
                  )}
                >
                  {checked && '✓'}
                </div>
                {opt}
              </div>
            );
          })}
          <div className="mt-2 text-right">
            <Button size="sm" className="text-[10px]">Submit selection →</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
