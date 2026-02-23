import React from 'react';
import AppShell from '../../components/layout-v2/AppShell';

type DashboardV2ShellProps = {
  children: React.ReactNode;
};

const DashboardV2Shell: React.FC<DashboardV2ShellProps> = ({ children }) => {
  return <AppShell>{children}</AppShell>;
};

export default React.memo(DashboardV2Shell);
