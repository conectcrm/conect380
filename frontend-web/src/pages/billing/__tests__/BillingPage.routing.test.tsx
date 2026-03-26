import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { BillingPage } from '../index';

const samplePlan = {
  id: 'plan-1',
  nome: 'Profissional',
  codigo: 'professional',
  descricao: 'Plano profissional',
  preco: 199,
  limiteUsuarios: 10,
  limiteClientes: 1000,
  limiteStorage: 10 * 1024 * 1024 * 1024,
  limiteApiCalls: 10000,
  whiteLabel: false,
  suportePrioritario: true,
  ativo: true,
  modulosInclusos: [],
};

jest.mock('../../../hooks/useSubscription', () => ({
  useSubscription: () => ({
    planos: [samplePlan],
  }),
}));

jest.mock('../../../components/Billing/BillingDashboard', () => ({
  BillingDashboard: ({ onUpgrade, onManageBilling }: any) => (
    <div>
      <span>billing-dashboard-view</span>
      <button type="button" onClick={onUpgrade}>
        dashboard-upgrade
      </button>
      <button type="button" onClick={onManageBilling}>
        dashboard-manage
      </button>
    </div>
  ),
}));

jest.mock('../../../components/Billing/BillingHistory', () => ({
  BillingHistory: () => <span>billing-history-view</span>,
}));

jest.mock('../../../components/Billing/PlanSelection', () => ({
  PlanSelection: ({ onPlanSelect, onClose }: any) => (
    <div>
      <span>plan-selection-view</span>
      <button
        type="button"
        onClick={() => onPlanSelect?.(samplePlan, { requiresPayment: true })}
      >
        select-with-payment
      </button>
      <button
        type="button"
        onClick={() => onPlanSelect?.(samplePlan, { requiresPayment: false })}
      >
        select-no-payment
      </button>
      <button type="button" onClick={onClose}>
        close-plan-selection
      </button>
    </div>
  ),
}));

jest.mock('../../../components/Billing/UsageMeter', () => ({
  UsageMeter: ({ onUpgrade }: any) => (
    <div>
      <span>usage-meter-view</span>
      <button type="button" onClick={onUpgrade}>
        usage-upgrade
      </button>
    </div>
  ),
}));

jest.mock('../../../components/Billing/PaymentForm', () => ({
  PaymentForm: ({ planoSelecionado, onPaymentSuccess, onCancel }: any) => (
    <div>
      <span>payment-form-view</span>
      <span data-testid="selected-plan-name">{planoSelecionado?.nome || 'none'}</span>
      <button type="button" onClick={() => onPaymentSuccess?.({ ok: true })}>
        submit-payment
      </button>
      <button type="button" onClick={onCancel}>
        cancel-payment
      </button>
    </div>
  ),
}));

jest.mock('../../../components/layout-v2', () => ({
  FiltersBar: ({ children }: any) => <div>{children}</div>,
  PageHeader: ({ title, description, actions }: any) => (
    <div>
      <div>{title}</div>
      <div>{description}</div>
      <div>{actions}</div>
    </div>
  ),
  SectionCard: ({ children }: any) => <div>{children}</div>,
}));

const LocationProbe = () => {
  const location = useLocation();
  return <span data-testid="location-probe">{`${location.pathname}${location.search}`}</span>;
};

const renderBillingRoute = (initialEntry: string) => {
  return render(
    <MemoryRouter
      initialEntries={[initialEntry]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route path="/billing/assinaturas" element={<BillingPage />} />
        <Route path="/billing/planos" element={<BillingPage />} />
      </Routes>
      <LocationProbe />
    </MemoryRouter>,
  );
};

describe('BillingPage routing tabs', () => {
  it('abre aba de uso por deep-link via query tab', () => {
    renderBillingRoute('/billing/assinaturas?tab=usage');

    expect(screen.getByText('usage-meter-view')).toBeInTheDocument();
    expect(screen.getByTestId('location-probe')).toHaveTextContent('/billing/assinaturas?tab=usage');
  });

  it('abre aba de historico por deep-link via query tab', () => {
    renderBillingRoute('/billing/assinaturas?tab=history');

    expect(screen.getByText('billing-history-view')).toBeInTheDocument();
    expect(screen.getByTestId('location-probe')).toHaveTextContent(
      '/billing/assinaturas?tab=history',
    );
  });

  it('abre pagamento por deep-link com planId', () => {
    renderBillingRoute('/billing/planos?tab=payment&planId=plan-1');

    expect(screen.getByText('payment-form-view')).toBeInTheDocument();
    expect(screen.getByTestId('selected-plan-name')).toHaveTextContent('Profissional');
  });

  it('faz fallback de tab=payment sem planId para tela de planos', async () => {
    renderBillingRoute('/billing/planos?tab=payment');

    await waitFor(() => {
      expect(screen.getByText('plan-selection-view')).toBeInTheDocument();
    });

    expect(screen.getByTestId('location-probe')).toHaveTextContent('/billing/planos');
  });

  it('navega para pagamento quando selecao exige checkout', async () => {
    renderBillingRoute('/billing/planos');

    fireEvent.click(screen.getByText('select-with-payment'));

    await waitFor(() => {
      expect(screen.getByText('payment-form-view')).toBeInTheDocument();
    });

    expect(screen.getByTestId('location-probe')).toHaveTextContent('/billing/planos?tab=payment&planId=plan-1');
  });

  it('volta para resumo de assinatura quando alteracao nao exige checkout', async () => {
    renderBillingRoute('/billing/planos');

    fireEvent.click(screen.getByText('select-no-payment'));

    await waitFor(() => {
      expect(screen.getByText('billing-dashboard-view')).toBeInTheDocument();
    });

    expect(screen.getByTestId('location-probe')).toHaveTextContent('/billing/assinaturas');
  });

  it('abre fluxo de planos quando gestao de cobranca e acionada no dashboard', async () => {
    renderBillingRoute('/billing/assinaturas');

    fireEvent.click(screen.getByText('dashboard-manage'));

    await waitFor(() => {
      expect(screen.getByText('plan-selection-view')).toBeInTheDocument();
    });

    expect(screen.getByTestId('location-probe')).toHaveTextContent('/billing/planos');
  });
});
