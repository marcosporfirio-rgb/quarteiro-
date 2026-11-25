import React, { useMemo, useState } from 'react';
import { AlertTriangle, Briefcase, Info } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { DailyAdRecord } from '../../types/ads';
import {
  formatDateBR,
  formatShortDateBR,
  getDayOfWeekIndex,
  WEEKDAY_SHORTS_MON_FIRST,
} from '../../utils/dateUtils';
import {
  formatBRL,
  formatNumber,
  formatPercent,
} from '../../utils/formatters';
import {
  calculateWeekdayAnalysis,
  calculateWeekdaysVsWeekends,
} from '../../services/metricsEngine';
import { ChartCard } from '../ui/ChartCard';

interface WeekdayAnalysisViewProps {
  allCampaignRecords: DailyAdRecord[];
  filteredPeriodRecords: DailyAdRecord[];
}

export const WeekdayAnalysisView: React.FC<WeekdayAnalysisViewProps> = ({
  allCampaignRecords,
  filteredPeriodRecords,
}) => {
  const [scope, setScope] = useState<'history' | 'period'>('history');
  const activeDataset = scope === 'history' ? allCampaignRecords : filteredPeriodRecords;

  const weekdayStats = useMemo(
    () => calculateWeekdayAnalysis(activeDataset),
    [activeDataset]
  );

  // Section 12: Weekdays vs Weekends on the currently filtered period (e.g. 18/11 to 24/11)
  const wvwe = useMemo(
    () => calculateWeekdaysVsWeekends(filteredPeriodRecords),
    [filteredPeriodRecords]
  );

  const byVolume = useMemo(
    () => [...weekdayStats].sort((a, b) => b.leads - a.leads),
    [weekdayStats]
  );

  const byLowestCpl = useMemo(
    () =>
      [...weekdayStats]
        .filter((d) => d.cpl !== null)
        .sort((a, b) => (a.cpl ?? Infinity) - (b.cpl ?? Infinity)),
    [weekdayStats]
  );

  const byHighestCtr = useMemo(
    () =>
      [...weekdayStats]
        .filter((d) => d.ctr !== null)
        .sort((a, b) => (b.ctr ?? -Infinity) - (a.ctr ?? -Infinity)),
    [weekdayStats]
  );

  const hasSmallSample = weekdayStats.some((d) => d.smallSample);

  const chartData = weekdayStats.map((w) => ({
    dayShort: w.dayShort,
    dayName: w.dayName,
    leads: w.leads,
    spend: Number(w.spend.toFixed(2)),
    leadsPerActiveDay: Number((w.leadsPerActiveDay ?? 0).toFixed(2)),
    leadsPerCalendarDay: Number((w.leadsPerCalendarDay ?? 0).toFixed(2)),
    cpl: w.cpl !== null ? Number(w.cpl.toFixed(2)) : null,
  }));

  // Week x Weekday matrix heatmap
  const weekRows = useMemo(() => {
    const sorted = [...allCampaignRecords].sort((a, b) => a.date.localeCompare(b.date));
    const weeksMap = new Map<string, Array<DailyAdRecord | null>>();

    sorted.forEach((rec) => {
      const idx = getDayOfWeekIndex(rec.date);
      // Compute Monday of that week as key
      const dt = new Date(rec.date + 'T00:00:00Z');
      dt.setUTCDate(dt.getUTCDate() - idx);
      const weekStart = dt.toISOString().slice(0, 10);
      if (!weeksMap.has(weekStart)) {
        weeksMap.set(weekStart, Array(7).fill(null));
      }
      const arr = weeksMap.get(weekStart)!;
      arr[idx] = rec;
    });

    return Array.from(weeksMap.entries()).map(([weekStart, days]) => ({
      weekStart,
      days,
    }));
  }, [allCampaignRecords]);

  const maxCellLeads = Math.max(
    1,
    ...allCampaignRecords.map((r) => r.leads ?? 0)
  );

  return (
    <div className="space-y-6">
      {/* Scope control & small sample alert */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-[#0F172A] dark:text-white">
              Análise consolidada por dia da semana
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Agrupamento de segunda-feira a domingo para identificar padrões de geração de leads e eficiência
            </p>
          </div>

          <div className="flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 p-1">
            <button
              type="button"
              onClick={() => setScope('history')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                scope === 'history'
                  ? 'bg-white dark:bg-slate-700 text-[#142B46] dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Histórico completo
            </button>
            <button
              type="button"
              onClick={() => setScope('period')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                scope === 'period'
                  ? 'bg-white dark:bg-slate-700 text-[#142B46] dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Apenas período filtrado
            </button>
          </div>
        </div>

        {hasSmallSample && (
          <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/80 dark:bg-amber-950/30 p-3.5 text-xs text-amber-900 dark:text-amber-200">
            <AlertTriangle className="h-4 w-4 shrink-0 text-[#D97706] mt-0.5" />
            <div>
              <strong>Alerta de amostra pequena:</strong> um ou mais dias da semana
              possuem menos de 4 ocorrências com investimento. Não é recomendado suspender
              definitivamente um dia da semana com base em amostra insuficiente.
            </div>
          </div>
        )}

        {/* Complete Seg-Dom Table */}
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                <th className="py-2.5 px-3">Dia da semana</th>
                <th className="py-2.5 px-2 text-right">Ocorrências</th>
                <th className="py-2.5 px-2 text-right">Dias ativos</th>
                <th className="py-2.5 px-3 text-right">Investimento</th>
                <th className="py-2.5 px-2 text-right">Leads</th>
                <th className="py-2.5 px-3 text-right">Média/dia corrido</th>
                <th className="py-2.5 px-3 text-right">Média/dia ativo</th>
                <th className="py-2.5 px-3 text-right">Invest. médio</th>
                <th className="py-2.5 px-3 text-right">CPL</th>
                <th className="py-2.5 px-3 text-right">CPC</th>
                <th className="py-2.5 px-3 text-right">CTR</th>
                <th className="py-2.5 px-3 text-right">CPM</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {weekdayStats.map((w) => (
                <tr
                  key={w.dayIndex}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                >
                  <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                    {w.dayName}
                    {w.smallSample && (
                      <span
                        title="Menos de 4 ocorrências com investimento"
                        className="ml-1.5 text-[10px] font-semibold text-[#D97706]"
                      >
                        (amostra &lt; 4)
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-2 text-right tabular-nums">{w.occurrences}</td>
                  <td className="py-2.5 px-2 text-right tabular-nums font-medium">
                    {w.activeDays}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums">{formatBRL(w.spend)}</td>
                  <td className="py-2.5 px-2 text-right tabular-nums font-semibold text-[#2563EB] dark:text-blue-400">
                    {formatNumber(w.leads)}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums">
                    {formatNumber(w.leadsPerCalendarDay, 2)}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums font-medium">
                    {formatNumber(w.leadsPerActiveDay, 2)}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums">
                    {formatBRL(w.avgSpendPerActiveDay)}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums font-semibold">
                    {formatBRL(w.cpl)}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums">{formatBRL(w.cpc)}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums">{formatPercent(w.ctr)}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums">{formatBRL(w.cpm)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 3 Rankings */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <h3 className="text-sm font-semibold text-[#0F172A] dark:text-white mb-3">
            Ranking por volume de leads
          </h3>
          <div className="space-y-2 text-xs">
            {byVolume.map((d, i) => (
              <div
                key={d.dayIndex}
                className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0"
              >
                <span className="text-slate-700 dark:text-slate-300">
                  <strong className="text-slate-400 mr-1.5 tabular-nums">#{i + 1}</strong>
                  {d.dayName}
                </span>
                <span className="font-semibold text-[#2563EB] dark:text-blue-400 tabular-nums">
                  {formatNumber(d.leads)} leads
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <h3 className="text-sm font-semibold text-[#0F172A] dark:text-white mb-3">
            Ranking por menor CPL
          </h3>
          <div className="space-y-2 text-xs">
            {byLowestCpl.map((d, i) => (
              <div
                key={d.dayIndex}
                className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0"
              >
                <span className="text-slate-700 dark:text-slate-300">
                  <strong className="text-slate-400 mr-1.5 tabular-nums">#{i + 1}</strong>
                  {d.dayName}
                </span>
                <span className="font-semibold text-[#16A34A] dark:text-emerald-400 tabular-nums">
                  {formatBRL(d.cpl)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <h3 className="text-sm font-semibold text-[#0F172A] dark:text-white mb-3">
            Ranking por maior CTR
          </h3>
          <div className="space-y-2 text-xs">
            {byHighestCtr.map((d, i) => (
              <div
                key={d.dayIndex}
                className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0"
              >
                <span className="text-slate-700 dark:text-slate-300">
                  <strong className="text-slate-400 mr-1.5 tabular-nums">#{i + 1}</strong>
                  {d.dayName}
                </span>
                <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
                  {formatPercent(d.ctr)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard
          title="Média diária de leads por dia da semana"
          subtitle="Comparação entre média por dia ativo e por dia corrido"
        >
          {() => (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 12, left: -12, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} />
                <XAxis dataKey="dayShort" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar
                  dataKey="leadsPerActiveDay"
                  name="Média / dia ativo"
                  fill="#2563EB"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="leadsPerCalendarDay"
                  name="Média / dia corrido"
                  fill="#94A3B8"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          title="Investimento versus leads por dia da semana"
          subtitle="Consolidado de investimento (R$) e volume total de leads"
        >
          {() => (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 12, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} />
                <XAxis dataKey="dayShort" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis
                  yAxisId="left"
                  tickFormatter={(v) => `R$${v}`}
                  tick={{ fontSize: 11, fill: '#142B46' }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11, fill: '#2563EB' }}
                />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar
                  yAxisId="left"
                  dataKey="spend"
                  name="Investimento (R$)"
                  fill="#142B46"
                  radius={[4, 4, 0, 0]}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="leads"
                  name="Leads"
                  stroke="#2563EB"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Heatmap Week x Weekday */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
        <h3 className="text-sm font-semibold text-[#0F172A] dark:text-white mb-1">
          Heatmap de desempenho por semana e dia da semana
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Matriz semanal de leads gerados em todo o histórico da campanha
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="text-slate-500 dark:text-slate-400 font-semibold">
                <th className="py-2 pr-3 text-left">Semana (início)</th>
                {WEEKDAY_SHORTS_MON_FIRST.map((d) => (
                  <th key={d} className="py-2 px-1.5 text-center">
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weekRows.map((row) => (
                <tr key={row.weekStart}>
                  <td className="py-1.5 pr-3 font-medium tabular-nums text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    {formatShortDateBR(row.weekStart)}
                  </td>
                  {row.days.map((cell, idx) => {
                    if (!cell) {
                      return (
                        <td key={idx} className="p-1">
                          <div className="h-11 rounded-md bg-slate-50 dark:bg-slate-800/30" />
                        </td>
                      );
                    }
                    const isInc = cell.spend > 0 && cell.leads === null;
                    const ratio = (cell.leads ?? 0) / maxCellLeads;
                    let cls =
                      'bg-slate-100 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500';
                    if (isInc) {
                      cls =
                        'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300';
                    } else if (cell.spend > 0) {
                      if (ratio >= 0.7) cls = 'bg-[#142B46] text-white dark:bg-blue-600';
                      else if (ratio >= 0.4) cls = 'bg-[#2563EB] text-white';
                      else cls = 'bg-blue-100 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200';
                    }
                    return (
                      <td key={idx} className="p-1">
                        <div
                          title={`${formatDateBR(cell.date)} · ${formatBRL(cell.spend)} · ${
                            cell.leads === null ? 'N/D' : `${cell.leads} leads`
                          }`}
                          className={`h-11 rounded-md flex flex-col items-center justify-center tabular-nums ${cls}`}
                        >
                          <span className="font-bold text-xs">
                            {isInc ? 'N/D' : cell.leads}
                          </span>
                          <span className="text-[9px] opacity-80">
                            {formatShortDateBR(cell.date)}
                          </span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 12: Dias Úteis vs. Finais de Semana */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-semibold text-[#0F172A] dark:text-white">
              Dias úteis versus finais de semana (período selecionado)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Comparação entre segunda a sexta-feira e sábado/domingo no recorte atual
            </p>
          </div>
          {wvwe.weekendCplDiffPct !== null && (
            <div className="text-xs font-semibold tabular-nums text-[#2563EB] dark:text-blue-400">
              CPL de fim de semana{' '}
              {wvwe.weekendCplDiffPct < 0
                ? `${Math.abs(wvwe.weekendCplDiffPct).toFixed(1).replace('.', ',')}% menor`
                : `${wvwe.weekendCplDiffPct.toFixed(1).replace('.', ',')}% maior`}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Weekdays */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-800/30">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-[#142B46] dark:text-white">
                Dias úteis (Seg–Sex)
              </span>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 tabular-nums">
                {formatPercent(wvwe.weekdaysLeadShare, 1)} dos leads
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs tabular-nums">
              <div>
                <div className="text-slate-500 dark:text-slate-400">Investimento</div>
                <div className="mt-0.5 font-bold text-slate-900 dark:text-white">
                  {formatBRL(wvwe.weekdays.spend)}
                </div>
              </div>
              <div>
                <div className="text-slate-500 dark:text-slate-400">Leads</div>
                <div className="mt-0.5 font-bold text-[#2563EB] dark:text-blue-400">
                  {formatNumber(wvwe.weekdays.leads)}
                </div>
              </div>
              <div>
                <div className="text-slate-500 dark:text-slate-400">CPL</div>
                <div className="mt-0.5 font-bold text-slate-900 dark:text-white">
                  {formatBRL(wvwe.weekdays.cpl)}
                </div>
              </div>
              <div>
                <div className="text-slate-500 dark:text-slate-400">Média/dia</div>
                <div className="mt-0.5 font-semibold text-slate-800 dark:text-slate-200">
                  {formatNumber(wvwe.weekdays.leadsPerDay, 2)}
                </div>
              </div>
              <div>
                <div className="text-slate-500 dark:text-slate-400">CPC</div>
                <div className="mt-0.5 font-medium">{formatBRL(wvwe.weekdays.cpc)}</div>
              </div>
              <div>
                <div className="text-slate-500 dark:text-slate-400">CTR</div>
                <div className="mt-0.5 font-medium">{formatPercent(wvwe.weekdays.ctr)}</div>
              </div>
              <div>
                <div className="text-slate-500 dark:text-slate-400">CPM</div>
                <div className="mt-0.5 font-medium">{formatBRL(wvwe.weekdays.cpm)}</div>
              </div>
              <div>
                <div className="text-slate-500 dark:text-slate-400">Dias ativos</div>
                <div className="mt-0.5 font-medium">
                  {wvwe.weekdays.activeDays}/{wvwe.weekdays.totalDays}
                </div>
              </div>
            </div>
          </div>

          {/* Weekends */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-800/30">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-[#142B46] dark:text-white">
                Finais de semana (Sáb–Dom)
              </span>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 tabular-nums">
                {formatPercent(wvwe.weekendsLeadShare, 1)} dos leads
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs tabular-nums">
              <div>
                <div className="text-slate-500 dark:text-slate-400">Investimento</div>
                <div className="mt-0.5 font-bold text-slate-900 dark:text-white">
                  {formatBRL(wvwe.weekends.spend)}
                </div>
              </div>
              <div>
                <div className="text-slate-500 dark:text-slate-400">Leads</div>
                <div className="mt-0.5 font-bold text-[#2563EB] dark:text-blue-400">
                  {formatNumber(wvwe.weekends.leads)}
                </div>
              </div>
              <div>
                <div className="text-slate-500 dark:text-slate-400">CPL</div>
                <div className="mt-0.5 font-bold text-[#16A34A] dark:text-emerald-400">
                  {formatBRL(wvwe.weekends.cpl)}
                </div>
              </div>
              <div>
                <div className="text-slate-500 dark:text-slate-400">Média/dia</div>
                <div className="mt-0.5 font-semibold text-slate-800 dark:text-slate-200">
                  {formatNumber(wvwe.weekends.leadsPerDay, 2)}
                </div>
              </div>
              <div>
                <div className="text-slate-500 dark:text-slate-400">CPC</div>
                <div className="mt-0.5 font-medium">{formatBRL(wvwe.weekends.cpc)}</div>
              </div>
              <div>
                <div className="text-slate-500 dark:text-slate-400">CTR</div>
                <div className="mt-0.5 font-medium">{formatPercent(wvwe.weekends.ctr)}</div>
              </div>
              <div>
                <div className="text-slate-500 dark:text-slate-400">CPM</div>
                <div className="mt-0.5 font-medium">{formatBRL(wvwe.weekends.cpm)}</div>
              </div>
              <div>
                <div className="text-slate-500 dark:text-slate-400">Dias ativos</div>
                <div className="mt-0.5 font-medium">
                  {wvwe.weekends.activeDays}/{wvwe.weekends.totalDays}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* B2B Commercial quality advisory */}
        <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-blue-200 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/30 p-3.5 text-xs text-slate-700 dark:text-slate-200">
          <Briefcase className="h-4 w-4 shrink-0 text-[#2563EB] mt-0.5" />
          <div>
            <strong>Recomendação B2B (validação comercial):</strong>{' '}
            {wvwe.weekendCplDiffPct !== null && wvwe.weekendCplDiffPct < 0
              ? `No recorte atual, o CPL de final de semana foi ${Math.abs(
                  wvwe.weekendCplDiffPct
                )
                  .toFixed(1)
                  .replace('.', ',')}% menor (${formatBRL(
                  wvwe.weekends.cpl
                )} vs. ${formatBRL(wvwe.weekdays.cpl)}). `
              : ''}
            Como se trata de uma operação B2B com atendimento via WhatsApp, valide com o
            time comercial a taxa de qualificação, perfil decisor e aproveitamento dos
            leads gerados aos finais de semana antes de redistribuir orçamento.
          </div>
        </div>

        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400">
          <Info className="h-3.5 w-3.5" />
          <span>
            Métricas consolidadas respeitam a razão dos totais de cada segmento, sem média aritmética simples.
          </span>
        </div>
      </section>
    </div>
  );
};
