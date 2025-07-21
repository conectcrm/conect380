import React from 'react';
import { Settings } from 'lucide-react';
import ModulesScreen, { NucleusModulesData } from '../../components/navigation/ModulesScreen';

const SistemaNucleusPage: React.FC = () => {
  const sistemaNucleusData: NucleusModulesData = {
    id: 'sistema',
    title: 'Sistema',
    description: 'Configurações e administração do sistema',
    icon: Settings,
    color: 'purple',
    modules: [
      {
        id: 'configuracoes',
        name: 'Configurações',
        description: 'Configurações gerais do sistema, permissões e preferências.',
        href: '/configuracoes',
        icon: Settings,
        notifications: 1,
        status: 'active'
      }
    ]
  };

  return <ModulesScreen nucleusData={sistemaNucleusData} />;
};

export default SistemaNucleusPage;
