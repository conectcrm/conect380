import React from 'react';
import { FileText, Package, TrendingUp, Target } from 'lucide-react';
import ModulesScreen, { NucleusModulesData } from '../../components/navigation/ModulesScreen';

const VendasNucleusPage: React.FC = () => {
  const vendasNucleusData: NucleusModulesData = {
    id: 'vendas',
    title: 'Vendas',
    description: 'Gestão completa do pipeline de vendas, propostas e produtos',
    icon: TrendingUp,
    color: 'green',
    modules: [
      {
        id: 'propostas',
        name: 'Propostas',
        description: 'Criação e acompanhamento de propostas comerciais com funil de vendas interativo.',
        href: '/propostas',
        icon: FileText,
        notifications: 2,
        badge: 'Ativo',
        badgeColor: 'blue',
        status: 'active'
      },
      {
        id: 'produtos',
        name: 'Produtos',
        description: 'Catálogo de produtos e serviços com preços dinâmicos e configurações personalizadas.',
        href: '/produtos',
        icon: Package,
        notifications: 0,
        status: 'active'
      },
      {
        id: 'oportunidades',
        name: 'Oportunidades',
        description: 'Gestão de oportunidades de negócio e acompanhamento do pipeline.',
        href: '/oportunidades',
        icon: Target,
        notifications: 0,
        badge: 'Em Breve',
        badgeColor: 'yellow',
        status: 'coming_soon'
      },
      {
        id: 'relatorios-vendas',
        name: 'Relatórios',
        description: 'Análises e relatórios detalhados de performance de vendas.',
        href: '/relatorios/vendas',
        icon: TrendingUp,
        notifications: 0,
        badge: 'Em Breve',
        badgeColor: 'yellow',
        status: 'coming_soon'
      }
    ]
  };

  return <ModulesScreen nucleusData={vendasNucleusData} />;
};

export default VendasNucleusPage;
