import { renderHook, act } from '@testing-library/react';
import { useAccessibility, useKeyboardNavigation, useLiveRegion } from '../hooks/useAccessibility';

describe('useAccessibility', () => {
  it('deve criar refs corretamente', () => {
    const { result } = renderHook(() => useAccessibility());
    
    expect(result.current.elementRef).toBeDefined();
    expect(result.current.elementRef.current).toBeNull();
  });

  it('deve anunciar mudanças para leitores de tela', () => {
    // Mock do DOM
    const mockAppendChild = jest.fn();
    const mockRemoveChild = jest.fn();
    const mockCreateElement = jest.fn(() => ({
      setAttribute: jest.fn(),
      classList: { add: jest.fn() },
      textContent: '',
    }));
    
    Object.defineProperty(document, 'createElement', {
      value: mockCreateElement,
    });
    Object.defineProperty(document.body, 'appendChild', {
      value: mockAppendChild,
    });
    Object.defineProperty(document.body, 'removeChild', {
      value: mockRemoveChild,
    });
    Object.defineProperty(document.body, 'contains', {
      value: () => true,
    });

    const { result } = renderHook(() => useAccessibility({ announceChanges: true }));
    
    act(() => {
      result.current.announceToScreenReader('Teste de anúncio');
    });

    expect(mockCreateElement).toHaveBeenCalledWith('div');
    expect(mockAppendChild).toHaveBeenCalled();
  });

  it('deve verificar contraste de cores', () => {
    const { result } = renderHook(() => useAccessibility());
    
    const isGoodContrast = result.current.checkColorContrast('#000000', '#ffffff');
    const isBadContrast = result.current.checkColorContrast('#888888', '#999999');
    
    expect(isGoodContrast).toBe(true);
    expect(isBadContrast).toBe(false);
  });

  it('deve gerenciar foco quando focusOnMount é true', () => {
    const mockFocus = jest.fn();
    const mockElement = { focus: mockFocus };
    
    const { result } = renderHook(() => useAccessibility({ focusOnMount: true }));
    
    act(() => {
      // Mock da propriedade current do ref
      Object.defineProperty(result.current.elementRef, 'current', {
        value: mockElement,
        writable: true,
      });
      result.current.manageFocus();
    });

    expect(mockFocus).toHaveBeenCalled();
  });
});

describe('useKeyboardNavigation', () => {
  it('deve gerenciar navegação por teclado', () => {
    const mockFocus = jest.fn();
    const items = [
      { focus: mockFocus },
      { focus: mockFocus },
      { focus: mockFocus },
    ] as unknown as HTMLElement[];

    const { result } = renderHook(() => useKeyboardNavigation(items));

    // Simula tecla ArrowDown
    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      Object.defineProperty(event, 'preventDefault', {
        value: jest.fn(),
      });
      result.current.handleKeyDown(event as any);
    });

    expect(mockFocus).toHaveBeenCalled();
  });

  it('deve navegar para o último item com tecla End', () => {
    const mockFocus = jest.fn();
    const items = [
      { focus: jest.fn() },
      { focus: jest.fn() },
      { focus: mockFocus },
    ] as unknown as HTMLElement[];

    const { result } = renderHook(() => useKeyboardNavigation(items));

    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'End' });
      Object.defineProperty(event, 'preventDefault', {
        value: jest.fn(),
      });
      result.current.handleKeyDown(event as any);
    });

    expect(mockFocus).toHaveBeenCalled();
  });

  it('deve navegar para o primeiro item com tecla Home', () => {
    const mockFocus = jest.fn();
    const items = [
      { focus: mockFocus },
      { focus: jest.fn() },
      { focus: jest.fn() },
    ] as unknown as HTMLElement[];

    const { result } = renderHook(() => useKeyboardNavigation(items));

    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'Home' });
      Object.defineProperty(event, 'preventDefault', {
        value: jest.fn(),
      });
      result.current.handleKeyDown(event as any);
    });

    expect(mockFocus).toHaveBeenCalled();
  });
});

describe('useLiveRegion', () => {
  it('deve criar região ao vivo para anúncios', () => {
    const mockGetElementById = jest.fn(() => null);
    const mockCreateElement = jest.fn(() => ({
      id: '',
      setAttribute: jest.fn(),
      classList: { add: jest.fn() },
      textContent: '',
    }));
    const mockAppendChild = jest.fn();

    Object.defineProperty(document, 'getElementById', {
      value: mockGetElementById,
    });
    Object.defineProperty(document, 'createElement', {
      value: mockCreateElement,
    });
    Object.defineProperty(document.body, 'appendChild', {
      value: mockAppendChild,
    });

    const { result } = renderHook(() => useLiveRegion());

    act(() => {
      result.current.announceChange('Teste de região ao vivo');
    });

    expect(mockCreateElement).toHaveBeenCalledWith('div');
    expect(mockAppendChild).toHaveBeenCalled();
  });

  it('deve reutilizar região existente', () => {
    const mockLiveRegion = {
      textContent: '',
    };
    const mockGetElementById = jest.fn(() => mockLiveRegion);

    Object.defineProperty(document, 'getElementById', {
      value: mockGetElementById,
    });

    const { result } = renderHook(() => useLiveRegion());

    act(() => {
      result.current.announceChange('Reutilizar região');
    });

    expect(mockLiveRegion.textContent).toBe('Reutilizar região');
  });
});
