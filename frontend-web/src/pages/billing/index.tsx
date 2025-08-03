import React, { useState } from 'react';
import { BillingDashboard } from '../../components/Billing/BillingDashboard';
import { PlanSelection } from '../../components/Billing/PlanSelection';
import { UsageMeter } from '../../components/Billing/UsageMeter';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import {
  ArrowLeft,
  Settings,
  CreditCard,
  FileText,
  HelpCircle
} from 'lucide-react';

type BillingView = 'dashboard' | 'plans' | 'usage' | 'settings';

export const BillingPage: React.FC = () => {
  const [currentView, setCurrentView] = useState<BillingView>('dashboard');

  const renderContent = () => {
    switch (currentView) {
      case 'plans':
        return (
          <PlanSelection
            onPlanSelect={(plano) => {
              console.log('Plano selecionado:', plano);
              setCurrentView('dashboard');
            }}
            onClose={() => setCurrentView('dashboard')}
          />
        );

      case 'usage':
        return (
          <UsageMeter
            showDetails={true}
            onUpgrade={() => setCurrentView('plans')}
          />
        );

      case 'settings':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Billing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="text-center py-12">
                  <Settings className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Configurações de Billing
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Esta seção permitirá gerenciar métodos de pagamento, histórico de faturas e configurações de cobrança.
                  </p>
                  <div className="space-y-4 max-w-md mx-auto">
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 text-gray-400" />
                        <span className="text-sm text-gray-600">Métodos de Pagamento</span>
                      </div>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <span className="text-sm text-gray-600">Histórico de Faturas</span>
                      </div>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Settings className="h-5 w-5 text-gray-400" />
                        <span className="text-sm text-gray-600">Configurações de Cobrança</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        {currentView !== 'dashboard' && (
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => setCurrentView('dashboard')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Dashboard
            </Button>
          </div>
        )}

        {/* Header Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setCurrentView('dashboard')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${currentView === 'dashboard'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setCurrentView('usage')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${currentView === 'usage'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Uso Detalhado
              </button>
              <button
                onClick={() => setCurrentView('plans')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${currentView === 'plans'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Planos
              </button>
              <button
                onClick={() => setCurrentView('settings')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${currentView === 'settings'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                Configurações
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {renderContent()}
        </div>

        {/* Help Section */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <HelpCircle className="h-8 w-8 text-blue-500 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Precisa de Ajuda?
                </h3>
                <p className="text-gray-600 mb-4">
                  Nossa equipe está pronta para ajudar você a escolher o melhor plano e configurar sua assinatura.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    Documentação
                  </Button>
                  <Button variant="outline" size="sm">
                    <HelpCircle className="h-4 w-4 mr-2" />
                    Falar com Suporte
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
