export type NavSection =
  | 'overview'
  | 'daily'
  | 'weekly'
  | 'weekday'
  | 'simulator'
  | 'reports'
  | 'import'
  | 'settings';

export type DateFilterPreset = '7d' | '14d' | '30d' | 'previous' | 'custom';

export type DayTypeFilter = 'all' | 'weekdays' | 'weekends' | 'active_only';

export interface DailyAdRecord {
  id: string;
  date: string; // YYYY-MM-DD
  campaign: string;
  spend: number;
  leads: number | null; // null represents missing reported value (e.g. 04/11)
  clicks: number;
  impressions: number;
  reach?: number | null;
  frequency?: number | null;
  deliveryStatus?: string;
  source?: 'initial' | 'csv';
}

export interface AggregatedMetrics {
  spend: number;
  leads: number;
  clicks: number;
  impressions: number;
  cpl: number | null;
  cpc: number | null;
  ctr: number | null;
  cpm: number | null;
  leadsPerDay: number | null;
  leadsPerActiveDay: number | null;
  spendPerDay: number | null;
  spendPerActiveDay: number | null;
  convPerClick: number | null;
  totalDays: number;
  activeDays: number;
  missingLeadsDays: number;
}

export interface DailyComputedRow extends DailyAdRecord {
  dayName: string;
  dayShort: string;
  dayIndex: number; // 0 = Seg ... 6 = Dom
  isWeekday: boolean;
  hasSpend: boolean;
  isIncomplete: boolean;
  cpl: number | null;
  cpc: number | null;
  ctr: number | null;
  cpm: number | null;
  convPerClick: number | null;
  leadsDelta: number | null;
  leadsDeltaPct: number | null;
  cplDelta: number | null;
  cplDeltaPct: number | null;
}

export interface WeekdaySummary {
  dayIndex: number; // 0 = Segunda ... 6 = Domingo
  dayName: string;
  dayShort: string;
  occurrences: number;
  activeDays: number;
  spend: number;
  leads: number;
  clicks: number;
  impressions: number;
  leadsPerCalendarDay: number | null;
  leadsPerActiveDay: number | null;
  avgSpendPerCalendarDay: number | null;
  avgSpendPerActiveDay: number | null;
  cpl: number | null;
  cpc: number | null;
  ctr: number | null;
  cpm: number | null;
  smallSample: boolean;
}

export interface PauseComparison {
  pauseStart: string;
  pauseEnd: string;
  pauseDays: number;
  beforeStart: string;
  beforeEnd: string;
  beforeMetrics: AggregatedMetrics;
  afterStart: string;
  afterEnd: string;
  afterMetrics: AggregatedMetrics;
}

export interface GoalsConfig {
  targetCpl: number;
  dailyLeadsGoal: number;
  weeklyLeadsGoal: number;
  monthlyLeadsGoal: number;
  dailySpendLimit: number;
  weeklySpendLimit: number;
  monthlySpendLimit: number;
}

export interface CsvImportPreview {
  fileName: string;
  delimiter: string;
  totalRowsRead: number;
  validDailyRows: DailyAdRecord[];
  duplicateRows: DailyAdRecord[];
  newRows: DailyAdRecord[];
  campaignsDetected: string[];
  warnings: string[];
  errors: string[];
  isConsolidatedError: boolean;
}
