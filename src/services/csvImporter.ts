import Papa from 'papaparse';
import { DEFAULT_CAMPAIGN } from '../data/initialData';
import { CsvImportPreview, DailyAdRecord } from '../types/ads';
import { isValidISODate } from '../utils/dateUtils';

function normalizeHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

function normalizeCampaignName(raw: string | undefined): string {
  if (!raw || !raw.trim()) return DEFAULT_CAMPAIGN;
  // Remove leading emojis/symbols if present and normalize bracketed tags
  const cleaned = raw
    .replace(/^[^\p{L}\p{N}\[]+/u, '')
    .trim();
  if (/^\[.+\](\s+\[.+\])+$/.test(cleaned)) {
    return cleaned
      .split(/\]\s*\[/)
      .map((part) => part.replace(/^\[|\]$/g, '').trim())
      .join(' | ');
  }
  return cleaned || DEFAULT_CAMPAIGN;
}

/**
 * Parses numbers supporting US (1234.56) and BR (1.234,56 or 92,04) formats.
 */
function parseFlexibleNumber(raw: unknown): number | null {
  if (raw === null || raw === undefined) return null;
  const str = String(raw).trim();
  if (!str || str === '-' || str === '—') return null;

  const cleaned = str.replace(/[R$\s%]/g, '');
  if (!cleaned) return null;

  const hasComma = cleaned.includes(',');
  const hasDot = cleaned.includes('.');

  let normalized = cleaned;
  if (hasComma && hasDot) {
    // Whichever appears last is the decimal separator
    if (cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
      normalized = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      normalized = cleaned.replace(/,/g, '');
    }
  } else if (hasComma) {
    // Assume comma is decimal separator unless strictly 3 digits after comma and multiple commas
    const parts = cleaned.split(',');
    if (parts.length > 2) {
      normalized = cleaned.replace(/,/g, '');
    } else {
      normalized = cleaned.replace(',', '.');
    }
  }

  const num = Number(normalized);
  return Number.isFinite(num) ? num : null;
}

function parseFlexibleDate(raw: unknown): string | null {
  if (raw === null || raw === undefined) return null;
  const str = String(raw).trim();
  if (!str) return null;

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return isValidISODate(str) ? str : null;
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const brMatch = str.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/);
  if (brMatch) {
    const iso = `${brMatch[3]}-${brMatch[2]}-${brMatch[1]}`;
    return isValidISODate(iso) ? iso : null;
  }

  return null;
}

function detectDelimiter(sampleText: string): string {
  const firstLine = sampleText.split(/\r?\n/)[0] || '';
  const candidates = [',', ';', '\t'];
  let best = ',';
  let maxCount = -1;
  for (const delim of candidates) {
    const count = firstLine.split(delim).length;
    if (count > maxCount) {
      maxCount = count;
      best = delim;
    }
  }
  return best;
}

function findColumnKey(headers: string[], aliases: string[]): string | undefined {
  const normalizedMap = new Map<string, string>();
  headers.forEach((h) => normalizedMap.set(normalizeHeader(h), h));

  for (const alias of aliases) {
    const normAlias = normalizeHeader(alias);
    if (normalizedMap.has(normAlias)) {
      return normalizedMap.get(normAlias);
    }
  }

  // Partial match fallback
  for (const alias of aliases) {
    const normAlias = normalizeHeader(alias);
    for (const [normHeader, origHeader] of normalizedMap.entries()) {
      if (normHeader.includes(normAlias)) {
        return origHeader;
      }
    }
  }

  return undefined;
}

function isConversationResultIndicator(raw: unknown): boolean {
  if (!raw) return false;
  const val = normalizeHeader(String(raw));
  return (
    val.includes('conversa') ||
    val.includes('mensagem') ||
    val.includes('messaging_conversation') ||
    val.includes('whatsapp')
  );
}

