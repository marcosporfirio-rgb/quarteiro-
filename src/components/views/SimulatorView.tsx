import React, { useMemo, useState } from 'react';
import { Calculator, Info, RotateCcw } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AggregatedMetrics, PauseComparison } from '../../types/ads';
import { formatBRL, formatNumber } from '../../utils/formatters';
import { ChartCard } from '../ui/ChartCard';

interface SimulatorViewProps {
  current: AggregatedMetrics;
  historyMetrics: AggregatedMetrics;
  previous: AggregatedMetrics;
  pauses: PauseComparison[];
}

export const SimulatorView: React.FC<SimulatorViewProps> = ({
  current,
  historyMetrics,
  previous,
  pauses,
}) => {
  // Reference CPL values dynamically derived from real data (falling back to documented benchmarks if zero)
  const currentCplRef = Number((current.cpl ?? 10.53).toFixed(2));
  const historicalCplRef = Number((historyMetrics.cpl ?? 7.34).toFixed(2));
  const prePauseCplRef = Number(
    (pauses.length > 0 ? pauses[0].beforeMetrics.cpl ?? 5.78 : 5.78).toFixed(2)
  );
  const prevWeekCplRef = Number((previous.cpl ?? 4.23).toFixed(2));

  const initialWeeklySpend = Number((current.spend > 0 ? current.spend : 831.56).toFixed(2));

  const [deliveryDays, setDeliveryDays] = useState<number>(7);
  const [weeklySpend, setWeeklySpend] = useState<number>(initialWeeklySpend);
  const [dailySpend, setDailySpend] = useState<number>(
    Number((initialWeeklySpend / 7).toFixed(2))
  );
  const [monthlySpend, setMonthlySpend] = useState<number>(
    Number(((initialWeeklySpend / 7) * 30).toFixed(2))
  );

  const [desiredCpl, setDesiredCpl] = useState<number>(currentCplRef);

  const [dailyLeadsGoal, setDailyLeadsGoal] = useState<number>(12);
  const [weeklyLeadsGoal, setWeeklyLeadsGoal] = useState<number>(84);
  const [monthlyLeadsGoal, setMonthlyLeadsGoal] = useState<number>(360);

  const handleDailySpendChange = (val: number) => {
    const safe = Math.max(0, val);
    setDailySpend(safe);
    setWeeklySpend(Number((safe * Math.max(1, deliveryDays)).toFixed(2)));
    setMonthlySpend(Number((safe * 30).toFixed(2)));
  };

  const handleWeeklySpendChange = (val: number) => {
    const safe = Math.max(0, val);
    setWeeklySpend(safe);
    const daily = safe / Math.max(1, deliveryDays);
    setDailySpend(Number(daily.toFixed(2)));
    setMonthlySpend(Number((daily * 30).toFixed(2)));
  };

  const handleMonthlySpendChange = (val: number) => {
    const safe = Math.max(0, val);
    setMonthlySpend(safe);
    const daily = safe / 30;
    setDailySpend(Number(daily.toFixed(2)));
    setWeeklySpend(Number((daily * Math.max(1, deliveryDays)).toFixed(2)));
  };

  const handleDeliveryDaysChange = (days: number) => {
    const safeDays = Math.max(1, Math.min(31, Math.round(days)));
    setDeliveryDays(safeDays);
    setWeeklySpend(Number((dailySpend * safeDays).toFixed(2)));
    setWeeklyLeadsGoal(Math.round(dailyLeadsGoal * safeDays));
  };

  const handleDailyLeadsGoalChange = (val: number) => {
    const safe = Math.max(0, val);
    setDailyLeadsGoal(safe);
    setWeeklyLeadsGoal(Math.round(safe * Math.max(1, deliveryDays)));
    setMonthlyLeadsGoal(Math.round(safe * 30));
  };

  const handleWeeklyLeadsGoalChange = (val: number) => {
    const safe = Math.max(0, val);
    setWeeklyLeadsGoal(safe);
    const daily = safe / Math.max(1, deliveryDays);
    setDailyLeadsGoal(Number(daily.toFixed(2)));
    setMonthlyLeadsGoal(Math.round(daily * 30));
  };

  const handleMonthlyLeadsGoalChange = (val: number) => {
    const safe = Math.max(0, val);
    setMonthlyLeadsGoal(safe);
    const daily = safe / 30;
    setDailyLeadsGoal(Number(daily.toFixed(2)));
    setWeeklyLeadsGoal(Math.round(daily * Math.max(1, deliveryDays)));
  };

  const resetDefaults = () => {
    setDeliveryDays(7);
    handleWeeklySpendChange(initialWeeklySpend);
    setDesiredCpl(currentCplRef);
    handleDailyLeadsGoalChange(12);
  };

  const calculations = useMemo(() => {
    const safeCpl = desiredCpl > 0 ? desiredCpl : null;
    const estLeadsPeriod = safeCpl ? weeklySpend / safeCpl : null;
    const estLeadsDaily = safeCpl ? dailySpend / safeCpl : null;
    const estLeadsMonthly = safeCpl ? monthlySpend / safeCpl : null;

    const requiredSpendForWeeklyGoal = safeCpl ? weeklyLeadsGoal * safeCpl : null;
    const requiredSpendForMonthlyGoal = safeCpl ? monthlyLeadsGoal * safeCpl : null;

    const requiredCplForWeeklyGoal =
      weeklyLeadsGoal > 0 ? weeklySpend / weeklyLeadsGoal : null;

    // Comparison keeping current weekly budget vs current CPL
    const baselineLeadsAtCurrentCpl =
      currentCplRef > 0 ? weeklySpend / currentCplRef : 0;
    const growthPotentialLeads =
      estLeadsPeriod !== null ? estLeadsPeriod - baselineLeadsAtCurrentCpl : null;
    const growthPotentialPct =
      baselineLeadsAtCurrentCpl > 0 && growthPotentialLeads !== null
        ? (growthPotentialLeads / baselineLeadsAtCurrentCpl) * 100
        : null;

    // Budget savings to generate the same leads as current CPL
    const costAtCurrentCplForProjectedLeads =
      estLeadsPeriod !== null ? estLeadsPeriod * currentCplRef : null;
    const budgetSavings =
      costAtCurrentCplForProjectedLeads !== null
        ? costAtCurrentCplForProjectedLeads - weeklySpend
        : null;

    return {
      estLeadsPeriod,
      estLeadsDaily,
      estLeadsMonthly,
      requiredSpendForWeeklyGoal,
      requiredSpendForMonthlyGoal,
      requiredCplForWeeklyGoal,
      growthPotentialLeads,
      growthPotentialPct,
      budgetSavings,
    };
  }, [
    desiredCpl,
    weeklySpend,
    dailySpend,
    monthlySpend,
    weeklyLeadsGoal,
    monthlyLeadsGoal,
    currentCplRef,
  ]);

  const scenarios = useMemo(
    () => [
      {
        id: 'current',
        title: 'Cenário atual',
        cpl: currentCplRef,
        leads: currentCplRef > 0 ? Math.round(weeklySpend / currentCplRef) : 0,
        color: '#D97706',
      },
      {
        id: 'historical',
        title: 'CPL histórico',
        cpl: historicalCplRef,
        leads: historicalCplRef > 0 ? Math.round(weeklySpend / historicalCplRef) : 0,
        color: '#2563EB',
      },
      {
        id: 'pre-pause',
        title: 'Antes da interrupção',
        cpl: prePauseCplRef,
        leads: prePauseCplRef > 0 ? Math.round(weeklySpend / prePauseCplRef) : 0,
        color: '#142B46',
      },
      {
        id: 'prev-week',
        title: 'Melhor referência semanal',
        cpl: prevWeekCplRef,
        leads: prevWeekCplRef > 0 ? Math.round(weeklySpend / prevWeekCplRef) : 0,
        color: '#16A34A',
      },
    ],
    [weeklySpend, currentCplRef, historicalCplRef, prePauseCplRef, prevWeekCplRef]
  );

  return (
    <div className="space-y-6">
      {/* Disclaimer */}
      <div className="flex items-start gap-2.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/30 p-4 text-xs text-slate-700 dark:text-slate-200">
        <Info className="h-4 w-4 shrink-0 text-[#2563EB] mt-0.5" />
        <div>
          <strong>Projeção matemática:</strong> todos os resultados desta calculadora são
          simulações lineares baseadas nas premissas informadas e referências históricas,
          não representando garantia de performance futura no leilão do Meta Ads.
        </div>
      </div>

      {/* Interactive Inputs */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2.5">
            <Calculator className="h-5 w-5 text-[#2563EB]" />
            <div>
              <h2 className="text-base font-semibold text-[#0F172A] dark:text-white">
                Simulador de resultados e orçamento
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ajuste orçamento, CPL desejado, metas e dias de veiculação para projetar cenários
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={resetDefaults}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Restaurar valores atuais</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
              Investimento diário (R$)
            </label>
            <input
              type="number"
              min={0}
              step="1"
              value={dailySpend}
              onChange={(e) => handleDailySpendChange(Number(e.target.value))}
              className="h-9 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm font-medium tabular-nums text-slate-900 dark:text-white focus:border-[#2563EB] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
              Investimento no período / semanal (R$)
            </label>
            <input
              type="number"
              min={0}
              step="1"
              value={weeklySpend}
              onChange={(e) => handleWeeklySpendChange(Number(e.target.value))}
              className="h-9 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm font-medium tabular-nums text-slate-900 dark:text-white focus:border-[#2563EB] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
              Investimento mensal (30d) (R$)
            </label>
            <input
              type="number"
              min={0}
              step="10"
              value={monthlySpend}
              onChange={(e) => handleMonthlySpendChange(Number(e.target.value))}
              className="h-9 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm font-medium tabular-nums text-slate-900 dark:text-white focus:border-[#2563EB] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
              CPL desejado (R$)
            </label>
            <input
              type="number"
              min={0.1}
              step="0.1"
              value={desiredCpl}
              onChange={(e) => setDesiredCpl(Math.max(0, Number(e.target.value)))}
              className="h-9 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm font-semibold tabular-nums text-[#2563EB] dark:text-blue-400 focus:border-[#2563EB] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
              Meta diária de leads
            </label>
            <input
              type="number"
              min={0}
              step="1"
              value={dailyLeadsGoal}
              onChange={(e) => handleDailyLeadsGoalChange(Number(e.target.value))}
              className="h-9 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm font-medium tabular-nums text-slate-900 dark:text-white focus:border-[#2563EB] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
              Meta semanal de leads
            </label>
            <input
              type="number"
              min={0}
              step="1"
              value={weeklyLeadsGoal}
              onChange={(e) => handleWeeklyLeadsGoalChange(Number(e.target.value))}
              className="h-9 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm font-medium tabular-nums text-slate-900 dark:text-white focus:border-[#2563EB] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
              Meta mensal de leads
            </label>
            <input
              type="number"
              min={0}
              step="5"
              value={monthlyLeadsGoal}
              onChange={(e) => handleMonthlyLeadsGoalChange(Number(e.target.value))}
              className="h-9 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm font-medium tabular-nums text-slate-900 dark:text-white focus:border-[#2563EB] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
              Dias de veiculação (janela)
            </label>
            <input
              type="number"
              min={1}
              max={31}
              value={deliveryDays}
              onChange={(e) => handleDeliveryDaysChange(Number(e.target.value))}
              className="h-9 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm font-medium tabular-nums text-slate-900 dark:text-white focus:border-[#2563EB] focus:outline-none"
            />
          </div>
        </div>

        {/* Dynamic output strip */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-3.5">
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Leads estimados ({deliveryDays}d)
            </div>
            <div className="mt-1 text-xl font-bold text-[#2563EB] dark:text-blue-400 tabular-nums">
              {calculations.estLeadsPeriod !== null
                ? `${Math.round(calculations.estLeadsPeriod)} leads`
                : '—'}
            </div>
            <div className="mt-0.5 text-[11px] text-slate-500 tabular-nums">
              {formatNumber(calculations.estLeadsDaily, 1)}/dia ·{' '}
              {calculations.estLeadsMonthly !== null
                ? `${Math.round(calculations.estLeadsMonthly)}/mês`
                : '—'}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-3.5">
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Investimento p/ meta ({weeklyLeadsGoal} leads)
            </div>
            <div className="mt-1 text-xl font-bold text-slate-900 dark:text-white tabular-nums">
              {formatBRL(calculations.requiredSpendForWeeklyGoal)}
            </div>
            <div className="mt-0.5 text-[11px] text-slate-500 tabular-nums">
              Mensal: {formatBRL(calculations.requiredSpendForMonthlyGoal)}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-3.5">
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              CPL necessário (mantendo verba)
            </div>
            <div className="mt-1 text-xl font-bold text-slate-900 dark:text-white tabular-nums">
              {formatBRL(calculations.requiredCplForWeeklyGoal)}
            </div>
            <div className="mt-0.5 text-[11px] text-slate-500 tabular-nums">
              Para entregar {weeklyLeadsGoal} leads em {deliveryDays}d
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-3.5">
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Economia equivalente vs. CPL atual
            </div>
            <div
              className={`mt-1 text-xl font-bold tabular-nums ${
                (calculations.budgetSavings ?? 0) >= 0
                  ? 'text-[#16A34A] dark:text-emerald-400'
                  : 'text-[#DC2626] dark:text-rose-400'
              }`}
            >
              {formatBRL(calculations.budgetSavings)}
            </div>
            <div className="mt-0.5 text-[11px] text-slate-500 tabular-nums">
              Ref. CPL atual: {formatBRL(currentCplRef)}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-3.5">
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Potencial mantendo orçamento
            </div>
            <div
              className={`mt-1 text-xl font-bold tabular-nums ${
                (calculations.growthPotentialLeads ?? 0) >= 0
                  ? 'text-[#16A34A] dark:text-emerald-400'
                  : 'text-[#DC2626] dark:text-rose-400'
              }`}
            >
              {calculations.growthPotentialLeads !== null
                ? `${calculations.growthPotentialLeads >= 0 ? '+' : ''}${Math.round(
                    calculations.growthPotentialLeads
                  )} leads`
                : '—'}
            </div>
            <div className="mt-0.5 text-[11px] text-slate-500 tabular-nums">
              {calculations.growthPotentialPct !== null
                ? `${calculations.growthPotentialPct >= 0 ? '+' : ''}${formatNumber(
                    calculations.growthPotentialPct,
                    1
                  )}% de ganho`
                : '—'}
            </div>
          </div>
        </div>
      </section>

      {/* 4 Reference Scenarios */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {scenarios.map((sc) => (
          <button
            key={sc.id}
            type="button"
            onClick={() => setDesiredCpl(sc.cpl)}
            className={`text-left rounded-xl border p-4 transition-colors ${
              Math.abs(desiredCpl - sc.cpl) < 0.01
                ? 'border-[#2563EB] bg-blue-50/50 dark:bg-blue-950/30 dark:border-blue-500'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {sc.title}
            </div>
            <div className="mt-1 flex items-baseline justify-between gap-2">
              <span className="text-lg font-bold text-[#0F172A] dark:text-white tabular-nums">
                {sc.leads} leads
              </span>
              <span className="text-xs font-semibold tabular-nums" style={{ color: sc.color }}>
                CPL {formatBRL(sc.cpl)}
              </span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
              Para verba de {formatBRL(weeklySpend)} · Clique para aplicar
            </div>
          </button>
        ))}
      </section>

      {/* Scenario Chart */}
      <ChartCard
        title="Projeção comparativa por cenário de CPL"
        subtitle={`Volume estimado de leads mantendo o investimento de ${formatBRL(weeklySpend)}`}
        heightClass="h-[280px]"
      >
        {() => (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={scenarios} margin={{ top: 10, right: 16, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} />
              <XAxis dataKey="title" tick={{ fontSize: 11, fill: '#64748B' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
              <Tooltip
                formatter={(val) => [`${val} leads (projeção)`, 'Leads estimados']}
              />
              <Bar dataKey="leads" name="Leads projetados" radius={[6, 6, 0, 0]} barSize={54}>
                {scenarios.map((entry) => (
                  <Cell key={entry.id} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  );
};
