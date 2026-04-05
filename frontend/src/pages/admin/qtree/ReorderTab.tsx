import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

const MOCK_SECTIONS = [
  '1. Current Landscape',
  '2. Migration Drivers',
  '3. Infrastructure',
  '4. Commercial',
];

const MOCK_REORDER_QUESTIONS = [
  { num: 1, text: 'What version of SAP are you currently running?', type: 'Single', options: ['SAP ECC 6.0', 'S/4HANA on-prem', 'BW/4HANA'] },
  { num: 2, text: 'Which SAP modules are active?', type: 'Multi', optionCount: '6 options + free text' },
  { num: 3, text: 'How many active named users on SAP?', type: 'Single', optionCount: '4 options' },
] as const;

export function ReorderTab() {
  const [activeSection, setActiveSection] = useState(0);

  return (
    <div className="grid grid-cols-[180px_1fr] gap-3">
      {/* Section list */}
      <div>
        <div className="mb-1.5 text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
          Sections (drag to reorder)
        </div>
        <Card className="space-y-0.5 p-2">
          {MOCK_SECTIONS.map((sec, i) => (
            <div
              key={sec}
              className={cn(
                'flex cursor-pointer items-center gap-1.5 rounded px-2 py-1.5 text-[10px]',
                i === activeSection ? 'bg-primary/10 text-primary' : 'hover:bg-muted',
              )}
              onClick={() => setActiveSection(i)}
            >
              <GripVertical className="size-3 text-muted-foreground" />
              {sec}
            </div>
          ))}
        </Card>
        <p className="mt-2 text-[9px] text-muted-foreground">Click section to edit its questions</p>
      </div>

      {/* Question list */}
      <div>
        <div className="mb-1.5 text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
          {MOCK_SECTIONS[activeSection]} — drag to reorder
        </div>
        <Card className="space-y-1.5 p-3">
          {MOCK_REORDER_QUESTIONS.map((q, i) => (
            <div
              key={q.num}
              className={cn(
                'flex items-start gap-2 rounded border p-2',
                i === 0 && 'border-primary bg-primary/5',
              )}
            >
              <GripVertical className="mt-0.5 size-4 shrink-0 cursor-grab text-muted-foreground" />
              <div className="flex-1">
                <div className="mb-1 text-[11px]">Q{q.num}. {q.text}</div>
                <div className="flex items-center gap-1.5">
                  {['Single', 'Multi', 'Text'].map((t) => (
                    <span
                      key={t}
                      className={cn(
                        'rounded border px-1.5 py-0.5 text-[9px] cursor-pointer',
                        t === q.type ? 'border-primary bg-primary text-white' : 'text-muted-foreground',
                      )}
                    >
                      {t}
                    </span>
                  ))}
                  {'options' in q && q.options && (
                    <div className="ml-2 flex flex-wrap gap-1">
                      {q.options.map((opt) => (
                        <span key={opt} className="flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] text-muted-foreground">
                          {opt} <span className="cursor-pointer text-destructive">×</span>
                        </span>
                      ))}
                      <span className="cursor-pointer text-[9px] text-primary">+ Add option</span>
                    </div>
                  )}
                  {'optionCount' in q && q.optionCount && (
                    <span className="ml-2 text-[9px] text-muted-foreground">{q.optionCount}</span>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <span className="cursor-pointer rounded border border-primary/30 px-1.5 py-0.5 text-[9px] text-primary">Edit</span>
                <span className="cursor-pointer rounded border border-destructive/30 px-1.5 py-0.5 text-[9px] text-destructive">Del</span>
              </div>
            </div>
          ))}
          <Button variant="outline" size="sm" className="mt-2 text-[9px]">+ Add question</Button>
        </Card>
        <div className="mt-3 flex gap-2">
          <Button variant="outline" size="sm">Revert</Button>
          <Button size="sm">Save Order</Button>
        </div>
      </div>
    </div>
  );
}
