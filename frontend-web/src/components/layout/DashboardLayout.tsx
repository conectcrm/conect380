import React from 'react';
import AppShell from '../layout-v2/AppShell';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return <AppShell>{children}</AppShell>;
};

export default React.memo(DashboardLayout);
