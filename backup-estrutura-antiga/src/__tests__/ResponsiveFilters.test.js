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
var ResponsiveFilters_1 = require("../components/common/ResponsiveFilters");
// Mock do hook de acessibilidade
jest.mock('../hooks/useAccessibility', function () { return ({
    useAccessibility: function () { return ({
        announceToScreenReader: jest.fn()
    }); }
}); });
describe('ResponsiveFilters', function () {
    var defaultProps = {
        filtros: {
            periodo: '2025',
            vendedor: 'Todos',
            regiao: 'Todas'
        },
        setFiltros: jest.fn()
    };
    beforeEach(function () {
        jest.clearAllMocks();
    });
    it('deve renderizar filtros no desktop', function () {
        (0, react_1.render)(<ResponsiveFilters_1.ResponsiveFilters {...defaultProps}/>);
        expect(react_1.screen.getByDisplayValue('2025')).toBeInTheDocument();
        expect(react_1.screen.getByDisplayValue('Todos')).toBeInTheDocument();
        expect(react_1.screen.getByDisplayValue('Todas')).toBeInTheDocument();
    });
    it('deve ter botão de toggle para mobile', function () {
        (0, react_1.render)(<ResponsiveFilters_1.ResponsiveFilters {...defaultProps}/>);
        var toggleButton = react_1.screen.getByRole('button', { name: /expandir filtros/i });
        expect(toggleButton).toBeInTheDocument();
        expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
    });
    it('deve expandir filtros quando clicado no mobile', function () {
        (0, react_1.render)(<ResponsiveFilters_1.ResponsiveFilters {...defaultProps}/>);
        var toggleButton = react_1.screen.getByRole('button', { name: /expandir filtros/i });
        react_1.fireEvent.click(toggleButton);
        expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
        expect(toggleButton).toHaveAttribute('aria-label', 'Recolher filtros do dashboard');
    });
    it('deve ter estrutura semântica correta', function () {
        (0, react_1.render)(<ResponsiveFilters_1.ResponsiveFilters {...defaultProps}/>);
        var section = react_1.screen.getByRole('region', { name: 'Filtros do dashboard' });
        expect(section).toBeInTheDocument();
        expect(section.tagName).toBe('SECTION');
    });
    it('deve ter controles acessíveis', function () {
        (0, react_1.render)(<ResponsiveFilters_1.ResponsiveFilters {...defaultProps}/>);
        var toggleButton = react_1.screen.getByRole('button');
        expect(toggleButton).toHaveAttribute('aria-controls');
        expect(toggleButton).toHaveAttribute('aria-expanded');
    });
    it('deve chamar setFiltros quando período é alterado', function () {
        (0, react_1.render)(<ResponsiveFilters_1.ResponsiveFilters {...defaultProps}/>);
        var periodoSelect = react_1.screen.getByDisplayValue('2025');
        react_1.fireEvent.change(periodoSelect, { target: { value: '2024' } });
        expect(defaultProps.setFiltros).toHaveBeenCalledWith(__assign(__assign({}, defaultProps.filtros), { periodo: '2024' }));
    });
    it('deve chamar setFiltros quando vendedor é alterado', function () {
        (0, react_1.render)(<ResponsiveFilters_1.ResponsiveFilters {...defaultProps}/>);
        var vendedorSelect = react_1.screen.getByDisplayValue('Todos');
        react_1.fireEvent.change(vendedorSelect, { target: { value: 'João Silva' } });
        expect(defaultProps.setFiltros).toHaveBeenCalledWith(__assign(__assign({}, defaultProps.filtros), { vendedor: 'João Silva' }));
    });
    it('deve chamar setFiltros quando região é alterada', function () {
        (0, react_1.render)(<ResponsiveFilters_1.ResponsiveFilters {...defaultProps}/>);
        var regiaoSelect = react_1.screen.getByDisplayValue('Todas');
        react_1.fireEvent.change(regiaoSelect, { target: { value: 'Norte' } });
        expect(defaultProps.setFiltros).toHaveBeenCalledWith(__assign(__assign({}, defaultProps.filtros), { regiao: 'Norte' }));
    });
    it('deve ter opções corretas no select de período', function () {
        (0, react_1.render)(<ResponsiveFilters_1.ResponsiveFilters {...defaultProps}/>);
        var periodoSelect = react_1.screen.getByDisplayValue('2025');
        expect(periodoSelect).toBeInTheDocument();
        // Verifica se as opções estão presentes
        expect(react_1.screen.getByText('2025')).toBeInTheDocument();
        expect(react_1.screen.getByText('2024')).toBeInTheDocument();
        expect(react_1.screen.getByText('2023')).toBeInTheDocument();
    });
    it('deve ter opções corretas no select de vendedor', function () {
        (0, react_1.render)(<ResponsiveFilters_1.ResponsiveFilters {...defaultProps}/>);
        expect(react_1.screen.getByText('Todos os vendedores')).toBeInTheDocument();
        expect(react_1.screen.getByText('João Silva')).toBeInTheDocument();
        expect(react_1.screen.getByText('Maria Santos')).toBeInTheDocument();
        expect(react_1.screen.getByText('Pedro Costa')).toBeInTheDocument();
    });
    it('deve ter opções corretas no select de região', function () {
        (0, react_1.render)(<ResponsiveFilters_1.ResponsiveFilters {...defaultProps}/>);
        expect(react_1.screen.getByText('Todas as regiões')).toBeInTheDocument();
        expect(react_1.screen.getByText('Norte')).toBeInTheDocument();
        expect(react_1.screen.getByText('Sul')).toBeInTheDocument();
        expect(react_1.screen.getByText('Sudeste')).toBeInTheDocument();
        expect(react_1.screen.getByText('Centro-Oeste')).toBeInTheDocument();
        expect(react_1.screen.getByText('Nordeste')).toBeInTheDocument();
    });
    it('deve ser navegável por teclado', function () {
        (0, react_1.render)(<ResponsiveFilters_1.ResponsiveFilters {...defaultProps}/>);
        var toggleButton = react_1.screen.getByRole('button');
        toggleButton.focus();
        expect(toggleButton).toHaveFocus();
        // Verifica se tem estilos de foco
        expect(toggleButton).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-blue-500');
    });
    it('deve ter ícone com aria-hidden', function () {
        (0, react_1.render)(<ResponsiveFilters_1.ResponsiveFilters {...defaultProps}/>);
        // O ícone Filter deve ter aria-hidden="true"
        var filterIcon = react_1.screen.getByRole('button').querySelector('svg');
        expect(filterIcon).toHaveAttribute('aria-hidden', 'true');
    });
});
