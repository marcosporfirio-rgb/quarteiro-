import React, { useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  FileUp,
  RotateCcw,
  Upload,
} from 'lucide-react';
import { CsvImportPreview, DailyAdRecord } from '../../types/ads';
import { formatDateBR } from '../../utils/dateUtils';
import { formatBRL, formatNumber } from '../../utils/formatters';
import { parseMetaAdsCsv } from '../../services/csvImporter';

interface ImportViewProps {
  existingRecords: DailyAdRecord[];
  onApplyImport: (
    rows: DailyAdRecord[],
    strategy: 'replace' | 'add_new_only'
  ) => void;
  onRestoreInitialData: () => void;
}

export const ImportView: React.FC<ImportViewProps> = ({
  existingRecords,
  onApplyImport,
  onRestoreInitialData,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<CsvImportPreview | null>(null);
  const [strategy, setStrategy] = useState<'replace' | 'add_new_only'>('replace');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [confirmRestore, setConfirmRestore] = useState(false);

  const handleFile = (file: File) => {
    setStatusMessage(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = String(e.target?.result ?? '');
      const parsed = parseMetaAdsCsv(text, file.name, existingRecords);
      setPreview(parsed);
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleConfirmImport = () => {
    if (!preview || preview.validDailyRows.length === 0) return;
    onApplyImport(preview.validDailyRows, strategy);
    const count =
      strategy === 'replace'
        ? preview.validDailyRows.length
        : preview.newRows.length;
    setStatusMessage(
      `Importação concluída: ${count} registro(s) aplicados e salvos localmente. Todos os dashboards foram atualizados.`
    );
    setPreview(null);
  };

  return (
    <div className="space-y-6">
      {/* Drag and drop zone */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
          <div>
            <h2 className="text-base font-semibold text-[#0F172A] dark:text-white">
              Importação de dados CSV do Meta Ads
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Suporte automático para exportações em português do Gerenciador de Anúncios (detalhamento diário por campanha)
            </p>
          </div>

          <button
            type="button"
            onClick={() => setConfirmRestore(true)}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
            <span>Restaurar base inicial</span>
          </button>
        </div>

        {confirmRestore && (
          <div className="mb-5 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/80 dark:bg-amber-950/30 p-4 text-xs flex flex-wrap items-center justify-between gap-3">
            <span className="text-amber-900 dark:text-amber-200">
              Confirmar restauração da base inicial da Quarteiro (26/10/2026 a 24/11/2026)? Dados importados localmente serão substituídos.
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setConfirmRestore(false)}
                className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 font-medium text-slate-700 dark:text-slate-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onRestoreInitialData();
                  setConfirmRestore(false);
                  setPreview(null);
                  setStatusMessage('Base inicial restaurada com sucesso.');
                }}
                className="rounded-md bg-[#142B46] px-3 py-1.5 font-semibold text-white hover:bg-[#1c3b60]"
              >
                Confirmar restauração
              </button>
            </div>
          </div>
        )}

        {statusMessage && (
          <div className="mb-5 flex items-center gap-2.5 rounded-lg border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/80 dark:bg-emerald-950/30 p-3.5 text-xs text-emerald-900 dark:text-emerald-200">
            <CheckCircle2 className="h-4 w-4 text-[#16A34A] shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
            isDragging
              ? 'border-[#2563EB] bg-blue-50/60 dark:bg-blue-950/30'
              : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30'
          }`}
        >
          <FileUp className="mx-auto h-10 w-10 text-[#2563EB]" />
          <div className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">
            Arraste e solte seu arquivo CSV do Meta Ads aqui
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Reconhece vírgula, ponto e vírgula, decimais BR/US, datas DD/MM/AAAA ou AAAA-MM-DD
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = '';
            }}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-semibold text-white hover:bg-blue-600 transition-colors"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Selecionar arquivo CSV</span>
          </button>
        </div>

        {/* Column recognition rules */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 dark:text-slate-300">
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3.5">
            <div className="font-semibold text-slate-800 dark:text-slate-100 mb-1">
              Regras de mapeamento de leads e granularidade
            </div>
            <ul className="space-y-1 list-disc pl-4">
              <li>
                Prioriza <strong>Conversas por mensagem iniciadas</strong>.
              </li>
              <li>
                Usa <strong>Resultados</strong> apenas quando o Indicador de resultados corresponder a conversas por mensagem iniciadas.
              </li>
              <li>
                Rejeita arquivos consolidados onde Início dos relatórios ≠ Encerramento dos relatórios.
              </li>
            </ul>
          </div>
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3.5">
            <div className="font-semibold text-slate-800 dark:text-slate-100 mb-1">
              Chave única e persistência local
            </div>
            <ul className="space-y-1 list-disc pl-4">
              <li>
                Identifica registros duplicados pela chave <strong>Campanha + Data</strong>.
              </li>
              <li>
                Preserva campos vazios de conversas em dias com investimento como dados ausentes (nulos).
              </li>
              <li>
                Armazena a base atualizada em LocalStorage automaticamente.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Preview Panel */}
      {preview && (
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-[#0F172A] dark:text-white">
                Prévia de importação: {preview.fileName}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                Delimitador detectado: <code>{preview.delimiter === '\t' ? 'TAB' : preview.delimiter}</code> ·{' '}
                {preview.validDailyRows.length} linha(s) diária(s) válida(s) ·{' '}
                {preview.newRows.length} nova(s) · {preview.duplicateRows.length} duplicada(s)
              </p>
            </div>

            {preview.validDailyRows.length > 0 && !preview.isConsolidatedError && (
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={strategy}
                  onChange={(e) =>
                    setStrategy(e.target.value as 'replace' | 'add_new_only')
                  }
                  className="h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs font-medium text-slate-800 dark:text-slate-100"
                >
                  <option value="replace">
                    Substituir duplicados e adicionar novos ({preview.validDailyRows.length})
                  </option>
                  <option value="add_new_only">
                    Adicionar apenas novos períodos ({preview.newRows.length})
                  </option>
                </select>

                <button
                  type="button"
                  onClick={handleConfirmImport}
                  className="h-9 rounded-lg bg-[#16A34A] px-4 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
                >
                  Confirmar importação
                </button>
              </div>
            )}
          </div>

          {/* Errors & Warnings */}
          {preview.errors.length > 0 && (
            <div className="rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/30 p-3.5 text-xs text-rose-900 dark:text-rose-200 space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-[#DC2626]" />
                <span>Inconsistências detectadas</span>
              </div>
              <ul className="list-disc pl-5 space-y-0.5">
                {preview.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {preview.warnings.length > 0 && (
            <div className="rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 p-3.5 text-xs text-amber-900 dark:text-amber-200 space-y-1">
              <div className="font-semibold">Avisos de importação</div>
              <ul className="list-disc pl-5 space-y-0.5">
                {preview.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {preview.campaignsDetected.length > 0 && (
            <div className="text-xs text-slate-600 dark:text-slate-300">
              Campanhas identificadas:{' '}
              <strong>{preview.campaignsDetected.join(', ')}</strong>
            </div>
          )}

          {preview.validDailyRows.length > 0 && (
            <div className="overflow-x-auto max-h-80 border border-slate-200 dark:border-slate-800 rounded-lg">
              <table className="w-full text-left text-xs border-collapse tabular-nums">
                <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-2 px-3">Data</th>
                    <th className="py-2 px-3">Campanha</th>
                    <th className="py-2 px-3 text-right">Investimento</th>
                    <th className="py-2 px-3 text-right">Leads</th>
                    <th className="py-2 px-3 text-right">Cliques</th>
                    <th className="py-2 px-3 text-right">Impressões</th>
                    <th className="py-2 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {preview.validDailyRows.map((r) => {
                    const isDup = preview.duplicateRows.some((d) => d.id === r.id);
                    return (
                      <tr key={r.id}>
                        <td className="py-2 px-3 font-medium">{formatDateBR(r.date)}</td>
                        <td className="py-2 px-3 truncate max-w-[220px]">{r.campaign}</td>
                        <td className="py-2 px-3 text-right">{formatBRL(r.spend)}</td>
                        <td className="py-2 px-3 text-right">
                          {r.leads === null ? (
                            <span className="text-[#D97706] font-semibold">N/D</span>
                          ) : (
                            formatNumber(r.leads)
                          )}
                        </td>
                        <td className="py-2 px-3 text-right">{formatNumber(r.clicks)}</td>
                        <td className="py-2 px-3 text-right">
                          {formatNumber(r.impressions)}
                        </td>
                        <td className="py-2 px-3 text-right">
                          {isDup ? (
                            <span className="text-amber-600 dark:text-amber-400 font-medium">
                              Duplicado
                            </span>
                          ) : (
                            <span className="text-[#16A34A] dark:text-emerald-400 font-medium">
                              Novo
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
};
