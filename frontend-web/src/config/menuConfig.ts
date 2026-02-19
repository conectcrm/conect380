import {
  type LucideIcon,
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
  BarChart3,
  BarChart,
  FileText,
  Shield,
  Database,
  UserCog,
  Archive,
  Phone,
  Zap,
  LineChart,
  Receipt,
  Calculator,
  Wallet,
  Mail,
  Shuffle,
  Clock,
  CheckCircle,
  Calendar,
  ClipboardList,
  Ticket,
  Layers,
  ListChecks,
  Tag,
} from 'lucide-react';
import { isMenuItemAllowedInMvp } from './mvpScope';

export interface MenuConfig {
  id: string;
  title: string;
  shortTitle?: string;
  icon: LucideIcon;
  href?: string;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  badge?: string;
  contextBadgeKey?: string;
  group?: string;
  children?: MenuConfig[];
  permissions?: string[];
  adminOnly?: boolean;
  requiredModule?: string; // Novo: modulo necessario para exibir item
  section?: string;
}

const filterMenuByModules = (items: MenuConfig[], modulosAtivos: string[]): MenuConfig[] => {
  return items.reduce<MenuConfig[]>((acc, item) => {
    if (item.requiredModule && !modulosAtivos.includes(item.requiredModule)) {
      return acc;
    }

    const filteredChildren = item.children ? filterMenuByModules(item.children, modulosAtivos) : undefined;

    if (item.children && (!filteredChildren || filteredChildren.length === 0)) {
      return acc;
    }

    if (filteredChildren) {
      acc.push({ ...item, children: filteredChildren });
      return acc;
    }

    acc.push(item);
    return acc;
  }, []);
};

const filterMenuForMvp = (items: MenuConfig[], depth = 0): MenuConfig[] => {
  return items.reduce<MenuConfig[]>((acc, item) => {
    if (!isMenuItemAllowedInMvp(item.id, depth)) {
      return acc;
    }

    const filteredChildren = item.children ? filterMenuForMvp(item.children, depth + 1) : undefined;

    if (item.children && (!filteredChildren || filteredChildren.length === 0)) {
      return acc;
    }

    if (filteredChildren) {
      acc.push({ ...item, children: filteredChildren });
      return acc;
    }

    acc.push(item);
    return acc;
  }, []);
};

