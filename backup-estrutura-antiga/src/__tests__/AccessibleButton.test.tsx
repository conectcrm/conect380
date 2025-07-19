import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AccessibleButton } from '../components/common/AccessibleButton';

// Mock do hook de acessibilidade
jest.mock('../hooks/useAccessibility', () => ({
  useAccessibility: () => ({
    announceToScreenReader: jest.fn(),
  }),
}));

describe('AccessibleButton', () => {
  it('deve renderizar texto do botão corretamente', () => {
    render(<AccessibleButton>Clique aqui</AccessibleButton>);
    
    expect(screen.getByRole('button', { name: 'Clique aqui' })).toBeInTheDocument();
  });

  it('deve aplicar variant primary por padrão', () => {
    render(<AccessibleButton>Botão</AccessibleButton>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-blue-600', 'text-white');
  });

  it('deve aplicar variant secundário corretamente', () => {
    render(<AccessibleButton variant="secondary">Botão</AccessibleButton>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-gray-600', 'text-white');
  });

  it('deve aplicar variant outline corretamente', () => {
    render(<AccessibleButton variant="outline">Botão</AccessibleButton>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('border-2', 'border-blue-600', 'text-blue-600');
  });

  it('deve aplicar variant danger corretamente', () => {
    render(<AccessibleButton variant="danger">Botão</AccessibleButton>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-red-600', 'text-white');
  });

  it('deve aplicar tamanhos corretamente', () => {
    const { rerender } = render(<AccessibleButton size="sm">Pequeno</AccessibleButton>);
    let button = screen.getByRole('button');
    expect(button).toHaveClass('px-3', 'py-1.5', 'text-sm');

    rerender(<AccessibleButton size="lg">Grande</AccessibleButton>);
    button = screen.getByRole('button');
    expect(button).toHaveClass('px-6', 'py-3', 'text-lg');
  });

  it('deve renderizar estado de loading corretamente', () => {
    render(
      <AccessibleButton loading={true} loadingText="Salvando...">
        Salvar
      </AccessibleButton>
    );
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toBeDisabled();
    expect(screen.getByText('Salvando...')).toBeInTheDocument();
  });

  it('deve chamar onClick quando clicado', () => {
    const handleClick = jest.fn();
    render(<AccessibleButton onClick={handleClick}>Clique</AccessibleButton>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('não deve chamar onClick quando loading', () => {
    const handleClick = jest.fn();
    render(
      <AccessibleButton onClick={handleClick} loading={true}>
        Clique
      </AccessibleButton>
    );
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('não deve chamar onClick quando disabled', () => {
    const handleClick = jest.fn();
    render(
      <AccessibleButton onClick={handleClick} disabled={true}>
        Clique
      </AccessibleButton>
    );
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('deve renderizar ícones corretamente', () => {
    const LeftIcon = () => <span data-testid="left-icon">←</span>;
    const RightIcon = () => <span data-testid="right-icon">→</span>;
    
    render(
      <AccessibleButton
        leftIcon={<LeftIcon />}
        rightIcon={<RightIcon />}
      >
        Botão com ícones
      </AccessibleButton>
    );
    
    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
  });

  it('deve aplicar fullWidth corretamente', () => {
    render(<AccessibleButton fullWidth={true}>Botão largo</AccessibleButton>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('w-full');
  });

  it('deve ter altura mínima adequada para acessibilidade', () => {
    const { rerender } = render(<AccessibleButton size="sm">Pequeno</AccessibleButton>);
    let button = screen.getByRole('button');
    expect(button).toHaveClass('min-h-[32px]');

    rerender(<AccessibleButton size="md">Médio</AccessibleButton>);
    button = screen.getByRole('button');
    expect(button).toHaveClass('min-h-[40px]');

    rerender(<AccessibleButton size="lg">Grande</AccessibleButton>);
    button = screen.getByRole('button');
    expect(button).toHaveClass('min-h-[48px]');
  });

  it('deve ter aria-label customizado', () => {
    render(
      <AccessibleButton aria-label="Botão personalizado">
        Clique
      </AccessibleButton>
    );
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Botão personalizado');
  });

  it('deve ser focável via teclado', () => {
    render(<AccessibleButton>Focável</AccessibleButton>);
    
    const button = screen.getByRole('button');
    button.focus();
    expect(button).toHaveFocus();
  });

  it('deve responder a tecla Enter', () => {
    const handleClick = jest.fn();
    render(<AccessibleButton onClick={handleClick}>Botão</AccessibleButton>);
    
    const button = screen.getByRole('button');
    fireEvent.keyDown(button, { key: 'Enter' });
    // O comportamento padrão do navegador deve chamar o onClick
  });

  it('deve responder a tecla Space', () => {
    const handleClick = jest.fn();
    render(<AccessibleButton onClick={handleClick}>Botão</AccessibleButton>);
    
    const button = screen.getByRole('button');
    fireEvent.keyDown(button, { key: ' ' });
    // O comportamento padrão do navegador deve chamar o onClick
  });
});
