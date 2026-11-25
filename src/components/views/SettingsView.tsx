import React, { useState } from 'react';
import { CheckCircle2, RotateCcw, Save } from 'lucide-react';
import { DEFAULT_GOALS } from '../../data/initialData';
import { AggregatedMetrics, GoalsConfig } from '../../types/ads';
import { formatBRL, formatNumber, formatPercent } from '../../utils/formatters';

interface SettingsViewProps {
  goals: GoalsConfig;
  onSaveGoals: (next: GoalsConfig) => void;
  current: AggregatedMetrics;
  historyMetrics: AggregatedMetrics;
  onRestoreInitialData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  goals,
  onSaveGoals,
  current,
  historyMetrics,
  onRestoreInitialData,
}) => {
  const [draft, setDraft] = useState<GoalsConfig>(goals);
  const [savedNotice, setSavedNotice] = useState(false);
  const [confirmRestore, setConfirmRestore] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveGoals(draft);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2200);
  };

  const handleResetGoals = () => {
    setDraft(DEFAULT_GOALS);
    onSaveGoals(DEFAULT_GOALS);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2200);
  };

  // Progress bar items comparing actual metrics against configured targets
  const progressBars = [
    {
      label: 'CPL do período vs. Meta de CPL',
      actualText: formatBRL(current.cpl),
      targetText: formatBRL(draft.targetCpl),
      pct:
        current.cpl !== null && draft.targetCpl > 0
          ? Math.min(150, (current.cpl / draft.targetCpl) * 100)
          : 0,
      isInverseCost: true,
      note:
        current.cpl !== null
          ? current.cpl <= draft.targetCpl
            ? 'Dentro da meta configurada'
            : `${formatPercent(((current.cpl - draft.targetCpl) / draft.targetCpl) * 100, 1)} acima da meta`
          : 'Sem CPL calculado no período',
    },
    {
      label: 'Média diária de leads vs. Meta diária',
      actualText: `${formatNumber(current.leadsPerDay, 2)} leads/dia`,
      targetText: `${formatNumber(draft.dailyLeadsGoal)} leads/dia`,
      pct:
        current.leadsPerDay !== null && draft.dailyLeadsGoal > 0
          ? Math.min(100, (current.leadsPerDay / draft.dailyLeadsGoal) * 100)
          : 0,
      isInverseCost: false,
      note: `${formatPercent(
        current.leadsPerDay !== null && draft.dailyLeadsGoal > 0
          ? (current.leadsPerDay / draft.dailyLeadsGoal) * 100
          : 0,
        1
      )} da meta diária`,
    },
    {
      label: 'Leads no período vs. Meta semanal',
      actualText: `${formatNumber(current.leads)} leads`,
      targetText: `${formatNumber(draft.weeklyLeadsGoal)} leads`,
      pct:
        draft.weeklyLeadsGoal > 0
          ? Math.min(100, (current.leads / draft.weeklyLeadsGoal) * 100)
          : 0,
      isInverseCost: false,
      note: `${formatPercent(
        draft.weeklyLeadsGoal > 0 ? (current.leads / draft.weeklyLeadsGoal) * 100 : 0,
        1
      )} da meta semanal`,
    },
    {
      label: 'Leads no histórico (30d) vs. Meta mensal',
      actualText: `${formatNumber(historyMetrics.leads)} leads`,
      targetText: `${formatNumber(draft.monthlyLeadsGoal)} leads`,
      pct:
        draft.monthlyLeadsGoal > 0
          ? Math.min(100, (historyMetrics.leads / draft.monthlyLeadsGoal) * 100)
          : 0,
      isInverseCost: false,
      note: `${formatPercent(
        draft.monthlyLeadsGoal > 0
          ? (historyMetrics.leads / draft.monthlyLeadsGoal) * 100
          : 0,
        1
      )} da meta mensal`,
    },
    {
      label: 'Investimento diário médio vs. Limite diário',
      actualText: formatBRL(current.spendPerActiveDay),
      targetText: formatBRL(draft.dailySpendLimit),
      pct:
        current.spendPerActiveDay !== null && draft.dailySpendLimit > 0
          ? Math.min(100, (current.spendPerActiveDay / draft.dailySpendLimit) * 100)
          : 0,
      isInverseCost: true,
      note: 'Por dia com investimento no período selecionado',
    },
    {
      label: 'Investimento no período vs. Limite semanal',
      actualText: formatBRL(current.spend),
      targetText: formatBRL(draft.weeklySpendLimit),
      pct:
        draft.weeklySpendLimit > 0
          ? Math.min(100, (current.spend / draft.weeklySpendLimit) * 100)
          : 0,
      isInverseCost: true,
      note: `${formatPercent(
        draft.weeklySpendLimit > 0 ? (current.spend / draft.weeklySpendLimit) * 100 : 0,
        1
      )} do teto semanal`,
    },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="text-base font-semibold text-[#0F172A] dark:text-white">
              Configuração de metas e limites de investimento
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Personalize as referências de CPL, leads e orçamento usadas nas barras de progresso
            </p>
          </div>

          <button
            type="button"
            onClick={handleResetGoals}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Restaurar metas padrão</span>
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Meta de CPL (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min={0.1}
                value={draft.targetCpl}
                onChange={(e) =>
                  setDraft({ ...draft, targetCpl: Math.max(0.1, Number(e.target.value)) })
                }
                className="h-9 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm font-semibold tabular-nums text-slate-900 dark:text-white"
              />
              <span className="mt-1 block text-[11px] text-slate-400">
                Padrão inicial: R$ 7,34 (CPL histórico)
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Meta diária de leads
              </label>
              <input
                type="number"
                min={1}
                value={draft.dailyLeadsGoal}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    dailyLeadsGoal: Math.max(1, Number(e.target.value)),
                  })
                }
                className="h-9 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm font-medium tabular-nums text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Meta semanal de leads
              </label>
              <input
                type="number"
                min={1}
                value={draft.weeklyLeadsGoal}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    weeklyLeadsGoal: Math.max(1, Number(e.target.value)),
                  })
                }
                className="h-9 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm font-medium tabular-nums text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Meta mensal de leads
              </label>
              <input
                type="number"
                min={1}
                value={draft.monthlyLeadsGoal}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    monthlyLeadsGoal: Math.max(1, Number(e.target.value)),
                  })
                }
                className="h-9 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm font-medium tabular-nums text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Limite diário de investimento (R$)
              </label>
              <input
                type="number"
                step="1"
                min={1}
                value={draft.dailySpendLimit}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    dailySpendLimit: Math.max(1, Number(e.target.value)),
                  })
                }
                className="h-9 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm font-medium tabular-nums text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Limite semanal de investimento (R$)
              </label>
              <input
                type="number"
                step="1"
                min={1}
                value={draft.weeklySpendLimit}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    weeklySpendLimit: Math.max(1, Number(e.target.value)),
                  })
                }
                className="h-9 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm font-medium tabular-nums text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Limite mensal de investimento (R$)
              </label>
              <input
                type="number"
                step="10"
                min={1}
                value={draft.monthlySpendLimit}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    monthlySpendLimit: Math.max(1, Number(e.target.value)),
                  })
                }
                className="h-9 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm font-medium tabular-nums text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              className="flex h-9 items-center gap-2 rounded-lg bg-[#2563EB] px-4 text-xs font-semibold text-white hover:bg-blue-600 transition-colors"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Salvar configurações</span>
            </button>

            {savedNotice && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#16A34A] dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                <span>Metas salvas localmente</span>
              </span>
            )}
          </div>
        </form>
      </section>

      {/* Progress Bars */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <h3 className="text-sm font-semibold text-[#0F172A] dark:text-white mb-4">
          Acompanhamento de metas e limites
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {progressBars.map((item) => {
            const barColor = item.isInverseCost
              ? item.pct > 100
                ? 'bg-[#DC2626]'
                : item.pct > 85
                ? 'bg-[#D97706]'
                : 'bg-[#16A34A]'
              : item.pct >= 100
              ? 'bg-[#16A34A]'
              : item.pct >= 65
              ? 'bg-[#2563EB]'
              : 'bg-[#D97706]';

            return (
              <div
                key={item.label}
                className="rounded-lg border border-slate-200 dark:border-slate-800 p-4"
              >
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    {item.label}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 tabular-nums">
                    {item.actualText} / {item.targetText}
                  </span>
                </div>
                <div className="mt-2.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className={`h-full rounded-full transition-all ${barColor}`}
                    style={{ width: `${Math.min(100, Math.max(4, item.pct))}%` }}
                  />
                </div>
                <div className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                  {item.note}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Base Reset */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-[#0F172A] dark:text-white">
            Gerenciamento da base de dados local
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Restaure os dados originais da campanha Quarteiro (26/10/2026 a 24/11/2026) caso deseje reiniciar após importações de CSV.
          </p>
        </div>

        {!confirmRestore ? (
          <button
            type="button"
            onClick={() => setConfirmRestore(true)}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/30 px-3.5 text-xs font-semibold text-[#DC2626] dark:text-rose-400 hover:bg-rose-100"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Restaurar base inicial</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => setConfirmRestore(false)}
              className="rounded-md border border-slate-300 dark:border-slate-700 px-3 py-1.5 font-medium"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                onRestoreInitialData();
                setConfirmRestore(false);
              }}
              className="rounded-md bg-[#DC2626] px-3 py-1.5 font-semibold text-white"
            >
              Confirmar restauração
            </button>
          </div>
        )}
      </section>
    </div>
  );
};
