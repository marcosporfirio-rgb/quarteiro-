import React, { useMemo, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  FileSpreadsheet,
  MessageSquare,
  Printer,
} from 'lucide-react';
import { CLIENT_NAME, PLATFORM_NAME } from '../../data/initialData';
import {
  AggregatedMetrics,
  DailyComputedRow,
  WeekdaySummary,
} from '../../types/ads';
import { formatDateBR } from '../../utils/dateUtils';
import {
  formatBRL,
  formatDeltaPercent,
  formatNumber,
  formatPercent,
} from '../../utils/formatters';
import { calculatePercentVariation } from '../../services/metricsEngine';
import {
  buildMarkdownReport,
  buildWhatsAppReport,
  exportDailyCsv,
  exportExecutivePdf,
} from '../../services/reportService';

interface ReportsViewProps {
  campaign: string;
  currentStart: string;
  currentEnd: string;
  previousStart: string;
  previousEnd: string;
  current: AggregatedMetrics;
  previous: AggregatedMetrics;
  dailyRows: DailyComputedRow[];
  weekdaySummary: WeekdaySummary[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  campaign,
  currentStart,
  currentEnd,
  previousStart,
  previousEnd,
  current,
  previous,
  dailyRows,
  weekdaySummary,
}) => {
  const [copiedType, setCopiedType] = useState<'wa' | 'md' | null>(null);

  const payload = useMemo(
    () => ({
      campaign,
      currentStart,
      currentEnd,
      previousStart,
      previousEnd,
      current,
      previous,
      dailyRows,
      weekdaySummary,
    }),
    [
      campaign,
      currentStart,
      currentEnd,
      previousStart,
      previousEnd,
      current,
      previous,
      dailyRows,
      weekdaySummary,
    ]
  );

  const whatsappText = useMemo(() => buildWhatsAppReport(payload), [payload]);
  const markdownText = useMemo(() => buildMarkdownReport(payload), [payload]);

  const copyToClipboard = async (text: string, type: 'wa' | 'md') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2200);
    } catch {
      // Fallback textarea copy
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2200);
    }
  };

  const bestWeekdays = useMemo(
    () =>
      [...weekdaySummary]
        .filter((w) => w.leads > 0)
        .sort((a, b) => b.leads - a.leads)
        .slice(0, 3),
    [weekdaySummary]
  );

  return (
    <div className="space-y-6">
      {/* Action Toolbar */}
      <section className="no-print rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[#0F172A] dark:text-white">
            Central de relatórios executivos
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Todos os números são gerados dinamicamente com base no período filtrado
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => exportExecutivePdf(payload)}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-[#142B46] dark:bg-[#2563EB] px-3.5 text-xs font-semibold text-white hover:bg-[#1c3b60] dark:hover:bg-blue-500 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Exportar PDF</span>
          </button>

          <button
            type="button"
            onClick={() =>
              exportDailyCsv(
                dailyRows,
                `quarteiro-relatorio-${currentStart}-a-${currentEnd}`
              )
            }
            className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-[#2563EB]" />
            <span>Exportar CSV</span>
          </button>

          <button
            type="button"
            onClick={() => copyToClipboard(whatsappText, 'wa')}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/30 px-3 text-xs font-semibold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
          >
            {copiedType === 'wa' ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <MessageSquare className="h-3.5 w-3.5" />
            )}
            <span>
              {copiedType === 'wa' ? 'Copiado para WhatsApp!' : 'Copiar para WhatsApp'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => copyToClipboard(markdownText, 'md')}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            {copiedType === 'md' ? (
              <Check className="h-3.5 w-3.5 text-[#16A34A]" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-slate-500" />
            )}
            <span>
              {copiedType === 'md' ? 'Markdown copiado!' : 'Copiar Markdown'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            <Printer className="h-3.5 w-3.5 text-slate-500" />
            <span>Imprimir relatório</span>
          </button>
        </div>
      </section>

      {/* WhatsApp Preview + Executive Document */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* WhatsApp Ready Preview */}
        <section className="no-print xl:col-span-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h3 className="text-sm font-semibold text-[#0F172A] dark:text-white">
              Prévia para WhatsApp
            </h3>
            <button
              type="button"
              onClick={() => copyToClipboard(whatsappText, 'wa')}
              className="text-xs font-semibold text-[#2563EB] hover:underline"
            >
              {copiedType === 'wa' ? 'Copiado' : 'Copiar texto'}
            </button>
          </div>
          <pre className="whitespace-pre-wrap rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 text-xs leading-relaxed text-slate-800 dark:text-slate-200 font-sans">
            {whatsappText}
          </pre>
        </section>

        {/* Full Printable Executive Report */}
        <article className="xl:col-span-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-[0_1px_2px_rgba(15,23,42,0.04)] space-y-6">
          {/* Header */}
          <div className="border-b border-slate-200 dark:border-slate-800 pb-5 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xs font-bold tracking-wider text-[#2563EB]">
                QUARTEIRO · PERFORMANCE INTELLIGENCE
              </div>
              <h1 className="mt-1 text-xl font-bold text-[#0F172A] dark:text-white">
                Relatório Executivo de Mídia Paga
              </h1>
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 space-x-2">
                <span>Cliente: <strong>{CLIENT_NAME}</strong></span>
                <span>·</span>
                <span>Plataforma: <strong>{PLATFORM_NAME}</strong></span>
                <span>·</span>
                <span>Campanha: <strong>{campaign}</strong></span>
              </div>
            </div>

            <div className="text-left sm:text-right text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              <div>
                Período analisado:{' '}
                <strong className="text-slate-900 dark:text-white">
                  {formatDateBR(currentStart)} a {formatDateBR(currentEnd)}
                </strong>
              </div>
              <div className="mt-0.5">
                Comparativo anterior:{' '}
                <span>
                  {formatDateBR(previousStart)} a {formatDateBR(previousEnd)}
                </span>
              </div>
            </div>
          </div>

          {/* KPI Summary */}
          <div className="print-break-inside-avoid">
            <h2 className="text-sm font-semibold text-[#142B46] dark:text-white mb-3">
              1. Resumo dos principais indicadores e comparativo
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                    <th className="py-2 text-left">Indicador</th>
                    <th className="py-2 text-right">Atual</th>
                    <th className="py-2 text-right">Anterior</th>
                    <th className="py-2 text-right">Variação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 tabular-nums">
                  {[
                    {
                      label: 'Investimento total',
                      c: formatBRL(current.spend),
                      p: formatBRL(previous.spend),
                      d: calculatePercentVariation(current.spend, previous.spend),
                    },
                    {
                      label: 'Leads (conversas iniciadas)',
                      c: formatNumber(current.leads),
                      p: formatNumber(previous.leads),
                      d: calculatePercentVariation(current.leads, previous.leads),
                    },
                    {
                      label: 'Custo por lead (CPL)',
                      c: formatBRL(current.cpl),
                      p: formatBRL(previous.cpl),
                      d: calculatePercentVariation(current.cpl, previous.cpl),
                    },
                    {
                      label: 'Média diária de leads',
                      c: formatNumber(current.leadsPerDay, 2),
                      p: formatNumber(previous.leadsPerDay, 2),
                      d: calculatePercentVariation(current.leadsPerDay, previous.leadsPerDay),
                    },
                    {
                      label: 'Cliques / CTR',
                      c: `${formatNumber(current.clicks)} (${formatPercent(current.ctr)})`,
                      p: `${formatNumber(previous.clicks)} (${formatPercent(previous.ctr)})`,
                      d: calculatePercentVariation(current.ctr, previous.ctr),
                    },
                    {
                      label: 'CPC / CPM',
                      c: `${formatBRL(current.cpc)} / ${formatBRL(current.cpm)}`,
                      p: `${formatBRL(previous.cpc)} / ${formatBRL(previous.cpm)}`,
                      d: calculatePercentVariation(current.cpm, previous.cpm),
                    },
                  ].map((r) => (
                    <tr key={r.label}>
                      <td className="py-2 font-medium text-slate-700 dark:text-slate-200">
                        {r.label}
                      </td>
                      <td className="py-2 text-right font-semibold text-slate-900 dark:text-white">
                        {r.c}
                      </td>
                      <td className="py-2 text-right text-slate-500">{r.p}</td>
                      <td className="py-2 text-right font-medium">
                        {formatDeltaPercent(r.d)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Daily table */}
          <div className="print-break-inside-avoid">
            <h2 className="text-sm font-semibold text-[#142B46] dark:text-white mb-3">
              2. Desempenho diário
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse tabular-nums">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                    <th className="py-2 text-left">Data</th>
                    <th className="py-2 text-left">Dia</th>
                    <th className="py-2 text-right">Investimento</th>
                    <th className="py-2 text-right">Leads</th>
                    <th className="py-2 text-right">CPL</th>
                    <th className="py-2 text-right">Cliques</th>
                    <th className="py-2 text-right">CTR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {dailyRows.map((r) => (
                    <tr key={r.id}>
                      <td className="py-1.5 font-medium">{formatDateBR(r.date)}</td>
                      <td className="py-1.5 text-slate-500">{r.dayShort}</td>
                      <td className="py-1.5 text-right">{formatBRL(r.spend)}</td>
                      <td className="py-1.5 text-right">
                        {r.leads === null ? 'N/D' : formatNumber(r.leads)}
                      </td>
                      <td className="py-1.5 text-right">{formatBRL(r.cpl)}</td>
                      <td className="py-1.5 text-right">{formatNumber(r.clicks)}</td>
                      <td className="py-1.5 text-right">{formatPercent(r.ctr)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Best Weekdays */}
          <div className="print-break-inside-avoid">
            <h2 className="text-sm font-semibold text-[#142B46] dark:text-white mb-2.5">
              3. Melhores dias da semana (histórico)
            </h2>
            <div className="space-y-2 text-xs">
              {bestWeekdays.map((w, idx) => (
                <div
                  key={w.dayIndex}
                  className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 tabular-nums"
                >
                  <span>
                    <strong>#{idx + 1}</strong> {w.dayName} ({w.activeDays}d ativos)
                  </span>
                  <span className="font-semibold">
                    {w.leads} leads · {formatBRL(w.cpl)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </article>
      </div>
    </div>
  );
};
