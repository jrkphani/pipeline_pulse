/**
 * AdminQTreePage — Q Tree Config with 4 tabs:
 * Registry, Upload Wizard (4-step), Reorder Wizard, Live Preview.
 */
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RegistryTab } from './qtree/RegistryTab';
import { UploadWizardTab } from './qtree/UploadWizardTab';
import { ReorderTab } from './qtree/ReorderTab';
import { LivePreviewTab } from './qtree/LivePreviewTab';

export function AdminQTreePage() {
  return (
    <div>
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h1 className="text-sm font-medium">Q Tree Config</h1>
          <p className="text-xs text-muted-foreground">
            /admin/q-tree · Markdown upload · sign-off gate for activation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
            Sales Ops ✓ + sign-off
          </Badge>
        </div>
      </div>

      {/* Sign-off gate banner */}
      <div className="mb-3 flex items-center gap-2 rounded border border-primary/30 bg-primary/5 px-3 py-2 text-[10px] text-primary">
        ⚑ <strong>Sign-off gate active.</strong> Questionnaires can be uploaded and set to Draft by
        Sales Ops or Admin. Activation to <em>Active</em> requires Presales Practice Lead + SDR Team
        Lead approval.
      </div>

      {/* Tabs */}
      <Tabs defaultValue="registry">
        <TabsList>
          <TabsTrigger value="registry">Registry</TabsTrigger>
          <TabsTrigger value="upload">Upload Wizard</TabsTrigger>
          <TabsTrigger value="reorder">Reorder Wizard</TabsTrigger>
          <TabsTrigger value="preview">Live Preview</TabsTrigger>
        </TabsList>
        <TabsContent value="registry">
          <RegistryTab />
        </TabsContent>
        <TabsContent value="upload">
          <UploadWizardTab />
        </TabsContent>
        <TabsContent value="reorder">
          <ReorderTab />
        </TabsContent>
        <TabsContent value="preview">
          <LivePreviewTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
