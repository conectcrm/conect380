"use strict";
exports.__esModule = true;
var react_1 = require("@testing-library/react");
var useAccessibility_1 = require("../hooks/useAccessibility");

afterEach(function () {
  jest.useRealTimers();
  jest.clearAllTimers();
  jest.restoreAllMocks();
  jest.clearAllMocks();
});
describe('useAccessibility', function () {
  it('deve criar refs corretamente', function () {
    var result = (0, react_1.renderHook)(function () { return (0, useAccessibility_1.useAccessibility)(); }).result;
    expect(result.current.elementRef).toBeDefined();
    expect(result.current.elementRef.current).toBeNull();
  });
  it('deve anunciar mudanças para leitores de tela', function () {
    jest.useFakeTimers();
    var appendSpy = jest.spyOn(document.body, 'appendChild');
    var removeSpy = jest.spyOn(document.body, 'removeChild');
    jest.spyOn(document.body, 'contains').mockReturnValue(true);
    var createSpy = jest.spyOn(document, 'createElement');
    var result = (0, react_1.renderHook)(function () { return (0, useAccessibility_1.useAccessibility)({ announceChanges: true }); }).result;
    (0, react_1.act)(function () {
      result.current.announceToScreenReader('Teste de anúncio');
      jest.runOnlyPendingTimers();
    });
    expect(createSpy).toHaveBeenCalledWith('div');
    expect(appendSpy).toHaveBeenCalled();
    expect(removeSpy).toHaveBeenCalled();
  });
  it('deve verificar contraste de cores', function () {
    var result = (0, react_1.renderHook)(function () { return (0, useAccessibility_1.useAccessibility)(); }).result;
    var isGoodContrast = result.current.checkColorContrast('#000000', '#ffffff');
    var isBadContrast = result.current.checkColorContrast('#888888', '#999999');
    expect(isGoodContrast).toBe(true);
    expect(isBadContrast).toBe(false);
  });
  it('deve gerenciar foco quando focusOnMount é true', function () {
    var mockFocus = jest.fn();
    var mockElement = { focus: mockFocus };
    var result = (0, react_1.renderHook)(function () { return (0, useAccessibility_1.useAccessibility)({ focusOnMount: true }); }).result;
    (0, react_1.act)(function () {
      result.current.elementRef.current = mockElement;
      result.current.manageFocus();
    });
    expect(mockFocus).toHaveBeenCalled();
  });
});
describe('useKeyboardNavigation', function () {
  it('deve gerenciar navegação por teclado', function () {
    var mockFocus = jest.fn();
    var items = [
      { focus: mockFocus },
      { focus: mockFocus },
      { focus: mockFocus },
    ];
    var result = (0, react_1.renderHook)(function () { return (0, useAccessibility_1.useKeyboardNavigation)(items); }).result;
    // Simula tecla ArrowDown
    (0, react_1.act)(function () {
      var event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      Object.defineProperty(event, 'preventDefault', {
        value: jest.fn(),
        configurable: true
      });
      result.current.handleKeyDown(event);
    });
    expect(mockFocus).toHaveBeenCalled();
  });
  it('deve navegar para o último item com tecla End', function () {
    var mockFocus = jest.fn();
    var items = [
      { focus: jest.fn() },
      { focus: jest.fn() },
      { focus: mockFocus },
    ];
    var result = (0, react_1.renderHook)(function () { return (0, useAccessibility_1.useKeyboardNavigation)(items); }).result;
    (0, react_1.act)(function () {
      var event = new KeyboardEvent('keydown', { key: 'End' });
      Object.defineProperty(event, 'preventDefault', {
        value: jest.fn(),
        configurable: true
      });
      result.current.handleKeyDown(event);
    });
    expect(mockFocus).toHaveBeenCalled();
  });
  it('deve navegar para o primeiro item com tecla Home', function () {
    var mockFocus = jest.fn();
    var items = [
      { focus: mockFocus },
      { focus: jest.fn() },
      { focus: jest.fn() },
    ];
    var result = (0, react_1.renderHook)(function () { return (0, useAccessibility_1.useKeyboardNavigation)(items); }).result;
    (0, react_1.act)(function () {
      var event = new KeyboardEvent('keydown', { key: 'Home' });
      Object.defineProperty(event, 'preventDefault', {
        value: jest.fn(),
        configurable: true
      });
      result.current.handleKeyDown(event);
    });
    expect(mockFocus).toHaveBeenCalled();
  });
});
describe('useLiveRegion', function () {
  it('deve criar região ao vivo para anúncios', function () {
    jest.spyOn(document, 'getElementById').mockReturnValue(null);
    var createSpy = jest.spyOn(document, 'createElement');
    var appendSpy = jest.spyOn(document.body, 'appendChild');
    var result = (0, react_1.renderHook)(function () { return (0, useAccessibility_1.useLiveRegion)(); }).result;
    (0, react_1.act)(function () {
      result.current.announceChange('Teste de região ao vivo');
    });
    expect(createSpy).toHaveBeenCalledWith('div');
    expect(appendSpy).toHaveBeenCalled();
  });
  it('deve reutilizar região existente', function () {
    var liveRegion = document.createElement('div');
    liveRegion.id = 'live-region';
    document.body.appendChild(liveRegion);
    var result = (0, react_1.renderHook)(function () { return (0, useAccessibility_1.useLiveRegion)(); }).result;
    (0, react_1.act)(function () {
      result.current.announceChange('Reutilizar região');
    });
    var region = document.getElementById('live-region');
    expect(region === null || region === void 0 ? void 0 : region.textContent).toBe('Reutilizar região');
    if (region === null || region === void 0 ? void 0 : region.parentNode) {
      region.parentNode.removeChild(region);
    }
  });
});
