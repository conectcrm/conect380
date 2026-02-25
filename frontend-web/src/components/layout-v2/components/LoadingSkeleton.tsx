import React from 'react';
import clsx from 'clsx';

type LoadingSkeletonProps = {
  lines?: number;
  className?: string;
};

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ lines = 4, className }) => {
  return (
    <section
      className={clsx(
        'rounded-[16px] border border-[#DCE8EC] bg-white p-4 shadow-[0_10px_22px_-20px_rgba(15,57,74,0.5)]',
        className,
      )}
      aria-live="polite"
      aria-busy="true"
    >
      <div className="h-6 w-40 animate-pulse rounded-lg bg-[#E8F0F2]" />
      <div className="mt-4 space-y-2.5">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className="h-4 animate-pulse rounded-md bg-[#EDF3F5]"
            style={{ width: `${92 - index * 10}%` }}
          />
        ))}
      </div>
    </section>
  );
};

export default React.memo(LoadingSkeleton);
