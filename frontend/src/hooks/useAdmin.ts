/**
 * React Query hooks for all Admin Console endpoints.
 *
 * apiClient returns parsed JSON directly (native fetch, not axios),
 * so no `.data` accessor is needed.
 */
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  AdminUser,
  StageSLA,
  Threshold,
  GTMMotion,
  FundingType,
  FXRate,
  DocAIField,
  QTreeQuestionnaire,
  QTreeParseResult,
  SystemHealth,
  SOPEntry,
  ModelConfig,
  CatalogEntry,
  TemplateEntry,
} from '@/types/admin';

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export function useAdminUsers() {
  return useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () =>
      apiClient.get<{ users: AdminUser[] }>('/admin/users').then((r) => r.users),
  });
}

// ---------------------------------------------------------------------------
// Reference Data
// ---------------------------------------------------------------------------

interface RefDataResponse {
  stage_slas: StageSLA[];
  thresholds: Threshold[];
  gtm_motions: GTMMotion[];
  funding_types: FundingType[];
}

export function useRefData() {
  return useQuery({
    queryKey: ['admin', 'reference-data'],
    queryFn: () => apiClient.get<RefDataResponse>('/admin/reference-data'),
  });
}

// ---------------------------------------------------------------------------
// Q Tree
// ---------------------------------------------------------------------------

export function useQTreeRegistry() {
  return useQuery({
    queryKey: ['admin', 'qtree'],
    queryFn: () =>
      apiClient.get<{ questionnaires: QTreeQuestionnaire[] }>('/admin/qtree').then((r) => r.questionnaires),
  });
}

export function useParseQTree() {
  return useMutation({
    mutationFn: () =>
      apiClient.post<QTreeParseResult>('/admin/qtree/parse', {}),
  });
}

// ---------------------------------------------------------------------------
// FX Rates
// ---------------------------------------------------------------------------

export function useFXRates() {
  return useQuery({
    queryKey: ['admin', 'fx-rates'],
    queryFn: () =>
      apiClient.get<{ rates: FXRate[] }>('/admin/fx-rates').then((r) => r.rates),
  });
}

// ---------------------------------------------------------------------------
// Doc AI
// ---------------------------------------------------------------------------

export function useDocAI() {
  return useQuery({
    queryKey: ['admin', 'doc-ai'],
    queryFn: () =>
      apiClient.get<{ fields: DocAIField[] }>('/admin/doc-ai').then((r) => r.fields),
  });
}

// ---------------------------------------------------------------------------
// System Health
// ---------------------------------------------------------------------------

export function useSystemHealth() {
  return useQuery({
    queryKey: ['admin', 'health'],
    queryFn: () => apiClient.get<SystemHealth>('/admin/health'),
    refetchInterval: 30_000,
  });
}

// ---------------------------------------------------------------------------
// SOPs
// ---------------------------------------------------------------------------

export function useSOPs() {
  return useQuery({
    queryKey: ['admin', 'sops'],
    queryFn: () =>
      apiClient.get<{ sops: SOPEntry[] }>('/admin/sops').then((r) => r.sops),
  });
}

// ---------------------------------------------------------------------------
// Model Config
// ---------------------------------------------------------------------------

export function useModelConfigs() {
  return useQuery({
    queryKey: ['admin', 'models'],
    queryFn: () =>
      apiClient.get<{ models: ModelConfig[] }>('/admin/models').then((r) => r.models),
  });
}

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------

export function useCatalog() {
  return useQuery({
    queryKey: ['admin', 'catalog'],
    queryFn: () =>
      apiClient.get<{ entries: CatalogEntry[] }>('/admin/catalog').then((r) => r.entries),
  });
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

export function useTemplates() {
  return useQuery({
    queryKey: ['admin', 'templates'],
    queryFn: () =>
      apiClient.get<{ templates: TemplateEntry[] }>('/admin/templates').then((r) => r.templates),
  });
}
