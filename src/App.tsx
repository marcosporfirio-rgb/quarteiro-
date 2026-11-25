import { useEffect, useMemo, useState } from 'react';
import { Sidebar } from './components/ui/Sidebar';
import { TopHeader } from './components/ui/TopHeader';
import { DailyPerformanceView } from './components/views/DailyPerformanceView';
import { ImportView } from './components/views/ImportView';
import { OverviewView } from './components/views/OverviewView';
import { ReportsView } from './components/views/ReportsView';
import { SettingsView } from './components/views/SettingsView';
import { SimulatorView } from './components/views/SimulatorView';
import { WeekdayAnalysisView } from './components/views/WeekdayAnalysisView';
import { WeeklyComparisonView } from './components/views/WeeklyComparisonView';
import {
  DEFAULT_CAMPAIGN,
  DEFAULT_GOALS,
  INITIAL_RECORDS,
} from './data/initialData';
import {
  applyDayTypeFilter,
  buildContinuousTimeline,
  buildDailyComputedRows,
  calculateAggregatedMetrics,
  calculateWeekdayAnalysis,
  detectPauseComparisons,
  getAvailableCampaigns,
  resolvePeriodRange,
  sliceAndFillRange,
} from './services/metricsEngine';
import {
  buildWhatsAppReport,
  exportDailyCsv,
  exportExecutivePdf,
} from './services/reportService';
import {
  DailyAdRecord,
  DateFilterPreset,
  DayTypeFilter,
  GoalsConfig,
  NavSection,
} from './types/ads';

const STORAGE_RECORDS_KEY = 'quarteiro_ads_records_v1';
const STORAGE_GOALS_KEY = 'quarteiro_ads_goals_v1';
const STORAGE_THEME_KEY = 'quarteiro_theme_v1';

function loadStoredRecords(): DailyAdRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_RECORDS_KEY);
    if (!raw) return INITIAL_RECORDS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {
    // ignore storage errors
  }
  return INITIAL_RECORDS;
}

function loadStoredGoals(): GoalsConfig {
  try {
    const raw = localStorage.getItem(STORAGE_GOALS_KEY);
    if (!raw) return DEFAULT_GOALS;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.targetCpl === 'number') {
      return { ...DEFAULT_GOALS, ...parsed };
    }
  } catch {
    // ignore storage errors
  }
  return DEFAULT_GOALS;
}

function loadStoredTheme(): boolean {
  try {
    return localStorage.getItem(STORAGE_THEME_KEY) === 'dark';
  } catch {
    return false;
  }
}

