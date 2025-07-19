import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Theme {
  primary: string;
  secondary: string;
  accent: string;
}

interface ThemeContextData {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  updateTheme: (newTheme: Partial<Theme>) => void;
}

const defaultTheme: Theme = {
  primary: '#3b82f6',
  secondary: '#64748b',
  accent: '#22c55e',
};

const ThemeContext = createContext<ThemeContextData>({} as ThemeContextData);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  const updateTheme = (newTheme: Partial<Theme>) => {
    setTheme(prev => ({ ...prev, ...newTheme }));
  };

  const value: ThemeContextData = {
    theme,
    isDark,
    toggleTheme,
    updateTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
  }
  return context;
};
