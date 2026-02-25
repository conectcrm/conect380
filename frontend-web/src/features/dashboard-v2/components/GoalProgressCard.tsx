import React from 'react';
import { ArrowUpRight } from 'lucide-react';

type GoalProgressCardProps = {
  title: string;
  primaryValue: string;
  secondaryValue: string;
  trendPercent?: number;
  progressPercent: number;
  projectionLabel?: string;
  icon?: React.ReactNode;
};

const clampPercent = (value: number): number => Math.max(0, Math.min(100, value));

const GoalProgressCard: React.FC<GoalProgressCardProps> = ({
  title,
  primaryValue,
  secondaryValue,
  trendPercent = 0,
  progressPercent,
  projectionLabel,
  icon,
}) => {
  const progress = clampPercent(progressPercent);
  const arcLength = 84;
  const offset = arcLength - (arcLength * progress) / 100;

  return (
    <article className="min-h-[232px] rounded-[20px] border border-[#DCE7EB] bg-white px-5 py-5 shadow-[0_16px_30px_-24px_rgba(15,57,74,0.28)]">
      <div className="mb-4 flex items-center justify-between gap-2.5">
        <h3 className="text-[17px] font-semibold leading-tight tracking-[-0.01em] text-[#19384C]">{title}</h3>
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#EEF6F3] text-[#6A8592]">
          {icon}
        </span>
      </div>

      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-[31px] font-semibold leading-none tracking-[-0.02em] text-[#19384C]">{primaryValue}</p>
          <p className="mt-2 text-[31px] font-semibold leading-none tracking-[-0.02em] text-[#19384C]">{secondaryValue}</p>
        </div>

        <svg viewBox="0 0 64 36" className="h-[58px] w-[96px]" aria-hidden>
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

      <div className="mt-3.5 flex items-center gap-1.5 text-[14px]">
        <span className="inline-flex items-center gap-1 font-semibold text-[#159B82]">
          <ArrowUpRight className="h-3.5 w-3.5" />
          +{Math.abs(trendPercent).toFixed(0)}
        </span>
      </div>

      <div className="mt-3.5 h-[7px] rounded-full bg-[#E6EEF0]">
        <div className="h-[7px] rounded-full bg-[#49B4AA]" style={{ width: `${progress}%` }} />
      </div>

      {projectionLabel ? <p className="mt-3.5 text-[14px] text-[#617C89]">{projectionLabel}</p> : null}
    </article>
  );
};

export default React.memo(GoalProgressCard);

