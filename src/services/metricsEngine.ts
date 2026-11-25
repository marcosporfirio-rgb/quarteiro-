import {
  AggregatedMetrics,
  DailyAdRecord,
  DailyComputedRow,
  DateFilterPreset,
  DayTypeFilter,
  PauseComparison,
  WeekdaySummary,
} from '../types/ads';
import {
  addDays,
  diffDaysInclusive,
  generateDateRange,
  getDayOfWeekIndex,
  getDayOfWeekName,
  getDayOfWeekShort,
  isWeekday,
  WEEKDAY_NAMES_MON_FIRST,
  WEEKDAY_SHORTS_MON_FIRST,
} from '../utils/dateUtils';

export function getAvailableCampaigns(records: DailyAdRecord[]): string[] {
  const set = new Set<string>();
  records.forEach((r) => {
    if (r.campaign.trim()) set.add(r.campaign.trim());
  });
  return Array.from(set).sort();
}

/**
 * Normalizes a campaign's records into a continuous daily calendar from minDate to maxDate,
 * preserving explicit rows (including null leads) and filling gaps with 0/0/0/0.
 */
export function buildContinuousTimeline(
  records: DailyAdRecord[],
  campaign: string
): DailyAdRecord[] {
  const filtered = records
    .filter((r) => (campaign === '__ALL__' ? true : r.campaign === campaign))
    .sort((a, b) => a.date.localeCompare(b.date));

  if (filtered.length === 0) return [];

  const byDate = new Map<string, DailyAdRecord>();
  for (const r of filtered) {
    const existing = byDate.get(r.date);
    if (!existing) {
      byDate.set(r.date, { ...r });
    } else {
      // If __ALL__ campaigns aggregated on same date
      const combinedLeads =
        existing.leads === null && r.leads === null
          ? null
          : (existing.leads ?? 0) + (r.leads ?? 0);
      byDate.set(r.date, {
        ...existing,
        campaign: campaign === '__ALL__' ? 'Todas as campanhas' : existing.campaign,
        spend: existing.spend + r.spend,
        leads: combinedLeads,
        clicks: existing.clicks + r.clicks,
        impressions: existing.impressions + r.impressions,
      });
    }
  }

  const dates = Array.from(byDate.keys()).sort();
  const minDate = dates[0];
  const maxDate = dates[dates.length - 1];
  const allDates = generateDateRange(minDate, maxDate);

  return allDates.map((date) => {
    const found = byDate.get(date);
    if (found) return found;
    return {
      id: `${campaign}::${date}`,
      date,
      campaign: campaign === '__ALL__' ? 'Todas as campanhas' : campaign,
      spend: 0,
      leads: 0,
      clicks: 0,
      impressions: 0,
      deliveryStatus: 'inactive',
      source: 'initial',
    };
  });
}

export function applyDayTypeFilter(
  records: DailyAdRecord[],
  dayFilter: DayTypeFilter
): DailyAdRecord[] {
  switch (dayFilter) {
    case 'weekdays':
      return records.filter((r) => isWeekday(r.date));
    case 'weekends':
      return records.filter((r) => !isWeekday(r.date));
    case 'active_only':
      return records.filter((r) => r.spend > 0);
    case 'all':
    default:
      return records;
  }
}

