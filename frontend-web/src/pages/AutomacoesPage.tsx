/**
 * Página de Automações - Consolidação de Templates, Bot e Regras
 * 
 * Consolida 3 páginas em uma única com abas:
 * - Templates de Mensagens (GestaoTemplatesPage)
 * - Bot de Atendimento (futuro)
 * - Regras de Negócio (futuro)
 * 
 * @author ConectCRM
 * @date 09/12/2025
 */

import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FileText, Bot, Zap } from 'lucide-react';
import { BackToNucleus } from '../components/navigation/BackToNucleus';
import GestaoTemplatesPage from './GestaoTemplatesPage';

type TabType = 'templates' | 'bot' | 'regras';

interface Tab {
  id: TabType;
  label: string;
  icon: React.ElementType;
  description: string;
}

const tabs: Tab[] = [
  {
    id: 'templates',
    label: 'Templates',
    icon: FileText,
    description: 'Modelos de mensagens rápidas',
  },
  {
    id: 'bot',
    label: 'Bot',
    icon: Bot,
    description: 'Automação de atendimento',
  },
  {
    id: 'regras',
    label: 'Regras',
    icon: Zap,
    description: 'Regras de negócio e triggers',
  },
];

const AutomacoesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = (searchParams.get('tab') as TabType) || 'templates';
  const [activeTab, setActiveTab] = useState<TabType>(tabFromUrl);

  const handleTabChange = (tabId: TabType) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <BackToNucleus nucleusName="Atendimento" nucleusPath="/nuclei/atendimento" />
        
        <div className="mt-4">
          <h1 className="text-3xl font-bold text-[#002333] flex items-center gap-3">
            <Zap className="h-8 w-8 text-[#159A9C]" />
            Automações
          </h1>
          <p className="text-gray-600 mt-2">
            Gerencie templates, bot e regras de automação do atendimento
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex gap-1" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors
                    ${
                      isActive
                        ? 'border-[#159A9C] text-[#159A9C]'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="py-8">
        {activeTab === 'templates' && (
          <GestaoTemplatesPage />
        )}

        {activeTab === 'bot' && (
          <div className="max-w-7xl mx-auto px-6">
            <div className="bg-white rounded-lg shadow-sm border p-8">
              <div className="text-center">
                <Bot className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Bot de Atendimento
                </h3>
                <p className="text-gray-600 mb-6">
                  Configure respostas automáticas e fluxos de conversação inteligentes
                </p>
                <button className="px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors">
                  Configurar Bot
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'regras' && (
          <div className="max-w-7xl mx-auto px-6">
            <div className="bg-white rounded-lg shadow-sm border p-8">
              <div className="text-center">
                <Zap className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Regras de Negócio
                </h3>
                <p className="text-gray-600 mb-6">
                  Defina triggers e ações automáticas baseadas em eventos do atendimento
                </p>
                <button className="px-4 py-2 bg-[#159A9C] text-white rounded-lg hover:bg-[#0F7B7D] transition-colors">
                  Criar Regra
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AutomacoesPage;
