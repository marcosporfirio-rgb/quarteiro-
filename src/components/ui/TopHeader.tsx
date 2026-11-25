import React, { useEffect, useRef, useState } from 'react';
import {
  Calendar,
  ChevronDown,
  Download,
  FileSpreadsheet,
  FileText,
  Menu,
  MessageSquare,
  Moon,
  Sun,
  Upload,
} from 'lucide-react';
import { CLIENT_NAME, PLATFORM_NAME } from '../../data/initialData';
import { DateFilterPreset, DayTypeFilter, NavSection } from '../../types/ads';
import { formatDateBR } from '../../utils/dateUtils';

interface TopHeaderProps {
  campaigns: string[];
  selectedCampaign: string;
  onSelectCampaign: (c: string) => void;
  lastAvailableDate: string;
  currentStart: string;
  currentEnd: string;
  preset: DateFilterPreset;
  onSelectPreset: (p: DateFilterPreset) => void;
  customStart: string;
  customEnd: string;
  onChangeCustomRange: (start: string, end: string) => void;
  dayFilter: DayTypeFilter;
  onSelectDayFilter: (f: DayTypeFilter) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenMobileMenu: () => void;
  onNavigate: (section: NavSection) => void;
  onQuickExportPdf: () => void;
  onQuickExportCsv: () => void;
  onQuickCopyWhatsApp: () => void;
}

const PRESET_OPTIONS: Array<{ value: DateFilterPreset; label: string }> = [
  { value: '7d', label: 'Últimos 7 dias' },
  { value: '14d', label: 'Últimos 14 dias' },
  { value: '30d', label: 'Últimos 30 dias' },
  { value: 'previous', label: 'Período anterior (7d)' },
  { value: 'custom', label: 'Período personalizado' },
];

const DAY_FILTER_OPTIONS: Array<{ value: DayTypeFilter; label: string }> = [
  { value: 'all', label: 'Todos os dias' },
  { value: 'weekdays', label: 'Dias úteis' },
  { value: 'weekends', label: 'Finais de semana' },
  { value: 'active_only', label: 'Somente com investimento' },
];