export function parseMetaAdsCsv(
  csvText: string,
  fileName: string,
  existingRecords: DailyAdRecord[]
): CsvImportPreview {
  const delimiter = detectDelimiter(csvText);
  const parsed = Papa.parse<Record<string, unknown>>(csvText, {
    header: true,
    delimiter,
    skipEmptyLines: 'greedy',
  });

  const headers = parsed.meta.fields || [];
  const warnings: string[] = [];
  const errors: string[] = [];

  if (parsed.errors.length > 0) {
    parsed.errors.slice(0, 3).forEach((err) => {
      warnings.push(`Linha ${err.row ?? '?'}: ${err.message}`);
    });
  }

  const colStart = findColumnKey(headers, [
    'Início dos relatórios',
    'Reporting starts',
    'data',
    'date',
  ]);
  const colEnd = findColumnKey(headers, [
    'Encerramento dos relatórios',
    'Reporting ends',
  ]);
  const colCampaign = findColumnKey(headers, [
    'Nome da campanha',
    'Campaign name',
    'campanha',
    'campaign',
  ]);
  const colStatus = findColumnKey(headers, [
    'Veiculação da campanha',
    'Campaign delivery',
  ]);
  const colSpend = findColumnKey(headers, [
    'Valor gasto (BRL)',
    'Amount spent (BRL)',
    'Valor gasto',
    'investimento',
    'spend',
  ]);
  const colConversations = findColumnKey(headers, [
    'Conversas por mensagem iniciadas',
    'Messaging conversations started',
    'leads',
  ]);
  const colResults = findColumnKey(headers, ['Resultados', 'Results']);
  const colResultIndicator = findColumnKey(headers, [
    'Indicador de resultados',
    'Result indicator',
  ]);
  const colImpressions = findColumnKey(headers, [
    'Impressões',
    'Impressions',
    'impressoes',
  ]);
  const colClicks = findColumnKey(headers, [
    'Cliques no link',
    'Link clicks',
    'cliques',
    'clicks',
  ]);
  const colReach = findColumnKey(headers, ['Alcance', 'Reach']);
  const colFrequency = findColumnKey(headers, ['Frequência', 'Frequency']);

  if (!colStart) {
    errors.push(
      'Coluna de data não encontrada ("Início dos relatórios" ou "data"). Verifique o cabeçalho do arquivo CSV.'
    );
  }
  if (!colSpend) {
    errors.push(
      'Coluna de investimento não encontrada ("Valor gasto (BRL)" ou "investimento").'
    );
  }

  if (errors.length > 0) {
    return {
      fileName,
      delimiter,
      totalRowsRead: parsed.data.length,
      validDailyRows: [],
      duplicateRows: [],
      newRows: [],
      campaignsDetected: [],
      warnings,
      errors,
      isConsolidatedError: false,
    };
  }

  const existingKeys = new Set(existingRecords.map((r) => `${r.campaign}::${r.date}`));
  const validDailyRows: DailyAdRecord[] = [];
  const duplicateRows: DailyAdRecord[] = [];
  const newRows: DailyAdRecord[] = [];
  const campaignsSet = new Set<string>();
  let consolidatedRowCount = 0;
  let missingLeadsCount = 0;

  parsed.data.forEach((row, index) => {
    const startRaw = colStart ? row[colStart] : null;
    const endRaw = colEnd ? row[colEnd] : null;
    const startDate = parseFlexibleDate(startRaw);
    const endDate = endRaw ? parseFlexibleDate(endRaw) : startDate;

    // Skip summary/total rows at the bottom of Meta Ads exports that have empty dates
    if (!startDate) {
      const hasAnyValue = Object.values(row).some((v) => String(v ?? '').trim() !== '');
      if (hasAnyValue && String(startRaw ?? '').trim() !== '') {
        warnings.push(`Linha ${index + 2}: data inválida ("${String(startRaw)}").`);
      }
      return;
    }

    if (endDate && endDate !== startDate) {
      consolidatedRowCount += 1;
      return;
    }

    const campaign = normalizeCampaignName(
      colCampaign ? String(row[colCampaign] ?? '') : DEFAULT_CAMPAIGN
    );
    campaignsSet.add(campaign);

    const spend = Math.max(0, parseFlexibleNumber(colSpend ? row[colSpend] : 0) ?? 0);
    const impressions = Math.max(
      0,
      Math.round(parseFlexibleNumber(colImpressions ? row[colImpressions] : 0) ?? 0)
    );
    const clicks = Math.max(
      0,
      Math.round(parseFlexibleNumber(colClicks ? row[colClicks] : 0) ?? 0)
    );
    const reach = colReach ? parseFlexibleNumber(row[colReach]) : null;
    const frequency = colFrequency ? parseFlexibleNumber(row[colFrequency]) : null;
    const deliveryStatus = colStatus
      ? String(row[colStatus] ?? '').trim() || (spend > 0 ? 'active' : 'inactive')
      : spend > 0
      ? 'active'
      : 'inactive';

    // Prioritizes "Conversas por mensagem iniciadas"; falls back to "Resultados" only when indicator matches conversations
    let leads: number | null = null;
    const convVal = colConversations ? parseFlexibleNumber(row[colConversations]) : null;
    if (convVal !== null) {
      leads = Math.max(0, Math.round(convVal));
    } else if (colResults && colResultIndicator) {
      const indicator = row[colResultIndicator];
      if (isConversationResultIndicator(indicator)) {
        const resVal = parseFlexibleNumber(row[colResults]);
        if (resVal !== null) {
          leads = Math.max(0, Math.round(resVal));
        }
      }
    }

    // On zero-spend & zero-impression days, missing leads means 0 results
    if (leads === null && spend === 0 && impressions === 0) {
      leads = 0;
    } else if (leads === null && spend > 0) {
      missingLeadsCount += 1;
    }

    const record: DailyAdRecord = {
      id: `${campaign}::${startDate}`,
      date: startDate,
      campaign,
      spend,
      leads,
      clicks,
      impressions,
      reach,
      frequency,
      deliveryStatus,
      source: 'csv',
    };

    validDailyRows.push(record);
    if (existingKeys.has(record.id)) {
      duplicateRows.push(record);
    } else {
      newRows.push(record);
    }
  });

  let isConsolidatedError = false;
  if (consolidatedRowCount > 0) {
    isConsolidatedError = validDailyRows.length === 0;
    errors.push(
      `${consolidatedRowCount} linha(s) possuem "Início dos relatórios" diferente de "Encerramento dos relatórios". Este dashboard exige detalhamento diário por campanha (não aceita arquivos consolidados de múltiplos dias como dados diários). Exporte do Gerenciador de Anúncios com o detalhamento "Dia".`
    );
  }

  if (missingLeadsCount > 0) {
    warnings.push(
      `${missingLeadsCount} dia(s) com investimento não possuem "Conversas por mensagem iniciadas" preenchida; os valores foram preservados como nulos (dados ausentes).`
    );
  }

  if (validDailyRows.length === 0 && errors.length === 0) {
    errors.push('Nenhum registro diário válido foi encontrado no arquivo.');
  }

  return {
    fileName,
    delimiter,
    totalRowsRead: parsed.data.length,
    validDailyRows: validDailyRows.sort((a, b) => a.date.localeCompare(b.date)),
    duplicateRows,
    newRows,
    campaignsDetected: Array.from(campaignsSet),
    warnings,
    errors,
    isConsolidatedError,
  };
}
