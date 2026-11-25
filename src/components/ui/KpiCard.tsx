import React, { useState } from 'react';
import { HelpCircle, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { Line, LineChart, ResponsiveContainer, Tooltip } from 'recharts';
import { formatDeltaPercent } from '../../utils/formatters';

export type KpiToneMode = 'higher_better' | 'lower_better' | 'neutral';

interface KpiCardProps {
  title: string;
  value: string;
  previousValue: string;
  variationPct: number | null;
  toneMode?: KpiToneMode;
  tooltipText: string;
  subtitle?: string;
  sparklineData?: Array<{ label: string; value: number | null }>;
  sparklineColor?: string;
  compact?: boolean;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  previousValue,
  variationPct,
  toneMode = 'higher_better',
  tooltipText,
  subtitle,
  sparklineData,
  sparklineColor = '#2563EB',
  compact = false,
}) => {
  const [showTip, setShowTip] = useState(false);

  const getDeltaPresentation = () => {
    if (variationPct === null || Number.isNaN(variationPct)) {
      return {
        colorClass: 'text-slate-500 dark:text-slate-400',
        Icon: Minus,
        label: 'Sem base anterior',
      };
    }

    const isPositive = variationPct > 0.05;
    const isNegative = variationPct < -0.05;

    if (!isPositive && !isNegative) {
      return {
        colorClass: 'text-slate-500 dark:text-slate-400',
        Icon: Minus,
        label: 'Estável',
      };
    }

    const Icon = isPositive ? TrendingUp : TrendingDown;

    if (toneMode === 'neutral') {
      return {
        colorClass: 'text-slate-600 dark:text-slate-300',
        Icon,
        label: isPositive ? 'Aumento' : 'Redução',
      };
    }

    const isGood =
      (toneMode === 'higher_better' && isPositive) ||
      (toneMode === 'lower_better' && isNegative);

    return {
      colorClass: isGood
        ? 'text-[#16A34A] dark:text-emerald-400'
        : 'text-[#DC2626] dark:text-rose-400',
      Icon,
      label: isGood ? 'Favorável' : 'Desfavorável',
    };
  };

  const delta = getDeltaPresentation();
  const DeltaIcon = delta.Icon;

  const validSparkline =
    sparklineData && sparklineData.some((d) => d.value !== null && d.value > 0);

  return (
    <div
      className={`relative rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 ${
        compact ? 'p-4' : 'p-5'
      } shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors`}
    >
      {/* Title & info tooltip */}
      <div className="flex items-start justify-between gap-2">
        <span className="text-[13px] font-medium text-slate-600 dark:text-slate-300 leading-snug">
          {title}
        </span>

        <div
          className="relative shrink-0"
          onMouseEnter={() => setShowTip(true)}
          onMouseLeave={() => setShowTip(false)}
        >
          <button
            type="button"
            onClick={() => setShowTip((v) => !v)}
            aria-label={`Explicação sobre ${title}`}
            className="text-slate-400 hover:text-[#2563EB] dark:hover:text-blue-400 transition-colors p-0.5"
          >
            <HelpCircle className="h-3.5 w-3.5" />
          </button>

          {showTip && (
            <div className="absolute right-0 top-6 z-40 w-60 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-900 dark:bg-slate-800 p-2.5 text-[11px] leading-relaxed text-slate-100 shadow-lg">
              {tooltipText}
            </div>
          )}
        </div>
      </div>

      {/* Main Value + Sparkline */}
      <div className="mt-2.5 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <div
            className={`font-bold tracking-tight text-[#0F172A] dark:text-white tabular-nums ${
              compact ? 'text-xl' : 'text-2xl'
            }`}
          >
            {value}
          </div>
          {subtitle && (
            <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
              {subtitle}
            </div>
          )}
        </div>

        {validSparkline && sparklineData && (
          <div className="h-9 w-20 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparklineData}>
                <Tooltip
                  cursor={false}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const item = payload[0].payload as {
                      label: string;
                      value: number | null;
                    };
                    return (
                      <div className="rounded bg-slate-900 px-2 py-1 text-[10px] text-white shadow tabular-nums">
                        {item.label}: {item.value ?? 'N/D'}
                      </div>
                    );
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={sparklineColor}
                  strokeWidth={2}
                  dot={false}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Previous & Variation */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 text-xs">
        <span className="text-slate-500 dark:text-slate-400 truncate tabular-nums">
          Anterior: <strong className="font-medium text-slate-700 dark:text-slate-300">{previousValue}</strong>
        </span>

        <span
          className={`inline-flex items-center gap-1 font-semibold tabular-nums shrink-0 ${delta.colorClass}`}
          title={delta.label}
        >
          <DeltaIcon className="h-3.5 w-3.5" />
          <span>{formatDeltaPercent(variationPct)}</span>
        </span>
      </div>
    </div>
  );
};
