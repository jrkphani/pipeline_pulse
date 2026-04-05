// ---------------------------------------------------------------------------
// ResultRow — entity-aware formatting for command palette search results
// ---------------------------------------------------------------------------

import {
  Briefcase,
  Building2,
  User,
  UserSearch,
  Users,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SearchResultItem, EntityType } from './types';

// ---------------------------------------------------------------------------
// Entity icon + colour mapping
// ---------------------------------------------------------------------------

const ENTITY_CONFIG: Record<
  EntityType,
  { icon: React.FC<{ className?: string }>; color: string; chipLabel: string }
> = {
  opportunity: { icon: Briefcase, color: 'text-blue-500', chipLabel: 'Opportunity' },
  account: { icon: Building2, color: 'text-green-500', chipLabel: 'Account' },
  contact: { icon: User, color: 'text-violet-500', chipLabel: 'Contact' },
  lead: { icon: UserSearch, color: 'text-orange-500', chipLabel: 'Lead' },
  team_member: { icon: Users, color: 'text-cyan-500', chipLabel: 'Team Member' },
  page: { icon: FileText, color: 'text-muted-foreground', chipLabel: 'Page' },
};

// ---------------------------------------------------------------------------
// SGD formatter
// ---------------------------------------------------------------------------

function formatSGD(value: unknown): string {
  if (typeof value !== 'number') return '';
  return `S$${value.toLocaleString('en-SG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

// ---------------------------------------------------------------------------
// Entity-specific detail renderers
// ---------------------------------------------------------------------------

function OpportunityDetail({ item }: { item: SearchResultItem }) {
  return (
    <span className="flex items-center gap-2 text-xs text-muted-foreground truncate">
      {item.sub_label && <span className="truncate">{item.sub_label}</span>}
      {item.meta.sgd_core != null && (
        <>
          <span className="text-muted-foreground/40">·</span>
          <span className="tabular-nums font-medium text-foreground/70">
            {formatSGD(item.meta.sgd_core)}
          </span>
        </>
      )}
      {item.meta.custodian && (
        <>
          <span className="text-muted-foreground/40">·</span>
          <span className="truncate">{String(item.meta.custodian)}</span>
        </>
      )}
    </span>
  );
}

function AccountDetail({ item }: { item: SearchResultItem }) {
  return (
    <span className="flex items-center gap-2 text-xs text-muted-foreground truncate">
      {item.meta.industry && <span className="truncate">{String(item.meta.industry)}</span>}
      {item.meta.primary_ae && (
        <>
          <span className="text-muted-foreground/40">·</span>
          <span className="truncate">{String(item.meta.primary_ae)}</span>
        </>
      )}
    </span>
  );
}

function ContactDetail({ item }: { item: SearchResultItem }) {
  return (
    <span className="flex items-center gap-2 text-xs text-muted-foreground truncate">
      {item.sub_label && <span className="truncate">{item.sub_label}</span>}
      {item.meta.title && (
        <>
          <span className="text-muted-foreground/40">·</span>
          <span className="truncate">{String(item.meta.title)}</span>
        </>
      )}
    </span>
  );
}

function LeadDetail({ item }: { item: SearchResultItem }) {
  return (
    <span className="flex items-center gap-2 text-xs text-muted-foreground truncate">
      {item.sub_label && <span className="truncate">{item.sub_label}</span>}
      {item.meta.stage && (
        <>
          <span className="text-muted-foreground/40">·</span>
          <span>{String(item.meta.stage)}</span>
        </>
      )}
      {item.meta.owner && (
        <>
          <span className="text-muted-foreground/40">·</span>
          <span className="truncate">{String(item.meta.owner)}</span>
        </>
      )}
    </span>
  );
}

function TeamMemberDetail({ item }: { item: SearchResultItem }) {
  return (
    <span className="flex items-center gap-2 text-xs text-muted-foreground truncate">
      {item.meta.role && <span className="truncate">{String(item.meta.role)}</span>}
      {item.meta.region && (
        <>
          <span className="text-muted-foreground/40">·</span>
          <span>{String(item.meta.region)}</span>
        </>
      )}
    </span>
  );
}

const DETAIL_RENDERERS: Record<EntityType, React.FC<{ item: SearchResultItem }>> = {
  opportunity: OpportunityDetail,
  account: AccountDetail,
  contact: ContactDetail,
  lead: LeadDetail,
  team_member: TeamMemberDetail,
  page: () => null,
};

// ---------------------------------------------------------------------------
// ResultRow Component
// ---------------------------------------------------------------------------

interface ResultRowProps {
  item: SearchResultItem;
  className?: string;
}

export function ResultRow({ item, className }: ResultRowProps) {
  const config = ENTITY_CONFIG[item.entity_type];
  const Icon = config.icon;
  const DetailRenderer = DETAIL_RENDERERS[item.entity_type];

  return (
    <div className={cn('flex items-center gap-3 w-full min-w-0', className)}>
      {/* Entity icon */}
      <Icon className={cn('size-4 shrink-0', config.color)} />

      {/* Label + sub-detail */}
      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
        <span className="text-sm font-medium truncate">{item.label}</span>
        <DetailRenderer item={item} />
      </div>

      {/* Entity type chip */}
      <span
        className={cn(
          'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium',
          'bg-muted text-muted-foreground',
        )}
      >
        {config.chipLabel}
      </span>
    </div>
  );
}
