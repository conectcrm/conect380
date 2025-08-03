import React from 'react';
import { 
  TrendingUp, 
  CreditCard, 
  PiggyBank, 
  FileText, 
  BarChart3, 
  Calculator,
  Building2,
  Repeat,
  Users
} from 'lucide-react';
import ModulesScreen, { NucleusModulesData } from '../../components/navigation/ModulesScreen';

const FinanceiroNucleusPage: React.FC = () => {
  const financeiroNucleusData: NucleusModulesData = {
    id: 'financeiro',
    title: 'Financeiro',
    description: 'Controle financeiro completo com fluxo de caixa, contas e relatórios',
    icon: TrendingUp,
    color: 'orange',
    modules: [
      {
        id: 'contas-receber',
        name: 'Contas a Receber',
        description: 'Gestão de recebimentos, controle de inadimplência e relatórios de cobrança.',
        href: '/financeiro/contas-receber',
        icon: TrendingUp,
        notifications: 5,
        status: 'active'
      },
      {
        id: 'contas-pagar',
        name: 'Contas a Pagar',
        description: 'Controle de despesas, agendamento de pagamentos e análise de gastos.',
        href: '/financeiro/contas-pagar',
        icon: CreditCard,
        notifications: 2,
        status: 'active'
      },
      {
        id: 'fluxo-caixa',
        name: 'Fluxo de Caixa',
        description: 'Visão completa do fluxo financeiro com projeções e análises detalhadas.',
        href: '/financeiro/fluxo-caixa',
        icon: PiggyBank,
        notifications: 0,
        status: 'active'
      },
      {
        id: 'fornecedores',
        name: 'Fornecedores',
        description: 'Gestão completa de fornecedores e parceiros comerciais.',
        href: '/financeiro/fornecedores',
        icon: Users,
        notifications: 0,
        status: 'active'
      },
      {
        id: 'faturamento',
        name: 'Faturamento',
        description: 'Emissão de notas fiscais, controle de faturamento e integração contábil.',
        href: '/financeiro/faturamento',
        icon: FileText,
        notifications: 1,
        badge: 'Em Breve',
        badgeColor: 'yellow',
        status: 'coming_soon'
      },
      {
        id: 'relatorios-financeiros',
        name: 'Relatórios Financeiros',
        description: 'Relatórios gerenciais, DRE, balanço patrimonial e análises financeiras.',
        href: '/financeiro/relatorios',
        icon: BarChart3,
        notifications: 0,
        badge: 'Q2 2025',
        badgeColor: 'blue',
        status: 'coming_soon'
      },
      {
        id: 'conciliacao',
        name: 'Conciliação Bancária',
        description: 'Conciliação automática de extratos bancários e controle de divergências.',
        href: '/financeiro/conciliacao',
        icon: Building2,
        notifications: 0,
        badge: 'Q2 2025',
        badgeColor: 'blue',
        status: 'coming_soon'
      },
      {
        id: 'centro-custos',
        name: 'Centro de Custos',
        description: 'Organização e controle de custos por departamento, projeto ou categoria.',
        href: '/financeiro/centro-custos',
        icon: Calculator,
        notifications: 0,
        badge: 'Q1 2025',
        badgeColor: 'purple',
        status: 'coming_soon'
      },
      {
        id: 'tesouraria',
        name: 'Tesouraria',
        description: 'Gestão de caixa, movimentações bancárias e controle de liquidez.',
        href: '/financeiro/tesouraria',
        icon: Repeat,
        notifications: 0,
        badge: 'Q3 2025',
        badgeColor: 'red',
        status: 'coming_soon'
      }
    ]
  };

  return <ModulesScreen nucleusData={financeiroNucleusData} />;
};

export default FinanceiroNucleusPage;
