import React from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

type GoalProgressCardProps = {
  title: string;
  primaryValue: string;
  primaryLabel?: string;
  secondaryValue: string;
  secondaryLabel?: string;
  featureHint?: string;
  trendPercent?: number;
  progressPercent: number;
  projectionLabel?: string;
  icon?: React.ReactNode;
};

const clampPercent = (value: number): number => Math.max(0, Math.min(100, value));

const GoalProgressCard: React.FC<GoalProgressCardProps> = ({
  title,
  primaryValue,
  primaryLabel = 'Principal',
  secondaryValue,
  featureHint,
  secondaryLabel = 'Secundário',
  trendPercent = 0,
  progressPercent,
  projectionLabel,
  icon,
}) => {
  const progress = clampPercent(progressPercent);
  const arcLength = 84;
  const offset = arcLength - (arcLength * progress) / 100;
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

  return (
    <article
      title={featureHint}
      className="min-h-[214px] md:min-h-[232px] rounded-[20px] border border-[#DCE7EB] bg-white px-5 py-5 shadow-[0_16px_30px_-24px_rgba(15,57,74,0.28)]"
    >
      <div className="mb-4 flex items-center justify-between gap-2.5">
        <h3 className="text-[17px] font-semibold leading-tight tracking-[-0.01em] text-[#19384C]">
          {title}
        </h3>
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#EEF6F3] text-[#6A8592]">
          {icon}
        </span>
      </div>

      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6D8793]">
            {primaryLabel}
          </p>
          <p className="break-words text-[25px] font-semibold leading-none tracking-[-0.02em] text-[#19384C] sm:text-[29px] lg:text-[31px]">
            {primaryValue}
          </p>
          <p className="mt-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6D8793]">
            {secondaryLabel}
          </p>
          <p className="mt-1 break-words text-[25px] font-semibold leading-none tracking-[-0.02em] text-[#19384C] sm:text-[29px] lg:text-[31px]">
            {secondaryValue}
          </p>
        </div>

        <svg viewBox="0 0 64 36" className="h-[52px] w-[86px] sm:h-[58px] sm:w-[96px]" aria-hidden>
          <path
            d="M4 32 A28 28 0 0 1 60 32"
            fill="none"
            stroke="#D6E6E0"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <path
            d="M4 32 A28 28 0 0 1 60 32"
            fill="none"
            stroke="#87CA97"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={arcLength}
            strokeDashoffset={offset}
          />
          <path
            d="M12 32 A20 20 0 0 1 52 32"
            fill="none"
            stroke="#4AB6AC"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={arcLength}
            strokeDashoffset={offset + 14}
          />
        </svg>
      </div>

      <div className="mt-3.5 flex items-center gap-1.5 text-[13px]">
        <span className={`inline-flex items-center gap-1 font-semibold ${trendToneClass}`}>
          <TrendIcon className="h-3.5 w-3.5" />
          {trendSignal}
          {Math.abs(safeTrendPercent).toFixed(0)}%
        </span>
      </div>

      <div className="mt-3.5 h-[7px] rounded-full bg-[#E6EEF0]">
        <div className="h-[7px] rounded-full bg-[#49B4AA]" style={{ width: `${progress}%` }} />
      </div>

      {projectionLabel ? (
        <p className="mt-3.5 text-[12px] text-[#708894]">{projectionLabel}</p>
      ) : null}
    </article>
  );
};

export default React.memo(GoalProgressCard);
