import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ResponsiveFilters } from '../components/common/ResponsiveFilters';

// Mock do hook de acessibilidade
jest.mock('../hooks/useAccessibility', () => ({
  useAccessibility: () => ({
    announceToScreenReader: jest.fn(),
  }),
}));

describe('ResponsiveFilters', () => {
  const defaultProps = {
    filtros: {
      periodo: '2025',
      vendedor: 'Todos',
      regiao: 'Todas',
    },
    setFiltros: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve renderizar filtros no desktop', () => {
    render(<ResponsiveFilters {...defaultProps} />);
    
    expect(screen.getByDisplayValue('2025')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Todos')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Todas')).toBeInTheDocument();
  });

  it('deve ter botão de toggle para mobile', () => {
    render(<ResponsiveFilters {...defaultProps} />);
    
    const toggleButton = screen.getByRole('button', { name: /expandir filtros/i });
    expect(toggleButton).toBeInTheDocument();
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('deve expandir filtros quando clicado no mobile', () => {
    render(<ResponsiveFilters {...defaultProps} />);
    
    const toggleButton = screen.getByRole('button', { name: /expandir filtros/i });
    fireEvent.click(toggleButton);
    
    expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
    expect(toggleButton).toHaveAttribute('aria-label', 'Recolher filtros do dashboard');
  });

  it('deve ter estrutura semântica correta', () => {
    render(<ResponsiveFilters {...defaultProps} />);
    
    const section = screen.getByRole('region', { name: 'Filtros do dashboard' });
    expect(section).toBeInTheDocument();
    expect(section.tagName).toBe('SECTION');
  });

  it('deve ter controles acessíveis', () => {
    render(<ResponsiveFilters {...defaultProps} />);
    
    const toggleButton = screen.getByRole('button');
    expect(toggleButton).toHaveAttribute('aria-controls');
    expect(toggleButton).toHaveAttribute('aria-expanded');
  });

  it('deve chamar setFiltros quando período é alterado', () => {
    render(<ResponsiveFilters {...defaultProps} />);
    
    const periodoSelect = screen.getByDisplayValue('2025');
    fireEvent.change(periodoSelect, { target: { value: '2024' } });
    
    expect(defaultProps.setFiltros).toHaveBeenCalledWith({
      ...defaultProps.filtros,
      periodo: '2024',
    });
  });

  it('deve chamar setFiltros quando vendedor é alterado', () => {
    render(<ResponsiveFilters {...defaultProps} />);
    
    const vendedorSelect = screen.getByDisplayValue('Todos');
    fireEvent.change(vendedorSelect, { target: { value: 'João Silva' } });
    
    expect(defaultProps.setFiltros).toHaveBeenCalledWith({
      ...defaultProps.filtros,
      vendedor: 'João Silva',
    });
  });

  it('deve chamar setFiltros quando região é alterada', () => {
    render(<ResponsiveFilters {...defaultProps} />);
    
    const regiaoSelect = screen.getByDisplayValue('Todas');
    fireEvent.change(regiaoSelect, { target: { value: 'Norte' } });
    
    expect(defaultProps.setFiltros).toHaveBeenCalledWith({
      ...defaultProps.filtros,
      regiao: 'Norte',
    });
  });

  it('deve ter opções corretas no select de período', () => {
    render(<ResponsiveFilters {...defaultProps} />);
    
    const periodoSelect = screen.getByDisplayValue('2025');
    expect(periodoSelect).toBeInTheDocument();
    
    // Verifica se as opções estão presentes
    expect(screen.getByText('2025')).toBeInTheDocument();
    expect(screen.getByText('2024')).toBeInTheDocument();
    expect(screen.getByText('2023')).toBeInTheDocument();
  });

  it('deve ter opções corretas no select de vendedor', () => {
    render(<ResponsiveFilters {...defaultProps} />);
    
    expect(screen.getByText('Todos os vendedores')).toBeInTheDocument();
    expect(screen.getByText('João Silva')).toBeInTheDocument();
    expect(screen.getByText('Maria Santos')).toBeInTheDocument();
    expect(screen.getByText('Pedro Costa')).toBeInTheDocument();
  });

  it('deve ter opções corretas no select de região', () => {
    render(<ResponsiveFilters {...defaultProps} />);
    
    expect(screen.getByText('Todas as regiões')).toBeInTheDocument();
    expect(screen.getByText('Norte')).toBeInTheDocument();
    expect(screen.getByText('Sul')).toBeInTheDocument();
    expect(screen.getByText('Sudeste')).toBeInTheDocument();
    expect(screen.getByText('Centro-Oeste')).toBeInTheDocument();
    expect(screen.getByText('Nordeste')).toBeInTheDocument();
  });

  it('deve ser navegável por teclado', () => {
    render(<ResponsiveFilters {...defaultProps} />);
    
    const toggleButton = screen.getByRole('button');
    toggleButton.focus();
    expect(toggleButton).toHaveFocus();
    
    // Verifica se tem estilos de foco
    expect(toggleButton).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-blue-500');
  });

  it('deve ter ícone com aria-hidden', () => {
    render(<ResponsiveFilters {...defaultProps} />);
    
    // O ícone Filter deve ter aria-hidden="true"
    const filterIcon = screen.getByRole('button').querySelector('svg');
    expect(filterIcon).toHaveAttribute('aria-hidden', 'true');
  });
});
