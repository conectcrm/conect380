import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface MenuContextType {
  expandedMenus: string[];
  toggleMenu: (menuId: string) => void;
  isMenuExpanded: (menuId: string) => boolean;
  expandMenu: (menuId: string) => void;
  collapseMenu: (menuId: string) => void;
  collapseAllMenus: () => void;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

export const MenuProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  // Carregar estado do localStorage na inicialização
  useEffect(() => {
    const savedState = localStorage.getItem('sidebar-expanded-menus');
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        setExpandedMenus(parsedState);
      } catch (error) {
        console.error('Erro ao carregar estado dos menus da sidebar:', error);
      }
    }
  }, []);

  // Salvar estado no localStorage sempre que mudar
  useEffect(() => {
    localStorage.setItem('sidebar-expanded-menus', JSON.stringify(expandedMenus));
  }, [expandedMenus]);

  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev => {
      if (prev.includes(menuId)) {
        return prev.filter(id => id !== menuId);
      } else {
        return [...prev, menuId];
      }
    });
  };

  const isMenuExpanded = (menuId: string) => {
    return expandedMenus.includes(menuId);
  };

  const expandMenu = (menuId: string) => {
    setExpandedMenus(prev => {
      if (!prev.includes(menuId)) {
        return [...prev, menuId];
      }
      return prev;
    });
  };

  const collapseMenu = (menuId: string) => {
    setExpandedMenus(prev => prev.filter(id => id !== menuId));
  };

  const collapseAllMenus = () => {
    setExpandedMenus([]);
  };

  return (
    <MenuContext.Provider
      value={{
        expandedMenus,
        toggleMenu,
        isMenuExpanded,
        expandMenu,
        collapseMenu,
        collapseAllMenus
      }}
    >
      {children}
    </MenuContext.Provider>
  );
};

export const useMenu = () => {
  const context = useContext(MenuContext);
  if (context === undefined) {
    throw new Error('useMenu must be used within a MenuProvider');
  }
  return context;
};