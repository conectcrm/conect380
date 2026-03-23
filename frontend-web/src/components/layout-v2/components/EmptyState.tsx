import React from 'react';
import clsx from 'clsx';
import { Inbox } from 'lucide-react';

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
};

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  className,
}) => {
  return (
    <section
      className={clsx(
        'rounded-[16px] border border-dashed border-[#CFE0E6] bg-[#F7FBFC] px-5 py-7 text-center',
        className,
      )}
    >
      <div className="mx-auto inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#6B8592]">
        {icon || <Inbox className="h-5 w-5" />}
      </div>
      <h3 className="mt-3 text-[17px] font-semibold text-[#1B3B4E]">{title}</h3>
      {description ? <p className="mt-1 text-[14px] text-[#64808E]">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </section>
  );
};

export default React.memo(EmptyState);
