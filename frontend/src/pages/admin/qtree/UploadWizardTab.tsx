import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useParseQTree } from '@/hooks/useAdmin';
import type { QTreeParseResult, QTreeSection } from '@/types/admin';
import { cn } from '@/lib/utils';

const WIZARD_STEPS = ['Upload file', 'Parse & review', 'Metadata', 'Publish'] as const;

function ParseSectionPreview({ section }: { section: QTreeSection }) {
  return (
    <div className="border-t px-3 py-2">
      <div className="mb-2 text-[10px] font-medium text-primary">
        {section.title} ({section.questions.length} questions)
      </div>
      {section.questions.map((q) => (
        <div key={q.number} className="mb-1 rounded bg-muted/50 px-2 py-1.5">
          <div className="flex items-start gap-1.5">
            <span className="text-[9px] text-muted-foreground">Q{q.number}.</span>
            <span className="flex-1 text-[11px]">{q.text}</span>
            <Badge
              variant="secondary"
              className={cn(
                'shrink-0 text-[8px]',
                q.type === 'multi-select' && 'bg-primary/10 text-primary',
                q.type === 'single-select' && 'bg-emerald-50 text-emerald-700',
                q.type === 'text' && 'bg-amber-50 text-amber-700',
              )}
            >
              {q.type}
            </Badge>
          </div>
          {q.options.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1 pl-5">
              {q.options.map((opt) => (
                <span
                  key={opt}
                  className={cn(
                    'rounded-full border px-2 py-0.5 text-[9px] text-muted-foreground',
                    opt.includes('Other') && 'border-dashed',
                  )}
                >
                  {opt}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function UploadWizardTab() {
  const [step, setStep] = useState(0);
  const parseMutation = useParseQTree();
  const [parseResult, setParseResult] = useState<QTreeParseResult | null>(null);

  const handleUpload = async () => {
    const result = await parseMutation.mutateAsync();
    setParseResult(result);
    setStep(1);
  };

  const next = () => setStep((s) => Math.min(s + 1, 3));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <div>
      {/* Stepper */}
      <div className="mb-4 flex items-center gap-1">
        {WIZARD_STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-1">
            {i > 0 && <span className="text-xs text-muted-foreground">›</span>}
            <div
              className={cn(
                'flex items-center gap-1.5 rounded px-2.5 py-1 text-[10px]',
                i === step && 'bg-primary/10 font-medium text-primary',
                i < step && 'text-emerald-600',
                i > step && 'text-muted-foreground',
              )}
            >
              <span
                className={cn(
                  'flex size-4 items-center justify-center rounded-full border text-[9px]',
                  i === step && 'border-primary text-primary',
                  i < step && 'border-emerald-500 bg-emerald-500 text-white',
                  i > step && 'border-muted-foreground/40',
                )}
              >
                {i < step ? '✓' : i + 1}
              </span>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Step 1: Upload */}
      {step === 0 && (
        <div>
          <Card className="mb-3 p-3">
            <div className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground mb-2">
              Markdown format spec
            </div>
            <div className="rounded bg-muted p-2.5 font-mono text-[9.5px] leading-relaxed">
              <span className="text-emerald-600"># Questionnaire Title</span><br />
              <span className="text-muted-foreground">role: SDR | AE | PC | SA &nbsp;&nbsp; domain: SAP Migration | …</span>
              <br /><br />
              <span className="text-primary">## Section 1: Section Name</span><br /><br />
              <strong>Q1.</strong> Question text<br />
              <span className="text-muted-foreground">type: multi-select | single-select | text</span><br />
              - Option A<br />- Option B<br />- Other: [user input]
            </div>
          </Card>
          <div
            className="cursor-pointer rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/50 p-6 text-center transition-colors hover:border-primary hover:bg-primary/5"
            onClick={handleUpload}
          >
            <div className="mb-2 text-2xl">📄</div>
            <div className="text-xs font-medium">Drop .md file here or click to browse</div>
            <div className="text-[10px] text-muted-foreground">Markdown files only · Max 500 questions · Max 20 sections</div>
          </div>
          <div className="mt-3 text-center">
            <Button size="sm" onClick={handleUpload} disabled={parseMutation.isPending}>
              {parseMutation.isPending ? 'Parsing…' : 'Simulate upload →'}
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Parse preview */}
      {step === 1 && parseResult && (
        <div>
          <div className="mb-3 rounded border border-emerald-300 bg-emerald-50 px-3 py-2 text-[10px] text-emerald-700">
            ✓ Parsed: <strong>{parseResult.filename}</strong> · {parseResult.sections.length} sections · {parseResult.total_questions} questions · {parseResult.errors} errors
          </div>
          <Card className="overflow-hidden p-0">
            <div className="flex items-center justify-between border-b bg-muted/50 px-3 py-2 text-[10px] font-medium">
              <span>{parseResult.title}</span>
              <span className="text-muted-foreground">role: {parseResult.roles} | domain: {parseResult.domain}</span>
            </div>
            {parseResult.sections.slice(0, 2).map((section) => (
              <ParseSectionPreview key={section.title} section={section} />
            ))}
            {parseResult.sections.length > 2 && (
              <div className="border-t px-3 py-2">
                <div className="text-[10px] font-medium text-primary">
                  Section 2–{parseResult.sections.length}:{' '}
                  {parseResult.sections.slice(1).map((s) => s.title.replace(/^Section \d+: /, '')).join(' · ')}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  … {parseResult.total_questions - parseResult.sections[0].questions.length} more questions parsed
                </div>
              </div>
            )}
          </Card>
          <div className="mt-3 flex gap-2">
            <Button variant="outline" size="sm" onClick={back}>← Back</Button>
            <Button size="sm" onClick={next}>Confirm & continue →</Button>
          </div>
        </div>
      )}

      {/* Step 3: Metadata */}
      {step === 2 && (
        <div>
          <Card className="max-w-lg space-y-3 p-4">
            <div>
              <Label className="text-[9px]">Questionnaire name</Label>
              <Input defaultValue={parseResult?.title ?? ''} className="mt-1" />
            </div>
            <div>
              <Label className="text-[9px]">Role scope</Label>
              <div className="mt-1 flex flex-wrap gap-3 text-[11px]">
                {['SDR', 'AE', 'PC', 'SA'].map((role) => (
                  <label key={role} className="flex items-center gap-1.5 cursor-pointer">
                    <Checkbox defaultChecked={role === 'PC' || role === 'SA'} />
                    {role}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-[9px]">Domain</Label>
              <Select defaultValue="SAP Migration">
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SAP Migration">SAP Migration</SelectItem>
                  <SelectItem value="Agentic AI">Agentic AI</SelectItem>
                  <SelectItem value="VMware Exit">VMware Exit</SelectItem>
                  <SelectItem value="All domains">All domains</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[9px]">Publish status</Label>
              <div className="mt-1 flex gap-4 text-[11px]">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="radio" name="publish" className="accent-primary" /> Active
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="radio" name="publish" className="accent-primary" defaultChecked /> Draft
                </label>
              </div>
              <p className="mt-1 text-[9px] text-amber-600">⚑ Sign-off required to set Active. Draft is safe to publish now.</p>
            </div>
            <div>
              <Label className="text-[9px]">Sign-off tracking</Label>
              <div className="mt-1 space-y-2 rounded border p-2">
                {['Presales Practice Lead', 'SDR Team Lead'].map((lead) => (
                  <div key={lead} className="flex items-center gap-2 text-[10px]">
                    <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[8px] font-medium text-amber-700">⏳ Pending</span>
                    <span className="text-muted-foreground">{lead}</span>
                    <Button variant="outline" size="sm" className="ml-auto h-5 px-2 text-[8px]">Mark received</Button>
                  </div>
                ))}
              </div>
            </div>
          </Card>
          <div className="mt-3 flex gap-2">
            <Button variant="outline" size="sm" onClick={back}>← Back</Button>
            <Button size="sm" onClick={next}>Publish as Draft →</Button>
          </div>
        </div>
      )}

      {/* Step 4: Success */}
      {step === 3 && (
        <div className="mx-auto max-w-md rounded-lg border border-emerald-300 bg-emerald-50 p-5 text-center">
          <div className="mb-2 text-2xl">✓</div>
          <div className="font-medium">Published as Draft</div>
          <div className="mt-1 text-[10px] text-emerald-700">
            {parseResult?.title ?? 'Questionnaire'} · v1.0 · {parseResult?.roles}
          </div>
          <p className="mt-1 text-[9px] text-amber-600">⚑ Activate when both sign-offs are marked received in the registry.</p>
          <div className="mt-4 flex justify-center gap-2">
            <Button size="sm">Reorder questions</Button>
            <Button variant="outline" size="sm" onClick={() => setStep(0)}>Back to registry</Button>
          </div>
        </div>
      )}
    </div>
  );
}
