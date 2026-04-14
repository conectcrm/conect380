import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { PlanSelection } from '../PlanSelection';
import { useSubscription } from '../../../hooks/useSubscription';

jest.mock('../../../hooks/useSubscription', () => ({
  useSubscription: jest.fn(),
}));

jest.mock('../../../utils/formatters', () => ({
  formatCurrency: (value: number) => `R$ ${value.toFixed(2)}`,
}));

const mockedUseSubscription = useSubscription as jest.Mock;

const planoStarter = {
  id: 'plan-starter',
  nome: 'Starter',
  codigo: 'starter',
  descricao: 'Plano starter',
  preco: 99,
  limiteUsuarios: 5,
  limiteClientes: 100,
  limiteStorage: 1024 * 1024 * 1024,
  limiteApiCalls: 1000,
  whiteLabel: false,
  suportePrioritario: false,
  ativo: true,
  modulosInclusos: [],
};

const planoBusiness = {
  ...planoStarter,
  id: 'plan-business',
  nome: 'Business',
  codigo: 'business',
  preco: 199,
};

describe('PlanSelection checkout behavior', () => {
  beforeEach(() => {
    mockedUseSubscription.mockReset();
  });

  it('permite finalizar assinatura em trial no plano atual via checkout', () => {
    const onPlanSelect = jest.fn();

    mockedUseSubscription.mockReturnValue({
      planos: [planoStarter],
      assinatura: {
        id: 'assinatura-trial',
        status: 'trial',
        plano: planoStarter,
      },
      loading: false,
      alterarPlano: jest.fn(),
      isOwnerTenant: false,
      podeAlterarPlano: true,
    });

    render(<PlanSelection onPlanSelect={onPlanSelect} />);

    const actionButton = screen.getByRole('button', { name: 'Finalizar assinatura' });
    expect(actionButton).not.toBeDisabled();

    fireEvent.click(actionButton);

    expect(onPlanSelect).toHaveBeenCalledWith(planoStarter, { requiresPayment: true });
  });

  it('mantem alteracao de plano sem checkout para assinatura ativa', async () => {
    const onPlanSelect = jest.fn();
    const alterarPlano = jest.fn().mockResolvedValue(undefined);

    mockedUseSubscription.mockReturnValue({
      planos: [planoStarter, planoBusiness],
      assinatura: {
        id: 'assinatura-active',
        status: 'active',
        plano: planoStarter,
      },
      loading: false,
      alterarPlano,
      isOwnerTenant: false,
      podeAlterarPlano: true,
    });

    render(<PlanSelection onPlanSelect={onPlanSelect} />);

    fireEvent.click(screen.getByRole('button', { name: 'Alterar para este Plano' }));

    await waitFor(() => {
      expect(alterarPlano).toHaveBeenCalledWith(planoBusiness.id);
    });

    expect(onPlanSelect).toHaveBeenCalledWith(planoBusiness, { requiresPayment: false });
  });
});