export const menuConfig: MenuConfig[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: Home,
    href: '/dashboard',
    color: 'blue',
    section: 'Vis\u00e3o Geral',
  },
  {
    id: 'atendimento',
    title: 'Atendimento',
    shortTitle: 'Atend.',
    icon: MessageSquare,
    href: '/atendimento',
    color: 'purple',
    requiredModule: 'ATENDIMENTO', // Requer licenca de Atendimento
    section: 'Opera\u00e7\u00f5es',
    children: [
      {
        id: 'atendimento-inbox',
        title: 'Chat',
        icon: MessageSquare,
        href: '/atendimento/inbox',
        color: 'purple',
        contextBadgeKey: 'atendimentoUnread',
        group: 'Opera\u00e7\u00e3o',
      },
      {
        id: 'atendimento-tickets',
        title: 'Tickets',
        icon: Ticket,
        href: '/atendimento/tickets',
        color: 'purple',
        contextBadgeKey: 'slaRisk',
        group: 'Opera\u00e7\u00e3o',
      },
      {
        id: 'atendimento-automacoes',
        title: 'Automa\u00e7\u00f5es',
        icon: Zap,
        href: '/atendimento/automacoes',
        color: 'purple',
        group: 'Gest\u00e3o',
      },
      {
        id: 'atendimento-equipe',
        title: 'Equipe',
        icon: Users,
        href: '/atendimento/equipe',
        color: 'purple',
        group: 'Gest\u00e3o',
      },
      {
        id: 'atendimento-analytics',
        title: 'Analytics',
        icon: BarChart3,
        href: '/atendimento/analytics',
        color: 'purple',
        group: 'Configura\u00e7\u00e3o',
      },
      {
        id: 'atendimento-configuracoes',
        title: 'Configura\u00e7\u00f5es',
        icon: Settings,
        href: '/atendimento/configuracoes',
        color: 'purple',
        group: 'Configura\u00e7\u00e3o',
      },
    ],
  },
  {
    id: 'comercial',
    title: 'Comercial',
    icon: TrendingUp,
    href: '/nuclei/crm',
    color: 'blue',
    requiredModule: 'CRM', //  Requer licenca CRM (base para comercial)
    section: 'Opera\u00e7\u00f5es',
    children: [
      {
        id: 'comercial-clientes',
        title: 'Clientes',
        icon: Users,
        href: '/crm/clientes',
        color: 'blue',
        group: 'Relacionamento',
      },
      {
        id: 'comercial-contatos',
        title: 'Contatos',
        icon: Phone,
        href: '/crm/contatos',
        color: 'blue',
        group: 'Relacionamento',
      },
      {
        id: 'comercial-leads',
        title: 'Leads',
        icon: Target,
        href: '/crm/leads',
        color: 'blue',
        group: 'Relacionamento',
      },
      {
        id: 'comercial-interacoes',
        title: 'Intera\u00e7\u00f5es',
        icon: MessageSquare,
        href: '/crm/interacoes',
        color: 'blue',
        requiredModule: 'CRM',
        group: 'Relacionamento',
      },
      {
        id: 'comercial-agenda',
        title: 'Agenda',
        icon: Calendar,
        href: '/crm/agenda',
        color: 'blue',
        requiredModule: 'CRM',
        group: 'Relacionamento',
      },
      {
        id: 'comercial-pipeline',
        title: 'Pipeline de Vendas',
        shortTitle: 'Pipeline',
        icon: TrendingUp,
        href: '/crm/pipeline',
        color: 'blue',
        group: 'Vendas',
      },
      {
        id: 'comercial-propostas',
        title: 'Propostas',
        icon: FileText,
        href: '/vendas/propostas',
        color: 'blue',
        requiredModule: 'VENDAS',
        group: 'Vendas',
      },
      {
        id: 'comercial-analytics',
        title: 'Analytics Comercial',
        icon: BarChart3,
        href: '/relatorios/analytics',
        color: 'blue',
        requiredModule: 'CRM',
        group: 'Vendas',
      },
      {
        id: 'comercial-cotacoes',
        title: 'Cota\u00e7\u00f5es',
        icon: Calculator,
        href: '/vendas/cotacoes',
        color: 'blue',
        requiredModule: 'VENDAS',
        group: 'Vendas',
      },
      {
        id: 'comercial-aprovacoes',
        title: 'Minhas Aprova\u00e7\u00f5es',
        shortTitle: 'Aprova\u00e7\u00f5es',
        icon: CheckCircle,
        href: '/vendas/aprovacoes',
        color: 'blue',
        requiredModule: 'VENDAS',
        group: 'Vendas',
      },
      {
        id: 'comercial-produtos',
        title: 'Produtos',
        icon: ShoppingBag,
        href: '/vendas/produtos',
        color: 'blue',
        requiredModule: 'VENDAS',
        group: 'Cat\u00e1logo',
      },
      {
        id: 'comercial-combos',
        title: 'Combos',
        icon: Archive,
        href: '/vendas/combos',
        color: 'blue',
        requiredModule: 'VENDAS',
        group: 'Cat\u00e1logo',
      },
    ],
  },
  {
    id: 'financeiro',
    title: 'Financeiro',
    shortTitle: 'Fin.',
    icon: DollarSign,
    href: '/nuclei/financeiro',
    color: 'orange',
    requiredModule: 'FINANCEIRO', //  Requer licenca de Financeiro
    section: 'Opera\u00e7\u00f5es',
    children: [
      {
        id: 'financeiro-faturamento',
        title: 'Faturamento',
        icon: Receipt,
        href: '/financeiro/faturamento',
        color: 'orange',
        group: 'Fluxo Financeiro',
      },
      {
        id: 'financeiro-contas-receber',
        title: 'Contas a Receber',
        shortTitle: 'A Receber',
        icon: TrendingUp,
        href: '/financeiro/contas-receber',
        color: 'orange',
        group: 'Fluxo Financeiro',
      },
      {
        id: 'financeiro-contas-pagar',
        title: 'Contas a Pagar',
        shortTitle: 'A Pagar',
        icon: Calculator,
        href: '/financeiro/contas-pagar',
        color: 'orange',
        group: 'Fluxo Financeiro',
      },
      {
        id: 'financeiro-fluxo-caixa',
        title: 'Fluxo de Caixa',
        shortTitle: 'Caixa',
        icon: LineChart,
        href: '/financeiro/fluxo-caixa',
        color: 'orange',
        group: 'Fluxo Financeiro',
      },
      {
        id: 'financeiro-fornecedores',
        title: 'Fornecedores',
        icon: Building2,
        href: '/financeiro/fornecedores',
        color: 'orange',
        group: 'Cadastros',
      },
    ],
  },
  {
    id: 'billing',
    title: 'Cobran\u00e7as',
    shortTitle: 'Cob.',
    icon: CreditCard,
    href: '/billing',
    color: 'green',
    requiredModule: 'BILLING', //  Requer licenca de Billing
    section: 'Opera\u00e7\u00f5es',
    children: [
      {
        id: 'billing-assinaturas',
        title: 'Assinaturas',
        icon: Zap,
        href: '/billing/assinaturas',
        color: 'green',
        group: 'Gest\u00e3o',
      },
      {
        id: 'billing-planos',
        title: 'Planos',
        icon: Archive,
        href: '/billing/planos',
        color: 'green',
        group: 'Gest\u00e3o',
      },
      {
        id: 'billing-faturas',
        title: 'Faturas',
        icon: Receipt,
        href: '/billing/faturas',
        color: 'green',
        group: 'Cobran\u00e7a',
      },
      {
        id: 'billing-pagamentos',
        title: 'Pagamentos',
        icon: Wallet,
        href: '/billing/pagamentos',
        color: 'green',
        group: 'Cobran\u00e7a',
      },
    ],
  },
  {
    id: 'configuracoes',
    title: 'Configura\u00e7\u00f5es',
    shortTitle: 'Config',
    icon: Settings,
    href: '/nuclei/configuracoes',
    color: 'purple',
    section: 'Administra\u00e7\u00e3o',
    children: [
      {
        id: 'configuracoes-sistema',
        title: 'Sistema & Prefer\u00eancias',
        shortTitle: 'Sistema',
        icon: Settings,
        href: '/configuracoes/sistema',
        color: 'purple',
        group: 'Base',
      },
      {
        id: 'configuracoes-empresa',
        title: 'Empresa',
        icon: Building2,
        href: '/nuclei/configuracoes/empresa',
        color: 'purple',
        group: 'Base',
      },
      {
        id: 'configuracoes-usuarios',
        title: 'Usu\u00e1rios',
        icon: UserCog,
        href: '/nuclei/configuracoes/usuarios',
        color: 'purple',
        group: 'Base',
      },
      {
        id: 'configuracoes-metas',
        title: 'Metas Comerciais',
        shortTitle: 'Metas',
        icon: Target,
        href: '/nuclei/configuracoes/metas',
        color: 'purple',
        group: 'Comercial',
      },
      {
        id: 'configuracoes-email',
        title: 'E-mail',
        icon: Mail,
        href: '/nuclei/configuracoes/email',
        color: 'purple',
        group: 'Comercial',
      },
      {
        id: 'configuracoes-integracoes',
        title: 'Integra\u00e7\u00f5es',
        icon: Zap,
        href: '/nuclei/configuracoes/integracoes',
        color: 'purple',
        group: 'Comercial',
      },
      {
        id: 'configuracoes-backup',
        title: 'Backup & Sincroniza\u00e7\u00e3o',
        shortTitle: 'Backup',
        icon: Database,
        href: '/sistema/backup',
        color: 'purple',
        group: 'Governan\u00e7a',
      },
      {
        id: 'configuracoes-seguranca',
        title: 'Seguran\u00e7a',
        icon: Shield,
        href: '/configuracoes/seguranca',
        color: 'purple',
        group: 'Governan\u00e7a',
      },
      {
        id: 'configuracoes-tickets',
        title: 'Tickets',
        icon: Settings,
        color: 'purple',
        group: 'Atendimento',
        children: [
          {
            id: 'configuracoes-tickets-niveis',
            title: 'N\u00edveis de Atendimento',
            shortTitle: 'N\u00edveis',
            icon: Layers,
            href: '/nuclei/configuracoes/tickets/niveis',
            color: 'purple',
          },
          {
            id: 'configuracoes-tickets-status',
            title: 'Status Customizados',
            shortTitle: 'Status',
            icon: ListChecks,
            href: '/nuclei/configuracoes/tickets/status',
            color: 'purple',
          },
          {
            id: 'configuracoes-tickets-tipos',
            title: 'Tipos de Servi\u00e7o',
            shortTitle: 'Tipos',
            icon: Tag,
            href: '/nuclei/configuracoes/tickets/tipos',
            color: 'purple',
          },
        ],
      },
    ],
  },
  {
    id: 'administracao',
    title: 'Administra\u00e7\u00e3o',
    shortTitle: 'Admin',
    icon: Building2,
    href: '/nuclei/administracao',
    color: 'blue',
    adminOnly: true,
    //  SEM requiredModule - Sempre disponivel para admins
    section: 'Administra\u00e7\u00e3o',
    children: [
      {
        id: 'admin-console',
        title: 'Dashboard Executivo',
        shortTitle: 'Dashboard',
        icon: BarChart,
        href: '/admin/console',
        color: 'blue',
        group: 'Vis\u00e3o Executiva',
      },
      {
        id: 'admin-empresas',
        title: 'Gest\u00e3o de Empresas',
        shortTitle: 'Empresas',
        icon: Users,
        href: '/admin/empresas',
        color: 'blue',
        group: 'Opera\u00e7\u00e3o',
      },
      {
        id: 'admin-usuarios',
        title: 'Usu\u00e1rios do Sistema',
        shortTitle: 'Usu\u00e1rios',
        icon: Users,
        href: '/admin/usuarios',
        color: 'blue',
        group: 'Opera\u00e7\u00e3o',
      },
      {
        id: 'admin-sistema',
        title: 'Sistema',
        icon: Settings,
        href: '/admin/sistema',
        color: 'blue',
        group: 'Governan\u00e7a',
      },
    ],
  },
];

/**
 * Filtra menu com base nos modulos ativos da empresa
 * @param modulosAtivos Array de modulos que a empresa tem licenca
 * @returns Menu filtrado
 */
export const getMenuParaEmpresa = (modulosAtivos: string[]): MenuConfig[] => {
  const menuPorModulo = filterMenuByModules(menuConfig, modulosAtivos);
  return filterMenuForMvp(menuPorModulo);
};

export default menuConfig;
