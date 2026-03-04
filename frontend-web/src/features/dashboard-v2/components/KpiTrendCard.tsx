import React, { useMemo } from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

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
  onClick?: () => void;
  ariaLabel?: string;
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
  trendLabel = 'no periodo selecionado',
  sparkline = [],
  progressPercent = 0,
  progressTone = 'teal',
  footerLeft,
  footerRight,
  icon,
  rightVisual,
  onClick,
  ariaLabel,
}) => {
  const sparklinePath = useMemo(() => buildSparklinePath(sparkline), [sparkline]);
  const normalizedProgress = clampPercent(progressPercent);
  const safeTrendPercent = Number.isFinite(trendPercent) ? trendPercent : 0;
  const isPositiveTrend = safeTrendPercent > 0;
  const isNegativeTrend = safeTrendPercent < 0;
  const trendSignal = isPositiveTrend ? '+' : isNegativeTrend ? '-' : '';
  const TrendIcon = isNegativeTrend ? ArrowDownRight : ArrowUpRight;
  const trendToneClass = isNegativeTrend
    ? 'text-[#AF3D4F]'
    : isPositiveTrend
      ? 'text-[#159B82]'
      : 'text-[#607C89]';
  const Container = onClick ? 'button' : 'article';
  const baseClass =
    'min-h-[214px] md:min-h-[232px] rounded-[20px] border border-[#DCE7EB] bg-white px-5 py-5 shadow-[0_16px_30px_-24px_rgba(15,57,74,0.28)]';
  const clickableClass = onClick
    ? ' text-left transition hover:border-[#C7DCE3] hover:shadow-[0_18px_34px_-24px_rgba(15,57,74,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#159A9C]/35'
    : '';

  return (
    <Container
      {...(onClick
        ? {
            type: 'button' as const,
            onClick,
            'aria-label': ariaLabel || title,
          }
        : {})}
      className={`${baseClass}${clickableClass}`}
    >
      <div className="mb-4 flex items-center justify-between gap-2.5">
        <h3 className="text-[17px] font-semibold leading-tight tracking-[-0.01em] text-[#19384C]">
          {title}
        </h3>
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#EEF6F3] text-[#6B8592]">
          {icon}
        </span>
      </div>

      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0">
          <div className="flex items-end gap-1.5">
            <p className="break-words text-[25px] font-semibold leading-none tracking-[-0.02em] text-[#19384C] sm:text-[29px] lg:text-[31px]">
              {value}
            </p>
            {valueSuffix ? (
              <span className="mb-0.5 text-[15px] font-medium leading-none text-[#19384C] sm:text-[18px]">
                {valueSuffix}
              </span>
            ) : null}
          </div>
        </div>

        {rightVisual ? (
          <div className="flex-shrink-0">{rightVisual}</div>
        ) : sparklinePath ? (
          <div className="h-[52px] w-[80px] flex-shrink-0 rounded-[10px] bg-[#F4FAF7] px-2.5 py-1.5 sm:w-[96px]">
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

      <div className="mt-3.5 flex flex-wrap items-center gap-1.5 text-[14px]">
        <span className={`inline-flex items-center gap-0.5 font-semibold ${trendToneClass}`}>
          <TrendIcon className="h-3.5 w-3.5" />
          {trendSignal}
          {Math.abs(safeTrendPercent).toFixed(0)}%
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
        <div className="mt-3.5 flex flex-col items-start justify-between gap-2 text-[14px] text-[#617C89] sm:flex-row sm:items-center">
          <span className="break-words">{footerLeft}</span>
          <span className="break-words">{footerRight}</span>
        </div>
      ) : null}
    </Container>
  );
};

export default React.memo(KpiTrendCard);
