import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AggregatedMetrics, DailyComputedRow } from '../../types/ads';
import {
  formatDateBR,
  WEEKDAY_SHORTS_MON_FIRST,
} from '../../utils/dateUtils';
import {
  formatBRL,
  formatDeltaPercent,
  formatNumber,
  formatPercent,
} from '../../utils/formatters';
import {
  calculateAggregatedMetrics,
  calculatePercentVariation,
} from '../../services/metricsEngine';
import { ChartCard } from '../ui/ChartCard';

interface WeeklyComparisonViewProps {
  current: AggregatedMetrics;
  previous: AggregatedMetrics;
  currentRows: DailyComputedRow[];
  previousRows: DailyComputedRow[];
  currentStart: string;
  currentEnd: string;
  previousStart: string;
  previousEnd: string;
}

export const WeeklyComparisonView: React.FC<WeeklyComparisonViewProps> = ({
  current,
  previous,
  currentRows,
  previousRows,
  currentStart,
  currentEnd,
  previousStart,
  previousEnd,
}) => {
  const [mode, setMode] = useState<'total' | 'active_avg'>('total');
  const [weekdayMetric, setWeekdayMetric] = useState<'leads' | 'spend' | 'cpl'>('leads');

  // Grouped comparison Mon -> Sun
  const weekdayComparisonData = WEEKDAY_SHORTS_MON_FIRST.map((dayShort, idx) => {
    const currBucket = currentRows.filter((r) => r.dayIndex === idx);
    const prevBucket = previousRows.filter((r) => r.dayIndex === idx);
    const currAgg = calculateAggregatedMetrics(currBucket);
    const prevAgg = calculateAggregatedMetrics(prevBucket);

    const getVal = (agg: AggregatedMetrics) => {
      if (weekdayMetric === 'leads') {
        return mode === 'total' ? agg.leads : Number((agg.leadsPerActiveDay ?? 0).toFixed(2));
      }
      if (weekdayMetric === 'spend') {
        return mode === 'total'
          ? Number(agg.spend.toFixed(2))
          : Number((agg.spendPerActiveDay ?? 0).toFixed(2));
      }
      return agg.cpl !== null ? Number(agg.cpl.toFixed(2)) : 0;
    };

    return {
      dayShort,
      atual: getVal(currAgg),
      anterior: getVal(prevAgg),
      currLeads: currAgg.leads,
      prevLeads: prevAgg.leads,
      currSpend: currAgg.spend,
      prevSpend: prevAgg.spend,
      currCpl: currAgg.cpl,
      prevCpl: prevAgg.cpl,
    };
  });

  const metricRows = [
    {
      label: mode === 'total' ? 'Leads gerados' : 'Média de leads / dia ativo',
      currNum: mode === 'total' ? current.leads : current.leadsPerActiveDay,
      prevNum: mode === 'total' ? previous.leads : previous.leadsPerActiveDay,
      fmt: (v: number | null) =>
        formatNumber(v, mode === 'total' ? 0 : 2),
      tone: 'higher' as const,
    },
    {
      label: mode === 'total' ? 'Investimento total' : 'Investimento / dia ativo',
      currNum: mode === 'total' ? current.spend : current.spendPerActiveDay,
      prevNum: mode === 'total' ? previous.spend : previous.spendPerActiveDay,
      fmt: (v: number | null) => formatBRL(v),
      tone: 'neutral' as const,
    },
    {
      label: 'CPL consolidado',
      currNum: current.cpl,
      prevNum: previous.cpl,
      fmt: (v: number | null) => formatBRL(v),
      tone: 'lower' as const,
    },
    {
      label: 'CPC de link',
      currNum: current.cpc,
      prevNum: previous.cpc,
      fmt: (v: number | null) => formatBRL(v),
      tone: 'lower' as const,
    },
    {
      label: 'CTR de link',
      currNum: current.ctr,
      prevNum: previous.ctr,
      fmt: (v: number | null) => formatPercent(v),
      tone: 'higher' as const,
    },
    {
      label: 'CPM',
      currNum: current.cpm,
      prevNum: previous.cpm,
      fmt: (v: number | null) => formatBRL(v),
      tone: 'lower' as const,
    },
    {
      label: 'Média diária de leads (dias corridos)',
      currNum: current.leadsPerDay,
      prevNum: previous.leadsPerDay,
      fmt: (v: number | null) => formatNumber(v, 2),
      tone: 'higher' as const,
    },
  ];

  const volumeChartData = [
    {
      metric: 'Leads',
      atual: mode === 'total' ? current.leads : Number((current.leadsPerActiveDay ?? 0).toFixed(2)),
      anterior: mode === 'total' ? previous.leads : Number((previous.leadsPerActiveDay ?? 0).toFixed(2)),
    },
    {
      metric: 'Média diária',
      atual: Number((current.leadsPerDay ?? 0).toFixed(2)),
      anterior: Number((previous.leadsPerDay ?? 0).toFixed(2)),
    },
  ];

  const spendChartData = [
    {
      metric: mode === 'total' ? 'Investimento total' : 'Investimento / dia ativo',
      atual:
        mode === 'total'
          ? Number(current.spend.toFixed(2))
          : Number((current.spendPerActiveDay ?? 0).toFixed(2)),
      anterior:
        mode === 'total'
          ? Number(previous.spend.toFixed(2))
          : Number((previous.spendPerActiveDay ?? 0).toFixed(2)),
    },
  ];

  const costEfficiencyData = [
    {
      metric: 'CPL (R$)',
      atual: Number((current.cpl ?? 0).toFixed(2)),
      anterior: Number((previous.cpl ?? 0).toFixed(2)),
    },
    {
      metric: 'CPC (R$)',
      atual: Number((current.cpc ?? 0).toFixed(2)),
      anterior: Number((previous.cpc ?? 0).toFixed(2)),
    },
    {
      metric: 'CPM (R$)',
      atual: Number((current.cpm ?? 0).toFixed(2)),
      anterior: Number((previous.cpm ?? 0).toFixed(2)),
    },
  ];

  const ctrComparisonData = [
    {
      metric: 'CTR (%)',
      atual: Number((current.ctr ?? 0).toFixed(2)),
      anterior: Number((previous.ctr ?? 0).toFixed(2)),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header & Mode Toggle */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-[#0F172A] dark:text-white">
              Comparativo entre períodos equivalentes
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              Período atual: <strong>{formatDateBR(currentStart)} a {formatDateBR(currentEnd)}</strong>{' '}
              ({current.activeDays} dia(s) com investimento) · Período anterior:{' '}
              <strong>{formatDateBR(previousStart)} a {formatDateBR(previousEnd)}</strong>{' '}
              ({previous.activeDays} dia(s) com investimento)
            </p>
          </div>

          <div
            className="flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 p-1"
            role="group"
            aria-label="Modo de comparação"
          >
            <button
              type="button"
              onClick={() => setMode('total')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                mode === 'total'
                  ? 'bg-white dark:bg-slate-700 text-[#142B46] dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Valores totais
            </button>
            <button
              type="button"
              onClick={() => setMode('active_avg')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                mode === 'active_avg'
                  ? 'bg-white dark:bg-slate-700 text-[#142B46] dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Média por dia com investimento
            </button>
          </div>
        </div>

        {current.activeDays !== previous.activeDays && (
          <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/80 dark:bg-amber-950/30 p-3.5 text-xs text-amber-900 dark:text-amber-200">
            <AlertTriangle className="h-4 w-4 shrink-0 text-[#D97706] mt-0.5" />
            <div>
              <strong>Alerta de dias veiculados distintos:</strong> o período selecionado
              teve <strong>{current.activeDays}</strong> dia(s) com investimento, enquanto
              o período anterior teve <strong>{previous.activeDays}</strong> dia(s). A
              comparação dos totais pode ser influenciada pela interrupção de veiculação;
              alterne para &ldquo;Média por dia com investimento&rdquo; para equilibrar a
              leitura operacional.
            </div>
          </div>
        )}

        {/* Comparison matrix table */}
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                <th className="py-2.5 pr-4">Indicador</th>
                <th className="py-2.5 px-4 text-right">Período Atual</th>
                <th className="py-2.5 px-4 text-right">Período Anterior</th>
                <th className="py-2.5 pl-4 text-right">Variação (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {metricRows.map((m) => {
                const delta = calculatePercentVariation(m.currNum, m.prevNum);
                const isPos = delta !== null && delta > 0.05;
                const isNeg = delta !== null && delta < -0.05;
                let color = 'text-slate-500 dark:text-slate-400';
                if (m.tone === 'higher' && (isPos || isNeg)) {
                  color = isPos
                    ? 'text-[#16A34A] dark:text-emerald-400'
                    : 'text-[#DC2626] dark:text-rose-400';
                } else if (m.tone === 'lower' && (isPos || isNeg)) {
                  color = isNeg
                    ? 'text-[#16A34A] dark:text-emerald-400'
                    : 'text-[#DC2626] dark:text-rose-400';
                }
                return (
                  <tr key={m.label}>
                    <td className="py-2.5 pr-4 font-medium text-slate-800 dark:text-slate-200">
                      {m.label}
                    </td>
                    <td className="py-2.5 px-4 text-right font-semibold tabular-nums text-slate-900 dark:text-white">
                      {m.fmt(m.currNum)}
                    </td>
                    <td className="py-2.5 px-4 text-right tabular-nums text-slate-500 dark:text-slate-400">
                      {m.fmt(m.prevNum)}
                    </td>
                    <td className={`py-2.5 pl-4 text-right font-semibold tabular-nums ${color}`}>
                      {formatDeltaPercent(delta)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Grouped Bar Chart: Mon - Sun */}
      <ChartCard
        title="Comparativo por dia da semana (Segunda a Domingo)"
        subtitle="Mesmos dias da semana entre o período atual e o período anterior"
        heightClass="h-[320px]"
        headerRight={
          <div className="flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5">
            {(['leads', 'spend', 'cpl'] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setWeekdayMetric(k)}
                className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  weekdayMetric === k
                    ? 'bg-white dark:bg-slate-700 text-[#142B46] dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {k === 'leads' ? 'Leads' : k === 'spend' ? 'Investimento' : 'CPL'}
              </button>
            ))}
          </div>
        }
      >
        {() => (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={weekdayComparisonData}
              margin={{ top: 10, right: 12, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} />
              <XAxis dataKey="dayShort" tick={{ fontSize: 12, fill: '#64748B' }} />
              <YAxis
                tickFormatter={(v) => (weekdayMetric === 'leads' ? String(v) : `R$${v}`)}
                tick={{ fontSize: 11, fill: '#64748B' }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  const fmt =
                    weekdayMetric === 'leads'
                      ? (v: number) => formatNumber(v, mode === 'total' ? 0 : 2)
                      : (v: number) => formatBRL(v);
                  return (
                    <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 shadow-lg text-xs tabular-nums">
                      <div className="font-semibold text-slate-900 dark:text-white mb-1">
                        {d.dayShort}
                      </div>
                      <div className="text-[#2563EB]">Atual: {fmt(d.atual)}</div>
                      <div className="text-slate-500">Anterior: {fmt(d.anterior)}</div>
                    </div>
                  );
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="anterior" name="Período anterior" fill="#94A3B8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="atual" name="Período atual" fill="#2563EB" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* Comparative Metric Charts (Leads & Média, Investimento, CPL/CPC/CPM, CTR) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard
          title="Leads e média diária"
          subtitle={
            mode === 'total'
              ? 'Total de leads e média por dia corrido'
              : 'Média por dia ativo e média por dia corrido'
          }
        >
          {() => (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volumeChartData} margin={{ top: 10, right: 12, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} />
                <XAxis dataKey="metric" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="anterior" name="Período anterior" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="atual" name="Período atual" fill="#2563EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          title="Investimento comparativo (BRL)"
          subtitle={
            mode === 'total' ? 'Investimento total no período' : 'Investimento médio por dia ativo'
          }
        >
          {() => (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={spendChartData} margin={{ top: 10, right: 12, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} />
                <XAxis dataKey="metric" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tickFormatter={(v) => `R$${v}`} tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip formatter={(value) => formatBRL(Number(value))} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="anterior" name="Período anterior" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="atual" name="Período atual" fill="#142B46" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          title="Indicadores de custo (CPL, CPC e CPM)"
          subtitle="Comparativo ponderado em reais (BRL)"
        >
          {() => (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={costEfficiencyData} margin={{ top: 10, right: 12, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} />
                <XAxis dataKey="metric" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tickFormatter={(v) => `R$${v}`} tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip formatter={(value) => formatBRL(Number(value))} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="anterior" name="Período anterior" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="atual" name="Período atual" fill="#D97706" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          title="Taxa de cliques no link (CTR %)"
          subtitle="Comparativo de engajamento por impressão"
        >
          {() => (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ctrComparisonData} margin={{ top: 10, right: 12, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} />
                <XAxis dataKey="metric" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip formatter={(value) => formatPercent(Number(value))} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="anterior" name="Período anterior" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="atual" name="Período atual" fill="#16A34A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  );
};
