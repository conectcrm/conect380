import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { KPICard } from '../components/common/KPICard';
import { UsersIcon } from '../components/icons/DashboardIcons';

// Mock do hook de acessibilidade
jest.mock('../hooks/useAccessibility', () => ({
  useAccessibility: () => ({
    announceToScreenReader: jest.fn(),
  }),
}));

describe('KPICard', () => {
  const defaultProps = {
    title: 'Total de Clientes',
    value: '248',
    icon: <UsersIcon size={24} />,
  };

  it('deve renderizar o título e valor corretamente', () => {
    render(<KPICard {...defaultProps} />);

    expect(screen.getByText('Total de Clientes')).toBeInTheDocument();
    expect(screen.getByText('248')).toBeInTheDocument();
  });

  it('deve renderizar estado de loading com skeleton', () => {
    render(<KPICard {...defaultProps} isLoading={true} />);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByLabelText('Carregando dados do indicador')).toBeInTheDocument();
    expect(screen.getByText('Carregando indicador: Total de Clientes')).toBeInTheDocument();
  });

  it('deve renderizar tendência positiva corretamente', () => {
    const propsWithTrend = {
      ...defaultProps,
      trend: {
        value: 12,
        isPositive: true,
        label: 'este mês',
      },
    };

    render(<KPICard {...propsWithTrend} />);

    const trendElement = screen.getByRole('status');
    expect(trendElement).toHaveAttribute('aria-label', 'Tendência positiva de 12% este mês');
    expect(screen.getByText('12%')).toBeInTheDocument();
  });

  it('deve renderizar tendência negativa corretamente', () => {
    const propsWithTrend = {
      ...defaultProps,
      trend: {
        value: -8,
        isPositive: false,
        label: 'este mês',
      },
    };

    render(<KPICard {...propsWithTrend} />);

    const trendElement = screen.getByRole('status');
    expect(trendElement).toHaveAttribute('aria-label', 'Tendência negativa de 8% este mês');
    expect(screen.getByText('8%')).toBeInTheDocument();
  });

  it('deve ser focável via teclado', () => {
    render(<KPICard {...defaultProps} />);

    const card = screen.getByRole('region');
    card.focus();
    expect(card).toHaveFocus();
  });

  it('deve ter aria-label automático quando não fornecido', () => {
    render(<KPICard {...defaultProps} />);

    const card = screen.getByRole('region');
    expect(card).toHaveAttribute('aria-label', 'Total de Clientes: 248');
  });

  it('deve usar aria-label customizado quando fornecido', () => {
    const customProps = {
      ...defaultProps,
      'aria-label': 'Métrica personalizada de clientes',
    };

    render(<KPICard {...customProps} />);

    const card = screen.getByRole('region');
    expect(card).toHaveAttribute('aria-label', 'Métrica personalizada de clientes');
  });

  it('deve renderizar subtítulo quando fornecido', () => {
    const propsWithSubtitle = {
      ...defaultProps,
      subtitle: 'Ativos no sistema',
    };

    render(<KPICard {...propsWithSubtitle} />);

    expect(screen.getByText('Ativos no sistema')).toBeInTheDocument();
    expect(screen.getByLabelText('Descrição: Ativos no sistema')).toBeInTheDocument();
  });

  it('deve aplicar classes de cor corretamente', () => {
    const { rerender } = render(<KPICard {...defaultProps} color="green" />);

    let card = screen.getByRole('region');
    expect(card).toHaveClass('border-green-200');

    rerender(<KPICard {...defaultProps} color="red" />);
    card = screen.getByRole('region');
    expect(card).toHaveClass('border-red-200');
  });

  it('deve formatar números corretamente', () => {
    const propsWithNumber = {
      ...defaultProps,
      value: 1234567,
    };

    render(<KPICard {...propsWithNumber} />);

    // Verifica se o número está formatado em português brasileiro
    expect(screen.getByText('1.234.567')).toBeInTheDocument();
  });

  it('deve ter estrutura HTML semântica', () => {
    render(<KPICard {...defaultProps} />);

    // Verifica se usa article como elemento semântico
    const article = screen.getByRole('region');
    expect(article.tagName).toBe('ARTICLE');

    // Verifica se tem título com h3
    const title = screen.getByRole('heading', { level: 3 });
    expect(title).toBeInTheDocument();

    // Verifica se o ícone tem role="img"
    const icon = screen.getByRole('img');
    expect(icon).toBeInTheDocument();
  });
});
