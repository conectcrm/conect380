import React from 'react';

type InlineStat = {
  label: string;
  value: string;
  tone?: 'neutral' | 'accent' | 'warning';
};

type InlineStatsProps = {
  stats: InlineStat[];
  className?: string;
};

const toneClassMap: Record<NonNullable<InlineStat['tone']>, string> = {
  neutral: 'text-[#5F7B89]',
  accent: 'text-[#1A9E87]',
  warning: 'text-[#C98A19]',
};

const InlineStats: React.FC<InlineStatsProps> = ({ stats, className }) => {
  if (!stats.length) return null;

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className || ''}`}>
      {stats.map((stat) => (
        <div
          key={`${stat.label}-${stat.value}`}
          className="inline-flex items-center gap-2 rounded-[999px] border border-[#DCE8EC] bg-white px-3 py-1.5 text-[13px]"
        >
          <span className="text-[#6E8997]">{stat.label}</span>
          <strong className={toneClassMap[stat.tone || 'neutral']}>{stat.value}</strong>
        </div>
      ))}
    </div>
  );
};

export default React.memo(InlineStats);
