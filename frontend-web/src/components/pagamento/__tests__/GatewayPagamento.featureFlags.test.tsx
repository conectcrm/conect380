import React from 'react';
import { render, screen } from '@testing-library/react';
import GatewayPagamento from '../GatewayPagamento';

describe('GatewayPagamento - feature flags', () => {
  const originalMvpMode = process.env.REACT_APP_MVP_MODE;
  const originalBoletoEnabled = process.env.REACT_APP_FINANCEIRO_BOLETO_ENABLED;

  const fatura = {
    id: 1,
    numero: '0001',
    valorTotal: 250,
  } as any;

  afterEach(() => {
    process.env.REACT_APP_MVP_MODE = originalMvpMode;
    process.env.REACT_APP_FINANCEIRO_BOLETO_ENABLED = originalBoletoEnabled;
  });

  it('oculta boleto quando a flag estiver desabilitada', () => {
    process.env.REACT_APP_MVP_MODE = 'false';
    process.env.REACT_APP_FINANCEIRO_BOLETO_ENABLED = 'false';

    render(
      <GatewayPagamento
        fatura={fatura}
        onPagamentoConcluido={jest.fn()}
        onFechar={jest.fn()}
      />,
    );

    expect(screen.queryByText('Boleto bancario')).not.toBeInTheDocument();
    expect(
      screen.getByText('Boleto desabilitado neste ambiente para foco no fluxo financeiro essencial.'),
    ).toBeInTheDocument();
  });

  it('exibe boleto quando a flag estiver habilitada', () => {
    process.env.REACT_APP_MVP_MODE = 'false';
    process.env.REACT_APP_FINANCEIRO_BOLETO_ENABLED = 'true';

    render(
      <GatewayPagamento
        fatura={fatura}
        onPagamentoConcluido={jest.fn()}
        onFechar={jest.fn()}
      />,
    );

    expect(screen.getByText('Boleto bancario')).toBeInTheDocument();
  });
});

