"use strict";
exports.__esModule = true;
var react_1 = require("@testing-library/react");
var useAccessibility_1 = require("../hooks/useAccessibility");
describe('useAccessibility', function () {
    it('deve criar refs corretamente', function () {
        var result = (0, react_1.renderHook)(function () { return (0, useAccessibility_1.useAccessibility)(); }).result;
        expect(result.current.elementRef).toBeDefined();
        expect(result.current.elementRef.current).toBeNull();
    });
    it('deve anunciar mudanças para leitores de tela', function () {
        // Mock do DOM
        var mockAppendChild = jest.fn();
        var mockRemoveChild = jest.fn();
        var mockCreateElement = jest.fn(function () { return ({
            setAttribute: jest.fn(),
            classList: { add: jest.fn() },
            textContent: ''
        }); });
        Object.defineProperty(document, 'createElement', {
            value: mockCreateElement
        });
        Object.defineProperty(document.body, 'appendChild', {
            value: mockAppendChild
        });
        Object.defineProperty(document.body, 'removeChild', {
            value: mockRemoveChild
        });
        Object.defineProperty(document.body, 'contains', {
            value: function () { return true; }
        });
        var result = (0, react_1.renderHook)(function () { return (0, useAccessibility_1.useAccessibility)({ announceChanges: true }); }).result;
        (0, react_1.act)(function () {
            result.current.announceToScreenReader('Teste de anúncio');
        });
        expect(mockCreateElement).toHaveBeenCalledWith('div');
        expect(mockAppendChild).toHaveBeenCalled();
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
            // Mock da propriedade current do ref
            Object.defineProperty(result.current.elementRef, 'current', {
                value: mockElement,
                writable: true
            });
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
                value: jest.fn()
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
                value: jest.fn()
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
                value: jest.fn()
            });
            result.current.handleKeyDown(event);
        });
        expect(mockFocus).toHaveBeenCalled();
    });
});
describe('useLiveRegion', function () {
    it('deve criar região ao vivo para anúncios', function () {
        var mockGetElementById = jest.fn(function () { return null; });
        var mockCreateElement = jest.fn(function () { return ({
            id: '',
            setAttribute: jest.fn(),
            classList: { add: jest.fn() },
            textContent: ''
        }); });
        var mockAppendChild = jest.fn();
        Object.defineProperty(document, 'getElementById', {
            value: mockGetElementById
        });
        Object.defineProperty(document, 'createElement', {
            value: mockCreateElement
        });
        Object.defineProperty(document.body, 'appendChild', {
            value: mockAppendChild
        });
        var result = (0, react_1.renderHook)(function () { return (0, useAccessibility_1.useLiveRegion)(); }).result;
        (0, react_1.act)(function () {
            result.current.announceChange('Teste de região ao vivo');
        });
        expect(mockCreateElement).toHaveBeenCalledWith('div');
        expect(mockAppendChild).toHaveBeenCalled();
    });
    it('deve reutilizar região existente', function () {
        var mockLiveRegion = {
            textContent: ''
        };
        var mockGetElementById = jest.fn(function () { return mockLiveRegion; });
        Object.defineProperty(document, 'getElementById', {
            value: mockGetElementById
        });
        var result = (0, react_1.renderHook)(function () { return (0, useAccessibility_1.useLiveRegion)(); }).result;
        (0, react_1.act)(function () {
            result.current.announceChange('Reutilizar região');
        });
        expect(mockLiveRegion.textContent).toBe('Reutilizar região');
    });
});
