import React, { useCallback, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BillingDashboard } from '../../components/Billing/BillingDashboard';
import { PlanSelection } from '../../components/Billing/PlanSelection';
import { UsageMeter } from '../../components/Billing/UsageMeter';
import { PaymentForm } from '../../components/Billing/PaymentForm';
import { useSubscription, type Plano } from '../../hooks/useSubscription';
import { ArrowLeft, CreditCard, FileText, HelpCircle, LayoutDashboard } from 'lucide-react';
import { FiltersBar, PageHeader, SectionCard } from '../../components/layout-v2';

type BillingTab = 'overview' | 'plans' | 'usage' | 'payment';

type BillingPrimaryTab = Exclude<BillingTab, 'payment'>;

const resolveTabFromLocation = (pathname: string, search: string): BillingTab => {
  const params = new URLSearchParams(search);
  const queryTab = String(params.get('tab') || '').toLowerCase();

  if (queryTab === 'payment') {
    return 'payment';
  }

  if (queryTab === 'usage') {
    return 'usage';
  }

  if (queryTab === 'plans') {
    return 'plans';
  }

  if (pathname.startsWith('/billing/planos')) {
    return 'plans';
  }

  return 'overview';
};

const resolvePathForTab = (tab: BillingTab): string => {
  if (tab === 'plans' || tab === 'payment') {
    return '/billing/planos';
  }

  return '/billing/assinaturas';
};

const mapPlanoToCheckout = (plano: Plano) => {
  return {
    id: plano.id,
    nome: plano.nome,
    preco: plano.preco,
    periodo: 'Cobranca mensal',
    features: (plano.modulosInclusos || []).map((modulo) => modulo.nome),
  };
};

export const BillingPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { planos } = useSubscription();

  const activeTab = useMemo(
    () => resolveTabFromLocation(location.pathname, location.search),
    [location.pathname, location.search],
  );

  const selectedPlanId = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('planId');
  }, [location.search]);

  const selectedPlan = useMemo(() => {
    if (!selectedPlanId) {
      return null;
    }

    return planos.find((plano) => plano.id === selectedPlanId) || null;
  }, [planos, selectedPlanId]);

  const navigateToTab = useCallback(
    (tab: BillingTab, planId?: string): void => {
      const targetPath = resolvePathForTab(tab);
      const params = new URLSearchParams(location.search);
      params.delete('tab');
      params.delete('planId');

      if (tab === 'usage') {
        params.set('tab', 'usage');
      } else if (tab === 'payment') {
        params.set('tab', 'payment');
        if (planId) {
          params.set('planId', planId);
        }
      }

      const targetSearch = params.toString();
      const currentSearch = location.search.startsWith('?')
        ? location.search.slice(1)
        : location.search;

      if (location.pathname === targetPath && currentSearch === targetSearch) {
        return;
      }

      navigate({
        pathname: targetPath,
        search: targetSearch ? `?${targetSearch}` : '',
      });
    },
    [location.pathname, location.search, navigate],
  );

  useEffect(() => {
    if (activeTab === 'payment' && !selectedPlanId) {
      navigateToTab('plans');
    }
  }, [activeTab, navigateToTab, selectedPlanId]);

  const currentPrimaryTab: BillingPrimaryTab = activeTab === 'payment' ? 'plans' : activeTab;

  const handlePlanSelect = (plano: Plano, context: { requiresPayment: boolean }) => {
    if (context.requiresPayment) {
      navigateToTab('payment', plano.id);
      return;
    }

    navigateToTab('overview');
  };

  const handlePaymentSuccess = (paymentData: any) => {
    console.log('Pagamento realizado com sucesso:', paymentData);
    navigateToTab('overview');
  };

  const handleManageBilling = () => {
    navigate('/financeiro/faturamento');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'plans':
        return (
          <PlanSelection
            onPlanSelect={handlePlanSelect}
            onClose={() => navigateToTab('overview')}
          />
        );

      case 'payment':
        return (
          <PaymentForm
            planoSelecionado={selectedPlan ? mapPlanoToCheckout(selectedPlan) : undefined}
            onPaymentSuccess={handlePaymentSuccess}
            onCancel={() => navigateToTab('plans')}
          />
        );

      case 'usage':
        return <UsageMeter showDetails={true} onUpgrade={() => navigateToTab('plans')} />;

      default:
        return (
          <BillingDashboard
            onUpgrade={() => navigateToTab('plans')}
            onManageBilling={handleManageBilling}
          />
        );
    }
  };

  return (
    <div className="space-y-4 pt-1 sm:pt-2">
      <SectionCard className="p-4 sm:p-5">
        <PageHeader
          title={
            <span className="inline-flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-[#159A9C]" />
              <span>Assinatura</span>
            </span>
          }
          description="Gerencie assinatura, uso e planos em um fluxo unico para o cliente."
          actions={
            activeTab !== 'overview' ? (
              <button
                type="button"
                onClick={() => navigateToTab('overview')}
                className="inline-flex items-center gap-2 rounded-lg border border-[#B4BEC9] bg-white px-4 py-2 text-sm font-medium text-[#19384C] transition-colors hover:bg-[#F6FAF9]"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar para Assinaturas
              </button>
            ) : undefined
          }
        />
      </SectionCard>

      <FiltersBar className="p-4">
        <div className="flex w-full flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => navigateToTab('overview')}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              currentPrimaryTab === 'overview'
                ? 'bg-[#159A9C] text-white'
                : 'border border-[#D4E2E7] bg-white text-[#244455] hover:bg-[#F6FAF9]'
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            Assinatura
          </button>
          <button
            type="button"
            onClick={() => navigateToTab('usage')}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              currentPrimaryTab === 'usage'
                ? 'bg-[#159A9C] text-white'
                : 'border border-[#D4E2E7] bg-white text-[#244455] hover:bg-[#F6FAF9]'
            }`}
          >
            Uso
          </button>
          <button
            type="button"
            onClick={() => navigateToTab('plans')}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              currentPrimaryTab === 'plans'
                ? 'bg-[#159A9C] text-white'
                : 'border border-[#D4E2E7] bg-white text-[#244455] hover:bg-[#F6FAF9]'
            }`}
          >
            Planos e Upgrade
          </button>
        </div>
      </FiltersBar>

      <div className="space-y-4">{renderContent()}</div>

      <SectionCard className="p-4 sm:p-6">
        <div className="text-center">
          <HelpCircle className="mx-auto mb-3 h-8 w-8 text-[#159A9C]" />
          <h3 className="mb-2 text-lg font-semibold text-[#002333]">Precisa de Ajuda?</h3>
          <p className="mx-auto mb-4 max-w-2xl text-sm text-[#385A6A]">
            Nossa equipe esta pronta para ajudar voce a escolher o melhor plano e configurar sua
            assinatura.
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#B4BEC9] bg-white px-4 py-2 text-sm font-medium text-[#19384C] transition-colors hover:bg-[#F6FAF9]"
            >
              <FileText className="h-4 w-4" />
              Documentacao
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#B4BEC9] bg-white px-4 py-2 text-sm font-medium text-[#19384C] transition-colors hover:bg-[#F6FAF9]"
            >
              <HelpCircle className="h-4 w-4" />
              Falar com Suporte
            </button>
          </div>
        </div>
      </SectionCard>
    </div>
  );
};