export function resolvePeriodRange(
  timeline: DailyAdRecord[],
  preset: DateFilterPreset,
  customStart: string,
  customEnd: string
): {
  currentStart: string;
  currentEnd: string;
  previousStart: string;
  previousEnd: string;
  lastAvailableDate: string;
  firstAvailableDate: string;
} {
  if (timeline.length === 0) {
    return {
      currentStart: '',
      currentEnd: '',
      previousStart: '',
      previousEnd: '',
      lastAvailableDate: '',
      firstAvailableDate: '',
    };
  }

  const firstAvailableDate = timeline[0].date;
  const lastAvailableDate = timeline[timeline.length - 1].date;

  let currentStart = lastAvailableDate;
  let currentEnd = lastAvailableDate;

  if (preset === '7d') {
    currentEnd = lastAvailableDate;
    currentStart = addDays(lastAvailableDate, -6);
  } else if (preset === '14d') {
    currentEnd = lastAvailableDate;
    currentStart = addDays(lastAvailableDate, -13);
  } else if (preset === '30d') {
    currentEnd = lastAvailableDate;
    currentStart = addDays(lastAvailableDate, -29);
  } else if (preset === 'previous') {
    // 7 days prior to the last 7 days (i.e. 11/11 to 17/11 when last date is 24/11)
    currentEnd = addDays(lastAvailableDate, -7);
    currentStart = addDays(currentEnd, -6);
  } else {
    currentStart = customStart || addDays(lastAvailableDate, -6);
    currentEnd = customEnd || lastAvailableDate;
    if (currentStart > currentEnd) {
      const tmp = currentStart;
      currentStart = currentEnd;
      currentEnd = tmp;
    }
  }

  const spanDays = Math.max(1, diffDaysInclusive(currentStart, currentEnd));
  const previousEnd = addDays(currentStart, -1);
  const previousStart = addDays(previousEnd, -(spanDays - 1));

  return {
    currentStart,
    currentEnd,
    previousStart,
    previousEnd,
    lastAvailableDate,
    firstAvailableDate,
  };
}

export function sliceAndFillRange(
  timeline: DailyAdRecord[],
  start: string,
  end: string,
  campaign: string
): DailyAdRecord[] {
  if (!start || !end || start > end) return [];
  const byDate = new Map(timeline.map((r) => [r.date, r]));
  const rangeDates = generateDateRange(start, end);
  return rangeDates.map((date) => {
    const found = byDate.get(date);
    if (found) return found;
    return {
      id: `${campaign}::${date}`,
      date,
      campaign,
      spend: 0,
      leads: 0,
      clicks: 0,
      impressions: 0,
      deliveryStatus: 'inactive',
      source: 'initial',
    };
  });
}

/**
 * Strict calculation rules (Section 17):
 * - No arithmetic mean of daily CPL, CPC, CTR, CPM
 * - Never divide by zero (returns null)
 * - Differentiates missing leads (null) from 0
 */
export function calculateAggregatedMetrics(records: DailyAdRecord[]): AggregatedMetrics {
  let spend = 0;
  let leads = 0;
  let clicks = 0;
  let impressions = 0;
  let activeDays = 0;
  let missingLeadsDays = 0;

  for (const r of records) {
    spend += r.spend;
    if (r.leads !== null && r.leads !== undefined) {
      leads += r.leads;
    } else if (r.spend > 0) {
      missingLeadsDays += 1;
    }
    clicks += r.clicks;
    impressions += r.impressions;
    if (r.spend > 0) {
      activeDays += 1;
    }
  }

  const totalDays = records.length;

  return {
    spend,
    leads,
    clicks,
    impressions,
    cpl: leads > 0 ? spend / leads : null,
    cpc: clicks > 0 ? spend / clicks : null,
    ctr: impressions > 0 ? (clicks / impressions) * 100 : null,
    cpm: impressions > 0 ? (spend / impressions) * 1000 : null,
    leadsPerDay: totalDays > 0 ? leads / totalDays : null,
    leadsPerActiveDay: activeDays > 0 ? leads / activeDays : null,
    spendPerDay: totalDays > 0 ? spend / totalDays : null,
    spendPerActiveDay: activeDays > 0 ? spend / activeDays : null,
    convPerClick: clicks > 0 ? (leads / clicks) * 100 : null,
    totalDays,
    activeDays,
    missingLeadsDays,
  };
}

