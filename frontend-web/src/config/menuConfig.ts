import {
  Home,
  Users,
  Settings,
  ShoppingBag,
  DollarSign,
  CreditCard,
  MessageSquare,
  Building2,
  TrendingUp,
  Target,
  Headphones,
  BarChart3,
  FileText,
  Shield,
  Database,
  UserCog,
  Bell,
  Archive,
  Phone,
  Monitor,
  Zap,
  Activity,
  PieChart,
  LineChart,
  Receipt,
  Calculator,
  Wallet,
  CreditCard as CreditCardIcon,
  GitBranch,
  Workflow
} from 'lucide-react';

export interface MenuConfig {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  href?: string;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  badge?: string;
  children?: MenuConfig[];
  permissions?: string[];
  adminOnly?: boolean;
  requiredModule?: string; // ⚡ Novo: módulo necessário para exibir item
}

export const menuConfig: MenuConfig[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: Home,
    href: '/dashboard',
    color: 'blue'
  },
  {
    id: 'atendimento',
    title: 'Atendimento',
    icon: MessageSquare,
    href: '/atendimento',
    color: 'purple',
    requiredModule: 'ATENDIMENTO', // ⚡ Requer licença de Atendimento
    children: [
      {
        id: 'atendimento-dashboard',
        title: 'Dashboard',
        icon: Activity,
        href: '/atendimento',
        color: 'purple'
      },
      {
        id: 'atendimento-central',
        title: 'Central de Atendimentos',
        icon: Headphones,
        href: '/atendimento/central',
        color: 'purple'
      },
      {
        id: 'atendimento-chat',
        title: 'Chat',
        icon: MessageSquare,
        href: '/atendimento/chat',
        color: 'purple'
      },
      // ❌ REMOVIDO: 'Clientes' - Owner é CRM (arquitetura modular)
      {
        id: 'atendimento-nucleos',
        title: 'Núcleos de Atendimento',
        icon: Target,
        href: '/gestao/nucleos',
        color: 'purple'
      },
      {
        id: 'atendimento-equipes',
        title: 'Equipes',
        icon: Users,
        href: '/gestao/equipes',
        color: 'purple'
      },
      {
        id: 'atendimento-atendentes',
        title: 'Atendentes',
        icon: UserCog,
        href: '/gestao/atendentes',
        color: 'purple'
      },
      {
        id: 'atendimento-atribuicoes',
        title: 'Matriz de Atribuições',
        icon: UserCog,
        href: '/gestao/atribuicoes',
        color: 'purple'
      },
      {
        id: 'atendimento-departamentos',
        title: 'Departamentos',
        icon: GitBranch,
        href: '/gestao/departamentos',
        color: 'purple'
      },
      {
        id: 'atendimento-fluxos',
        title: 'Fluxos de Triagem',
        icon: Workflow,
        href: '/gestao/fluxos',
        color: 'purple'
      },
      {
        id: 'atendimento-relatorios',
        title: 'Relatórios',
        icon: BarChart3,
        href: '/relatorios/atendimento',
        color: 'purple'
      },
      {
        id: 'atendimento-configuracoes',
        title: 'Configurações',
        icon: Settings,
        href: '/configuracoes/atendimento',
        color: 'purple'
      },
      {
        id: 'atendimento-supervisao',
        title: 'Supervisão',
        icon: Monitor,
        href: '/atendimento/supervisao',
        color: 'purple',
        adminOnly: true
      }
    ]
  },
  {
    id: 'crm',
    title: 'CRM',
    icon: Users,
    href: '/nuclei/crm',
    color: 'blue',
    requiredModule: 'CRM', // ⚡ Requer licença de CRM
    children: [
      {
        id: 'crm-dashboard',
        title: 'Dashboard CRM',
        icon: TrendingUp,
        href: '/nuclei/crm',
        color: 'blue'
      },
      {
        id: 'crm-clientes',
        title: 'Clientes',
        icon: Users,
        href: '/clientes',
        color: 'blue'
      },
      {
        id: 'crm-contatos',
        title: 'Contatos',
        icon: Phone,
        href: '/contatos',
        color: 'blue'
      },
      {
        id: 'crm-leads',
        title: 'Leads',
        icon: Target,
        href: '/leads',
        color: 'blue'
      },
      {
        id: 'crm-pipeline',
        title: 'Pipeline',
        icon: TrendingUp,
        href: '/pipeline',
        color: 'blue'
      },
      {
        id: 'crm-relatorios',
        title: 'Relatórios',
        icon: BarChart3,
        href: '/relatorios/crm',
        color: 'blue'
      }
    ]
  },
  {
    id: 'vendas',
    title: 'Vendas',
    icon: ShoppingBag,
    href: '/nuclei/vendas',
    color: 'green',
    requiredModule: 'VENDAS', // ⚡ Requer licença de Vendas
    children: [
      {
        id: 'vendas-dashboard',
        title: 'Dashboard Vendas',
        icon: TrendingUp,
        href: '/nuclei/vendas',
        color: 'green'
      },
      {
        id: 'vendas-propostas',
        title: 'Propostas',
        icon: FileText,
        href: '/propostas',
        color: 'green'
      },
      {
        id: 'vendas-funil',
        title: 'Funil de Vendas',
        icon: Target,
        href: '/funil-vendas',
        color: 'green'
      },
      {
        id: 'vendas-produtos',
        title: 'Produtos',
        icon: ShoppingBag,
        href: '/produtos',
        color: 'green'
      },
      {
        id: 'vendas-combos',
        title: 'Combos',
        icon: Archive,
        href: '/combos',
        color: 'green'
      },
      {
        id: 'vendas-metas',
        title: 'Metas',
        icon: Target,
        href: '/configuracoes/metas',
        color: 'green'
      },
      {
        id: 'vendas-relatorios',
        title: 'Relatórios',
        icon: BarChart3,
        href: '/relatorios/vendas',
        color: 'green'
      }
    ]
  },
  {
    id: 'financeiro',
    title: 'Financeiro',
    icon: DollarSign,
    href: '/nuclei/financeiro',
    color: 'orange',
    requiredModule: 'FINANCEIRO', // ⚡ Requer licença de Financeiro
    children: [
      {
        id: 'financeiro-dashboard',
        title: 'Dashboard Financeiro',
        icon: PieChart,
        href: '/nuclei/financeiro',
        color: 'orange'
      },
      {
        id: 'financeiro-faturamento',
        title: 'Faturamento',
        icon: Receipt,
        href: '/faturamento',
        color: 'orange'
      },
      {
        id: 'financeiro-contas-receber',
        title: 'Contas a Receber',
        icon: TrendingUp,
        href: '/financeiro/contas-receber',
        color: 'orange'
      },
      {
        id: 'financeiro-contas-pagar',
        title: 'Contas a Pagar',
        icon: Calculator,
        href: '/financeiro/contas-pagar',
        color: 'orange'
      },
      {
        id: 'financeiro-fluxo-caixa',
        title: 'Fluxo de Caixa',
        icon: LineChart,
        href: '/financeiro/fluxo-caixa',
        color: 'orange'
      },
      {
        id: 'financeiro-relatorios',
        title: 'Relatórios',
        icon: BarChart3,
        href: '/relatorios/financeiro',
        color: 'orange'
      }
    ]
  },
  {
    id: 'billing',
    title: 'Billing',
    icon: CreditCard,
    href: '/billing',
    color: 'green',
    requiredModule: 'BILLING', // ⚡ Requer licença de Billing
    children: [
      {
        id: 'billing-dashboard',
        title: 'Dashboard Billing',
        icon: CreditCardIcon,
        href: '/billing',
        color: 'green'
      },
      {
        id: 'billing-assinaturas',
        title: 'Assinaturas',
        icon: Zap,
        href: '/billing/assinaturas',
        color: 'green'
      },
      {
        id: 'billing-planos',
        title: 'Planos',
        icon: Archive,
        href: '/billing/planos',
        color: 'green'
      },
      {
        id: 'billing-faturas',
        title: 'Faturas',
        icon: Receipt,
        href: '/billing/faturas',
        color: 'green'
      },
      {
        id: 'billing-pagamentos',
        title: 'Pagamentos',
        icon: Wallet,
        href: '/billing/pagamentos',
        color: 'green'
      }
    ]
  },
  {
    id: 'configuracoes',
    title: 'Configurações',
    icon: Settings,
    href: '/nuclei/configuracoes',
    color: 'purple',
    children: [
      {
        id: 'configuracoes-dashboard',
        title: 'Visão Geral',
        icon: Settings,
        href: '/nuclei/configuracoes',
        color: 'purple'
      },
      {
        id: 'configuracoes-empresa',
        title: 'Empresa',
        icon: Building2,
        href: '/nuclei/configuracoes/empresas',
        color: 'purple'
      },
      {
        id: 'configuracoes-usuarios',
        title: 'Usuários',
        icon: UserCog,
        href: '/nuclei/configuracoes/usuarios',
        color: 'purple'
      },
      // ❌ REMOVIDO: 'Núcleos' - Owner é Atendimento (não é config global)
      // ❌ REMOVIDO: 'Departamentos' - Owner é Atendimento (não é config global)
      {
        id: 'configuracoes-integracoes',
        title: 'Integrações',
        icon: Zap,
        href: '/nuclei/configuracoes/integracoes',
        color: 'purple'
      },
      {
        id: 'configuracoes-chatwoot',
        title: 'Chatwoot',
        icon: MessageSquare,
        href: '/nuclei/configuracoes/chatwoot',
        color: 'purple'
      },
      {
        id: 'configuracoes-notificacoes',
        title: 'Notificações',
        icon: Bell,
        href: '/nuclei/configuracoes/notificacoes',
        color: 'purple'
      },
      {
        id: 'configuracoes-seguranca',
        title: 'Segurança',
        icon: Shield,
        href: '/configuracoes/seguranca',
        color: 'purple'
      },
      {
        id: 'configuracoes-backup',
        title: 'Backup',
        icon: Database,
        href: '/sistema/backup',
        color: 'purple'
      }
    ]
  },
  {
    id: 'administracao',
    title: 'Administração',
    icon: Building2,
    href: '/nuclei/administracao',
    color: 'blue',
    adminOnly: true,
    requiredModule: 'ADMINISTRACAO', // ⚡ Requer licença de Administração (Enterprise)
    children: [
      {
        id: 'admin-dashboard',
        title: 'Dashboard Admin',
        icon: Building2,
        href: '/nuclei/administracao',
        color: 'blue'
      },
      {
        id: 'admin-empresas',
        title: 'Gestão de Empresas',
        icon: Building2,
        href: '/admin/empresas',
        color: 'blue'
      },
      {
        id: 'admin-usuarios',
        title: 'Usuários do Sistema',
        icon: Users,
        href: '/admin/usuarios',
        color: 'blue'
      },
      {
        id: 'admin-relatorios',
        title: 'Relatórios Gerais',
        icon: BarChart3,
        href: '/relatorios/analytics',
        color: 'blue'
      },
      {
        id: 'admin-sistema',
        title: 'Sistema',
        icon: Settings,
        href: '/admin/sistema',
        color: 'blue'
      }
    ]
  }
];

/**
 * Filtra menu com base nos módulos ativos da empresa
 * @param modulosAtivos Array de módulos que a empresa tem licença
 * @returns Menu filtrado
 */
export const getMenuParaEmpresa = (modulosAtivos: string[]): MenuConfig[] => {
  return menuConfig.filter((item) => {
    // Dashboard e Configurações são sempre visíveis (Plataforma Base)
    if (!item.requiredModule) {
      return true;
    }

    // Verificar se empresa tem o módulo ativo
    return modulosAtivos.includes(item.requiredModule);
  });
};

export default menuConfig;