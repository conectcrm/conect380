import { useState, useEffect } from 'react';

type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface BreakpointConfig {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  '2xl': number;
}

const breakpoints: BreakpointConfig = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

export const useBreakpoint = () => {
  const [screenWidth, setScreenWidth] = useState<number>(0);
  const [currentBreakpoint, setCurrentBreakpoint] = useState<Breakpoint>('xs');

  useEffect(() => {
    // Função para atualizar a largura da tela
    const updateScreenWidth = () => {
      setScreenWidth(window.innerWidth);
    };

    // Definir largura inicial
    updateScreenWidth();

    // Adicionar listener para mudanças de tamanho
    window.addEventListener('resize', updateScreenWidth);

    // Cleanup
    return () => window.removeEventListener('resize', updateScreenWidth);
  }, []);

  useEffect(() => {
    // Determinar o breakpoint atual baseado na largura da tela
    if (screenWidth >= breakpoints['2xl']) {
      setCurrentBreakpoint('2xl');
    } else if (screenWidth >= breakpoints.xl) {
      setCurrentBreakpoint('xl');
    } else if (screenWidth >= breakpoints.lg) {
      setCurrentBreakpoint('lg');
    } else if (screenWidth >= breakpoints.md) {
      setCurrentBreakpoint('md');
    } else if (screenWidth >= breakpoints.sm) {
      setCurrentBreakpoint('sm');
    } else {
      setCurrentBreakpoint('xs');
    }
  }, [screenWidth]);

  // Funções helper para verificar breakpoints
  const isXs = currentBreakpoint === 'xs';
  const isSm = currentBreakpoint === 'sm';
  const isMd = currentBreakpoint === 'md';
  const isLg = currentBreakpoint === 'lg';
  const isXl = currentBreakpoint === 'xl';
  const is2Xl = currentBreakpoint === '2xl';

  // Funções para verificar se é >= breakpoint
  const isSmUp = screenWidth >= breakpoints.sm;
  const isMdUp = screenWidth >= breakpoints.md;
  const isLgUp = screenWidth >= breakpoints.lg;
  const isXlUp = screenWidth >= breakpoints.xl;
  const is2XlUp = screenWidth >= breakpoints['2xl'];

  // Função para verificar se está em mobile
  const isMobile = !isSmUp;
  const isTablet = isSmUp && !isLgUp;
  const isDesktop = isLgUp;

  return {
    screenWidth,
    currentBreakpoint,
    isXs,
    isSm,
    isMd,
    isLg,
    isXl,
    is2Xl,
    isSmUp,
    isMdUp,
    isLgUp,
    isXlUp,
    is2XlUp,
    isMobile,
    isTablet,
    isDesktop,
  };
};