export function calculatePercentVariation(
  current: number | null,
  previous: number | null
): number | null {
  if (current === null || previous === null || previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

export function buildDailyComputedRows(records: DailyAdRecord[]): DailyComputedRow[] {
  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));

  return sorted.map((r, index) => {
    const prev = index > 0 ? sorted[index - 1] : null;
    const cpl = r.leads !== null && r.leads > 0 ? r.spend / r.leads : null;
    const cpc = r.clicks > 0 ? r.spend / r.clicks : null;
    const ctr = r.impressions > 0 ? (r.clicks / r.impressions) * 100 : null;
    const cpm = r.impressions > 0 ? (r.spend / r.impressions) * 1000 : null;
    const convPerClick =
      r.leads !== null && r.clicks > 0 ? (r.leads / r.clicks) * 100 : null;

    const prevLeads = prev?.leads ?? null;
    const prevCpl =
      prev && prev.leads !== null && prev.leads > 0 ? prev.spend / prev.leads : null;

    const leadsDelta =
      r.leads !== null && prevLeads !== null ? r.leads - prevLeads : null;
    const leadsDeltaPct = calculatePercentVariation(r.leads, prevLeads);

    const cplDelta = cpl !== null && prevCpl !== null ? cpl - prevCpl : null;
    const cplDeltaPct = calculatePercentVariation(cpl, prevCpl);

    return {
      ...r,
      dayName: getDayOfWeekName(r.date),
      dayShort: getDayOfWeekShort(r.date),
      dayIndex: getDayOfWeekIndex(r.date),
      isWeekday: isWeekday(r.date),
      hasSpend: r.spend > 0,
      isIncomplete: r.spend > 0 && r.leads === null,
      cpl,
      cpc,
      ctr,
      cpm,
      convPerClick,
      leadsDelta,
      leadsDeltaPct,
      cplDelta,
      cplDeltaPct,
    };
  });
}

export function calculateWeekdayAnalysis(records: DailyAdRecord[]): WeekdaySummary[] {
  const buckets: DailyAdRecord[][] = Array.from({ length: 7 }, () => []);
  for (const r of records) {
    const idx = getDayOfWeekIndex(r.date);
    buckets[idx].push(r);
  }

  return buckets.map((bucket, dayIndex) => {
    const agg = calculateAggregatedMetrics(bucket);
    return {
      dayIndex,
      dayName: WEEKDAY_NAMES_MON_FIRST[dayIndex],
      dayShort: WEEKDAY_SHORTS_MON_FIRST[dayIndex],
      occurrences: agg.totalDays,
      activeDays: agg.activeDays,
      spend: agg.spend,
      leads: agg.leads,
      clicks: agg.clicks,
      impressions: agg.impressions,
      leadsPerCalendarDay: agg.leadsPerDay,
      leadsPerActiveDay: agg.leadsPerActiveDay,
      avgSpendPerCalendarDay: agg.spendPerDay,
      avgSpendPerActiveDay: agg.spendPerActiveDay,
      cpl: agg.cpl,
      cpc: agg.cpc,
      ctr: agg.ctr,
      cpm: agg.cpm,
      smallSample: agg.activeDays < 4,
    };
  });
}

export function calculateWeekdaysVsWeekends(records: DailyAdRecord[]) {
  const weekdayRecords = records.filter((r) => isWeekday(r.date));
  const weekendRecords = records.filter((r) => !isWeekday(r.date));

  const weekdays = calculateAggregatedMetrics(weekdayRecords);
  const weekends = calculateAggregatedMetrics(weekendRecords);
  const totalLeads = weekdays.leads + weekends.leads;

  const weekdaysLeadShare = totalLeads > 0 ? (weekdays.leads / totalLeads) * 100 : null;
  const weekendsLeadShare = totalLeads > 0 ? (weekends.leads / totalLeads) * 100 : null;

  const weekendCplDiffPct = calculatePercentVariation(weekends.cpl, weekdays.cpl);

  return {
    weekdays,
    weekends,
    weekdaysLeadShare,
    weekendsLeadShare,
    weekendCplDiffPct,
  };
}

