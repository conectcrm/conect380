import React from 'react';
import clsx from 'clsx';

export type PageTypology =
  | 'DASHBOARD'
  | 'LIST'
  | 'DETAIL'
  | 'FORM'
  | 'SETTINGS'
  | 'AUTH'
  | 'UTILITY';

type PageTemplateProps = {
  type: PageTypology;
  children: React.ReactNode;
  fullBleed?: boolean;
};

const containerByType: Record<PageTypology, string> = {
  DASHBOARD: 'space-y-4',
  LIST: 'space-y-3.5',
  DETAIL: 'space-y-4',
  FORM: 'space-y-4 w-full max-w-[1200px] mx-auto',
  SETTINGS: 'space-y-4 w-full max-w-[1280px] mx-auto',
  AUTH: 'space-y-4',
  UTILITY: 'space-y-4',
};

const surfaceByType: Record<PageTypology, string> = {
  DASHBOARD: '',
  LIST: '',
  DETAIL: '',
  FORM: '',
  SETTINGS: '',
  AUTH: '',
  UTILITY: '',
};

const PageTemplate: React.FC<PageTemplateProps> = ({ type, children, fullBleed = false }) => {
  if (fullBleed) {
    return <div data-page-typology={type}>{children}</div>;
  }

  return (
    <div data-page-typology={type} className={clsx(containerByType[type], surfaceByType[type])}>
      {children}
    </div>
  );
};

export default React.memo(PageTemplate);
