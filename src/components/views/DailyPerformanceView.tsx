import React, { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Download,
  Search,
} from 'lucide-react';
import { DailyComputedRow } from '../../types/ads';
import { formatDateBR, formatShortDateBR } from '../../utils/dateUtils';
import {
  formatBRL,
  formatDeltaPercent,
  formatNumber,
  formatPercent,
} from '../../utils/formatters';
import { getBestAndWorstDays } from '../../services/metricsEngine';
import { exportDailyCsv } from '../../services/reportService';

interface DailyPerformanceViewProps {
  dailyRows: DailyComputedRow[];
  campaign: string;
}

type SortKey =
  | 'date'
  | 'dayIndex'
  | 'spend'
  | 'leads'
  | 'cpl'
  | 'clicks'
  | 'impressions'
  | 'cpc'
  | 'ctr'
  | 'cpm'
  | 'leadsDeltaPct'
  | 'cplDeltaPct';

export const DailyPerformanceView: React.FC<DailyPerformanceViewProps> = ({
  dailyRows,
  campaign,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [heatmapMetric, setHeatmapMetric] = useState<'leads' | 'cpl'>('leads');

  const { highestLeadsDay, lowestCplDay, highestSpendDay } = useMemo(
    () => getBestAndWorstDays(dailyRows),
    [dailyRows]
  );

  const filteredAndSorted = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = q
      ? dailyRows.filter(
          (r) =>
            formatDateBR(r.date).toLowerCase().includes(q) ||
            r.date.includes(q) ||
            r.dayName.toLowerCase().includes(q)
        )
      : dailyRows;

    const sorted = [...filtered].sort((a, b) => {
      const getVal = (row: DailyComputedRow): number | string => {
        const v = row[sortKey];
        if (v === null || v === undefined) {
          return sortDir === 'asc' ? Number.MAX_SAFE_INTEGER : -Number.MAX_SAFE_INTEGER;
        }
        return v;
      };
      const av = getVal(a);
      const bv = getVal(b);
      if (typeof av === 'string' && typeof bv === 'string') {
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortDir === 'asc'
        ? Number(av) - Number(bv)
        : Number(bv) - Number(av);
    });

    return sorted;
  }, [dailyRows, searchQuery, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const maxLeads = Math.max(1, ...dailyRows.map((r) => r.leads ?? 0));
  const validCpls = dailyRows.map((r) => r.cpl).filter((v): v is number => v !== null);
  const minCpl = validCpls.length ? Math.min(...validCpls) : 0;
  const maxCpl = validCpls.length ? Math.max(...validCpls) : 1;

  const getHeatmapStyle = (row: DailyComputedRow) => {
    if (row.isIncomplete) {
      return 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200';
    }
    if (!row.hasSpend) {
      return 'bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500';
    }
    if (heatmapMetric === 'leads') {
      const ratio = (row.leads ?? 0) / maxLeads;
      if (ratio >= 0.75) {
        return 'bg-[#142B46] text-white border-[#142B46] dark:bg-blue-600 dark:border-blue-500';
      }
      if (ratio >= 0.45) {
        return 'bg-[#2563EB]/85 text-white border-[#2563EB]';
      }
      if (ratio > 0) {
        return 'bg-blue-100 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-blue-950 dark:text-blue-100';
      }
      return 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300';
    } else {
      if (row.cpl === null) {
        return 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500';
      }
      const norm = maxCpl > minCpl ? (row.cpl - minCpl) / (maxCpl - minCpl) : 0.5;
      if (norm <= 0.33) {
        return 'bg-emerald-600 text-white border-emerald-700';
      }
      if (norm <= 0.66) {
        return 'bg-amber-100 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-100';
      }
      return 'bg-rose-600 text-white border-rose-700';
    }
  };

  const renderSortIcon = (key: SortKey) => {
    if (sortKey !== key) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
    return sortDir === 'asc' ? (
      <ArrowUp className="h-3 w-3 text-[#2563EB]" />
    ) : (
      <ArrowDown className="h-3 w-3 text-[#2563EB]" />
    );
  };

  const columns: Array<{ key: SortKey; label: string; align?: 'left' | 'right' }> = [
    { key: 'date', label: 'Data', align: 'left' },
    { key: 'dayIndex', label: 'Dia da semana', align: 'left' },
    { key: 'spend', label: 'Investimento', align: 'right' },
    { key: 'leads', label: 'Leads', align: 'right' },
    { key: 'cpl', label: 'CPL', align: 'right' },
    { key: 'clicks', label: 'Cliques', align: 'right' },
    { key: 'impressions', label: 'Impressões', align: 'right' },
    { key: 'cpc', label: 'CPC', align: 'right' },
    { key: 'ctr', label: 'CTR', align: 'right' },
    { key: 'cpm', label: 'CPM', align: 'right' },
    { key: 'leadsDeltaPct', label: 'Var. Leads', align: 'right' },
    { key: 'cplDeltaPct', label: 'Var. CPL', align: 'right' },
  ];

  return (
    <div className="space-y-6">
      {/* Heatmap Calendar */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-sm font-semibold text-[#0F172A] dark:text-white">
              Calendário de performance (Heatmap)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Visualização diária colorida por {heatmapMetric === 'leads' ? 'volume de leads' : 'CPL consolidado'}
            </p>
          </div>

          <div className="flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 p-1">
            <button
              type="button"
              onClick={() => setHeatmapMetric('leads')}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                heatmapMetric === 'leads'
                  ? 'bg-white dark:bg-slate-700 text-[#142B46] dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Volume de leads
            </button>
            <button
              type="button"
              onClick={() => setHeatmapMetric('cpl')}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                heatmapMetric === 'cpl'
                  ? 'bg-white dark:bg-slate-700 text-[#142B46] dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              CPL (R$)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
          {dailyRows.map((row) => (
            <div
              key={row.id}
              className={`rounded-lg border p-2.5 transition-colors ${getHeatmapStyle(row)}`}
              title={`${formatDateBR(row.date)} (${row.dayName}) · Investimento: ${formatBRL(
                row.spend
              )} · Leads: ${row.leads ?? 'Não informado'} · CPL: ${formatBRL(row.cpl)}`}
            >
              <div className="flex items-center justify-between text-[11px] opacity-85 tabular-nums">
                <span className="font-semibold">{formatShortDateBR(row.date)}</span>
                <span>{row.dayShort}</span>
              </div>
              <div className="mt-1.5 text-sm font-bold tabular-nums">
                {heatmapMetric === 'leads'
                  ? row.isIncomplete
                    ? 'N/D'
                    : `${formatNumber(row.leads)} leads`
                  : row.cpl !== null
                  ? formatBRL(row.cpl)
                  : row.isIncomplete
                  ? 'N/D'
                  : '—'}
              </div>
              <div className="mt-0.5 text-[10px] opacity-80 tabular-nums">
                {row.hasSpend ? formatBRL(row.spend) : 'Sem veiculação'}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400">
          <span>Legenda:</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-xs bg-slate-200 dark:bg-slate-700" />
            Sem veiculação
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-xs bg-amber-300 dark:bg-amber-700" />
            Dados incompletos (leads N/D)
          </span>
          {heatmapMetric === 'leads' ? (
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-xs bg-[#142B46] dark:bg-blue-600" />
              Maior volume de leads
            </span>
          ) : (
            <>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs bg-emerald-600" />
                Menor CPL
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs bg-rose-600" />
                Maior CPL
              </span>
            </>
          )}
        </div>
      </section>

      {/* Full Sortable Table */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.04)] overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-sm font-semibold text-[#0F172A] dark:text-white">
              Tabela analítica de desempenho diário
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {filteredAndSorted.length} dia(s) exibido(s) · Clique no cabeçalho de qualquer coluna para ordenar
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar data ou dia..."
                className="h-8 w-48 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-8 pr-3 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:border-[#2563EB] focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={() =>
                exportDailyCsv(
                  filteredAndSorted,
                  `quarteiro-diario-${campaign.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
                )
              }
              className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <Download className="h-3.5 w-3.5 text-[#2563EB]" />
              <span>Exportar CSV</span>
            </button>
          </div>
        </div>

        {/* Highlight legend */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 px-5 py-2.5 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300">
          <span>
            Maior nº de leads:{' '}
            <strong className="text-[#16A34A] dark:text-emerald-400">
              {highestLeadsDay ? `${formatDateBR(highestLeadsDay.date)} (${highestLeadsDay.leads})` : '—'}
            </strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            Menor CPL válido:{' '}
            <strong className="text-[#2563EB] dark:text-blue-400">
              {lowestCplDay ? `${formatDateBR(lowestCplDay.date)} (${formatBRL(lowestCplDay.cpl)})` : '—'}
            </strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            Maior investimento:{' '}
            <strong className="text-slate-900 dark:text-white">
              {highestSpendDay ? `${formatDateBR(highestSpendDay.date)} (${formatBRL(highestSpendDay.spend)})` : '—'}
            </strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`py-2.5 px-3 whitespace-nowrap ${
                      col.align === 'right' ? 'text-right' : 'text-left'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSort(col.key)}
                      className={`inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-white transition-colors ${
                        col.align === 'right' ? 'flex-row-reverse' : ''
                      }`}
                    >
                      <span>{col.label}</span>
                      {renderSortIcon(col.key)}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredAndSorted.length === 0 ? (
                <tr>
                  <td
                    colSpan={12}
                    className="py-10 text-center text-slate-500 dark:text-slate-400"
                  >
                    Nenhum registro encontrado para os filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredAndSorted.map((row) => {
                  const isMaxLeads = highestLeadsDay?.id === row.id;
                  const isMinCpl = lowestCplDay?.id === row.id;
                  const isMaxSpend = highestSpendDay?.id === row.id;

                  return (
                    <tr
                      key={row.id}
                      className={`transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                        row.isIncomplete
                          ? 'bg-amber-50/50 dark:bg-amber-950/20'
                          : !row.hasSpend
                          ? 'bg-slate-50/50 dark:bg-slate-900/40 text-slate-400 dark:text-slate-500'
                          : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 font-medium tabular-nums whitespace-nowrap text-slate-800 dark:text-slate-200">
                        {formatDateBR(row.date)}
                        {!row.hasSpend && (
                          <span className="ml-1.5 text-[10px] text-slate-400">
                            (sem entrega)
                          </span>
                        )}
                        {row.isIncomplete && (
                          <span className="ml-1.5 text-[10px] font-semibold text-[#D97706]">
                            (incompleto)
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-slate-600 dark:text-slate-400">
                        {row.dayName}
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right tabular-nums ${
                          isMaxSpend
                            ? 'font-bold text-[#142B46] dark:text-white underline decoration-[#2563EB]/60 underline-offset-4'
                            : 'font-medium'
                        }`}
                      >
                        {formatBRL(row.spend)}
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right tabular-nums ${
                          isMaxLeads
                            ? 'font-bold text-[#16A34A] dark:text-emerald-400'
                            : ''
                        }`}
                      >
                        {row.isIncomplete ? (
                          <span
                            title="Conversas não informadas neste dia"
                            className="font-semibold text-[#D97706]"
                          >
                            Não informado
                          </span>
                        ) : (
                          formatNumber(row.leads)
                        )}
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right tabular-nums ${
                          isMinCpl
                            ? 'font-bold text-[#2563EB] dark:text-blue-400'
                            : ''
                        }`}
                      >
                        {formatBRL(row.cpl)}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums">
                        {formatNumber(row.clicks)}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums">
                        {formatNumber(row.impressions)}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums">
                        {formatBRL(row.cpc)}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums">
                        {formatPercent(row.ctr)}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums">
                        {formatBRL(row.cpm)}
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right tabular-nums font-medium ${
                          row.leadsDeltaPct === null
                            ? 'text-slate-400'
                            : row.leadsDeltaPct > 0
                            ? 'text-[#16A34A] dark:text-emerald-400'
                            : row.leadsDeltaPct < 0
                            ? 'text-[#DC2626] dark:text-rose-400'
                            : 'text-slate-500'
                        }`}
                      >
                        {formatDeltaPercent(row.leadsDeltaPct)}
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right tabular-nums font-medium ${
                          row.cplDeltaPct === null
                            ? 'text-slate-400'
                            : row.cplDeltaPct < 0
                            ? 'text-[#16A34A] dark:text-emerald-400'
                            : row.cplDeltaPct > 0
                            ? 'text-[#DC2626] dark:text-rose-400'
                            : 'text-slate-500'
                        }`}
                      >
                        {formatDeltaPercent(row.cplDeltaPct)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
