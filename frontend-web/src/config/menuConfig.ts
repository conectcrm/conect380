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
  Workflow,
  Mail,
  Shuffle,
  Clock
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
  section?: string;
}

export const menuConfig: MenuConfig[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: Home,
    href: '/dashboard',
    color: 'blue',
    section: 'Visão Geral'
  },
  {
    id: 'atendimento',
    title: 'Atendimento',
    icon: MessageSquare,
    href: '/atendimento',
    color: 'purple',
    requiredModule: 'ATENDIMENTO', // ⚡ Requer licença de Atendimento
    section: 'Operações',
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
      {
        id: 'atendimento-filas',
        title: 'Gestão de Filas',
        icon: Users,
        href: '/nuclei/atendimento/filas',
        color: 'purple'
      },
      {
        id: 'atendimento-templates',
        title: 'Templates de Mensagens',
        icon: FileText,
        href: '/nuclei/atendimento/templates',
        color: 'purple'
      },
      {
        id: 'atendimento-sla',
        title: 'SLA Tracking',
        icon: Clock,
        href: '/nuclei/atendimento/sla/dashboard',
        color: 'purple',
        children: [
          {
            id: 'atendimento-sla-dashboard',
            title: 'Dashboard SLA',
            icon: BarChart3,
            href: '/nuclei/atendimento/sla/dashboard',
            color: 'purple'
          },
          {
            id: 'atendimento-sla-configuracoes',
            title: 'Configurações',
            icon: Settings,
            href: '/nuclei/atendimento/sla/configuracoes',
            color: 'purple'
          }
        ]
      },
      {
        id: 'atendimento-distribuicao',
        title: 'Distribuição Automática',
        icon: Shuffle,
        href: '/nuclei/atendimento/distribuicao/dashboard',
        color: 'purple',
        children: [
          {
            id: 'atendimento-distribuicao-dashboard',
            title: 'Dashboard',
            icon: BarChart3,
            href: '/nuclei/atendimento/distribuicao/dashboard',
            color: 'purple'
          },
          {
            id: 'atendimento-distribuicao-config',
            title: 'Configurações',
            icon: Settings,
            href: '/nuclei/atendimento/distribuicao/configuracao',
            color: 'purple'
          },
          {
            id: 'atendimento-distribuicao-skills',
            title: 'Gestão de Skills',
            icon: Target,
            href: '/nuclei/atendimento/distribuicao/skills',
            color: 'purple'
          }
        ]
      },
      {
        id: 'atendimento-configuracoes',
        title: 'Configurações',
        icon: Settings,
        href: '/atendimento/configuracoes',
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
    section: 'Operações',
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
    section: 'Operações',
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
    section: 'Operações',
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
    section: 'Operações',
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
    section: 'Administração',
    children: [
      {
        id: 'configuracoes-home',
        title: 'Início',
        icon: Home,
        href: '/nuclei/configuracoes',
        color: 'purple'
      },
      {
        id: 'configuracoes-sistema',
        title: 'Sistema & Preferências',
        icon: Settings,
        href: '/configuracoes/sistema',
        color: 'purple'
      },
      {
        id: 'configuracoes-empresa',
        title: 'Empresa',
        icon: Building2,
        href: '/nuclei/configuracoes/empresa',
        color: 'purple'
      },
      {
        id: 'configuracoes-usuarios',
        title: 'Usuários',
        icon: UserCog,
        href: '/nuclei/configuracoes/usuarios',
        color: 'purple'
      },
      {
        id: 'configuracoes-metas',
        title: 'Metas Comerciais',
        icon: Target,
        href: '/configuracoes/metas',
        color: 'purple'
      },
      {
        id: 'configuracoes-email',
        title: 'E-mail',
        icon: Mail,
        href: '/configuracoes/email',
        color: 'purple'
      },
      {
        id: 'configuracoes-integracoes',
        title: 'Integrações',
        icon: Zap,
        href: '/nuclei/configuracoes/integracoes',
        color: 'purple'
      },
      {
        id: 'configuracoes-backup',
        title: 'Backup & Sincronização',
        icon: Database,
        href: '/sistema/backup',
        color: 'purple'
      },
      {
        id: 'configuracoes-seguranca',
        title: 'Segurança',
        icon: Shield,
        href: '/configuracoes/seguranca',
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
    section: 'Administração',
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