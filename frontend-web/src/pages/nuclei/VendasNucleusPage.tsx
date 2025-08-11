import React from 'react';
import { FileText, Package, TrendingUp, Target, PackageOpen, Calculator } from 'lucide-react';
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
        id: 'cotacoes',
        name: 'Cotações',
        description: 'Sistema completo de cotações e orçamentos com geração de PDF, envio por email e controle de status.',
        href: '/cotacoes',
        icon: Calculator,
        notifications: 0,
        badge: 'Novo',
        badgeColor: 'green',
        status: 'active'
      },
      {
        id: 'funil-vendas',
        name: 'Funil de Vendas',
        description: 'Pipeline visual de oportunidades com Kanban drag-and-drop e gestão completa do ciclo de vendas.',
        href: '/funil-vendas',
        icon: TrendingUp,
        notifications: 0,
        badge: 'Novo',
        badgeColor: 'green',
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
        id: 'combos',
        name: 'Combos',
        description: 'Criação e gestão de combos e pacotes de produtos com descontos especiais.',
        href: '/combos',
        icon: PackageOpen,
        notifications: 0,
        badge: 'Novo',
        badgeColor: 'green',
        status: 'active'
      },
      {
        id: 'oportunidades',
        name: 'Oportunidades',
        description: 'Gestão completa de oportunidades com Kanban, estatísticas e pipeline de vendas.',
        href: '/oportunidades',
        icon: Target,
        notifications: 0,
        badge: 'Ativo',
        badgeColor: 'blue',
        status: 'active'
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
