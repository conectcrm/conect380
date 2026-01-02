import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SidebarContextType {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  // Painel suspenso de submenus
  activeSubmenuPanel: string | null;
  setActiveSubmenuPanel: (menuId: string | null) => void;
  toggleSubmenuPanel: (menuId: string) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const SidebarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Sidebar sempre aberta agora (barra de ícones fixa)
  const [sidebarCollapsed] = useState<boolean>(false);

  // Painel suspenso de submenus
  const [activeSubmenuPanel, setActiveSubmenuPanel] = useState<string | null>(null);

  const setSidebarCollapsed = () => {
    // Não faz nada - sidebar sempre visível
  };

  const toggleSidebar = () => {
    // Não faz nada - sidebar sempre visível
  };

  const toggleSubmenuPanel = (menuId: string) => {
    setActiveSubmenuPanel(prev => prev === menuId ? null : menuId);
  };

  return (
    <SidebarContext.Provider value={{
      sidebarCollapsed,
      setSidebarCollapsed,
      toggleSidebar,
      activeSubmenuPanel,
      setActiveSubmenuPanel,
      toggleSubmenuPanel
    }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};
