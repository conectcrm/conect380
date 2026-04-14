import React from 'react';
import clsx from 'clsx';

export type FiltersBarProps = {
  children: React.ReactNode;
  className?: string;
};

const FiltersBar: React.FC<FiltersBarProps> = ({ children, className }) => {
  return (
    <section
      className={clsx(
        'flex flex-wrap items-center gap-2 rounded-[14px] border border-[#DCE8EC] bg-white px-3 py-2 shadow-[0_8px_20px_-22px_rgba(15,57,74,0.5)]',
        className,
      )}
    >
      {children}
    </section>
  );
};

export default React.memo(FiltersBar);