/**
 * Automatically detects consecutive zero-spend pauses (>= 2 days) flanked by active periods.
 */
export function detectPauseComparisons(timeline: DailyAdRecord[]): PauseComparison[] {
  if (timeline.length === 0) return [];
  const sorted = [...timeline].sort((a, b) => a.date.localeCompare(b.date));

  // Find first and last active indices
  const firstActive = sorted.findIndex((r) => r.spend > 0);
  if (firstActive === -1) return [];

  let lastActive = sorted.length - 1;
  while (lastActive >= 0 && sorted[lastActive].spend === 0) {
    lastActive--;
  }

  const comparisons: PauseComparison[] = [];
  let i = firstActive;

  while (i <= lastActive) {
    if (sorted[i].spend === 0) {
      const pauseStartIdx = i;
      while (i <= lastActive && sorted[i].spend === 0) {
        i++;
      }
      const pauseEndIdx = i - 1;
      const pauseDays = pauseEndIdx - pauseStartIdx + 1;

      if (pauseDays >= 2) {
        // Find contiguous active segment immediately before pause
        let beforeStartIdx = pauseStartIdx - 1;
        while (beforeStartIdx >= firstActive && sorted[beforeStartIdx].spend > 0) {
          beforeStartIdx--;
        }
        beforeStartIdx += 1;

        // Find contiguous active segment immediately after pause
        let afterEndIdx = pauseEndIdx + 1;
        while (afterEndIdx <= lastActive && sorted[afterEndIdx].spend > 0) {
          afterEndIdx++;
        }
        afterEndIdx -= 1;

        const beforeSlice = sorted.slice(beforeStartIdx, pauseStartIdx);
        const afterSlice = sorted.slice(pauseEndIdx + 1, afterEndIdx + 1);

        if (beforeSlice.length > 0 && afterSlice.length > 0) {
          comparisons.push({
            pauseStart: sorted[pauseStartIdx].date,
            pauseEnd: sorted[pauseEndIdx].date,
            pauseDays,
            beforeStart: beforeSlice[0].date,
            beforeEnd: beforeSlice[beforeSlice.length - 1].date,
            beforeMetrics: calculateAggregatedMetrics(beforeSlice),
            afterStart: afterSlice[0].date,
            afterEnd: afterSlice[afterSlice.length - 1].date,
            afterMetrics: calculateAggregatedMetrics(afterSlice),
          });
        }
      }
    } else {
      i++;
    }
  }

  return comparisons;
}

export function getBestAndWorstDays(rows: DailyComputedRow[]) {
  const activeRows = rows.filter((r) => r.spend > 0);
  const validLeadRows = activeRows.filter((r) => r.leads !== null && r.leads > 0);

  const highestLeadsDay =
    activeRows
      .filter((r) => r.leads !== null)
      .sort((a, b) => (b.leads ?? 0) - (a.leads ?? 0))[0] ?? null;

  const lowestCplDay =
    validLeadRows
      .filter((r) => r.cpl !== null)
      .sort((a, b) => (a.cpl ?? Infinity) - (b.cpl ?? Infinity))[0] ?? null;

  const highestCplDay =
    validLeadRows
      .filter((r) => r.cpl !== null)
      .sort((a, b) => (b.cpl ?? -Infinity) - (a.cpl ?? -Infinity))[0] ?? null;

  const highestSpendDay =
    [...activeRows].sort((a, b) => b.spend - a.spend)[0] ?? null;

  const lowestLeadsActiveDay =
    activeRows
      .filter((r) => r.leads !== null)
      .sort((a, b) => (a.leads ?? Infinity) - (b.leads ?? Infinity))[0] ?? null;

  return {
    highestLeadsDay,
    lowestCplDay,
    highestCplDay,
    highestSpendDay,
    lowestLeadsActiveDay,
  };
}
