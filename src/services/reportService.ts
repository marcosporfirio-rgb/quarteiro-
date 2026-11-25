import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CLIENT_NAME, PLATFORM_NAME } from '../data/initialData';
import {
  AggregatedMetrics,
  DailyComputedRow,
  WeekdaySummary,
} from '../types/ads';
import { formatDateBR, formatShortDateBR } from '../utils/dateUtils';
import {
  formatBRL,
  formatDeltaPercent,
  formatNumber,
  formatPercent,
} from '../utils/formatters';
import { calculatePercentVariation } from './metricsEngine';

export interface ExecutiveReportPayload {
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

export function buildWhatsAppReport(payload: ExecutiveReportPayload): string {
  const { currentStart, currentEnd, current, previous, dailyRows } = payload;

  const leadsDeltaPct = calculatePercentVariation(current.leads, previous.leads);
  const spendDeltaPct = calculatePercentVariation(current.spend, previous.spend);
  const cplDeltaPct = calculatePercentVariation(current.cpl, previous.cpl);

  const bestDay = [...dailyRows]
    .filter((r) => r.leads !== null && r.leads > 0)
    .sort((a, b) => (b.leads ?? 0) - (a.leads ?? 0))[0];

  const cplText =
    cplDeltaPct !== null
      ? `aproximadamente ${cplDeltaPct > 0 ? '+' : ''}${Math.round(cplDeltaPct)}%`
      : '—';

  let analysisLine =
    'Desempenho estável no período, mantendo acompanhamento diário de entrega e custo por conversa.';
  if (
    spendDeltaPct !== null &&
    leadsDeltaPct !== null &&
    cplDeltaPct !== null &&
    spendDeltaPct > leadsDeltaPct &&
    cplDeltaPct > 15
  ) {
    analysisLine =
      'O volume de leads aumentou, porém o investimento cresceu em uma proporção superior, gerando aumento no CPL.';
  } else if (cplDeltaPct !== null && cplDeltaPct <= -10) {
    analysisLine =
      'Houve ganho de eficiência com redução no Custo por Lead em relação ao período anterior.';
  } else if (leadsDeltaPct !== null && leadsDeltaPct < -15) {
    analysisLine =
      'Houve redução no volume de leads frente ao período anterior, exigindo revisão de criativos e frequência de entrega.';
  }

  const bestDayLine = bestDay
    ? `Melhor dia: ${bestDay.dayName.toLowerCase()}, com ${bestDay.leads} leads a ${formatBRL(bestDay.cpl)}.`
    : 'Melhor dia: sem leads suficientes para destaque.';

  return [
    'Bom dia, pessoal!',
    '',
    `Segue o relatório de desempenho da ${CLIENT_NAME}.`,
    '',
    `Período: ${formatShortDateBR(currentStart)} a ${formatShortDateBR(currentEnd)}`,
    '',
    `Investimento: ${formatBRL(current.spend)}`,
    `Leads gerados: ${formatNumber(current.leads)}`,
    `Custo por lead: ${formatBRL(current.cpl)}`,
    `Média diária: ${formatNumber(current.leadsPerDay, 2)} leads`,
    '',
    'Comparativo com o período anterior:',
    `Leads: ${formatDeltaPercent(leadsDeltaPct)}`,
    `Investimento: ${formatDeltaPercent(spendDeltaPct)}`,
    `CPL: ${cplText}`,
    '',
    bestDayLine,
    '',
    'Análise:',
    analysisLine,
  ].join('\n');
}

export function buildMarkdownReport(payload: ExecutiveReportPayload): string {
  const {
    campaign,
    currentStart,
    currentEnd,
    previousStart,
    previousEnd,
    current,
    previous,
    dailyRows,
    weekdaySummary,
  } = payload;

  const leadsDelta = calculatePercentVariation(current.leads, previous.leads);
  const spendDelta = calculatePercentVariation(current.spend, previous.spend);
  const cplDelta = calculatePercentVariation(current.cpl, previous.cpl);

  const lines: string[] = [
    `# Relatório Executivo — ${CLIENT_NAME} (${PLATFORM_NAME})`,
    '',
    `- **Campanha:** ${campaign}`,
    `- **Período analisado:** ${formatDateBR(currentStart)} a ${formatDateBR(currentEnd)}`,
    `- **Período anterior:** ${formatDateBR(previousStart)} a ${formatDateBR(previousEnd)}`,
    '',
    '## Resumo dos Principais Indicadores',
    '',
    '| Métrica | Período Atual | Período Anterior | Variação |',
    '| :--- | ---: | ---: | ---: |',
    `| Investimento | ${formatBRL(current.spend)} | ${formatBRL(previous.spend)} | ${formatDeltaPercent(spendDelta)} |`,
    `| Leads | ${formatNumber(current.leads)} | ${formatNumber(previous.leads)} | ${formatDeltaPercent(leadsDelta)} |`,
    `| CPL | ${formatBRL(current.cpl)} | ${formatBRL(previous.cpl)} | ${formatDeltaPercent(cplDelta)} |`,
    `| Média diária de leads | ${formatNumber(current.leadsPerDay, 2)} | ${formatNumber(previous.leadsPerDay, 2)} | ${formatDeltaPercent(calculatePercentVariation(current.leadsPerDay, previous.leadsPerDay))} |`,
    `| Cliques no link | ${formatNumber(current.clicks)} | ${formatNumber(previous.clicks)} | ${formatDeltaPercent(calculatePercentVariation(current.clicks, previous.clicks))} |`,
    `| Impressões | ${formatNumber(current.impressions)} | ${formatNumber(previous.impressions)} | ${formatDeltaPercent(calculatePercentVariation(current.impressions, previous.impressions))} |`,
    `| CTR | ${formatPercent(current.ctr)} | ${formatPercent(previous.ctr)} | ${formatDeltaPercent(calculatePercentVariation(current.ctr, previous.ctr))} |`,
    `| CPC | ${formatBRL(current.cpc)} | ${formatBRL(previous.cpc)} | ${formatDeltaPercent(calculatePercentVariation(current.cpc, previous.cpc))} |`,
    `| CPM | ${formatBRL(current.cpm)} | ${formatBRL(previous.cpm)} | ${formatDeltaPercent(calculatePercentVariation(current.cpm, previous.cpm))} |`,
    '',
    '## Desempenho Diário',
    '',
    '| Data | Dia | Investimento | Leads | CPL | Cliques | Impressões | CTR |',
    '| :--- | :--- | ---: | ---: | ---: | ---: | ---: | ---: |',
    ...dailyRows.map(
      (r) =>
        `| ${formatDateBR(r.date)} | ${r.dayShort} | ${formatBRL(r.spend)} | ${r.leads === null ? 'Não informado' : formatNumber(r.leads)} | ${formatBRL(r.cpl)} | ${formatNumber(r.clicks)} | ${formatNumber(r.impressions)} | ${formatPercent(r.ctr)} |`
    ),
    '',
    '## Desempenho por Dia da Semana (Histórico da Campanha)',
    '',
    '| Dia | Dias ativos | Investimento | Leads | CPL | Média/dia ativo |',
    '| :--- | ---: | ---: | ---: | ---: | ---: |',
    ...weekdaySummary.map(
      (w) =>
        `| ${w.dayName} | ${w.activeDays} | ${formatBRL(w.spend)} | ${formatNumber(w.leads)} | ${formatBRL(w.cpl)} | ${formatNumber(w.leadsPerActiveDay, 2)} |`
    ),
  ];

  return lines.join('\n');
}

export function exportDailyCsv(rows: DailyComputedRow[], filenamePrefix = 'quarteiro-desempenho') {
  const header = [
    'Data',
    'Dia da semana',
    'Campanha',
    'Investimento (BRL)',
    'Leads',
    'CPL (BRL)',
    'Cliques no link',
    'Impressoes',
    'CPC (BRL)',
    'CTR (%)',
    'CPM (BRL)',
  ];

  const csvLines = [
    header.join(';'),
    ...rows.map((r) =>
      [
        formatDateBR(r.date),
        r.dayName,
        `"${r.campaign}"`,
        r.spend.toFixed(2).replace('.', ','),
        r.leads === null ? '' : String(r.leads),
        r.cpl !== null ? r.cpl.toFixed(2).replace('.', ',') : '',
        String(r.clicks),
        String(r.impressions),
        r.cpc !== null ? r.cpc.toFixed(2).replace('.', ',') : '',
        r.ctr !== null ? r.ctr.toFixed(2).replace('.', ',') : '',
        r.cpm !== null ? r.cpm.toFixed(2).replace('.', ',') : '',
      ].join(';')
    ),
  ];

  const blob = new Blob(['\uFEFF' + csvLines.join('\n')], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filenamePrefix}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportExecutivePdf(payload: ExecutiveReportPayload) {
  const {
    campaign,
    currentStart,
    currentEnd,
    previousStart,
    previousEnd,
    current,
    previous,
    dailyRows,
  } = payload;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Header band
  doc.setFillColor(20, 43, 70); // #142B46
  doc.rect(0, 0, 210, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('QUARTEIRO · Performance Intelligence', 14, 13);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Relatório Executivo ${PLATFORM_NAME} | Campanha: ${campaign}`,
    14,
    20
  );
  doc.text(
    `Período: ${formatDateBR(currentStart)} a ${formatDateBR(currentEnd)} (Anterior: ${formatDateBR(previousStart)} a ${formatDateBR(previousEnd)})`,
    14,
    25.5
  );

  // KPI summary table
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Resumo de Indicadores', 14, 39);

  autoTable(doc, {
    startY: 42,
    head: [['Indicador', 'Período Atual', 'Período Anterior', 'Variação']],
    body: [
      [
        'Investimento total',
        formatBRL(current.spend),
        formatBRL(previous.spend),
        formatDeltaPercent(calculatePercentVariation(current.spend, previous.spend)),
      ],
      [
        'Leads (conversas iniciadas)',
        formatNumber(current.leads),
        formatNumber(previous.leads),
        formatDeltaPercent(calculatePercentVariation(current.leads, previous.leads)),
      ],
      [
        'Custo por lead (CPL)',
        formatBRL(current.cpl),
        formatBRL(previous.cpl),
        formatDeltaPercent(calculatePercentVariation(current.cpl, previous.cpl)),
      ],
      [
        'Média diária de leads',
        formatNumber(current.leadsPerDay, 2),
        formatNumber(previous.leadsPerDay, 2),
        formatDeltaPercent(
          calculatePercentVariation(current.leadsPerDay, previous.leadsPerDay)
        ),
      ],
      [
        'Cliques no link / CTR',
        `${formatNumber(current.clicks)} (${formatPercent(current.ctr)})`,
        `${formatNumber(previous.clicks)} (${formatPercent(previous.ctr)})`,
        formatDeltaPercent(calculatePercentVariation(current.ctr, previous.ctr)),
      ],
      [
        'CPC / CPM',
        `${formatBRL(current.cpc)} / ${formatBRL(current.cpm)}`,
        `${formatBRL(previous.cpc)} / ${formatBRL(previous.cpm)}`,
        formatDeltaPercent(calculatePercentVariation(current.cpm, previous.cpm)),
      ],
    ],
    theme: 'grid',
    headStyles: { fillColor: [20, 43, 70], textColor: 255, fontSize: 8.5 },
    bodyStyles: { fontSize: 8.5, textColor: [15, 23, 42] },
    margin: { left: 14, right: 14 },
  });

  const afterKpiY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('2. Desempenho Diário', 14, afterKpiY);

  autoTable(doc, {
    startY: afterKpiY + 3,
    head: [['Data', 'Dia', 'Investimento', 'Leads', 'CPL', 'Cliques', 'Impressões', 'CTR']],
    body: dailyRows.map((r) => [
      formatDateBR(r.date),
      r.dayShort,
      formatBRL(r.spend),
      r.leads === null ? 'N/D' : formatNumber(r.leads),
      formatBRL(r.cpl),
      formatNumber(r.clicks),
      formatNumber(r.impressions),
      formatPercent(r.ctr),
    ]),
    theme: 'striped',
    headStyles: { fillColor: [20, 43, 70], textColor: 255, fontSize: 8 },
    bodyStyles: { fontSize: 8, textColor: [15, 23, 42] },
    margin: { left: 14, right: 14 },
  });

  doc.save(`quarteiro-relatorio-${currentStart}-a-${currentEnd}.pdf`);
}