export default function App() {
  const [records, setRecords] = useState<DailyAdRecord[]>(loadStoredRecords);
  const [goals, setGoals] = useState<GoalsConfig>(loadStoredGoals);
  const [darkMode, setDarkMode] = useState<boolean>(loadStoredTheme);

  const [activeSection, setActiveSection] = useState<NavSection>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const campaigns = useMemo(() => getAvailableCampaigns(records), [records]);
  const [selectedCampaign, setSelectedCampaign] = useState<string>(
    () => (campaigns.includes(DEFAULT_CAMPAIGN) ? DEFAULT_CAMPAIGN : campaigns[0] || DEFAULT_CAMPAIGN)
  );

  const [preset, setPreset] = useState<DateFilterPreset>('7d');
  const [customStart, setCustomStart] = useState<string>('2026-11-18');
  const [customEnd, setCustomEnd] = useState<string>('2026-11-24');
  const [dayFilter, setDayFilter] = useState<DayTypeFilter>('all');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_RECORDS_KEY, JSON.stringify(records));
    } catch {
      // ignore storage quota
    }
  }, [records]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_GOALS_KEY, JSON.stringify(goals));
    } catch {
      // ignore storage quota
    }
  }, [goals]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_THEME_KEY, darkMode ? 'dark' : 'light');
    } catch {
      // ignore
    }
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Keep selectedCampaign valid if dataset changes
  const effectiveCampaign =
    selectedCampaign === '__ALL__' || campaigns.includes(selectedCampaign)
      ? selectedCampaign
      : campaigns[0] || DEFAULT_CAMPAIGN;

  const continuousTimeline = useMemo(
    () => buildContinuousTimeline(records, effectiveCampaign),
    [records, effectiveCampaign]
  );

  const periodRange = useMemo(
    () => resolvePeriodRange(continuousTimeline, preset, customStart, customEnd),
    [continuousTimeline, preset, customStart, customEnd]
  );

  const currentRawRecords = useMemo(() => {
    const filled = sliceAndFillRange(
      continuousTimeline,
      periodRange.currentStart,
      periodRange.currentEnd,
      effectiveCampaign
    );
    return applyDayTypeFilter(filled, dayFilter);
  }, [
    continuousTimeline,
    periodRange.currentStart,
    periodRange.currentEnd,
    effectiveCampaign,
    dayFilter,
  ]);

  const previousRawRecords = useMemo(() => {
    const filled = sliceAndFillRange(
      continuousTimeline,
      periodRange.previousStart,
      periodRange.previousEnd,
      effectiveCampaign
    );
    return applyDayTypeFilter(filled, dayFilter);
  }, [
    continuousTimeline,
    periodRange.previousStart,
    periodRange.previousEnd,
    effectiveCampaign,
    dayFilter,
  ]);

  const currentMetrics = useMemo(
    () => calculateAggregatedMetrics(currentRawRecords),
    [currentRawRecords]
  );

  const previousMetrics = useMemo(
    () => calculateAggregatedMetrics(previousRawRecords),
    [previousRawRecords]
  );

  const historyFilteredRecords = useMemo(
    () => applyDayTypeFilter(continuousTimeline, dayFilter),
    [continuousTimeline, dayFilter]
  );

  const historyMetrics = useMemo(
    () => calculateAggregatedMetrics(historyFilteredRecords),
    [historyFilteredRecords]
  );

  const currentComputedRows = useMemo(
    () => buildDailyComputedRows(currentRawRecords),
    [currentRawRecords]
  );

  const previousComputedRows = useMemo(
    () => buildDailyComputedRows(previousRawRecords),
    [previousRawRecords]
  );

  const weekdaySummary = useMemo(
    () => calculateWeekdayAnalysis(historyFilteredRecords),
    [historyFilteredRecords]
  );

  const pauses = useMemo(
    () => detectPauseComparisons(continuousTimeline),
    [continuousTimeline]
  );

  const handleSelectPreset = (nextPreset: DateFilterPreset) => {
    if (nextPreset === 'custom') {
      setCustomStart(periodRange.currentStart);
      setCustomEnd(periodRange.currentEnd);
    }
    setPreset(nextPreset);
  };

  const handleApplyImport = (
    importedRows: DailyAdRecord[],
    strategy: 'replace' | 'add_new_only'
  ) => {
    setRecords((prev) => {
      const map = new Map(prev.map((r) => [r.id, r]));
      for (const row of importedRows) {
        if (strategy === 'replace') {
          map.set(row.id, row);
        } else if (!map.has(row.id)) {
          map.set(row.id, row);
        }
      }
      return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
    });

    if (importedRows.length > 0) {
      const firstImportedCampaign = importedRows[0].campaign;
      if (!campaigns.includes(firstImportedCampaign)) {
        setSelectedCampaign(firstImportedCampaign);
      }
    }
  };

  const handleRestoreInitialData = () => {
    setRecords(INITIAL_RECORDS);
    setSelectedCampaign(DEFAULT_CAMPAIGN);
    setPreset('7d');
    setDayFilter('all');
  };

  const reportPayload = useMemo(
    () => ({
      campaign:
        effectiveCampaign === '__ALL__' ? 'Todas as campanhas' : effectiveCampaign,
      currentStart: periodRange.currentStart,
      currentEnd: periodRange.currentEnd,
      previousStart: periodRange.previousStart,
      previousEnd: periodRange.previousEnd,
      current: currentMetrics,
      previous: previousMetrics,
      dailyRows: currentComputedRows,
      weekdaySummary,
    }),
    [
      effectiveCampaign,
      periodRange,
      currentMetrics,
      previousMetrics,
      currentComputedRows,
      weekdaySummary,
    ]
  );

  const handleQuickCopyWhatsApp = async () => {
    const text = buildWhatsAppReport(reportPayload);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
  };

  const sectionTitles: Record<NavSection, { title: string; subtitle: string }> = {
    overview: {
      title: 'Visão geral de performance',
      subtitle: 'Painel executivo com indicadores consolidados e tendências',
    },
    daily: {
      title: 'Desempenho diário',
      subtitle: 'Tabela analítica ordenável e calendário heatmap de geração de leads e CPL',
    },
    weekly: {
      title: 'Comparativo semanal',
      subtitle: 'Evolução frente ao período anterior de mesma duração',
    },
    weekday: {
      title: 'Análise por dia da semana e dias úteis vs. finais de semana',
      subtitle: 'Identificação dos melhores dias para geração de leads e eficiência B2B',
    },
    simulator: {
      title: 'Simulador de resultados',
      subtitle: 'Calculadora interativa de projeção de leads, orçamento e metas de CPL',
    },
    reports: {
      title: 'Relatórios executivos',
      subtitle: 'Geração dinâmica em PDF, CSV, Markdown, impressão e mensagem para WhatsApp',
    },
    import: {
      title: 'Importação de dados CSV',
      subtitle: 'Upload de relatórios do Gerenciador de Anúncios Meta Ads com validação diária',
    },
    settings: {
      title: 'Configurações de metas',
      subtitle: 'Definição de CPL alvo, metas de leads, limites de orçamento e base local',
    },
  };

  return (
    <div className="min-h-screen flex bg-[#F4F6FA] dark:bg-slate-950 text-[#0F172A] dark:text-slate-100">
      <Sidebar
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <TopHeader
          campaigns={campaigns}
          selectedCampaign={effectiveCampaign}
          onSelectCampaign={setSelectedCampaign}
          lastAvailableDate={periodRange.lastAvailableDate}
          currentStart={periodRange.currentStart}
          currentEnd={periodRange.currentEnd}
          preset={preset}
          onSelectPreset={handleSelectPreset}
          customStart={customStart}
          customEnd={customEnd}
          onChangeCustomRange={(s, e) => {
            setCustomStart(s);
            setCustomEnd(e);
          }}
          dayFilter={dayFilter}
          onSelectDayFilter={setDayFilter}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode((d) => !d)}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onNavigate={setActiveSection}
          onQuickExportPdf={() => exportExecutivePdf(reportPayload)}
          onQuickExportCsv={() =>
            exportDailyCsv(
              currentComputedRows,
              `quarteiro-desempenho-${periodRange.currentStart}-a-${periodRange.currentEnd}`
            )
          }
          onQuickCopyWhatsApp={handleQuickCopyWhatsApp}
        />

        <main className="flex-1 p-4 sm:p-6 max-w-[1440px] w-full mx-auto space-y-6">
          <div className="no-print">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[#0F172A] dark:text-white">
              {sectionTitles[activeSection].title}
            </h1>
            <p className="mt-0.5 text-xs text-[#64748B] dark:text-slate-400">
              {sectionTitles[activeSection].subtitle}
            </p>
          </div>

          {activeSection === 'overview' && (
            <OverviewView
              current={currentMetrics}
              previous={previousMetrics}
              dailyRows={currentComputedRows}
              currentStart={periodRange.currentStart}
              currentEnd={periodRange.currentEnd}
              previousStart={periodRange.previousStart}
              previousEnd={periodRange.previousEnd}
              onNavigate={setActiveSection}
            />
          )}

          {activeSection === 'daily' && (
            <DailyPerformanceView
              dailyRows={currentComputedRows}
              campaign={effectiveCampaign}
            />
          )}

          {activeSection === 'weekly' && (
            <WeeklyComparisonView
              current={currentMetrics}
              previous={previousMetrics}
              currentRows={currentComputedRows}
              previousRows={previousComputedRows}
              currentStart={periodRange.currentStart}
              currentEnd={periodRange.currentEnd}
              previousStart={periodRange.previousStart}
              previousEnd={periodRange.previousEnd}
            />
          )}

          {activeSection === 'weekday' && (
            <WeekdayAnalysisView
              allCampaignRecords={historyFilteredRecords}
              filteredPeriodRecords={currentRawRecords}
            />
          )}

          {activeSection === 'simulator' && (
            <SimulatorView
              current={currentMetrics}
              historyMetrics={historyMetrics}
              previous={previousMetrics}
              pauses={pauses}
            />
          )}

          {activeSection === 'reports' && (
            <ReportsView
              campaign={
                effectiveCampaign === '__ALL__'
                  ? 'Todas as campanhas'
                  : effectiveCampaign
              }
              currentStart={periodRange.currentStart}
              currentEnd={periodRange.currentEnd}
              previousStart={periodRange.previousStart}
              previousEnd={periodRange.previousEnd}
              current={currentMetrics}
              previous={previousMetrics}
              dailyRows={currentComputedRows}
              weekdaySummary={weekdaySummary}
            />
          )}

          {activeSection === 'import' && (
            <ImportView
              existingRecords={records}
              onApplyImport={handleApplyImport}
              onRestoreInitialData={handleRestoreInitialData}
            />
          )}

          {activeSection === 'settings' && (
            <SettingsView
              goals={goals}
              onSaveGoals={setGoals}
              current={currentMetrics}
              historyMetrics={historyMetrics}
              onRestoreInitialData={handleRestoreInitialData}
            />
          )}
        </main>
      </div>
    </div>
  );
}
