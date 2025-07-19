import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ResponsiveDashboardLayout } from '../components/layout/ResponsiveDashboardLayout';

describe('ResponsiveDashboardLayout', () => {
  const defaultProps = {
    title: 'Dashboard',
    children: <div data-testid="content">Conteúdo do dashboard</div>,
  };

  it('deve renderizar título corretamente', () => {
    render(<ResponsiveDashboardLayout {...defaultProps} />);
    
    expect(screen.getAllByText('Dashboard')).toHaveLength(2); // Mobile e Desktop
  });

  it('deve renderizar conteúdo filho', () => {
    render(<ResponsiveDashboardLayout {...defaultProps} />);
    
    expect(screen.getByTestId('content')).toBeInTheDocument();
    expect(screen.getByText('Conteúdo do dashboard')).toBeInTheDocument();
  });

  it('deve renderizar subtítulo quando fornecido', () => {
    const propsWithSubtitle = {
      ...defaultProps,
      subtitle: 'Visão geral do seu negócio',
    };

    render(<ResponsiveDashboardLayout {...propsWithSubtitle} />);
    
    expect(screen.getAllByText('Visão geral do seu negócio')).toHaveLength(2);
  });

  it('deve renderizar ações quando fornecidas', () => {
    const actions = (
      <button data-testid="action-button">Ação</button>
    );
    
    const propsWithActions = {
      ...defaultProps,
      actions,
    };

    render(<ResponsiveDashboardLayout {...propsWithActions} />);
    
    expect(screen.getAllByTestId('action-button')).toHaveLength(2); // Mobile e Desktop
  });

  it('deve ter estrutura semântica correta', () => {
    render(<ResponsiveDashboardLayout {...defaultProps} />);
    
    // Verifica se tem headers com role="banner"
    const headers = screen.getAllByRole('banner');
    expect(headers).toHaveLength(2); // Mobile e Desktop
    expect(headers[0].tagName).toBe('HEADER');
    expect(headers[1].tagName).toBe('HEADER');

    // Verifica se tem main com role="main"
    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
    expect(main.tagName).toBe('MAIN');
  });

  it('deve ter títulos focáveis', () => {
    render(<ResponsiveDashboardLayout {...defaultProps} />);
    
    const titles = screen.getAllByText('Dashboard');
    titles.forEach(title => {
      expect(title).toHaveAttribute('tabIndex', '0');
    });
  });

  it('deve ter IDs únicos para acessibilidade', () => {
    render(<ResponsiveDashboardLayout {...defaultProps} />);
    
    const main = screen.getByRole('main');
    expect(main).toHaveAttribute('id');
    expect(main).toHaveAttribute('aria-labelledby');
  });

  it('deve ter grupos de ações com labels apropriados', () => {
    const actions = (
      <button>Ação 1</button>
    );
    
    const propsWithActions = {
      ...defaultProps,
      actions,
    };

    render(<ResponsiveDashboardLayout {...propsWithActions} />);
    
    const actionGroups = screen.getAllByRole('group', { name: 'Ações do dashboard' });
    expect(actionGroups).toHaveLength(2); // Mobile e Desktop
  });

  it('deve ter classes CSS corretas para responsividade', () => {
    render(<ResponsiveDashboardLayout {...defaultProps} />);
    
    const headers = screen.getAllByRole('banner');
    
    // Header mobile deve ter classe lg:hidden
    expect(headers[0]).toHaveClass('lg:hidden');
    
    // Header desktop deve ter classe hidden lg:block
    expect(headers[1]).toHaveClass('hidden', 'lg:block');
  });

  it('deve ter padding responsivo no conteúdo', () => {
    render(<ResponsiveDashboardLayout {...defaultProps} />);
    
    const main = screen.getByRole('main');
    expect(main).toHaveClass(
      'px-4', 'sm:px-6', 'lg:px-8',
      'py-4', 'sm:py-6', 'lg:py-8'
    );
  });

  it('deve aplicar classes de posicionamento corretas', () => {
    render(<ResponsiveDashboardLayout {...defaultProps} />);
    
    const mobileHeader = screen.getAllByRole('banner')[0];
    expect(mobileHeader).toHaveClass('sticky', 'top-0', 'z-10');
  });

  it('deve ter cores e estilos de design consistentes', () => {
    render(<ResponsiveDashboardLayout {...defaultProps} />);
    
    const headers = screen.getAllByRole('banner');
    
    // Mobile header: bg-white está no próprio header
    expect(headers[0]).toHaveClass('bg-white');
    
    // Desktop header: bg-white está na div interna
    expect(headers[1].querySelector('div')).toHaveClass('bg-white');

    const containerDiv = screen.getByRole('main').parentElement;
    expect(containerDiv).toHaveClass('min-h-screen', 'bg-gray-50');
  });
});
