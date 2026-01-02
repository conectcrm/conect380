/**
 * Página de Equipe - Consolidação de Atendentes, Filas e Skills
 * 
 * Consolida 3 páginas em uma única com abas:
 * - Atendentes (GestaoAtendentesPage)
 * - Gestão de Filas (GestaoFilasPage)
 * - Skills e Competências (GestaoSkillsPage)
 * 
 * @author ConectCRM
 * @date 09/12/2025
 */

import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Users, ListOrdered, Award } from 'lucide-react';
import { BackToNucleus } from '../components/navigation/BackToNucleus';
import GestaoAtendentesPage from '../features/gestao/pages/GestaoAtendentesPage';
import GestaoFilasPage from '../features/atendimento/pages/GestaoFilasPage';
import GestaoSkillsPage from './GestaoSkillsPage';

type TabType = 'atendentes' | 'filas' | 'skills';

interface Tab {
  id: TabType;
  label: string;
  icon: React.ElementType;
  description: string;
}

const tabs: Tab[] = [
  {
    id: 'atendentes',
    label: 'Atendentes',
    icon: Users,
    description: 'Gerenciar equipe de atendimento',
  },
  {
    id: 'filas',
    label: 'Filas',
    icon: ListOrdered,
    description: 'Configuração de filas de atendimento',
  },
  {
    id: 'skills',
    label: 'Skills',
    icon: Award,
    description: 'Competências e habilidades',
  },
];

const EquipePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = (searchParams.get('tab') as TabType) || 'atendentes';
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
            <Users className="h-8 w-8 text-[#159A9C]" />
            Gestão de Equipe
          </h1>
          <p className="text-gray-600 mt-2">
            Gerencie atendentes, filas e competências da equipe de atendimento
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
                    ${isActive
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
        {activeTab === 'atendentes' && (
          <GestaoAtendentesPage hideBackButton={true} />
        )}

        {activeTab === 'filas' && (
          <GestaoFilasPage />
        )}

        {activeTab === 'skills' && (
          <GestaoSkillsPage />
        )}
      </div>
    </div>
  );
};

export default EquipePage;
