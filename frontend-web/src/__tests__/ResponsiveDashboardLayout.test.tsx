import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ResponsiveDashboardLayout } from '../components/layout/ResponsiveDashboardLayout';

jest.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      nome: 'Usuário Teste',
      empresa: {
        nome: 'Empresa Teste',
      },
    },
    logout: jest.fn(),
  }),
}));

jest.mock('../contexts/ThemeContext', () => ({
  useTheme: () => ({
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
  }),
}));

describe('ResponsiveDashboardLayout', () => {
  const defaultProps = {
    title: 'Dashboard',
    subtitle: 'Visão geral do seu negócio',
    children: <div data-testid="content">Conteúdo do dashboard</div>,
  };

  it('exibe branding principal e informações do usuário', () => {
    render(<ResponsiveDashboardLayout {...defaultProps} />);

    expect(screen.getByText('Fênix CRM')).toBeInTheDocument();
    expect(screen.getByTitle('Usuário Teste - Empresa Teste')).toBeInTheDocument();
  });

  it('renderiza título e subtítulo na área principal', () => {
    render(<ResponsiveDashboardLayout {...defaultProps} />);

    const main = screen.getByRole('main');
    const heading = within(main).getByRole('heading', { name: defaultProps.title });

    expect(heading).toBeInTheDocument();
    if (defaultProps.subtitle) {
      expect(within(main).getByText(defaultProps.subtitle)).toBeInTheDocument();
    }
  });

  it('renderiza ações quando fornecidas', () => {
    const actions = <button data-testid="action-button">Ação</button>;

    render(<ResponsiveDashboardLayout {...defaultProps} actions={actions} />);

    const actionsGroup = screen.getByLabelText('Ações do dashboard');
    expect(within(actionsGroup).getByTestId('action-button')).toBeInTheDocument();
  });

  it('posiciona o conteúdo filho dentro da região principal', () => {
    render(<ResponsiveDashboardLayout {...defaultProps} />);

    const main = screen.getByRole('main');
    expect(within(main).getByTestId('content')).toBeInTheDocument();
  });

  it('configura atributos de acessibilidade corretamente', () => {
    render(<ResponsiveDashboardLayout {...defaultProps} />);

    const main = screen.getByRole('main');
    const labelledBy = main.getAttribute('aria-labelledby');
    expect(labelledBy).toBeTruthy();

    const referencedHeading = labelledBy ? document.getElementById(labelledBy) : null;
    expect(referencedHeading?.textContent).toBe(defaultProps.title);
  });

  it('mantém elementos interativos principais visíveis', () => {
    render(<ResponsiveDashboardLayout {...defaultProps} />);

    expect(screen.getByPlaceholderText('Buscar clientes, propostas, contratos...')).toBeInTheDocument();
    expect(screen.getByText('Online')).toBeInTheDocument();
    expect(screen.getByTitle('Notificações')).toBeInTheDocument();
  });
});
