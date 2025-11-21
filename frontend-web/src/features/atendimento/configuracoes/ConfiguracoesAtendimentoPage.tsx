import React, { useState } from 'react';
import {
  Settings,
  Target,
  Users,
  UserCog,
  Tag,
  Workflow,
  Clock
} from 'lucide-react';
import { BackToNucleus } from '../../../components/navigation/BackToNucleus';

// Tabs
import { NucleosTab } from './tabs/NucleosTab';
import { EquipesTab } from './tabs/EquipesTab';
import { AtendentesTab } from './tabs/AtendentesTab';
import { TagsTab } from './tabs/TagsTab';
import { FluxosTab } from './tabs/FluxosTab';
import { GeralTab } from './tabs/GeralTab';
import { FechamentoAutomaticoTab } from './tabs/FechamentoAutomaticoTab';

type TabId = 'nucleos' | 'equipes' | 'atendentes' | 'tags' | 'fluxos' | 'fechamento' | 'geral';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ComponentType<any>;
  description: string;
}

const tabs: Tab[] = [
  {
    id: 'nucleos',
    label: 'Núcleos',
    icon: Target,
    description: 'Gerencie os núcleos de atendimento e suas configurações'
  },
  {
    id: 'equipes',
    label: 'Equipes',
    icon: Users,
    description: 'Organize e gerencie equipes de atendimento'
  },
  {
    id: 'atendentes',
    label: 'Atendentes',
    icon: UserCog,
    description: 'Cadastre e gerencie atendentes do sistema'
  },
  {
    id: 'tags',
    label: 'Tags',
    icon: Tag,
    description: 'Categorize tickets com tags flexíveis (substitui departamentos)'
  },
  {
    id: 'fluxos',
    label: 'Fluxos',
    icon: Workflow,
    description: 'Configure fluxos de triagem e automação'
  },
  {
    id: 'fechamento',
    label: 'Fechamento Automático',
    icon: Clock,
    description: 'Configure fechamento automático por inatividade'
  },
  {
    id: 'geral',
    label: 'Geral',
    icon: Settings,
    description: 'Configurações gerais do módulo de atendimento'
  },
];

const ConfiguracoesAtendimentoPage: React.FC = () => {
  // Obter tab da URL ou usar 'nucleos' como padrão
  const urlParams = new URLSearchParams(window.location.search);
  const initialTab = (urlParams.get('tab') as TabId) || 'nucleos';

  const [activeTab, setActiveTab] = useState<TabId>(initialTab);

  const handleTabChange = (tabId: TabId) => {
    setActiveTab(tabId);
    // Atualizar URL sem reload
    const newUrl = `${window.location.pathname}?tab=${tabId}`;
    window.history.pushState({}, '', newUrl);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'nucleos':
        return <NucleosTab />;
      case 'equipes':
        return <EquipesTab />;
      case 'atendentes':
        return <AtendentesTab />;
      case 'tags':
        return <TagsTab />;
      case 'fluxos':
        return <FluxosTab />;
      case 'fechamento':
        return <FechamentoAutomaticoTab />;
      case 'geral':
        return <GeralTab />;
      default:
        return <NucleosTab />;
    }
  };

  const activeTabData = tabs.find(t => t.id === activeTab);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header com BackToNucleus */}
      <div className="bg-white border-b px-6 py-4">
        <BackToNucleus
          nucleusName="Atendimento"
          nucleusPath="/atendimento"
        />
      </div>

      {/* Container Principal */}
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header da Página */}
          <div className="bg-white rounded-lg shadow-sm border border-[#DEEFE7] p-6 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-[#002333] flex items-center">
                  <Settings className="h-8 w-8 mr-3 text-[#159A9C]" />
                  Configurações de Atendimento
                </h1>
                <p className="text-[#64748B] mt-2">
                  Gerencie todas as configurações do módulo de atendimento em um só lugar
                </p>
              </div>
            </div>
          </div>

          {/* Navegação de Abas */}
          <div className="bg-white rounded-lg shadow-sm border border-[#DEEFE7] mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px overflow-x-auto" aria-label="Tabs">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`
                        group relative min-w-0 flex-1 overflow-hidden py-4 px-4 text-center text-sm font-medium
                        hover:bg-gray-50 focus:z-10 transition-all duration-200
                        ${isActive
                          ? 'text-[#159A9C] border-b-2 border-[#159A9C]'
                          : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'
                        }
                      `}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <Icon className={`h-5 w-5 ${isActive ? 'text-[#159A9C]' : 'text-gray-400'}`} />
                        <span className="hidden sm:inline">{tab.label}</span>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Descrição da Tab Ativa */}
            {activeTabData && (
              <div className="px-6 py-3 bg-[#DEEFE7] border-b border-[#DEEFE7]">
                <p className="text-sm text-[#64748B]">
                  <span className="font-medium text-[#159A9C]">{activeTabData.label}:</span>{' '}
                  {activeTabData.description}
                </p>
              </div>
            )}
          </div>

          {/* Conteúdo da Tab Ativa */}
          <div className="transition-all duration-200">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfiguracoesAtendimentoPage;
