import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ResponsiveFilters, FilterOption } from '../components/common/ResponsiveFilters';

// Mock do hook de acessibilidade
jest.mock('../hooks/useAccessibility', () => ({
  useAccessibility: () => ({
    announceToScreenReader: jest.fn(),
  }),
}));

describe('ResponsiveFilters', () => {
  const defaultProps = {
    filtros: {
      periodo: 'mensal',
      vendedor: 'Todos',
      regiao: 'Todas',
    },
    onChange: jest.fn(),
    periodOptions: [
      { value: 'semanal', label: 'Esta semana' },
      { value: 'mensal', label: 'Este mês' },
      { value: 'trimestral', label: 'Último trimestre' },
    ] as FilterOption[],
    vendedorOptions: [
      { value: 'Todos', label: 'Todos os vendedores' },
      { value: '1', label: 'João Silva' },
      { value: '2', label: 'Maria Santos' },
    ] as FilterOption[],
    regiaoOptions: [
      { value: 'Todas', label: 'Todas as regiões' },
      { value: 'Sudeste', label: 'Sudeste' },
      { value: 'Sul', label: 'Sul' },
    ] as FilterOption[],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve renderizar filtros no desktop', () => {
    render(<ResponsiveFilters {...defaultProps} />);

    const selects = screen.getAllByRole('combobox');
    expect(selects).toHaveLength(3);

    const [periodoSelect, vendedorSelect, regiaoSelect] = selects as HTMLSelectElement[];

    expect(periodoSelect).toHaveValue('mensal');
    expect(vendedorSelect).toHaveValue('Todos');
    expect(regiaoSelect).toHaveValue('Todas');
  });

  it('deve ter botão de toggle para mobile', () => {
    render(<ResponsiveFilters {...defaultProps} />);

    const toggleButton = screen.getByRole('button', { name: /expandir filtros/i });
    expect(toggleButton).toBeInTheDocument();
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('deve expandir filtros quando clicado no mobile', async () => {
    render(<ResponsiveFilters {...defaultProps} />);

    const toggleButton = screen.getByRole('button', { name: /expandir filtros/i });
    const user = userEvent.setup();
    await user.click(toggleButton);

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

  it('deve chamar setFiltros quando período é alterado', async () => {
    render(<ResponsiveFilters {...defaultProps} />);

    const [periodoSelect] = screen.getAllByRole('combobox');
    const user = userEvent.setup();
    await user.selectOptions(periodoSelect, 'trimestral');

    expect(defaultProps.onChange).toHaveBeenCalledWith({
      ...defaultProps.filtros,
      periodo: 'trimestral',
    });
  });

  it('deve chamar setFiltros quando vendedor é alterado', async () => {
    render(<ResponsiveFilters {...defaultProps} />);

    const [, vendedorSelect] = screen.getAllByRole('combobox');
    const user = userEvent.setup();
    await user.selectOptions(vendedorSelect, '1');

    expect(defaultProps.onChange).toHaveBeenCalledWith({
      ...defaultProps.filtros,
      vendedor: '1',
    });
  });

  it('deve chamar setFiltros quando região é alterada', async () => {
    render(<ResponsiveFilters {...defaultProps} />);

    const [, , regiaoSelect] = screen.getAllByRole('combobox');
    const user = userEvent.setup();
    await user.selectOptions(regiaoSelect, 'Sul');

    expect(defaultProps.onChange).toHaveBeenCalledWith({
      ...defaultProps.filtros,
      regiao: 'Sul',
    });
  });

  it('deve ter opções corretas no select de período', () => {
    render(<ResponsiveFilters {...defaultProps} />);

    const [periodoSelect] = screen.getAllByRole('combobox');
    const periodoScope = within(periodoSelect);

    expect(periodoSelect).toBeInTheDocument();
    expect(periodoScope.getByText('Esta semana')).toBeInTheDocument();
    expect(periodoScope.getByText('Este mês')).toBeInTheDocument();
    expect(periodoScope.getByText('Último trimestre')).toBeInTheDocument();
  });

  it('deve ter opções corretas no select de vendedor', () => {
    render(<ResponsiveFilters {...defaultProps} />);

    expect(screen.getByText('Todos os vendedores')).toBeInTheDocument();
    expect(screen.getByText('João Silva')).toBeInTheDocument();
    expect(screen.getByText('Maria Santos')).toBeInTheDocument();
  });

  it('deve ter opções corretas no select de região', () => {
    render(<ResponsiveFilters {...defaultProps} />);

    expect(screen.getByText('Todas as regiões')).toBeInTheDocument();
    expect(screen.getByText('Sudeste')).toBeInTheDocument();
    expect(screen.getByText('Sul')).toBeInTheDocument();
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
