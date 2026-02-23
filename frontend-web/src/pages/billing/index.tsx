import React, { useState } from 'react';
import { BillingDashboard } from '../../components/Billing/BillingDashboard';
import { PlanSelection } from '../../components/Billing/PlanSelection';
import { UsageMeter } from '../../components/Billing/UsageMeter';
import { PaymentForm } from '../../components/Billing/PaymentForm';
import { ArrowLeft, CreditCard, FileText, HelpCircle, LayoutDashboard, Settings } from 'lucide-react';
import { FiltersBar, PageHeader, SectionCard } from '../../components/layout-v2';

type BillingView = 'dashboard' | 'plans' | 'usage' | 'settings' | 'payment';

export const BillingPage: React.FC = () => {
  const [currentView, setCurrentView] = useState<BillingView>('dashboard');
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  const abaAtiva = currentView === 'payment' ? 'plans' : currentView;

  const handlePlanSelect = (plano: any) => {
    setSelectedPlan(plano);
    setCurrentView('payment');
  };

  const handlePaymentSuccess = (paymentData: any) => {
    console.log('Pagamento realizado com sucesso:', paymentData);
    setSelectedPlan(null);
    setCurrentView('dashboard');
  };

  const renderContent = () => {
    switch (currentView) {
      case 'plans':
        return (
          <PlanSelection
            onPlanSelect={handlePlanSelect}
            onClose={() => setCurrentView('dashboard')}
          />
        );

      case 'payment':
        return (
          <PaymentForm
            planoSelecionado={selectedPlan}
            onPaymentSuccess={handlePaymentSuccess}
            onCancel={() => setCurrentView('plans')}
          />
        );

      case 'usage':
        return <UsageMeter showDetails={true} onUpgrade={() => setCurrentView('plans')} />;

      case 'settings':
        return (
          <SectionCard className="p-4 sm:p-5">
            <div className="space-y-6">
              <div className="py-6 text-center sm:py-10">
                <Settings className="mx-auto mb-4 h-14 w-14 text-[#B4BEC9]" />
                <h3 className="mb-2 text-lg font-semibold text-[#002333]">
                  Configurações de Billing
                </h3>
                <p className="mx-auto mb-6 max-w-2xl text-sm text-[#385A6A]">
                  Esta seção permitirá gerenciar métodos de pagamento, histórico de faturas e
                  configurações de cobrança.
                </p>
                <div className="mx-auto grid max-w-3xl grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="rounded-xl border border-[#DEEFE7] bg-white p-4 text-left">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5 text-[#159A9C]" />
                      <span className="text-sm font-medium text-[#244455]">Métodos de Pagamento</span>
                    </div>
                  </div>
                  <div className="rounded-xl border border-[#DEEFE7] bg-white p-4 text-left">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-[#159A9C]" />
                      <span className="text-sm font-medium text-[#244455]">Histórico de Faturas</span>
                    </div>
                  </div>
                  <div className="rounded-xl border border-[#DEEFE7] bg-white p-4 text-left">
                    <div className="flex items-center gap-3">
                      <Settings className="h-5 w-5 text-[#159A9C]" />
                      <span className="text-sm font-medium text-[#244455]">
                        Configurações de Cobrança
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>
        );

      default:
        return (
          <BillingDashboard
            onUpgrade={() => setCurrentView('plans')}
            onManageBilling={() => setCurrentView('settings')}
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
              <span>Billing</span>
            </span>
          }
          description="Gerencie assinatura, uso, planos e configurações de cobrança em um fluxo único."
          actions={
            currentView !== 'dashboard' ? (
              <button
                type="button"
                onClick={() => setCurrentView('dashboard')}
                className="inline-flex items-center gap-2 rounded-lg border border-[#B4BEC9] bg-white px-4 py-2 text-sm font-medium text-[#19384C] transition-colors hover:bg-[#F6FAF9]"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar ao Dashboard
              </button>
            ) : undefined
          }
        />
      </SectionCard>

      <FiltersBar className="p-4">
        <div className="flex w-full flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentView('dashboard')}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              abaAtiva === 'dashboard'
                ? 'bg-[#159A9C] text-white'
                : 'border border-[#D4E2E7] bg-white text-[#244455] hover:bg-[#F6FAF9]'
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </button>
          <button
            type="button"
            onClick={() => setCurrentView('usage')}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              abaAtiva === 'usage'
                ? 'bg-[#159A9C] text-white'
                : 'border border-[#D4E2E7] bg-white text-[#244455] hover:bg-[#F6FAF9]'
            }`}
          >
            Uso Detalhado
          </button>
          <button
            type="button"
            onClick={() => setCurrentView('plans')}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              abaAtiva === 'plans'
                ? 'bg-[#159A9C] text-white'
                : 'border border-[#D4E2E7] bg-white text-[#244455] hover:bg-[#F6FAF9]'
            }`}
          >
            Planos
          </button>
          <button
            type="button"
            onClick={() => setCurrentView('settings')}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              abaAtiva === 'settings'
                ? 'bg-[#159A9C] text-white'
                : 'border border-[#D4E2E7] bg-white text-[#244455] hover:bg-[#F6FAF9]'
            }`}
          >
            <Settings className="h-4 w-4" />
            Configurações
          </button>
        </div>
      </FiltersBar>

      <div className="space-y-4">{renderContent()}</div>

      <SectionCard className="p-4 sm:p-6">
        <div className="text-center">
          <HelpCircle className="mx-auto mb-3 h-8 w-8 text-[#159A9C]" />
          <h3 className="mb-2 text-lg font-semibold text-[#002333]">Precisa de Ajuda?</h3>
          <p className="mx-auto mb-4 max-w-2xl text-sm text-[#385A6A]">
            Nossa equipe está pronta para ajudar você a escolher o melhor plano e configurar sua
            assinatura.
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#B4BEC9] bg-white px-4 py-2 text-sm font-medium text-[#19384C] transition-colors hover:bg-[#F6FAF9]"
            >
              <FileText className="h-4 w-4" />
              Documentação
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
