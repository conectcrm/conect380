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

jest.mock('../hooks/useAuth', function () {
  return {
    useAuth: function () {
      return {
        user: {
          nome: 'Usuário Teste',
          empresa: {
            nome: 'Empresa Teste',
          },
        },
        logout: jest.fn(),
      };
    },
  };
});

jest.mock('../contexts/ThemeContext', function () {
  return {
    useTheme: function () {
      return {
        currentPalette: {
          colors: {
            primary: '#159A9C',
            primaryHover: '#0F7B7D',
            primaryLight: '#DEEFE7',
            primaryDark: '#0A5F61',
            secondary: '#B4BEC9',
            secondaryLight: '#E5EAF0',
            accent: '#159A9C',
            accentLight: '#DEEFE7',
            success: '#10b981',
            warning: '#f59e0b',
            error: '#ef4444',
            neutral: '#B4BEC9',
            neutralLight: '#f8fafc',
            neutralDark: '#002333',
            background: '#ffffff',
            backgroundSecondary: '#DEEFE7',
            text: '#002333',
            textSecondary: '#B4BEC9',
            border: '#B4BEC9',
            borderLight: '#DEEFE7',
          },
        },
      };
    },
  };
});

var ResponsiveDashboardLayout_1 = require('../components/layout/ResponsiveDashboardLayout');
describe('ResponsiveDashboardLayout', function () {
  var defaultProps = {
    title: 'Dashboard',
    subtitle: 'Visão geral do seu negócio',
    children: <div data-testid="content">Conteúdo do dashboard</div>,
  };
  it('exibe branding principal e informações do usuário', function () {
    (0, react_1.render)(
      <ResponsiveDashboardLayout_1.ResponsiveDashboardLayout {...defaultProps} />,
    );
    expect(react_1.screen.getByText('Fênix CRM')).toBeInTheDocument();
    expect(react_1.screen.getByTitle('Usuário Teste - Empresa Teste')).toBeInTheDocument();
  });
  it('renderiza título e subtítulo na área principal', function () {
    (0, react_1.render)(
      <ResponsiveDashboardLayout_1.ResponsiveDashboardLayout {...defaultProps} />,
    );
    var main = react_1.screen.getByRole('main');
    var heading = react_1.within(main).getByRole('heading', { name: defaultProps.title });
    expect(heading).toBeInTheDocument();
    expect(react_1.within(main).getByText(defaultProps.subtitle)).toBeInTheDocument();
  });
  it('renderiza ações quando fornecidas', function () {
    var actions = <button data-testid="action-button">Ação</button>;
    (0, react_1.render)(
      <ResponsiveDashboardLayout_1.ResponsiveDashboardLayout {...defaultProps} actions={actions} />,
    );
    var actionsGroup = react_1.screen.getByLabelText('Ações do dashboard');
    expect(react_1.within(actionsGroup).getByTestId('action-button')).toBeInTheDocument();
  });
  it('posiciona o conteúdo filho dentro da região principal', function () {
    (0, react_1.render)(
      <ResponsiveDashboardLayout_1.ResponsiveDashboardLayout {...defaultProps} />,
    );
    var main = react_1.screen.getByRole('main');
    expect(react_1.within(main).getByTestId('content')).toBeInTheDocument();
  });
  it('configura atributos de acessibilidade corretamente', function () {
    (0, react_1.render)(
      <ResponsiveDashboardLayout_1.ResponsiveDashboardLayout {...defaultProps} />,
    );
    var main = react_1.screen.getByRole('main');
    var labelledBy = main.getAttribute('aria-labelledby');
    expect(labelledBy).toBeTruthy();
    var referencedHeading = labelledBy ? document.getElementById(labelledBy) : null;
    expect(
      referencedHeading === null || referencedHeading === void 0
        ? void 0
        : referencedHeading.textContent,
    ).toBe(defaultProps.title);
  });
  it('mantém elementos interativos principais visíveis', function () {
    (0, react_1.render)(
      <ResponsiveDashboardLayout_1.ResponsiveDashboardLayout {...defaultProps} />,
    );
    expect(
      react_1.screen.getByPlaceholderText('Buscar clientes, propostas, contratos...'),
    ).toBeInTheDocument();
    expect(react_1.screen.getByText('Online')).toBeInTheDocument();
    expect(react_1.screen.getByTitle('Notificações')).toBeInTheDocument();
  });
});
