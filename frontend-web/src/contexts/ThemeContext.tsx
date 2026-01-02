import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Definição dos temas disponíveis
export interface ThemeColors {
  primary: string;
  primaryHover: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  secondaryLight: string;
  accent: string;
  accentLight: string;
  success: string;
  warning: string;
  error: string;
  neutral: string;
  neutralLight: string;
  neutralDark: string;
  background: string;
  backgroundSecondary: string;
  text: string;
  textSecondary: string;
  border: string;
  borderLight: string;
}

export interface ThemePalette {
  id: string;
  name: string;
  description: string;
  colors: ThemeColors;
  gradients: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

// Temas predefinidos
export const themePalettes: Record<string, ThemePalette> = {
  crevasse: {
    id: 'crevasse',
    name: 'Crevasse Professional',
    description: 'Paleta moderna com tons teal e azul profissional',
    colors: {
      primary: '#159A9C', // Crevasse-2: Teal principal
      primaryHover: '#0F7B7D', // Variação mais escura do teal
      primaryLight: '#DEEFE7', // Crevasse-4: Verde claro suave
      primaryDark: '#0A5F61', // Ainda mais escuro do teal
      secondary: '#B4BEC9', // Crevasse-1: Cinza azulado
      secondaryLight: '#E5EAF0', // Variação mais clara do cinza azulado
      accent: '#159A9C', // Mesmo que primary para consistência
      accentLight: '#DEEFE7', // Crevasse-4: Verde claro
      success: '#10b981', // Verde success padrão
      warning: '#f59e0b', // Amarelo warning padrão
      error: '#ef4444', // Vermelho error padrão
      neutral: '#B4BEC9', // Crevasse-1: Cinza azulado neutro
      neutralLight: '#f8fafc', // Quase branco
      neutralDark: '#002333', // Crevasse-3: Azul escuro profundo
      background: '#FFFFFF', // Crevasse-5: Branco puro
      backgroundSecondary: '#DEEFE7', // Crevasse-4: Fundo secundário suave
      text: '#002333', // Crevasse-3: Texto principal escuro
      textSecondary: '#B4BEC9', // Crevasse-1: Texto secundário
      border: '#B4BEC9', // Crevasse-1: Bordas sutis
      borderLight: '#DEEFE7', // Crevasse-4: Bordas mais claras
    },
    gradients: {
      primary: 'linear-gradient(135deg, #159A9C 0%, #0F7B7D 100%)',
      secondary: 'linear-gradient(135deg, #B4BEC9 0%, #8A9BA8 100%)',
      accent: 'linear-gradient(135deg, #DEEFE7 0%, #C8E6DB 100%)',
    },
  },
  neutral: {
    id: 'neutral',
    name: 'Neutro Profissional',
    description: 'Tons de cinza com acentos azuis sutis',
    colors: {
      primary: '#3b82f6',
      primaryHover: '#2563eb',
      primaryLight: '#dbeafe',
      primaryDark: '#1e40af',
      secondary: '#6b7280',
      secondaryLight: '#f3f4f6',
      accent: '#1e40af',
      accentLight: '#eff6ff',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      neutral: '#6b7280',
      neutralLight: '#f9fafb',
      neutralDark: '#374151',
      background: '#ffffff',
      backgroundSecondary: '#f8fafc',
      text: '#111827',
      textSecondary: '#6b7280',
      border: '#e5e7eb',
      borderLight: '#f3f4f6',
    },
    gradients: {
      primary: 'from-gray-50 to-slate-100',
      secondary: 'from-blue-50 to-blue-100',
      accent: 'from-gray-100 to-gray-200',
    },
  },
  business: {
    id: 'business',
    name: 'Corporativo Azul',
    description: 'Paleta profissional em tons de azul',
    colors: {
      primary: '#1e40af',
      primaryHover: '#1e3a8a',
      primaryLight: '#dbeafe',
      primaryDark: '#1e3a8a',
      secondary: '#3b82f6',
      secondaryLight: '#eff6ff',
      accent: '#0ea5e9',
      accentLight: '#e0f2fe',
      success: '#059669',
      warning: '#d97706',
      error: '#dc2626',
      neutral: '#64748b',
      neutralLight: '#f1f5f9',
      neutralDark: '#334155',
      background: '#ffffff',
      backgroundSecondary: '#f8fafc',
      text: '#0f172a',
      textSecondary: '#64748b',
      border: '#cbd5e1',
      borderLight: '#e2e8f0',
    },
    gradients: {
      primary: 'from-blue-50 to-indigo-100',
      secondary: 'from-sky-50 to-blue-100',
      accent: 'from-blue-100 to-indigo-200',
    },
  },
  modern: {
    id: 'modern',
    name: 'Moderno Vibrante',
    description: 'Cores vibrantes e contrastantes',
    colors: {
      primary: '#7c3aed',
      primaryHover: '#6d28d9',
      primaryLight: '#f3e8ff',
      primaryDark: '#5b21b6',
      secondary: '#06b6d4',
      secondaryLight: '#cffafe',
      accent: '#f59e0b',
      accentLight: '#fef3c7',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      neutral: '#6b7280',
      neutralLight: '#f9fafb',
      neutralDark: '#374151',
      background: '#ffffff',
      backgroundSecondary: '#fafafa',
      text: '#111827',
      textSecondary: '#6b7280',
      border: '#e5e7eb',
      borderLight: '#f3f4f6',
    },
    gradients: {
      primary: 'from-purple-50 to-violet-100',
      secondary: 'from-cyan-50 to-teal-100',
      accent: 'from-amber-50 to-orange-100',
    },
  },
  forest: {
    id: 'forest',
    name: 'Natureza Verde',
    description: 'Inspirado na natureza com tons de verde',
    colors: {
      primary: '#059669',
      primaryHover: '#047857',
      primaryLight: '#d1fae5',
      primaryDark: '#065f46',
      secondary: '#10b981',
      secondaryLight: '#ecfdf5',
      accent: '#84cc16',
      accentLight: '#f7fee7',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
      neutral: '#6b7280',
      neutralLight: '#f9fafb',
      neutralDark: '#374151',
      background: '#ffffff',
      backgroundSecondary: '#f9fafb',
      text: '#111827',
      textSecondary: '#6b7280',
      border: '#e5e7eb',
      borderLight: '#f3f4f6',
    },
    gradients: {
      primary: 'from-green-50 to-emerald-100',
      secondary: 'from-teal-50 to-green-100',
      accent: 'from-lime-50 to-green-100',
    },
  },
  sunset: {
    id: 'sunset',
    name: 'Pôr do Sol',
    description: 'Cores quentes inspiradas no pôr do sol',
    colors: {
      primary: '#ea580c',
      primaryHover: '#dc2626',
      primaryLight: '#fed7aa',
      primaryDark: '#c2410c',
      secondary: '#f59e0b',
      secondaryLight: '#fef3c7',
      accent: '#dc2626',
      accentLight: '#fecaca',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      neutral: '#6b7280',
      neutralLight: '#f9fafb',
      neutralDark: '#374151',
      background: '#ffffff',
      backgroundSecondary: '#fffbeb',
      text: '#111827',
      textSecondary: '#6b7280',
      border: '#e5e7eb',
      borderLight: '#f3f4f6',
    },
    gradients: {
      primary: 'from-orange-50 to-red-100',
      secondary: 'from-amber-50 to-orange-100',
      accent: 'from-red-50 to-pink-100',
    },
  },
};

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
  // Novas propriedades para paleta de cores
  currentPalette: ThemePalette;
  setPalette: (paletteId: string) => void;
  availablePalettes: ThemePalette[];
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
  const [currentPaletteId, setCurrentPaletteId] = useState<string>('crevasse');

