"use strict";
exports.__esModule = true;
exports.useLiveRegion = exports.useKeyboardNavigation = exports.useAccessibility = void 0;
var react_1 = require("react");
var useAccessibility = function (options) {
    if (options === void 0) { options = {}; }
    var elementRef = (0, react_1.useRef)(null);
    var _a = options.announceChanges, announceChanges = _a === void 0 ? false : _a, _b = options.focusOnMount, focusOnMount = _b === void 0 ? false : _b, _c = options.trapFocus, trapFocus = _c === void 0 ? false : _c;
    // Função para anunciar mudanças para leitores de tela
    var announceToScreenReader = (0, react_1.useCallback)(function (message, priority) {
        if (priority === void 0) { priority = 'polite'; }
        if (!announceChanges)
            return;
        var announcement = document.createElement('div');
        announcement.setAttribute('aria-live', priority);
        announcement.setAttribute('aria-atomic', 'true');
        announcement.classList.add('sr-only');
        announcement.textContent = message;
        document.body.appendChild(announcement);
        // Remove o elemento após um tempo para não acumular no DOM
        setTimeout(function () {
            if (document.body.contains(announcement)) {
                document.body.removeChild(announcement);
            }
        }, 1000);
    }, [announceChanges]);
    // Função para gerenciar foco
    var manageFocus = (0, react_1.useCallback)(function () {
        if (focusOnMount && elementRef.current) {
            elementRef.current.focus();
        }
    }, [focusOnMount]);
    // Hook para capturar teclas de navegação
    var handleKeyNavigation = (0, react_1.useCallback)(function (event) {
        var _a;
        if (!trapFocus || !elementRef.current)
            return;
        var focusableElements = elementRef.current.querySelectorAll('a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, [tabindex]:not([tabindex="-1"])');
        var firstElement = focusableElements[0];
        var lastElement = focusableElements[focusableElements.length - 1];
        if (event.key === 'Tab') {
            if (event.shiftKey) {
                if (document.activeElement === firstElement) {
                    lastElement === null || lastElement === void 0 ? void 0 : lastElement.focus();
                    event.preventDefault();
                }
            }
            else {
                if (document.activeElement === lastElement) {
                    firstElement === null || firstElement === void 0 ? void 0 : firstElement.focus();
                    event.preventDefault();
                }
            }
        }
        if (event.key === 'Escape') {
            (_a = elementRef.current) === null || _a === void 0 ? void 0 : _a.blur();
        }
    }, [trapFocus]);
    // Função para verificar contraste de cores
    var checkColorContrast = (0, react_1.useCallback)(function (foreground, background) {
        // Implementação simplificada - em produção, usar biblioteca específica
        // Esta é uma verificação básica para demonstração
        var getLuminance = function (hex) {
            var _a;
            var rgb = ((_a = hex.match(/\w\w/g)) === null || _a === void 0 ? void 0 : _a.map(function (x) { return parseInt(x, 16); })) || [0, 0, 0];
            var _b = rgb.map(function (c) {
                c /= 255;
                return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
            }), r = _b[0], g = _b[1], b = _b[2];
            return 0.2126 * r + 0.7152 * g + 0.0722 * b;
        };
        var l1 = getLuminance(foreground);
        var l2 = getLuminance(background);
        var contrast = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
        return contrast >= 4.5; // WCAG AA standard
    }, []);
    // Efeitos para configurar acessibilidade
    (0, react_1.useEffect)(function () {
        manageFocus();
    }, [manageFocus]);
    (0, react_1.useEffect)(function () {
        if (trapFocus) {
            document.addEventListener('keydown', handleKeyNavigation);
            return function () { return document.removeEventListener('keydown', handleKeyNavigation); };
        }
    }, [handleKeyNavigation, trapFocus]);
    return {
        elementRef: elementRef,
        announceToScreenReader: announceToScreenReader,
        checkColorContrast: checkColorContrast,
        manageFocus: manageFocus
    };
};
exports.useAccessibility = useAccessibility;
// Hook para gerenciar navegação por teclado em listas
var useKeyboardNavigation = function (items) {
    if (items === void 0) { items = []; }
    var currentIndex = (0, react_1.useRef)(0);
    var handleKeyDown = (0, react_1.useCallback)(function (event) {
        var _a, _b, _c, _d;
        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                currentIndex.current = Math.min(currentIndex.current + 1, items.length - 1);
                (_a = items[currentIndex.current]) === null || _a === void 0 ? void 0 : _a.focus();
                break;
            case 'ArrowUp':
                event.preventDefault();
                currentIndex.current = Math.max(currentIndex.current - 1, 0);
                (_b = items[currentIndex.current]) === null || _b === void 0 ? void 0 : _b.focus();
                break;
            case 'Home':
                event.preventDefault();
                currentIndex.current = 0;
                (_c = items[0]) === null || _c === void 0 ? void 0 : _c.focus();
                break;
            case 'End':
                event.preventDefault();
                currentIndex.current = items.length - 1;
                (_d = items[items.length - 1]) === null || _d === void 0 ? void 0 : _d.focus();
                break;
        }
    }, [items]);
    return { handleKeyDown: handleKeyDown, currentIndex: currentIndex.current };
};
exports.useKeyboardNavigation = useKeyboardNavigation;
// Hook para anúncios de status em tempo real
var useLiveRegion = function () {
    var announceChange = (0, react_1.useCallback)(function (message, priority) {
        if (priority === void 0) { priority = 'polite'; }
        var liveRegion = document.getElementById('live-region') || (function () {
            var region = document.createElement('div');
            region.id = 'live-region';
            region.setAttribute('aria-live', priority);
            region.setAttribute('aria-atomic', 'true');
            region.classList.add('sr-only');
            document.body.appendChild(region);
            return region;
        })();
        liveRegion.textContent = message;
    }, []);
    return { announceChange: announceChange };
};
exports.useLiveRegion = useLiveRegion;
