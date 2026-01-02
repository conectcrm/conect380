import { useEffect, useRef, useCallback } from 'react';

interface UseAccessibilityOptions {
  announceChanges?: boolean;
  focusOnMount?: boolean;
  trapFocus?: boolean;
}

export const useAccessibility = (options: UseAccessibilityOptions = {}) => {
  const elementRef = useRef<HTMLElement>(null);
  const { announceChanges = false, focusOnMount = false, trapFocus = false } = options;

  // Função para anunciar mudanças para leitores de tela
  const announceToScreenReader = useCallback(
    (message: string, priority: 'polite' | 'assertive' = 'polite') => {
      if (!announceChanges) return;

      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', priority);
      announcement.setAttribute('aria-atomic', 'true');
      announcement.classList.add('sr-only');
      announcement.textContent = message;

      document.body.appendChild(announcement);

      // Remove o elemento após um tempo para não acumular no DOM
      setTimeout(() => {
        if (document.body.contains(announcement)) {
          document.body.removeChild(announcement);
        }
      }, 1000);
    },
    [announceChanges],
  );

  // Função para gerenciar foco
  const manageFocus = useCallback(() => {
    if (focusOnMount && elementRef.current) {
      elementRef.current.focus();
    }
  }, [focusOnMount]);

  // Hook para capturar teclas de navegação
  const handleKeyNavigation = useCallback(
    (event: KeyboardEvent) => {
      if (!trapFocus || !elementRef.current) return;

      const focusableElements = elementRef.current.querySelectorAll(
        'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, [tabindex]:not([tabindex="-1"])',
      );

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (event.key === 'Tab') {
        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement?.focus();
            event.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement?.focus();
            event.preventDefault();
          }
        }
      }

      if (event.key === 'Escape') {
        elementRef.current?.blur();
      }
    },
    [trapFocus],
  );

  // Função para verificar contraste de cores
  const checkColorContrast = useCallback((foreground: string, background: string): boolean => {
    // Implementação simplificada - em produção, usar biblioteca específica
    // Esta é uma verificação básica para demonstração
    const getLuminance = (hex: string): number => {
      const rgb = hex.match(/\w\w/g)?.map((x) => parseInt(x, 16)) || [0, 0, 0];
      const [r, g, b] = rgb.map((c) => {
        c /= 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };

    const l1 = getLuminance(foreground);
    const l2 = getLuminance(background);
    const contrast = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

    return contrast >= 4.5; // WCAG AA standard
  }, []);

  // Efeitos para configurar acessibilidade
  useEffect(() => {
    manageFocus();
  }, [manageFocus]);

  useEffect(() => {
    if (trapFocus) {
      document.addEventListener('keydown', handleKeyNavigation);
      return () => document.removeEventListener('keydown', handleKeyNavigation);
    }
  }, [handleKeyNavigation, trapFocus]);

  return {
    elementRef,
    announceToScreenReader,
    checkColorContrast,
    manageFocus,
  };
};

// Hook para gerenciar navegação por teclado em listas
export const useKeyboardNavigation = (items: HTMLElement[] = []) => {
  const currentIndex = useRef(0);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          currentIndex.current = Math.min(currentIndex.current + 1, items.length - 1);
          items[currentIndex.current]?.focus();
          break;
        case 'ArrowUp':
          event.preventDefault();
          currentIndex.current = Math.max(currentIndex.current - 1, 0);
          items[currentIndex.current]?.focus();
          break;
        case 'Home':
          event.preventDefault();
          currentIndex.current = 0;
          items[0]?.focus();
          break;
        case 'End':
          event.preventDefault();
          currentIndex.current = items.length - 1;
          items[items.length - 1]?.focus();
          break;
      }
    },
    [items],
  );

  return { handleKeyDown, currentIndex: currentIndex.current };
};

// Hook para anúncios de status em tempo real
export const useLiveRegion = () => {
  const announceChange = useCallback(
    (message: string, priority: 'polite' | 'assertive' = 'polite') => {
      const liveRegion =
        document.getElementById('live-region') ||
        (() => {
          const region = document.createElement('div');
          region.id = 'live-region';
          region.setAttribute('aria-live', priority);
          region.setAttribute('aria-atomic', 'true');
          region.classList.add('sr-only');
          document.body.appendChild(region);
          return region;
        })();

      liveRegion.textContent = message;
    },
    [],
  );

  return { announceChange };
};
