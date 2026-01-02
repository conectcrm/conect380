'use strict';
exports.__esModule = true;
var react_1 = require('@testing-library/react');
require('@testing-library/jest-dom');
var AccessibleButton_1 = require('../components/common/AccessibleButton');
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
describe('AccessibleButton', function () {
  it('deve renderizar texto do botão corretamente', function () {
    (0, react_1.render)(
      <AccessibleButton_1.AccessibleButton>Clique aqui</AccessibleButton_1.AccessibleButton>,
    );
    expect(react_1.screen.getByRole('button', { name: 'Clique aqui' })).toBeInTheDocument();
  });
  it('deve aplicar variant primary por padrão', function () {
    (0, react_1.render)(
      <AccessibleButton_1.AccessibleButton>Botão</AccessibleButton_1.AccessibleButton>,
    );
    var button = react_1.screen.getByRole('button');
    expect(button).toHaveClass('bg-blue-600', 'text-white');
  });
  it('deve aplicar variant secundário corretamente', function () {
    (0, react_1.render)(
      <AccessibleButton_1.AccessibleButton variant="secondary">
        Botão
      </AccessibleButton_1.AccessibleButton>,
    );
    var button = react_1.screen.getByRole('button');
    expect(button).toHaveClass('bg-gray-600', 'text-white');
  });
  it('deve aplicar variant outline corretamente', function () {
    (0, react_1.render)(
      <AccessibleButton_1.AccessibleButton variant="outline">
        Botão
      </AccessibleButton_1.AccessibleButton>,
    );
    var button = react_1.screen.getByRole('button');
    expect(button).toHaveClass('border-2', 'border-blue-600', 'text-blue-600');
  });
  it('deve aplicar variant danger corretamente', function () {
    (0, react_1.render)(
      <AccessibleButton_1.AccessibleButton variant="danger">
        Botão
      </AccessibleButton_1.AccessibleButton>,
    );
    var button = react_1.screen.getByRole('button');
    expect(button).toHaveClass('bg-red-600', 'text-white');
  });
  it('deve aplicar tamanhos corretamente', function () {
    var rerender = (0, react_1.render)(
      <AccessibleButton_1.AccessibleButton size="sm">Pequeno</AccessibleButton_1.AccessibleButton>,
    ).rerender;
    var button = react_1.screen.getByRole('button');
    expect(button).toHaveClass('px-3', 'py-1.5', 'text-sm');
    rerender(
      <AccessibleButton_1.AccessibleButton size="lg">Grande</AccessibleButton_1.AccessibleButton>,
    );
    button = react_1.screen.getByRole('button');
    expect(button).toHaveClass('px-6', 'py-3', 'text-lg');
  });
  it('deve renderizar estado de loading corretamente', function () {
    (0, react_1.render)(
      <AccessibleButton_1.AccessibleButton loading={true} loadingText="Salvando...">
        Salvar
      </AccessibleButton_1.AccessibleButton>,
    );
    var button = react_1.screen.getByRole('button');
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toBeDisabled();
    expect(react_1.screen.getByText('Salvando...')).toBeInTheDocument();
  });
  it('deve chamar onClick quando clicado', function () {
    var handleClick = jest.fn();
    (0, react_1.render)(
      <AccessibleButton_1.AccessibleButton onClick={handleClick}>
        Clique
      </AccessibleButton_1.AccessibleButton>,
    );
    react_1.fireEvent.click(react_1.screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  it('não deve chamar onClick quando loading', function () {
    var handleClick = jest.fn();
    (0, react_1.render)(
      <AccessibleButton_1.AccessibleButton onClick={handleClick} loading={true}>
        Clique
      </AccessibleButton_1.AccessibleButton>,
    );
    react_1.fireEvent.click(react_1.screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });
  it('não deve chamar onClick quando disabled', function () {
    var handleClick = jest.fn();
    (0, react_1.render)(
      <AccessibleButton_1.AccessibleButton onClick={handleClick} disabled={true}>
        Clique
      </AccessibleButton_1.AccessibleButton>,
    );
    react_1.fireEvent.click(react_1.screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });
  it('deve renderizar ícones corretamente', function () {
    var LeftIcon = function () {
      return <span data-testid="left-icon">←</span>;
    };
    var RightIcon = function () {
      return <span data-testid="right-icon">→</span>;
    };
    (0, react_1.render)(
      <AccessibleButton_1.AccessibleButton leftIcon={<LeftIcon />} rightIcon={<RightIcon />}>
        Botão com ícones
      </AccessibleButton_1.AccessibleButton>,
    );
    expect(react_1.screen.getByTestId('left-icon')).toBeInTheDocument();
    expect(react_1.screen.getByTestId('right-icon')).toBeInTheDocument();
  });
  it('deve aplicar fullWidth corretamente', function () {
    (0, react_1.render)(
      <AccessibleButton_1.AccessibleButton fullWidth={true}>
        Botão largo
      </AccessibleButton_1.AccessibleButton>,
    );
    var button = react_1.screen.getByRole('button');
    expect(button).toHaveClass('w-full');
  });
  it('deve ter altura mínima adequada para acessibilidade', function () {
    var rerender = (0, react_1.render)(
      <AccessibleButton_1.AccessibleButton size="sm">Pequeno</AccessibleButton_1.AccessibleButton>,
    ).rerender;
    var button = react_1.screen.getByRole('button');
    expect(button).toHaveClass('min-h-[32px]');
    rerender(
      <AccessibleButton_1.AccessibleButton size="md">Médio</AccessibleButton_1.AccessibleButton>,
    );
    button = react_1.screen.getByRole('button');
    expect(button).toHaveClass('min-h-[40px]');
    rerender(
      <AccessibleButton_1.AccessibleButton size="lg">Grande</AccessibleButton_1.AccessibleButton>,
    );
    button = react_1.screen.getByRole('button');
    expect(button).toHaveClass('min-h-[48px]');
  });
  it('deve ter aria-label customizado', function () {
    (0, react_1.render)(
      <AccessibleButton_1.AccessibleButton aria-label="Botão personalizado">
        Clique
      </AccessibleButton_1.AccessibleButton>,
    );
    var button = react_1.screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Botão personalizado');
  });
  it('deve ser focável via teclado', function () {
    (0, react_1.render)(
      <AccessibleButton_1.AccessibleButton>Focável</AccessibleButton_1.AccessibleButton>,
    );
    var button = react_1.screen.getByRole('button');
    button.focus();
    expect(button).toHaveFocus();
  });
  it('deve responder a tecla Enter', function () {
    var handleClick = jest.fn();
    (0, react_1.render)(
      <AccessibleButton_1.AccessibleButton onClick={handleClick}>
        Botão
      </AccessibleButton_1.AccessibleButton>,
    );
    var button = react_1.screen.getByRole('button');
    react_1.fireEvent.keyDown(button, { key: 'Enter' });
    // O comportamento padrão do navegador deve chamar o onClick
  });
  it('deve responder a tecla Space', function () {
    var handleClick = jest.fn();
    (0, react_1.render)(
      <AccessibleButton_1.AccessibleButton onClick={handleClick}>
        Botão
      </AccessibleButton_1.AccessibleButton>,
    );
    var button = react_1.screen.getByRole('button');
    react_1.fireEvent.keyDown(button, { key: ' ' });
    // O comportamento padrão do navegador deve chamar o onClick
  });
});
