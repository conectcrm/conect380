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
} from 'lucide-react';

export interface MenuConfig {
  id: string;
  title: string;
  icon: LucideIcon;
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
    section: 'Visão Geral',
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
        id: 'atendimento-inbox',
        title: 'Chat',
        icon: MessageSquare,
        href: '/atendimento/inbox',
        color: 'purple',
      },
      {
        id: 'atendimento-automacoes',
        title: 'Automações',
        icon: Zap,
        href: '/atendimento/automacoes',
        color: 'purple',
      },
      {
        id: 'atendimento-equipe',
        title: 'Equipe',
        icon: Users,
        href: '/atendimento/equipe',
        color: 'purple',
      },
      {
        // Sprint 2: Demandas agora usam modelo unificado Ticket (tipo='suporte')
        id: 'atendimento-demandas',
        title: 'Demandas',
        icon: ClipboardList,
        href: '/nuclei/atendimento/demandas',
        color: 'purple',
      },
      {
        id: 'atendimento-analytics',
        title: 'Analytics',
        icon: BarChart3,
        href: '/atendimento/analytics',
        color: 'purple',
      },
      {
        id: 'atendimento-configuracoes',
        title: 'Configurações',
        icon: Settings,
        href: '/atendimento/configuracoes',
        color: 'purple',
      },
    ],
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
        color: 'blue',
      },
      {
        id: 'comercial-contatos',
        title: 'Contatos',
        icon: Phone,
        href: '/contatos',
        color: 'blue',
      },
      {
        id: 'comercial-leads',
        title: 'Leads',
        icon: Target,
        href: '/leads',
        color: 'blue',
      },
      {
        id: 'comercial-interacoes',
        title: 'Interações',
        icon: MessageSquare,
        href: '/interacoes',
        color: 'blue',
        requiredModule: 'CRM',
      },
      {
        id: 'comercial-agenda',
        title: 'Agenda',
        icon: Calendar,
        href: '/agenda',
        color: 'blue',
        requiredModule: 'CRM',
      },
      {
        id: 'comercial-pipeline',
        title: 'Pipeline de Vendas',
        icon: TrendingUp,
        href: '/pipeline',
        color: 'blue',
        badge: 'Completo',
      },
      {
        id: 'comercial-propostas',
        title: 'Propostas',
        icon: FileText,
        href: '/propostas',
        color: 'blue',
        requiredModule: 'VENDAS',
      },
      {
        id: 'comercial-cotacoes',
        title: 'Cotações',
        icon: Calculator,
        href: '/cotacoes',
        color: 'blue',
        requiredModule: 'VENDAS',
      },
      {
        id: 'comercial-aprovacoes',
        title: 'Minhas Aprovações',
        icon: CheckCircle,
        href: '/aprovacoes/pendentes',
        color: 'blue',
        requiredModule: 'VENDAS',
        badge: 'dynamic', // Badge será atualizado dinamicamente
      },
      {
        id: 'comercial-produtos',
        title: 'Produtos',
        icon: ShoppingBag,
        href: '/produtos',
        color: 'blue',
        requiredModule: 'VENDAS',
      },
      {
        id: 'comercial-combos',
        title: 'Combos',
        icon: Archive,
        href: '/combos',
        color: 'blue',
        requiredModule: 'VENDAS',
      },
    ],
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
        color: 'orange',
      },
      {
        id: 'financeiro-contas-receber',
        title: 'Contas a Receber',
        icon: TrendingUp,
        href: '/financeiro/contas-receber',
        color: 'orange',
      },
      {
        id: 'financeiro-contas-pagar',
        title: 'Contas a Pagar',
        icon: Calculator,
        href: '/financeiro/contas-pagar',
        color: 'orange',
      },
      {
        id: 'financeiro-fluxo-caixa',
        title: 'Fluxo de Caixa',
        icon: LineChart,
        href: '/financeiro/fluxo-caixa',
        color: 'orange',
      },
      {
        id: 'financeiro-fornecedores',
        title: 'Fornecedores',
        icon: Building2,
        href: '/financeiro/fornecedores',
        color: 'orange',
      },
    ],
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
        color: 'green',
      },
      {
        id: 'billing-planos',
        title: 'Planos',
        icon: Archive,
        href: '/billing/planos',
        color: 'green',
      },
      {
        id: 'billing-faturas',
        title: 'Faturas',
        icon: Receipt,
        href: '/billing/faturas',
        color: 'green',
      },
      {
        id: 'billing-pagamentos',
        title: 'Pagamentos',
        icon: Wallet,
        href: '/billing/pagamentos',
        color: 'green',
      },
    ],
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
        color: 'purple',
      },
      {
        id: 'configuracoes-empresa',
        title: 'Empresa',
        icon: Building2,
        href: '/nuclei/configuracoes/empresa',
        color: 'purple',
      },
      {
        id: 'configuracoes-usuarios',
        title: 'Usuários',
        icon: UserCog,
        href: '/nuclei/configuracoes/usuarios',
        color: 'purple',
      },
      {
        id: 'configuracoes-metas',
        title: 'Metas Comerciais',
        icon: Target,
        href: '/nuclei/configuracoes/metas',
        color: 'purple',
      },
      {
        id: 'configuracoes-email',
        title: 'E-mail',
        icon: Mail,
        href: '/nuclei/configuracoes/email',
        color: 'purple',
      },
      {
        id: 'configuracoes-integracoes',
        title: 'Integrações',
        icon: Zap,
        href: '/nuclei/configuracoes/integracoes',
        color: 'purple',
      },
      {
        id: 'configuracoes-backup',
        title: 'Backup & Sincronização',
        icon: Database,
        href: '/sistema/backup',
        color: 'purple',
      },
      {
        id: 'configuracoes-seguranca',
        title: 'Segurança',
        icon: Shield,
        href: '/configuracoes/seguranca',
        color: 'purple',
      },
    ],
  },
  {
    id: 'administracao',
    title: 'Administrativo',
    icon: Building2,
    href: '/nuclei/administracao',
    color: 'blue',
    adminOnly: true,
    // ✅ SEM requiredModule - Sempre disponível para admins
    section: 'Administração',
    children: [
      {
        id: 'admin-console',
        title: 'Dashboard Executivo',
        icon: BarChart,
        href: '/admin/console',
        color: 'blue',
      },
      {
        id: 'admin-empresas',
        title: 'Gestão de Empresas',
        icon: Users,
        href: '/admin/empresas',
        color: 'blue',
      },
      {
        id: 'admin-usuarios',
        title: 'Usuários do Sistema',
        icon: Users,
        href: '/admin/usuarios',
        color: 'blue',
      },
      {
        id: 'admin-sistema',
        title: 'Sistema',
        icon: Settings,
        href: '/admin/sistema',
        color: 'blue',
      },
    ],
  },
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
