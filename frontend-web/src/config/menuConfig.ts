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
  Clock,
  CheckCircle
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
        title: 'SLA Dashboard',
        icon: Clock,
        href: '/nuclei/atendimento/sla/dashboard',
        color: 'purple'
      },
      {
        id: 'atendimento-distribuicao',
        title: 'Distribuição Dashboard',
        icon: Shuffle,
        href: '/nuclei/atendimento/distribuicao/dashboard',
        color: 'purple'
      },
      {
        id: 'atendimento-fechamento-automatico',
        title: 'Fechamento Automático',
        icon: Clock,
        href: '/atendimento/fechamento-automatico',
        color: 'purple'
      },
      {
        id: 'atendimento-dashboard-analytics',
        title: 'Dashboard Analytics',
        icon: BarChart3,
        href: '/atendimento/dashboard-analytics',
        color: 'purple'
      },
      {
        id: 'atendimento-configuracoes',
        title: 'Configurações',
        icon: Settings,
        href: '/atendimento/configuracoes',
        color: 'purple',
        children: [
          {
            id: 'atendimento-configuracoes-geral',
            title: 'Geral',
            icon: Settings,
            href: '/atendimento/configuracoes',
            color: 'purple'
          },
          {
            id: 'atendimento-configuracoes-sla',
            title: 'SLA',
            icon: Clock,
            href: '/nuclei/atendimento/sla/configuracoes',
            color: 'purple'
          },
          {
            id: 'atendimento-configuracoes-distribuicao',
            title: 'Distribuição',
            icon: Shuffle,
            href: '/nuclei/atendimento/distribuicao/configuracao',
            color: 'purple'
          },
          {
            id: 'atendimento-configuracoes-skills',
            title: 'Skills',
            icon: Target,
            href: '/nuclei/atendimento/distribuicao/skills',
            color: 'purple'
          }
        ]
      }
    ]
  },
  {
    id: 'comercial',
    title: 'Comercial',
    icon: TrendingUp,
    href: '/nuclei/comercial',
    color: 'blue',
    requiredModule: 'CRM', // ⚡ Requer licença CRM (base para comercial)
    section: 'Operações',
    children: [
      {
        id: 'comercial-clientes',
        title: 'Clientes',
        icon: Users,
        href: '/clientes',
        color: 'blue'
      },
      {
        id: 'comercial-contatos',
        title: 'Contatos',
        icon: Phone,
        href: '/contatos',
        color: 'blue'
      },
      {
        id: 'comercial-leads',
        title: 'Leads',
        icon: Target,
        href: '/leads',
        color: 'blue'
      },
      {
        id: 'comercial-pipeline',
        title: 'Pipeline de Vendas',
        icon: TrendingUp,
        href: '/pipeline',
        color: 'blue',
        badge: 'Completo'
      },
      {
        id: 'comercial-propostas',
        title: 'Propostas',
        icon: FileText,
        href: '/propostas',
        color: 'blue',
        requiredModule: 'VENDAS'
      },
      {
        id: 'comercial-cotacoes',
        title: 'Cotações',
        icon: Calculator,
        href: '/cotacoes',
        color: 'blue',
        requiredModule: 'VENDAS'
      },
      {
        id: 'comercial-aprovacoes',
        title: 'Minhas Aprovações',
        icon: CheckCircle,
        href: '/aprovacoes/pendentes',
        color: 'blue',
        requiredModule: 'VENDAS',
        badge: 'dynamic' // Badge será atualizado dinamicamente
      },
      {
        id: 'comercial-produtos',
        title: 'Produtos',
        icon: ShoppingBag,
        href: '/produtos',
        color: 'blue',
        requiredModule: 'VENDAS'
      },
      {
        id: 'comercial-combos',
        title: 'Combos',
        icon: Archive,
        href: '/combos',
        color: 'blue',
        requiredModule: 'VENDAS'
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
        id: 'financeiro-fornecedores',
        title: 'Fornecedores',
        icon: Building2,
        href: '/financeiro/fornecedores',
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
    id: 'relatorios',
    title: 'Relatórios',
    icon: BarChart3,
    href: '/relatorios',
    color: 'blue',
    section: 'Visão Geral',
    children: [
      {
        id: 'relatorios-atendimento',
        title: 'Atendimento',
        icon: Headphones,
        href: '/relatorios/atendimento',
        color: 'purple',
        requiredModule: 'ATENDIMENTO'
      },
      {
        id: 'relatorios-crm',
        title: 'CRM',
        icon: Users,
        href: '/relatorios/crm',
        color: 'blue',
        requiredModule: 'CRM'
      },
      {
        id: 'relatorios-vendas',
        title: 'Vendas',
        icon: ShoppingBag,
        href: '/relatorios/vendas',
        color: 'green',
        requiredModule: 'VENDAS'
      },
      {
        id: 'relatorios-financeiro',
        title: 'Financeiro',
        icon: DollarSign,
        href: '/relatorios/financeiro',
        color: 'orange',
        requiredModule: 'FINANCEIRO'
      },
      {
        id: 'relatorios-analytics',
        title: 'Analytics Gerais',
        icon: PieChart,
        href: '/relatorios/analytics',
        color: 'blue',
        adminOnly: true,
        requiredModule: 'ADMINISTRACAO'
      }
    ]
  },
  {
    id: 'supervisao',
    title: 'Supervisão',
    icon: Monitor,
    href: '/supervisao',
    color: 'purple',
    adminOnly: true,
    section: 'Visão Geral',
    children: [
      {
        id: 'supervisao-atendimento',
        title: 'Atendimento',
        icon: Headphones,
        href: '/atendimento/supervisao',
        color: 'purple',
        requiredModule: 'ATENDIMENTO'
      },
      {
        id: 'supervisao-equipes',
        title: 'Equipes',
        icon: Users,
        href: '/supervisao/equipes',
        color: 'purple'
      },
      {
        id: 'supervisao-performance',
        title: 'Performance',
        icon: TrendingUp,
        href: '/supervisao/performance',
        color: 'purple'
      },
      {
        id: 'supervisao-auditoria',
        title: 'Auditoria',
        icon: Shield,
        href: '/supervisao/auditoria',
        color: 'purple'
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