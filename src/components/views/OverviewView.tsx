import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Award,
  CalendarOff,
  CheckCircle2,
  TrendingDown,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AggregatedMetrics,
  DailyComputedRow,
  NavSection,
} from '../../types/ads';
import { formatDateBR, formatShortDateBR } from '../../utils/dateUtils';
import {
  formatBRL,
  formatDeltaPercent,
  formatNumber,
  formatPercent,
} from '../../utils/formatters';
import {
  calculatePercentVariation,
  getBestAndWorstDays,
} from '../../services/metricsEngine';
import { ChartCard } from '../ui/ChartCard';
import { KpiCard } from '../ui/KpiCard';

interface OverviewViewProps {
  current: AggregatedMetrics;
  previous: AggregatedMetrics;
  dailyRows: DailyComputedRow[];
  currentStart: string;
  currentEnd: string;
  previousStart: string;
  previousEnd: string;
  onNavigate: (section: NavSection) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  current,
  previous,
  dailyRows,
  currentStart,
  currentEnd,
  previousStart,
  previousEnd,
  onNavigate,
}) => {
  const chartData = dailyRows.map((r) => ({
    date: r.date,
    shortDate: `${formatShortDateBR(r.date)} (${r.dayShort})`,
    fullDate: `${formatDateBR(r.date)} · ${r.dayName}`,
    spend: Number(r.spend.toFixed(2)),
    leads: r.leads,
    cpl: r.cpl !== null ? Number(r.cpl.toFixed(2)) : null,
    impressions: r.impressions,
    clicks: r.clicks,
    isIncomplete: r.isIncomplete,
  }));

  const leadsSpark = chartData.map((d) => ({ label: d.shortDate, value: d.leads }));
  const spendSpark = chartData.map((d) => ({ label: d.shortDate, value: d.spend }));
  const cplSpark = chartData.map((d) => ({ label: d.shortDate, value: d.cpl }));

  const { highestLeadsDay, lowestCplDay, highestCplDay, highestSpendDay } =
    getBestAndWorstDays(dailyRows);

  const comparisonItems = [
    {
      label: 'Investimento',
      curr: formatBRL(current.spend),
      prev: formatBRL(previous.spend),
      delta: calculatePercentVariation(current.spend, previous.spend),
      tone: 'neutral' as const,
    },
    {
      label: 'Leads gerados',
      curr: formatNumber(current.leads),
      prev: formatNumber(previous.leads),
      delta: calculatePercentVariation(current.leads, previous.leads),
      tone: 'higher' as const,
    },
    {
      label: 'CPL consolidado',
      curr: formatBRL(current.cpl),
      prev: formatBRL(previous.cpl),
      delta: calculatePercentVariation(current.cpl, previous.cpl),
      tone: 'lower' as const,
    },
    {
      label: 'Média diária de leads',
      curr: `${formatNumber(current.leadsPerDay, 2)} / dia`,
      prev: `${formatNumber(previous.leadsPerDay, 2)} / dia`,
      delta: calculatePercentVariation(current.leadsPerDay, previous.leadsPerDay),
      tone: 'higher' as const,
    },
    {
      label: 'Dias com investimento',
      curr: `${current.activeDays} de ${current.totalDays}`,
      prev: `${previous.activeDays} de ${previous.totalDays}`,
      delta: calculatePercentVariation(current.activeDays, previous.activeDays),
      tone: 'neutral' as const,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Section 1: Main KPI Cards (4 primary + 8 secondary = all 12 KPIs from Section 5) */}
      <section aria-label="Indicadores principais">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            title="Investimento total"
            value={formatBRL(current.spend)}
            previousValue={formatBRL(previous.spend)}
            variationPct={calculatePercentVariation(current.spend, previous.spend)}
            toneMode="neutral"
            tooltipText="Soma dos valores gastos no período selecionado. A variação usa cor neutra porque aumento de verba não indica por si só melhora ou piora."
            subtitle={`Média ${formatBRL(current.spendPerActiveDay)} / dia ativo`}
            sparklineData={spendSpark}
            sparklineColor="#142B46"
          />
          <KpiCard
            title="Leads (conversas iniciadas)"
            value={formatNumber(current.leads)}
            previousValue={formatNumber(previous.leads)}
            variationPct={calculatePercentVariation(current.leads, previous.leads)}
            toneMode="higher_better"
            tooltipText="Total de conversas por mensagem iniciadas registradas no período. Dias sem informação não recebem conversões fictícias."
            subtitle={`${formatNumber(current.leadsPerActiveDay, 2)} leads / dia ativo`}
            sparklineData={leadsSpark}
            sparklineColor="#2563EB"
          />
          <KpiCard
            title="Custo por lead (CPL)"
            value={formatBRL(current.cpl)}
            previousValue={formatBRL(previous.cpl)}
            variationPct={calculatePercentVariation(current.cpl, previous.cpl)}
            toneMode="lower_better"
            tooltipText="Investimento total dividido pelo total de leads registrados no período (nunca média simples dos CPLs diários). Reduções aparecem em verde."
            subtitle={
              current.missingLeadsDays > 0
                ? `${current.missingLeadsDays} dia(s) com leads não informados`
                : 'Cálculo consolidado ponderado'
            }
            sparklineData={cplSpark}
            sparklineColor="#D97706"
          />
          <KpiCard
            title="Média diária de leads"
            value={formatNumber(current.leadsPerDay, 2)}
            previousValue={formatNumber(previous.leadsPerDay, 2)}
            variationPct={calculatePercentVariation(
              current.leadsPerDay,
              previous.leadsPerDay
            )}
            toneMode="higher_better"
            tooltipText="Total de leads dividido pela quantidade de dias corridos do recorte selecionado."
            subtitle={`${current.totalDays} dias no recorte · ${current.activeDays} ativos`}
          />
        </div>

        {/* Remaining 8 KPIs */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            compact
            title="Impressões"
            value={formatNumber(current.impressions)}
            previousValue={formatNumber(previous.impressions)}
            variationPct={calculatePercentVariation(
              current.impressions,
              previous.impressions
            )}
            toneMode="higher_better"
            tooltipText="Total de vezes que os anúncios foram exibidos nas telas durante o período."
          />
          <KpiCard
            compact
            title="Cliques no link"
            value={formatNumber(current.clicks)}
            previousValue={formatNumber(previous.clicks)}
            variationPct={calculatePercentVariation(current.clicks, previous.clicks)}
            toneMode="higher_better"
            tooltipText="Total de cliques no link de destino (WhatsApp) registrados no período."
          />
          <KpiCard
            compact
            title="CTR de link"
            value={formatPercent(current.ctr)}
            previousValue={formatPercent(previous.ctr)}
            variationPct={calculatePercentVariation(current.ctr, previous.ctr)}
            toneMode="higher_better"
            tooltipText="Taxa de cliques no link: (Cliques no link ÷ Impressões) × 100."
          />
          <KpiCard
            compact
            title="CPC de link"
            value={formatBRL(current.cpc)}
            previousValue={formatBRL(previous.cpc)}
            variationPct={calculatePercentVariation(current.cpc, previous.cpc)}
            toneMode="lower_better"
            tooltipText="Custo médio por clique no link: Investimento total ÷ Cliques no link."
          />
          <KpiCard
            compact
            title="CPM"
            value={formatBRL(current.cpm)}
            previousValue={formatBRL(previous.cpm)}
            variationPct={calculatePercentVariation(current.cpm, previous.cpm)}
            toneMode="lower_better"
            tooltipText="Custo por mil impressões: (Investimento total ÷ Impressões) × 1.000."
          />
          <KpiCard
            compact
            title="Investimento médio diário"
            value={formatBRL(current.spendPerDay)}
            previousValue={formatBRL(previous.spendPerDay)}
            variationPct={calculatePercentVariation(
              current.spendPerDay,
              previous.spendPerDay
            )}
            toneMode="neutral"
            tooltipText="Investimento total dividido pela quantidade de dias do recorte. Por dia ativo: "
            subtitle={`Por dia ativo: ${formatBRL(current.spendPerActiveDay)}`}
          />
          <KpiCard
            compact
            title="Dias com investimento"
            value={`${current.activeDays} dias`}
            previousValue={`${previous.activeDays} dias`}
            variationPct={calculatePercentVariation(
              current.activeDays,
              previous.activeDays
            )}
            toneMode="neutral"
            tooltipText="Quantidade de dias no recorte com valor gasto maior que R$ 0,00."
            subtitle={`De ${current.totalDays} dias no período`}
          />
          <KpiCard
            compact
            title="Conversas / Cliques"
            value={formatPercent(current.convPerClick)}
            previousValue={formatPercent(previous.convPerClick)}
            variationPct={calculatePercentVariation(
              current.convPerClick,
              previous.convPerClick
            )}
            toneMode="higher_better"
            tooltipText="Taxa de conversão de clique em conversa iniciada: (Conversas iniciadas ÷ Cliques no link) × 100."
          />
        </div>
      </section>

      {/* Section 2: Bar chart of daily leads + Line chart of CPL evolution */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <ChartCard
          title="Volume diário de leads"
          subtitle="Conversas iniciadas por dia (unidade: leads)"
        >
          {() => (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 12, left: -12, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} />
                <XAxis
                  dataKey="shortDate"
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  axisLine={{ stroke: '#CBD5E1' }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 shadow-lg text-xs">
                        <div className="font-semibold text-slate-900 dark:text-white mb-1">
                          {d.fullDate}
                        </div>
                        <div className="text-slate-600 dark:text-slate-300 tabular-nums">
                          Leads:{' '}
                          <strong>
                            {d.leads === null ? 'Não informado (dado ausente)' : `${d.leads} leads`}
                          </strong>
                        </div>
                        <div className="text-slate-500 dark:text-slate-400 tabular-nums">
                          Investimento: {formatBRL(d.spend)}
                        </div>
                      </div>
                    );
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar
                  dataKey="leads"
                  name="Leads (conversas)"
                  fill="#2563EB"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          title="Evolução diária do CPL"
          subtitle="Custo por conversa iniciada em reais (BRL)"
        >
          {() => (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 12, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} />
                <XAxis
                  dataKey="shortDate"
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  axisLine={{ stroke: '#CBD5E1' }}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) => `R$${v}`}
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 shadow-lg text-xs">
                        <div className="font-semibold text-slate-900 dark:text-white mb-1">
                          {d.fullDate}
                        </div>
                        <div className="text-slate-600 dark:text-slate-300 tabular-nums">
                          CPL:{' '}
                          <strong>
                            {d.cpl !== null
                              ? formatBRL(d.cpl)
                              : d.isIncomplete
                              ? 'Indisponível (leads ausentes)'
                              : 'Sem veiculação / leads'}
                          </strong>
                        </div>
                        <div className="text-slate-500 dark:text-slate-400 tabular-nums">
                          Investimento: {formatBRL(d.spend)}
                        </div>
                      </div>
                    );
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line
                  type="monotone"
                  dataKey="cpl"
                  name="CPL (R$)"
                  stroke="#D97706"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#D97706', strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </section>

      {/* Section 3: Daily spend vs leads generated (dual-axis chart) */}
      <ChartCard
        title="Investimento diário versus leads gerados"
        subtitle="Eixo esquerdo: Investimento (R$) · Eixo direito: Leads (conversas iniciadas)"
        heightClass="h-[320px]"
      >
        {() => (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} />
              <XAxis
                dataKey="shortDate"
                tick={{ fontSize: 11, fill: '#64748B' }}
                axisLine={{ stroke: '#CBD5E1' }}
                tickLine={false}
              />
              <YAxis
                yAxisId="left"
                tickFormatter={(v) => `R$${v}`}
                tick={{ fontSize: 11, fill: '#142B46' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                allowDecimals={false}
                tick={{ fontSize: 11, fill: '#2563EB' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 shadow-lg text-xs">
                      <div className="font-semibold text-slate-900 dark:text-white mb-1">
                        {d.fullDate}
                      </div>
                      <div className="text-slate-700 dark:text-slate-300 tabular-nums">
                        Investimento: <strong>{formatBRL(d.spend)}</strong>
                      </div>
                      <div className="text-[#2563EB] dark:text-blue-400 tabular-nums">
                        Leads:{' '}
                        <strong>
                          {d.leads === null ? 'Não informado' : formatNumber(d.leads)}
                        </strong>
                      </div>
                      <div className="text-slate-500 dark:text-slate-400 tabular-nums">
                        CPL do dia: {formatBRL(d.cpl)}
                      </div>
                    </div>
                  );
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar
                yAxisId="left"
                dataKey="spend"
                name="Investimento (R$)"
                fill="#142B46"
                radius={[4, 4, 0, 0]}
                barSize={24}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="leads"
                name="Leads gerados"
                stroke="#2563EB"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#2563EB' }}
                connectNulls={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* Section 4 & Section 5: Current vs Previous comparison + Best/Worst Days */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Section 4: Week/Period Comparison */}
        <section className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm font-semibold text-[#0F172A] dark:text-white">
                Comparativo com o período anterior
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                {formatDateBR(currentStart)}–{formatDateBR(currentEnd)} vs.{' '}
                {formatDateBR(previousStart)}–{formatDateBR(previousEnd)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('weekly')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:underline whitespace-nowrap"
            >
              <span>Ver comparativo completo</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {current.activeDays !== previous.activeDays && (
            <div className="mb-3 flex items-start gap-2.5 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 p-3 text-xs text-amber-900 dark:text-amber-200">
              <AlertTriangle className="h-4 w-4 shrink-0 text-[#D97706] mt-0.5" />
              <span>
                Os períodos possuem quantidades diferentes de dias com investimento (
                <strong>{current.activeDays}</strong> vs.{' '}
                <strong>{previous.activeDays}</strong>). A comparação dos totais pode ser
                influenciada pela interrupção de veiculação.
              </span>
            </div>
          )}

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {comparisonItems.map((item) => {
              const isPos = item.delta !== null && item.delta > 0.05;
              const isNeg = item.delta !== null && item.delta < -0.05;
              let deltaColor = 'text-slate-500 dark:text-slate-400';
              if (item.tone === 'higher' && (isPos || isNeg)) {
                deltaColor = isPos
                  ? 'text-[#16A34A] dark:text-emerald-400'
                  : 'text-[#DC2626] dark:text-rose-400';
              } else if (item.tone === 'lower' && (isPos || isNeg)) {
                deltaColor = isNeg
                  ? 'text-[#16A34A] dark:text-emerald-400'
                  : 'text-[#DC2626] dark:text-rose-400';
              }

              return (
                <div
                  key={item.label}
                  className="py-2.5 flex items-center justify-between gap-4 text-xs"
                >
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {item.label}
                  </span>
                  <div className="flex items-center gap-4 tabular-nums">
                    <span className="text-slate-400 dark:text-slate-500 hidden sm:inline">
                      Ant.: {item.prev}
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white min-w-[85px] text-right">
                      {item.curr}
                    </span>
                    <span className={`font-semibold min-w-[60px] text-right ${deltaColor}`}>
                      {formatDeltaPercent(item.delta)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 5: Best and Worst Days Summary */}
        <section className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <h3 className="text-sm font-semibold text-[#0F172A] dark:text-white mb-1">
            Resumo de melhores e piores dias
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Destaques observados dentro do período filtrado
          </p>

          <div className="space-y-3 text-xs">
            <div className="flex items-start justify-between gap-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-3">
              <div className="flex items-start gap-2.5">
                <Award className="h-4 w-4 text-[#16A34A] shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-100">
                    Maior volume de leads
                  </div>
                  <div className="text-slate-500 dark:text-slate-400 tabular-nums">
                    {highestLeadsDay
                      ? `${formatDateBR(highestLeadsDay.date)} (${highestLeadsDay.dayName})`
                      : 'Sem registros'}
                  </div>
                </div>
              </div>
              <div className="text-right tabular-nums">
                <div className="font-bold text-[#16A34A] dark:text-emerald-400">
                  {highestLeadsDay ? `${highestLeadsDay.leads} leads` : '—'}
                </div>
                <div className="text-slate-500 dark:text-slate-400">
                  {highestLeadsDay ? `CPL ${formatBRL(highestLeadsDay.cpl)}` : ''}
                </div>
              </div>
            </div>

            <div className="flex items-start justify-between gap-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-3">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-[#2563EB] shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-100">
                    Menor CPL válido
                  </div>
                  <div className="text-slate-500 dark:text-slate-400 tabular-nums">
                    {lowestCplDay
                      ? `${formatDateBR(lowestCplDay.date)} (${lowestCplDay.dayName})`
                      : 'Sem registros'}
                  </div>
                </div>
              </div>
              <div className="text-right tabular-nums">
                <div className="font-bold text-[#2563EB] dark:text-blue-400">
                  {lowestCplDay ? formatBRL(lowestCplDay.cpl) : '—'}
                </div>
                <div className="text-slate-500 dark:text-slate-400">
                  {lowestCplDay ? `${lowestCplDay.leads} leads` : ''}
                </div>
              </div>
            </div>

            <div className="flex items-start justify-between gap-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-3">
              <div className="flex items-start gap-2.5">
                <TrendingDown className="h-4 w-4 text-[#DC2626] shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-100">
                    Maior CPL (menor eficiência)
                  </div>
                  <div className="text-slate-500 dark:text-slate-400 tabular-nums">
                    {highestCplDay
                      ? `${formatDateBR(highestCplDay.date)} (${highestCplDay.dayName})`
                      : 'Sem registros'}
                  </div>
                </div>
              </div>
              <div className="text-right tabular-nums">
                <div className="font-bold text-[#DC2626] dark:text-rose-400">
                  {highestCplDay ? formatBRL(highestCplDay.cpl) : '—'}
                </div>
                <div className="text-slate-500 dark:text-slate-400">
                  {highestCplDay ? `${highestCplDay.leads} leads` : ''}
                </div>
              </div>
            </div>

            <div className="flex items-start justify-between gap-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-3">
              <div className="flex items-start gap-2.5">
                <CalendarOff className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-100">
                    Maior investimento diário
                  </div>
                  <div className="text-slate-500 dark:text-slate-400 tabular-nums">
                    {highestSpendDay
                      ? `${formatDateBR(highestSpendDay.date)} (${highestSpendDay.dayName})`
                      : 'Sem registros'}
                  </div>
                </div>
              </div>
              <div className="text-right tabular-nums">
                <div className="font-bold text-slate-900 dark:text-white">
                  {highestSpendDay ? formatBRL(highestSpendDay.spend) : '—'}
                </div>
                <div className="text-slate-500 dark:text-slate-400">
                  {highestSpendDay
                    ? highestSpendDay.leads === null
                      ? 'Leads N/D'
                      : `${highestSpendDay.leads} leads`
                    : ''}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Section 6: Daily Performance Table */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.04)] overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-semibold text-[#0F172A] dark:text-white">
              Desempenho diário do período
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Detalhamento dia a dia com diferenciação de dias sem veiculação e dados ausentes
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('daily')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:underline whitespace-nowrap"
          >
            <span>Abrir tabela completa & heatmap</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                <th className="py-2.5 px-4 whitespace-nowrap">Data</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Dia</th>
                <th className="py-2.5 px-3 text-right whitespace-nowrap">Investimento</th>
                <th className="py-2.5 px-3 text-right whitespace-nowrap">Leads</th>
                <th className="py-2.5 px-3 text-right whitespace-nowrap">CPL</th>
                <th className="py-2.5 px-3 text-right whitespace-nowrap">Cliques</th>
                <th className="py-2.5 px-3 text-right whitespace-nowrap">Impressões</th>
                <th className="py-2.5 px-3 text-right whitespace-nowrap">CTR</th>
                <th className="py-2.5 px-3 text-right whitespace-nowrap">CPC</th>
                <th className="py-2.5 px-4 text-right whitespace-nowrap">CPM</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {dailyRows.map((row) => (
                <tr
                  key={row.id}
                  className={`transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40 ${
                    !row.hasSpend
                      ? 'bg-slate-50/50 dark:bg-slate-900/50 text-slate-400 dark:text-slate-500'
                      : ''
                  }`}
                >
                  <td className="py-2.5 px-4 font-medium tabular-nums whitespace-nowrap text-slate-800 dark:text-slate-200">
                    {formatDateBR(row.date)}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap text-slate-600 dark:text-slate-400">
                    {row.dayShort}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums font-medium">
                    {formatBRL(row.spend)}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums">
                    {row.isIncomplete ? (
                      <span
                        title="Investimento registrado sem informação de conversas iniciadas"
                        className="text-amber-700 dark:text-amber-400 font-medium"
                      >
                        N/D
                      </span>
                    ) : (
                      formatNumber(row.leads)
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums">{formatBRL(row.cpl)}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums">
                    {formatNumber(row.clicks)}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums">
                    {formatNumber(row.impressions)}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums">{formatPercent(row.ctr)}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums">{formatBRL(row.cpc)}</td>
                  <td className="py-2.5 px-4 text-right tabular-nums">{formatBRL(row.cpm)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
