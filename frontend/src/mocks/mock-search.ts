// ---------------------------------------------------------------------------
// Mock Search Data — simulates backend /search endpoint
// ---------------------------------------------------------------------------

import type { SearchResultItem } from '@/components/command-palette/types';

export const MOCK_SEARCH_ITEMS: SearchResultItem[] = [
  // ── Opportunities ─────────────────────────────────────────────────────
  {
    id: 'opp-001',
    entity_type: 'opportunity',
    label: 'Panasonic Q2 Expansion',
    sub_label: 'Panasonic Asia Pacific',
    meta: { sgd_core: 320_000, custodian: 'Sarah Chen' },
    visited_at: '2026-04-04T14:30:00Z',
  },
  {
    id: 'opp-002',
    entity_type: 'opportunity',
    label: 'DBS Cloud Migration Phase 3',
    sub_label: 'DBS Bank',
    meta: { sgd_core: 1_250_000, custodian: 'Tracy Tan' },
    visited_at: '2026-04-03T09:15:00Z',
  },
  {
    id: 'opp-003',
    entity_type: 'opportunity',
    label: 'SAP on AWS — Singtel',
    sub_label: 'Singtel Group',
    meta: { sgd_core: 780_000, custodian: 'Sarah Chen' },
    visited_at: '2026-04-02T16:00:00Z',
  },
  {
    id: 'opp-004',
    entity_type: 'opportunity',
    label: 'Grab Data Platform Modernization',
    sub_label: 'Grab Holdings',
    meta: { sgd_core: 540_000, custodian: 'Ravi Kumar' },
    visited_at: '2026-03-28T11:00:00Z',
  },
  {
    id: 'opp-005',
    entity_type: 'opportunity',
    label: 'Pacific Life GenAI POC',
    sub_label: 'Pacific Life Insurance',
    meta: { sgd_core: 95_000, custodian: 'Sarah Chen' },
    visited_at: null,
  },

  // ── Accounts ──────────────────────────────────────────────────────────
  {
    id: 'acc-001',
    entity_type: 'account',
    label: 'Panasonic Asia Pacific',
    sub_label: null,
    meta: { industry: 'Manufacturing', primary_ae: 'Sarah Chen' },
    visited_at: '2026-04-04T12:00:00Z',
  },
  {
    id: 'acc-002',
    entity_type: 'account',
    label: 'DBS Bank',
    sub_label: null,
    meta: { industry: 'Financial Services', primary_ae: 'Tracy Tan' },
    visited_at: '2026-04-03T10:00:00Z',
  },
  {
    id: 'acc-003',
    entity_type: 'account',
    label: 'Five-Star Business Finance',
    sub_label: null,
    meta: { industry: 'Financial Services', primary_ae: 'Sarah Chen' },
    visited_at: '2026-04-01T08:00:00Z',
  },
  {
    id: 'acc-004',
    entity_type: 'account',
    label: 'Singtel Group',
    sub_label: null,
    meta: { industry: 'Telecommunications', primary_ae: 'Tracy Tan' },
    visited_at: '2026-03-30T14:00:00Z',
  },
  {
    id: 'acc-005',
    entity_type: 'account',
    label: 'Grab Holdings',
    sub_label: null,
    meta: { industry: 'Technology', primary_ae: 'Ravi Kumar' },
    visited_at: null,
  },

  // ── Contacts ──────────────────────────────────────────────────────────
  {
    id: 'con-001',
    entity_type: 'contact',
    label: 'David Lim',
    sub_label: 'DBS Bank',
    meta: { title: 'VP Engineering' },
    visited_at: '2026-04-04T11:00:00Z',
  },
  {
    id: 'con-002',
    entity_type: 'contact',
    label: 'Priya Nair',
    sub_label: 'Singtel Group',
    meta: { title: 'Head of Cloud' },
    visited_at: '2026-04-02T09:00:00Z',
  },
  {
    id: 'con-003',
    entity_type: 'contact',
    label: 'Patrick Wong',
    sub_label: 'Panasonic Asia Pacific',
    meta: { title: 'CTO' },
    visited_at: '2026-03-29T15:30:00Z',
  },

  // ── Leads ─────────────────────────────────────────────────────────────
  {
    id: 'lead-001',
    entity_type: 'lead',
    label: 'Jennifer Tan',
    sub_label: 'Oceanus Group',
    meta: { stage: 'L2', owner: 'Ravi Kumar' },
    visited_at: '2026-04-03T14:00:00Z',
  },
  {
    id: 'lead-002',
    entity_type: 'lead',
    label: 'Kumar Patel',
    sub_label: 'Tata Communications',
    meta: { stage: 'L1', owner: 'Ravi Kumar' },
    visited_at: null,
  },

  // ── Team Members ──────────────────────────────────────────────────────
  {
    id: 'tm-001',
    entity_type: 'team_member',
    label: 'Sarah Chen',
    sub_label: null,
    meta: { role: 'Account Executive', region: 'SG' },
    visited_at: null,
  },
  {
    id: 'tm-002',
    entity_type: 'team_member',
    label: 'Tracy Tan',
    sub_label: null,
    meta: { role: 'Account Executive', region: 'SG' },
    visited_at: null,
  },
  {
    id: 'tm-003',
    entity_type: 'team_member',
    label: 'Ravi Kumar',
    sub_label: null,
    meta: { role: 'SDR', region: 'SG' },
    visited_at: null,
  },
];
