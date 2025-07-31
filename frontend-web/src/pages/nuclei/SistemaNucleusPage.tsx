import React from 'react';
import { Settings, Building2, MessageCircle } from 'lucide-react';
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
      },
      {
        id: 'chatwoot',
        name: 'Chatwoot',
        description: 'Configurações de integração com Chatwoot para atendimento via WhatsApp.',
        href: '/configuracoes/chatwoot',
        icon: MessageCircle,
        notifications: 0,
        status: 'active'
      }
    ]
  };

  return <ModulesScreen nucleusData={sistemaNucleusData} />;
};

export default SistemaNucleusPage;
