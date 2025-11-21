import { renderHook, act } from '@testing-library/react';
import { useAccessibility, useKeyboardNavigation, useLiveRegion } from '../hooks/useAccessibility';

afterEach(() => {
  jest.useRealTimers();
  jest.clearAllTimers();
  jest.restoreAllMocks();
  jest.clearAllMocks();
});

describe('useAccessibility', () => {
  it('deve criar refs corretamente', () => {
    const { result } = renderHook(() => useAccessibility());

    expect(result.current.elementRef).toBeDefined();
    expect(result.current.elementRef.current).toBeNull();
  });

  it('deve anunciar mudanças para leitores de tela', () => {
    jest.useFakeTimers();

    const appendSpy = jest.spyOn(document.body, 'appendChild');
    const removeSpy = jest.spyOn(document.body, 'removeChild');
    jest.spyOn(document.body, 'contains').mockReturnValue(true);
    const createSpy = jest.spyOn(document, 'createElement');

    const { result } = renderHook(() => useAccessibility({ announceChanges: true }));

    act(() => {
      result.current.announceToScreenReader('Teste de anúncio');
      jest.runOnlyPendingTimers();
    });

    expect(createSpy).toHaveBeenCalledWith('div');
    expect(appendSpy).toHaveBeenCalled();
    expect(removeSpy).toHaveBeenCalled();
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
      result.current.elementRef.current = mockElement as unknown as HTMLElement;
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
    jest.spyOn(document, 'getElementById').mockReturnValue(null);
    const createSpy = jest.spyOn(document, 'createElement');
    const appendSpy = jest.spyOn(document.body, 'appendChild');

    const { result } = renderHook(() => useLiveRegion());

    act(() => {
      result.current.announceChange('Teste de região ao vivo');
    });

    expect(createSpy).toHaveBeenCalledWith('div');
    expect(appendSpy).toHaveBeenCalled();
  });

  it('deve reutilizar região existente', () => {
    const liveRegion = document.createElement('div');
    liveRegion.id = 'live-region';
    document.body.appendChild(liveRegion);

    const { result } = renderHook(() => useLiveRegion());

    act(() => {
      result.current.announceChange('Reutilizar região');
    });

    const region = document.getElementById('live-region');
    expect(region?.textContent).toBe('Reutilizar região');

    region?.parentNode?.removeChild(region);
  });
});