  // Carregar tema e paleta do localStorage na inicialização
  useEffect(() => {
    const savedTheme = localStorage.getItem('crm-theme');
    const savedPalette = localStorage.getItem('crm-palette');

    if (savedTheme) {
      try {
        const parsedTheme = JSON.parse(savedTheme);
        setTheme(parsedTheme);
      } catch (error) {
        console.warn('Erro ao carregar tema salvo:', error);
      }
    }

    if (savedPalette && themePalettes[savedPalette]) {
      setCurrentPaletteId(savedPalette);
    }
  }, []);

  // Aplicar variáveis CSS quando a paleta mudar
  useEffect(() => {
    const palette = themePalettes[currentPaletteId];
    if (palette) {
      const root = document.documentElement;

      // Aplicar cores CSS customizadas
      Object.entries(palette.colors).forEach(([key, value]) => {
        root.style.setProperty(`--color-${key}`, value);
      });

      // Aplicar gradientes
      Object.entries(palette.gradients).forEach(([key, value]) => {
        root.style.setProperty(`--gradient-${key}`, value);
      });
    }
  }, [currentPaletteId]);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  const updateTheme = (newTheme: Partial<Theme>) => {
    const updatedTheme = { ...theme, ...newTheme };
    setTheme(updatedTheme);
    localStorage.setItem('crm-theme', JSON.stringify(updatedTheme));
  };

  const setPalette = (paletteId: string) => {
    if (themePalettes[paletteId]) {
      setCurrentPaletteId(paletteId);
      localStorage.setItem('crm-palette', paletteId);
    }
  };

  const value: ThemeContextData = {
    theme,
    isDark,
    toggleTheme,
    updateTheme,
    currentPalette: themePalettes[currentPaletteId],
    setPalette,
    availablePalettes: Object.values(themePalettes),
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
