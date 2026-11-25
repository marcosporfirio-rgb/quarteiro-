import { DailyAdRecord, GoalsConfig } from '../types/ads';

export const DEFAULT_CAMPAIGN = 'B2B | ENG | WPP | SP | ABO';
export const CLIENT_NAME = 'Quarteiro';
export const PLATFORM_NAME = 'Meta Ads';

export const DEFAULT_GOALS: GoalsConfig = {
  targetCpl: 7.34,
  dailyLeadsGoal: 12,
  weeklyLeadsGoal: 84,
  monthlyLeadsGoal: 360,
  dailySpendLimit: 150,
  weeklySpendLimit: 900,
  monthlySpendLimit: 3800,
};

const RAW_INITIAL_ROWS: Array<[string, number, number | null, number, number]> = [
  ['2026-10-26', 0, 0, 0, 0],
  ['2026-10-27', 0, 0, 0, 0],
  ['2026-10-28', 0, 0, 0, 0],
  ['2026-10-29', 0, 0, 0, 0],
  ['2026-10-30', 0, 0, 0, 0],
  ['2026-10-31', 0, 0, 0, 0],
  ['2026-11-01', 0, 0, 0, 0],
  ['2026-11-02', 0, 0, 0, 0],
  ['2026-11-03', 0, 0, 0, 0],
  ['2026-11-04', 15.35, null, 4, 368],
  ['2026-11-05', 123.0, 22, 44, 3520],
  ['2026-11-06', 128.23, 18, 37, 3678],
  ['2026-11-07', 91.07, 9, 21, 2822],
  ['2026-11-08', 102.02, 23, 34, 3332],
  ['2026-11-09', 165.34, 20, 42, 5218],
  ['2026-11-10', 123.02, 26, 39, 4094],
  ['2026-11-11', 90.66, 29, 51, 3116],
  ['2026-11-12', 90.52, 13, 18, 3210],
  ['2026-11-13', 0.6, 1, 1, 14],
  ['2026-11-14', 0, 0, 0, 0],
  ['2026-11-15', 0, 0, 0, 0],
  ['2026-11-16', 0, 0, 0, 0],
  ['2026-11-17', 0, 0, 0, 0],
  ['2026-11-18', 0, 0, 0, 0],
  ['2026-11-19', 143.59, 12, 27, 3352],
  ['2026-11-20', 185.57, 18, 41, 4745],
  ['2026-11-21', 178.83, 20, 36, 4818],
  ['2026-11-22', 43.23, 4, 4, 1061],
  ['2026-11-23', 188.3, 16, 24, 3804],
  ['2026-11-24', 92.04, 9, 14, 1966],
];

export const INITIAL_RECORDS: DailyAdRecord[] = RAW_INITIAL_ROWS.map(
  ([date, spend, leads, clicks, impressions]) => ({
    id: `${DEFAULT_CAMPAIGN}::${date}`,
    date,
    campaign: DEFAULT_CAMPAIGN,
    spend,
    leads,
    clicks,
    impressions,
    deliveryStatus: spend > 0 ? 'active' : 'inactive',
    source: 'initial',
  })
);