export const TopHeader: React.FC<TopHeaderProps> = ({
  campaigns,
  selectedCampaign,
  onSelectCampaign,
  lastAvailableDate,
  currentStart,
  currentEnd,
  preset,
  onSelectPreset,
  customStart,
  customEnd,
  onChangeCustomRange,
  dayFilter,
  onSelectDayFilter,
  darkMode,
  onToggleDarkMode,
  onOpenMobileMenu,
  onNavigate,
  onQuickExportPdf,
  onQuickExportCsv,
  onQuickCopyWhatsApp,
}) => {
  const [exportOpen, setExportOpen] = useState(false);
  const [copiedNotice, setCopiedNotice] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const handleCopyWa = () => {
    onQuickCopyWhatsApp();
    setCopiedNotice(true);
    setExportOpen(false);
    setTimeout(() => setCopiedNotice(false), 2200);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm">
      {/* Row 1: Context identity + primary actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 sm:px-6 py-3 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            aria-label="Abrir menu lateral"
            className="lg:hidden rounded-lg border border-slate-200 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-[#142B46] dark:text-slate-100">
                {CLIENT_NAME}
              </span>
              <span aria-hidden="true">·</span>
              <span>{PLATFORM_NAME}</span>
              <span aria-hidden="true">·</span>
              <span className="truncate max-w-[260px] sm:max-w-none font-medium text-slate-700 dark:text-slate-300">
                {selectedCampaign === '__ALL__' ? 'Todas as campanhas' : selectedCampaign}
              </span>
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[12px] text-slate-500 dark:text-slate-400 tabular-nums">
              <span>
                Período ativo:{' '}
                <strong className="font-semibold text-slate-700 dark:text-slate-200">
                  {formatDateBR(currentStart)} a {formatDateBR(currentEnd)}
                </strong>
              </span>
              <span aria-hidden="true">·</span>
              <span>
                Última data na base:{' '}
                <strong className="font-medium text-slate-700 dark:text-slate-200">
                  {formatDateBR(lastAvailableDate)}
                </strong>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onToggleDarkMode}
            aria-label={darkMode ? 'Ativar modo claro' : 'Ativar modo escuro'}
            title={darkMode ? 'Modo claro' : 'Modo escuro'}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={() => onNavigate('import')}
            className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0"
          >
            <Upload className="h-3.5 w-3.5 text-[#2563EB]" />
            <span>Importar CSV</span>
          </button>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setExportOpen((v) => !v)}
              className="flex h-9 items-center gap-2 rounded-lg bg-[#142B46] dark:bg-[#2563EB] px-3.5 text-xs font-semibold text-white hover:bg-[#1c3b60] dark:hover:bg-blue-500 transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="h-3.5 w-3.5" />
              <span>{copiedNotice ? 'Copiado!' : 'Exportar relatório'}</span>
              <ChevronDown className="h-3.5 w-3.5 opacity-80" />
            </button>

            {exportOpen && (
              <div className="absolute right-0 mt-1.5 w-56 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-1.5 shadow-lg z-40">
                <button
                  type="button"
                  onClick={() => {
                    setExportOpen(false);
                    onNavigate('reports');
                  }}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <FileText className="h-4 w-4 text-[#2563EB]" />
                  <span>Abrir relatório executivo</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setExportOpen(false);
                    onQuickExportPdf();
                  }}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <Download className="h-4 w-4 text-slate-500" />
                  <span>Exportar PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setExportOpen(false);
                    onQuickExportCsv();
                  }}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <FileSpreadsheet className="h-4 w-4 text-slate-500" />
                  <span>Exportar tabela CSV</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyWa}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <MessageSquare className="h-4 w-4 text-[#16A34A]" />
                  <span>Copiar resumo WhatsApp</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Dynamic interactive filters */}
      <div className="flex flex-wrap items-center gap-2.5 px-4 sm:px-6 py-2.5 bg-slate-50/70 dark:bg-slate-900/60">
        {/* Campaign selector */}
        <div className="flex items-center gap-1.5">
          <label
            htmlFor="campaign-select"
            className="text-[11px] font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap"
          >
            Campanha:
          </label>
          <select
            id="campaign-select"
            value={selectedCampaign}
            onChange={(e) => onSelectCampaign(e.target.value)}
            className="h-8 max-w-[230px] rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 text-xs font-medium text-slate-800 dark:text-slate-100 focus:border-[#2563EB] focus:outline-none"
          >
            {campaigns.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
            {campaigns.length > 1 && <option value="__ALL__">Todas as campanhas</option>}
          </select>
        </div>

        {/* Period preset buttons */}
        <div
          className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-200/70 dark:bg-slate-800 p-0.5"
          role="group"
          aria-label="Seletor de período"
        >
          {PRESET_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onSelectPreset(opt.value)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                preset === opt.value
                  ? 'bg-white dark:bg-slate-700 text-[#142B46] dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Custom dates when active */}
        {preset === 'custom' && (
          <div className="flex items-center gap-1.5 text-xs">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <input
              type="date"
              aria-label="Data inicial"
              value={customStart}
              onChange={(e) => onChangeCustomRange(e.target.value, customEnd)}
              className="h-8 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-xs text-slate-800 dark:text-slate-100 tabular-nums"
            />
            <span className="text-slate-400">até</span>
            <input
              type="date"
              aria-label="Data final"
              value={customEnd}
              onChange={(e) => onChangeCustomRange(customStart, e.target.value)}
              className="h-8 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-xs text-slate-800 dark:text-slate-100 tabular-nums"
            />
          </div>
        )}

        {/* Day type filter */}
        <div className="flex items-center gap-1.5 ml-auto">
          <label
            htmlFor="day-filter-select"
            className="text-[11px] font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap"
          >
            Recorte:
          </label>
          <select
            id="day-filter-select"
            value={dayFilter}
            onChange={(e) => onSelectDayFilter(e.target.value as DayTypeFilter)}
            className="h-8 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 text-xs font-medium text-slate-800 dark:text-slate-100 focus:border-[#2563EB] focus:outline-none"
          >
            {DAY_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
};
