import React from 'react';
import clsx from 'clsx';
import { shellTokens } from '../tokens';

type PageHeaderProps = {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  filters?: React.ReactNode;
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  inlineDescriptionOnDesktop?: boolean;
};

const PageHeader: React.FC<PageHeaderProps> = ({
  eyebrow,
  title,
  description,
  actions,
  filters,
  className,
  titleClassName,
  descriptionClassName,
  inlineDescriptionOnDesktop = false,
}) => {
  return (
    <header className={clsx('flex flex-col gap-3', className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          {eyebrow ? <div className="mb-1.5">{eyebrow}</div> : null}
          {inlineDescriptionOnDesktop ? (
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
              <h1 className={clsx(shellTokens.title, titleClassName)}>{title}</h1>
              {description ? (
                <p className={clsx(shellTokens.subtitle, descriptionClassName)}>{description}</p>
              ) : null}
            </div>
          ) : (
            <>
              <h1 className={clsx(shellTokens.title, titleClassName)}>{title}</h1>
              {description ? (
                <p className={clsx('mt-1', shellTokens.subtitle, descriptionClassName)}>{description}</p>
              ) : null}
            </>
          )}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
      {filters ? <div className="flex flex-wrap items-center gap-2">{filters}</div> : null}
    </header>
  );
};

export default React.memo(PageHeader);
