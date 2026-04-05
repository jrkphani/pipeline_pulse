import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useUserRole } from '@/stores/auth.store';
import { useSetTopBarActions } from '@/components/layout/TopBarSlot';
import { PipelineGrid, type PipelineTab } from '@/components/grid/PipelineGrid';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { Deal, PipelineStats, UserRole as GridUserRole } from '@/types/index';
import type { UserRole as AuthUserRole } from '@/types/auth';

// ---------------------------------------------------------------------------
// Auth role → Grid role mapping
// ---------------------------------------------------------------------------

const ROLE_MAP: Partial<Record<AuthUserRole, GridUserRole>> = {
  cro: 'cro',
  ae: 'ae',
  sdr: 'sdr',
  admin: 'admin',
  finance_manager: 'finance',
  presales_consultant: 'pc',
  presales_sa: 'sa',
  presales_manager: 'pm',
  aws_alliance_manager: 'am',
  sales_manager: 'cro',
};

// ---------------------------------------------------------------------------
// FX Rate Pill — injected into TopBar via context
// ---------------------------------------------------------------------------

function FxRatePill({ rate, ageHours }: { rate: number; ageHours: number }) {
  const freshness =
    ageHours < 4 ? 'green' : ageHours < 24 ? 'amber' : 'red';

  const dotColor = {
    green: 'text-emerald-500',
    amber: 'text-amber-500',
    red: 'text-red-500',
  }[freshness];

  const borderColor = {
    green: 'border-emerald-200',
    amber: 'border-amber-200',
    red: 'border-red-200',
  }[freshness];

  const label =
    ageHours < 1
      ? 'just now'
      : ageHours < 24
        ? `${Math.round(ageHours)}h ago`
        : `${Math.round(ageHours / 24)}d ago`;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        borderColor,
      )}
    >
      <span className={cn('text-[10px] leading-none', dotColor)}>●</span>
      <span className="font-mono">USD/SGD {rate.toFixed(3)}</span>
      <span className="text-muted-foreground">· {label}</span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// API response shape
// ---------------------------------------------------------------------------

interface DealsResponse {
  deals: Deal[];
  stats: PipelineStats;
}

// ---------------------------------------------------------------------------
// PipelinePage
// ---------------------------------------------------------------------------

export function PipelinePage() {
  const authRole = useUserRole();
  const gridRole = authRole ? (ROLE_MAP[authRole] ?? 'ae') : 'ae';
  const setTopBarActions = useSetTopBarActions();

  const [activeTab, setActiveTab] = useState<PipelineTab>(
    gridRole === 'am' ? 'alliance' : 'pipeline',
  );
  const [, setSelectedDeals] = useState<Deal[]>([]);

  // Fetch deals from MSW mock
  const { data, isLoading } = useQuery<DealsResponse>({
    queryKey: ['deals'],
    queryFn: () => apiClient.get<DealsResponse>('/deals'),
  });

  // Inject FX pill into TopBar
  useEffect(() => {
    if (data?.stats) {
      setTopBarActions(
        <FxRatePill
          rate={data.stats.fx_rate_usd_sgd}
          ageHours={data.stats.fx_rate_age_hours}
        />,
      );
    }
    return () => setTopBarActions(null);
  }, [data?.stats, setTopBarActions]);


  // Loading state
  if (isLoading || !data) {
    return (
      <div className="flex h-full flex-col gap-px overflow-hidden p-0">
        <Skeleton className="h-10 w-full rounded-none" />
        <Skeleton className="h-9 w-full rounded-none" />
        <Skeleton className="h-full w-full flex-1 rounded-none" />
        <Skeleton className="h-9 w-full rounded-none" />
      </div>
    );
  }

  return (
    <div className="h-full flex-col overflow-hidden flex">
      <PipelineGrid
        deals={data.deals}
        stats={data.stats}
        activeTab={activeTab}
        userRole={gridRole}
        onSelectionChange={setSelectedDeals}
        onTabChange={setActiveTab}
      />
    </div>
  );
}
