"use strict";
exports.__esModule = true;
exports.useBreakpoint = void 0;
var react_1 = require("react");
var breakpoints = {
    xs: 0,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536
};
var useBreakpoint = function () {
    var _a = (0, react_1.useState)(0), screenWidth = _a[0], setScreenWidth = _a[1];
    var _b = (0, react_1.useState)('xs'), currentBreakpoint = _b[0], setCurrentBreakpoint = _b[1];
    (0, react_1.useEffect)(function () {
        // Função para atualizar a largura da tela
        var updateScreenWidth = function () {
            setScreenWidth(window.innerWidth);
        };
        // Definir largura inicial
        updateScreenWidth();
        // Adicionar listener para mudanças de tamanho
        window.addEventListener('resize', updateScreenWidth);
        // Cleanup
        return function () { return window.removeEventListener('resize', updateScreenWidth); };
    }, []);
    (0, react_1.useEffect)(function () {
        // Determinar o breakpoint atual baseado na largura da tela
        if (screenWidth >= breakpoints['2xl']) {
            setCurrentBreakpoint('2xl');
        }
        else if (screenWidth >= breakpoints.xl) {
            setCurrentBreakpoint('xl');
        }
        else if (screenWidth >= breakpoints.lg) {
            setCurrentBreakpoint('lg');
        }
        else if (screenWidth >= breakpoints.md) {
            setCurrentBreakpoint('md');
        }
        else if (screenWidth >= breakpoints.sm) {
            setCurrentBreakpoint('sm');
        }
        else {
            setCurrentBreakpoint('xs');
        }
    }, [screenWidth]);
    // Funções helper para verificar breakpoints
    var isXs = currentBreakpoint === 'xs';
    var isSm = currentBreakpoint === 'sm';
    var isMd = currentBreakpoint === 'md';
    var isLg = currentBreakpoint === 'lg';
    var isXl = currentBreakpoint === 'xl';
    var is2Xl = currentBreakpoint === '2xl';
    // Funções para verificar se é >= breakpoint
    var isSmUp = screenWidth >= breakpoints.sm;
    var isMdUp = screenWidth >= breakpoints.md;
    var isLgUp = screenWidth >= breakpoints.lg;
    var isXlUp = screenWidth >= breakpoints.xl;
    var is2XlUp = screenWidth >= breakpoints['2xl'];
    // Função para verificar se está em mobile
    var isMobile = !isSmUp;
    var isTablet = isSmUp && !isLgUp;
    var isDesktop = isLgUp;
    return {
        screenWidth: screenWidth,
        currentBreakpoint: currentBreakpoint,
        isXs: isXs,
        isSm: isSm,
        isMd: isMd,
        isLg: isLg,
        isXl: isXl,
        is2Xl: is2Xl,
        isSmUp: isSmUp,
        isMdUp: isMdUp,
        isLgUp: isLgUp,
        isXlUp: isXlUp,
        is2XlUp: is2XlUp,
        isMobile: isMobile,
        isTablet: isTablet,
        isDesktop: isDesktop
    };
};
exports.useBreakpoint = useBreakpoint;
