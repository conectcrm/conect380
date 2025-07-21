"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
var react_1 = require("@testing-library/react");
require("@testing-library/jest-dom");
var ResponsiveDashboardLayout_1 = require("../components/layout/ResponsiveDashboardLayout");
describe('ResponsiveDashboardLayout', function () {
    var defaultProps = {
        title: 'Dashboard',
        children: <div data-testid="content">Conteúdo do dashboard</div>
    };
    it('deve renderizar título corretamente', function () {
        (0, react_1.render)(<ResponsiveDashboardLayout_1.ResponsiveDashboardLayout {...defaultProps}/>);
        expect(react_1.screen.getAllByText('Dashboard')).toHaveLength(2); // Mobile e Desktop
    });
    it('deve renderizar conteúdo filho', function () {
        (0, react_1.render)(<ResponsiveDashboardLayout_1.ResponsiveDashboardLayout {...defaultProps}/>);
        expect(react_1.screen.getByTestId('content')).toBeInTheDocument();
        expect(react_1.screen.getByText('Conteúdo do dashboard')).toBeInTheDocument();
    });
    it('deve renderizar subtítulo quando fornecido', function () {
        var propsWithSubtitle = __assign(__assign({}, defaultProps), { subtitle: 'Visão geral do seu negócio' });
        (0, react_1.render)(<ResponsiveDashboardLayout_1.ResponsiveDashboardLayout {...propsWithSubtitle}/>);
        expect(react_1.screen.getAllByText('Visão geral do seu negócio')).toHaveLength(2);
    });
    it('deve renderizar ações quando fornecidas', function () {
        var actions = (<button data-testid="action-button">Ação</button>);
        var propsWithActions = __assign(__assign({}, defaultProps), { actions: actions });
        (0, react_1.render)(<ResponsiveDashboardLayout_1.ResponsiveDashboardLayout {...propsWithActions}/>);
        expect(react_1.screen.getAllByTestId('action-button')).toHaveLength(2); // Mobile e Desktop
    });
    it('deve ter estrutura semântica correta', function () {
        (0, react_1.render)(<ResponsiveDashboardLayout_1.ResponsiveDashboardLayout {...defaultProps}/>);
        // Verifica se tem headers com role="banner"
        var headers = react_1.screen.getAllByRole('banner');
        expect(headers).toHaveLength(2); // Mobile e Desktop
        expect(headers[0].tagName).toBe('HEADER');
        expect(headers[1].tagName).toBe('HEADER');
        // Verifica se tem main com role="main"
        var main = react_1.screen.getByRole('main');
        expect(main).toBeInTheDocument();
        expect(main.tagName).toBe('MAIN');
    });
    it('deve ter títulos focáveis', function () {
        (0, react_1.render)(<ResponsiveDashboardLayout_1.ResponsiveDashboardLayout {...defaultProps}/>);
        var titles = react_1.screen.getAllByText('Dashboard');
        titles.forEach(function (title) {
            expect(title).toHaveAttribute('tabIndex', '0');
        });
    });
    it('deve ter IDs únicos para acessibilidade', function () {
        (0, react_1.render)(<ResponsiveDashboardLayout_1.ResponsiveDashboardLayout {...defaultProps}/>);
        var main = react_1.screen.getByRole('main');
        expect(main).toHaveAttribute('id');
        expect(main).toHaveAttribute('aria-labelledby');
    });
    it('deve ter grupos de ações com labels apropriados', function () {
        var actions = (<button>Ação 1</button>);
        var propsWithActions = __assign(__assign({}, defaultProps), { actions: actions });
        (0, react_1.render)(<ResponsiveDashboardLayout_1.ResponsiveDashboardLayout {...propsWithActions}/>);
        var actionGroups = react_1.screen.getAllByRole('group', { name: 'Ações do dashboard' });
        expect(actionGroups).toHaveLength(2); // Mobile e Desktop
    });
    it('deve ter classes CSS corretas para responsividade', function () {
        (0, react_1.render)(<ResponsiveDashboardLayout_1.ResponsiveDashboardLayout {...defaultProps}/>);
        var headers = react_1.screen.getAllByRole('banner');
        // Header mobile deve ter classe lg:hidden
        expect(headers[0]).toHaveClass('lg:hidden');
        // Header desktop deve ter classe hidden lg:block
        expect(headers[1]).toHaveClass('hidden', 'lg:block');
    });
    it('deve ter padding responsivo no conteúdo', function () {
        (0, react_1.render)(<ResponsiveDashboardLayout_1.ResponsiveDashboardLayout {...defaultProps}/>);
        var main = react_1.screen.getByRole('main');
        expect(main).toHaveClass('px-4', 'sm:px-6', 'lg:px-8', 'py-4', 'sm:py-6', 'lg:py-8');
    });
    it('deve aplicar classes de posicionamento corretas', function () {
        (0, react_1.render)(<ResponsiveDashboardLayout_1.ResponsiveDashboardLayout {...defaultProps}/>);
        var mobileHeader = react_1.screen.getAllByRole('banner')[0];
        expect(mobileHeader).toHaveClass('sticky', 'top-0', 'z-10');
    });
    it('deve ter cores e estilos de design consistentes', function () {
        (0, react_1.render)(<ResponsiveDashboardLayout_1.ResponsiveDashboardLayout {...defaultProps}/>);
        var headers = react_1.screen.getAllByRole('banner');
        // Mobile header: bg-white está no próprio header
        expect(headers[0]).toHaveClass('bg-white');
        // Desktop header: bg-white está na div interna
        expect(headers[1].querySelector('div')).toHaveClass('bg-white');
        var containerDiv = react_1.screen.getByRole('main').parentElement;
        expect(containerDiv).toHaveClass('min-h-screen', 'bg-gray-50');
    });
});
