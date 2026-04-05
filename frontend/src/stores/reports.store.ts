import { create } from 'zustand';

// ---------------------------------------------------------------------------
// GTM motions and timeframe filters for Reports section
// ---------------------------------------------------------------------------

const GTM_MOTIONS = [
  'All GTM',
  'AWS SAP',
  'VMware Exit',
  'Agentic AI',
] as const;

type GtmMotion = (typeof GTM_MOTIONS)[number];

const TIMEFRAMES = ['Q1 · AMJ', 'Q2 · JAS', 'Q3 · OND', 'Q4 · JFM'] as const;

type Timeframe = (typeof TIMEFRAMES)[number];

interface ReportsState {
  gtm: GtmMotion;
  timeframe: Timeframe | null;
}

interface ReportsActions {
  setGtm: (gtm: GtmMotion) => void;
  setTimeframe: (tf: Timeframe | null) => void;
}

type ReportsStore = ReportsState & ReportsActions;

export const useReportsStore = create<ReportsStore>()((set) => ({
  gtm: 'All GTM',
  timeframe: null,

  setGtm: (gtm) => set({ gtm }),
  setTimeframe: (timeframe) => set({ timeframe }),
}));

export { GTM_MOTIONS, TIMEFRAMES };
export type { GtmMotion, Timeframe };
