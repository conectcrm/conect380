import { useState, useEffect } from 'react';

/**
 * Hook para detectar tamanho da tela e breakpoints
 */
export interface ScreenSize {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLarge: boolean;
  orientation: 'portrait' | 'landscape';
  breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

const breakpoints = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
};

export const useResponsive = (): ScreenSize => {
  const [screenSize, setScreenSize] = useState<ScreenSize>({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isLarge: false,
    orientation: 'landscape',
    breakpoint: 'lg'
  });

  useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Determinar breakpoint
      let breakpoint: ScreenSize['breakpoint'] = 'xs';
      if (width >= breakpoints['2xl']) breakpoint = '2xl';
      else if (width >= breakpoints.xl) breakpoint = 'xl';
      else if (width >= breakpoints.lg) breakpoint = 'lg';
      else if (width >= breakpoints.md) breakpoint = 'md';
      else if (width >= breakpoints.sm) breakpoint = 'sm';

      // Determinar tipo de dispositivo
      const isMobile = width < breakpoints.md;
      const isTablet = width >= breakpoints.md && width < breakpoints.lg;
      const isDesktop = width >= breakpoints.lg;
      const isLarge = width >= breakpoints.xl;

      // Determinar orientação
      const orientation = width > height ? 'landscape' : 'portrait';

      setScreenSize({
        width,
        height,
        isMobile,
        isTablet,
        isDesktop,
        isLarge,
        orientation,
        breakpoint
      });
    };

    // Atualizar no mount
    updateScreenSize();

    // Listener para mudanças
    window.addEventListener('resize', updateScreenSize);
    window.addEventListener('orientationchange', updateScreenSize);

    return () => {
      window.removeEventListener('resize', updateScreenSize);
      window.removeEventListener('orientationchange', updateScreenSize);
    };
  }, []);

  return screenSize;
};

/**
 * Hook para gerenciar overflow do body (útil para modais)
 */
export const useBodyOverflow = () => {
  const lockScroll = () => {
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = '0px'; // Evita shift de layout
  };

  const unlockScroll = () => {
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
  };

  return { lockScroll, unlockScroll };
};

/**
 * Hook para calcular dimensões de modal responsivo
 */
export const useModalDimensions = (maxWidth: string = '4xl') => {
  const { width, height, isMobile, isTablet } = useResponsive();

  const getMaxWidth = () => {
    const sizes = {
      'sm': '384px',
      'md': '448px',
      'lg': '512px',
      'xl': '576px',
      '2xl': '672px',
      '3xl': '768px',
      '4xl': '896px',
      '5xl': '1024px',
      '6xl': '1152px'
    };

    return sizes[maxWidth as keyof typeof sizes] || sizes['4xl'];
  };

  const modalStyle = {
    '--modal-max-width': getMaxWidth(),
    width: isMobile ? '95vw' : isTablet ? '90vw' : 'auto',
    maxHeight: isMobile ? '95vh' : '90vh',
    padding: isMobile ? '0.5rem' : '1rem'
  } as React.CSSProperties;

  return {
    modalStyle,
    shouldUseFullscreen: isMobile && height < 600,
    columnsCount: isMobile ? 1 : isTablet ? 2 : 3
  };
};

/**
 * Hook para grid responsivo automático
 */
export const useResponsiveGrid = (itemMinWidth: number = 280) => {
  const { width } = useResponsive();
  
  const getColumns = () => {
    const availableWidth = width - 64; // Considerando padding
    const columns = Math.floor(availableWidth / itemMinWidth);
    return Math.max(1, columns);
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${getColumns()}, 1fr)`,
    gap: 'clamp(1rem, 3vw, 2rem)',
    width: '100%'
  } as React.CSSProperties;

  return {
    gridStyle,
    columns: getColumns()
  };
};
