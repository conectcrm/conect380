import React from 'react';
import clsx from 'clsx';
import { shellTokens } from '../tokens';

type PageHeaderProps = {
  title: React.ReactNode;
  description?: string;
  actions?: React.ReactNode;
  filters?: React.ReactNode;
  className?: string;
};

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  actions,
  filters,
  className,
}) => {
  return (
    <header className={clsx('flex flex-col gap-3', className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className={shellTokens.title}>{title}</h1>
          {description ? <p className={clsx('mt-1', shellTokens.subtitle)}>{description}</p> : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
      {filters ? <div className="flex flex-wrap items-center gap-2">{filters}</div> : null}
    </header>
  );
};

export default React.memo(PageHeader);
