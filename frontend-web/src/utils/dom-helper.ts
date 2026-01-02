/**
 * Utilitários para manipulação segura do DOM
 * Previne erros comuns com getBoundingClientRect e outros métodos DOM
 */

export const safeGetBoundingClientRect = (element: Element | null): DOMRect => {
  if (!element) {
    // Retorna um DOMRect padrão se o elemento for null
    return {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      toJSON: () => ({}),
    } as DOMRect;
  }

  try {
    return element.getBoundingClientRect();
  } catch (error) {
    console.warn('Erro ao obter getBoundingClientRect:', error);
    return {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      toJSON: () => ({}),
    } as DOMRect;
  }
};

export const safeGetWindowDimensions = () => {
  if (typeof window === 'undefined') {
    return {
      innerWidth: 1920,
      innerHeight: 1080,
    };
  }

  return {
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
  };
};

export const calculateSafePosition = (
  position: { x: number; y: number },
  elementWidth: number = 400,
  elementHeight: number = 500,
) => {
  const { innerWidth, innerHeight } = safeGetWindowDimensions();

  return {
    x: Math.min(position.x, innerWidth - elementWidth),
    y: Math.min(position.y, innerHeight - elementHeight),
  };
};

/**
 * Hook para manipulação segura de eventos de mouse
 */
export const createSafeMouseHandler = (callback: (rect: DOMRect) => void, delay: number = 0) => {
  return (event: React.MouseEvent) => {
    const execute = () => {
      if (!event.currentTarget) return;

      const rect = safeGetBoundingClientRect(event.currentTarget);
      callback(rect);
    };

    if (delay > 0) {
      setTimeout(execute, delay);
    } else {
      execute();
    }
  };
};
