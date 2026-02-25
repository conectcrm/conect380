import React, { useMemo } from 'react';
import { ArrowUpRight } from 'lucide-react';

type ProgressTone = 'teal' | 'amber';

type KpiTrendCardProps = {
  title: string;
  value: string;
  valueSuffix?: string;
  trendPercent?: number;
  trendLabel?: string;
  sparkline?: number[];
  progressPercent?: number;
  progressTone?: ProgressTone;
  footerLeft?: string;
  footerRight?: string;
  icon?: React.ReactNode;
  rightVisual?: React.ReactNode;
};

const clampPercent = (value?: number): number => {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, value));
};

const buildSparklinePath = (points: number[]): string => {
  if (points.length < 2) return '';

  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;

  return points
    .map((point, index) => {
      const x = (index / (points.length - 1)) * 100;
      const y = 30 - ((point - min) / range) * 26;
      return `${x},${y}`;
    })
    .join(' ');
};

const toneClassMap: Record<ProgressTone, string> = {
  teal: 'bg-[#4AAC90]',
  amber: 'bg-[#EDBE52]',
};

const KpiTrendCard: React.FC<KpiTrendCardProps> = ({
  title,
  value,
  valueSuffix,
  trendPercent = 0,
  trendLabel = 'vs mes anterior',
  sparkline = [],
  progressPercent = 0,
  progressTone = 'teal',
  footerLeft,
  footerRight,
  icon,
  rightVisual,
}) => {
  const sparklinePath = useMemo(() => buildSparklinePath(sparkline), [sparkline]);
  const normalizedProgress = clampPercent(progressPercent);

  return (
    <article className="min-h-[232px] rounded-[20px] border border-[#DCE7EB] bg-white px-5 py-5 shadow-[0_16px_30px_-24px_rgba(15,57,74,0.28)]">
      <div className="mb-4 flex items-center justify-between gap-2.5">
        <h3 className="text-[17px] font-semibold leading-tight tracking-[-0.01em] text-[#19384C]">{title}</h3>
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#EEF6F3] text-[#6B8592]">
          {icon}
        </span>
      </div>

      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-end gap-1.5">
            <p className="text-[31px] font-semibold leading-none tracking-[-0.02em] text-[#19384C]">{value}</p>
            {valueSuffix ? <span className="mb-0.5 text-[18px] font-medium leading-none text-[#19384C]">{valueSuffix}</span> : null}
          </div>
        </div>

        {rightVisual ? (
          <div className="flex-shrink-0">{rightVisual}</div>
        ) : sparklinePath ? (
          <div className="h-[52px] w-[108px] flex-shrink-0 rounded-[10px] bg-[#F4FAF7] px-2.5 py-1.5">
            <svg viewBox="0 0 100 34" className="h-full w-full" preserveAspectRatio="none">
              <polyline
                points={sparklinePath}
                fill="none"
                stroke="#4CAB90"
                strokeWidth="1.35"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        ) : null}
      </div>

      <div className="mt-3.5 flex items-center gap-1.5 text-[14px]">
        <span className="inline-flex items-center gap-0.5 font-semibold text-[#159B82]">
          <ArrowUpRight className="h-3.5 w-3.5" />
          {trendPercent >= 0 ? '+' : '-'}{Math.abs(trendPercent).toFixed(0)}%
        </span>
        <span className="text-[#607C89]">{trendLabel}</span>
      </div>

      <div className="mt-3.5 h-[7px] rounded-full bg-[#E6EEF0]">
        <div
          className={`h-[7px] rounded-full ${toneClassMap[progressTone]}`}
          style={{ width: `${normalizedProgress}%` }}
        />
      </div>

      {footerLeft || footerRight ? (
        <div className="mt-3.5 flex items-center justify-between gap-2 text-[14px] text-[#617C89]">
          <span>{footerLeft}</span>
          <span>{footerRight}</span>
        </div>
      ) : null}
    </article>
  );
};

export default React.memo(KpiTrendCard);

