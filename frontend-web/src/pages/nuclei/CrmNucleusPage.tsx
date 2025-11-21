import React from 'react';
import { Users, MessageSquare, UserCheck, Calendar, Target, UserPlus } from 'lucide-react';
import ModulesScreen, { NucleusModulesData } from '../../components/navigation/ModulesScreen';

const CrmNucleusPage: React.FC = () => {
  const crmNucleusData: NucleusModulesData = {
    id: 'crm',
    title: 'CRM',
    description: 'Gestão completa de relacionamento com clientes e contatos',
    icon: Users,
    color: 'blue',
    modules: [
      {
        id: 'clientes',
        name: 'Clientes',
        description: 'Cadastro e gestão completa de clientes, histórico de interações e segmentação avançada.',
        href: '/clientes',
        icon: Users,
        notifications: 3,
        badge: 'Ativo',
        badgeColor: 'green',
        status: 'active'
      },
      {
        id: 'contatos',
        name: 'Contatos',
        description: 'Gestão de contatos e relacionamentos dentro das empresas clientes.',
        href: '/contatos',
        icon: UserCheck,
        notifications: 0,
        badge: 'Ativo',
        badgeColor: 'green',
        status: 'active'
      },
      {
        id: 'leads',
        name: 'Leads',
        description: 'Captura, qualificação e conversão de leads em oportunidades de negócio.',
        href: '/leads',
        icon: UserPlus,
        notifications: 0,
        badge: 'Novo',
        badgeColor: 'blue',
        status: 'active'
      },
      {
        id: 'pipeline',
        name: 'Pipeline de Vendas',
        description: 'Visualização Kanban do funil de oportunidades com drag-and-drop entre etapas.',
        href: '/pipeline',
        icon: Target,
        notifications: 0,
        badge: 'Novo',
        badgeColor: 'blue',
        status: 'active'
      },
      {
        id: 'interacoes',
        name: 'Interações',
        description: 'Histórico completo de interações, chamadas, e-mails e reuniões.',
        href: '/interacoes',
        icon: MessageSquare,
        notifications: 0,
        badge: 'Em Breve',
        badgeColor: 'yellow',
        status: 'coming_soon'
      },
      {
        id: 'agenda',
        name: 'Agenda',
        description: 'Agendamento de reuniões, follow-ups e lembretes de contato.',
        href: '/agenda',
        icon: Calendar,
        notifications: 2,
        badge: 'Ativo',
        badgeColor: 'green',
        status: 'active'
      }
    ]
  };

  return <ModulesScreen nucleusData={crmNucleusData} />;
};

export default CrmNucleusPage;
