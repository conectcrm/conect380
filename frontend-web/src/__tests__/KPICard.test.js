'use strict';
var __assign =
  (this && this.__assign) ||
  function () {
    __assign =
      Object.assign ||
      function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
      };
    return __assign.apply(this, arguments);
  };
exports.__esModule = true;
var react_1 = require('@testing-library/react');
require('@testing-library/jest-dom');
var KPICard_1 = require('../components/common/KPICard');
var DashboardIcons_1 = require('../components/icons/DashboardIcons');
// Mock do hook de acessibilidade
jest.mock('../hooks/useAccessibility', function () {
  return {
    useAccessibility: function () {
      return {
        announceToScreenReader: jest.fn(),
      };
    },
  };
});
describe('KPICard', function () {
  var defaultProps = {
    title: 'Total de Clientes',
    value: '248',
    icon: <DashboardIcons_1.UsersIcon size={24} />,
  };
  it('deve renderizar o título e valor corretamente', function () {
    (0, react_1.render)(<KPICard_1.KPICard {...defaultProps} />);
    expect(react_1.screen.getByText('Total de Clientes')).toBeInTheDocument();
    expect(react_1.screen.getByText('248')).toBeInTheDocument();
  });
  it('deve renderizar estado de loading com skeleton', function () {
    (0, react_1.render)(<KPICard_1.KPICard {...defaultProps} isLoading={true} />);
    expect(react_1.screen.getByRole('status')).toBeInTheDocument();
    expect(react_1.screen.getByLabelText('Carregando dados do indicador')).toBeInTheDocument();
    expect(react_1.screen.getByText('Carregando indicador: Total de Clientes')).toBeInTheDocument();
  });
  it('deve renderizar tendência positiva corretamente', function () {
    var propsWithTrend = __assign(__assign({}, defaultProps), {
      trend: {
        value: 12,
        isPositive: true,
        label: 'este mês',
      },
    });
    (0, react_1.render)(<KPICard_1.KPICard {...propsWithTrend} />);
    var trendElement = react_1.screen.getByRole('status');
    expect(trendElement).toHaveAttribute('aria-label', 'Tendência positiva de 12% este mês');
    expect(react_1.screen.getByText('12%')).toBeInTheDocument();
  });
  it('deve renderizar tendência negativa corretamente', function () {
    var propsWithTrend = __assign(__assign({}, defaultProps), {
      trend: {
        value: -8,
        isPositive: false,
        label: 'este mês',
      },
    });
    (0, react_1.render)(<KPICard_1.KPICard {...propsWithTrend} />);
    var trendElement = react_1.screen.getByRole('status');
    expect(trendElement).toHaveAttribute('aria-label', 'Tendência negativa de 8% este mês');
    expect(react_1.screen.getByText('8%')).toBeInTheDocument();
  });
  it('deve ser focável via teclado', function () {
    (0, react_1.render)(<KPICard_1.KPICard {...defaultProps} />);
    var card = react_1.screen.getByRole('region');
    card.focus();
    expect(card).toHaveFocus();
  });
  it('deve ter aria-label automático quando não fornecido', function () {
    (0, react_1.render)(<KPICard_1.KPICard {...defaultProps} />);
    var card = react_1.screen.getByRole('region');
    expect(card).toHaveAttribute('aria-label', 'Total de Clientes: 248');
  });
  it('deve usar aria-label customizado quando fornecido', function () {
    var customProps = __assign(__assign({}, defaultProps), {
      'aria-label': 'Métrica personalizada de clientes',
    });
    (0, react_1.render)(<KPICard_1.KPICard {...customProps} />);
    var card = react_1.screen.getByRole('region');
    expect(card).toHaveAttribute('aria-label', 'Métrica personalizada de clientes');
  });
  it('deve renderizar subtítulo quando fornecido', function () {
    var propsWithSubtitle = __assign(__assign({}, defaultProps), { subtitle: 'Ativos no sistema' });
    (0, react_1.render)(<KPICard_1.KPICard {...propsWithSubtitle} />);
    expect(react_1.screen.getByText('Ativos no sistema')).toBeInTheDocument();
    expect(react_1.screen.getByLabelText('Descrição: Ativos no sistema')).toBeInTheDocument();
  });
  it('deve aplicar classes de cor corretamente', function () {
    var rerender = (0, react_1.render)(
      <KPICard_1.KPICard {...defaultProps} color="green" />,
    ).rerender;
    var card = react_1.screen.getByRole('region');
    expect(card).toHaveClass('border-green-200');
    rerender(<KPICard_1.KPICard {...defaultProps} color="red" />);
    card = react_1.screen.getByRole('region');
    expect(card).toHaveClass('border-red-200');
  });
  it('deve formatar números corretamente', function () {
    var propsWithNumber = __assign(__assign({}, defaultProps), { value: 1234567 });
    (0, react_1.render)(<KPICard_1.KPICard {...propsWithNumber} />);
    // Verifica se o número está formatado em português brasileiro
    expect(react_1.screen.getByText('1.234.567')).toBeInTheDocument();
  });
  it('deve ter estrutura HTML semântica', function () {
    (0, react_1.render)(<KPICard_1.KPICard {...defaultProps} />);
    // Verifica se usa article como elemento semântico
    var article = react_1.screen.getByRole('region');
    expect(article.tagName).toBe('ARTICLE');
    // Verifica se tem título com h3
    var title = react_1.screen.getByRole('heading', { level: 3 });
    expect(title).toBeInTheDocument();
    // Verifica se o ícone tem role="img"
    var icon = react_1.screen.getByRole('img');
    expect(icon).toBeInTheDocument();
  });
});
