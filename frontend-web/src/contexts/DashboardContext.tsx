import React, { createContext, useContext, ReactNode } from 'react';

interface DashboardContextType {
  // Estado futuro do dashboard
}

interface DashboardProviderProps {
  children: ReactNode;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider: React.FC<DashboardProviderProps> = ({ children }) => {
  const value: DashboardContextType = {
    // Implementação futura do contexto
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};

export default DashboardContext;