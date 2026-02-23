import type { ComponentType } from 'react';
import {
  TrendingUp,
  PiggyBank,
  FileText,
  BarChart3,
  Calculator,
  Building2,
  Repeat,
  Users,
  Settings,
  Shield,
  Database,
  UserCheck,
  Calendar,
  Zap,
  Globe,
  PackageOpen,
  Target,
  MessageSquare,
  Home,
  AlertTriangle,
  ClipboardList,
} from 'lucide-react';
import menuConfig, { MenuConfig } from './menuConfig';
import { ModuleItem, NucleusModulesData } from '../components/navigation/ModulesScreen';

interface ModuleDescriptor {
  menuId?: string;
  id?: string;
  name?: string;
  description: string;
  href?: string;
  icon?: ComponentType<any>;
  notifications?: number;
  badge?: string;
  badgeColor?: ModuleItem['badgeColor'];
  status?: ModuleItem['status'];
}

interface NucleusDescriptor extends Omit<NucleusModulesData, 'modules'> {
  modules: ModuleDescriptor[];
}

const findMenuItemById = (id: string, items: MenuConfig[] = menuConfig): MenuConfig | undefined => {
  for (const item of items) {
    if (item.id === id) {
      return item;
    }

    if (item.children) {
      const foundChild = findMenuItemById(id, item.children);
      if (foundChild) {
        return foundChild;
      }
    }
  }

  return undefined;
};

const resolveModule = (descriptor: ModuleDescriptor): ModuleItem => {
  const menuItem = descriptor.menuId ? findMenuItemById(descriptor.menuId) : undefined;

  if (descriptor.menuId && !menuItem) {
    throw new Error(`Menu item "${descriptor.menuId}" não encontrado para o módulo do núcleo.`);
  }

  return {
    id: descriptor.id ?? menuItem?.id ?? descriptor.menuId ?? 'module-without-id',
    name: descriptor.name ?? menuItem?.title ?? 'Módulo',
    description: descriptor.description,
    href: descriptor.href ?? menuItem?.href ?? '#',
    icon: descriptor.icon ?? menuItem?.icon ?? Home,
    notifications: descriptor.notifications ?? 0,
    badge: descriptor.badge,
    badgeColor: descriptor.badgeColor,
    status: descriptor.status ?? 'active',
  };
};

const nucleusDescriptors: Record<string, NucleusDescriptor> = {
  principal: {
    id: 'principal',
    title: 'Principal',
    description: 'Dashboard e visão geral do sistema',
    icon: Home,
    color: 'blue',
    modules: [
      {
        menuId: 'dashboard',
        description: 'Visão geral com KPIs, gráficos e métricas principais do negócio.',
        notifications: 1,
      },
    ],
  },
  crm: {
    id: 'crm',
    title: 'CRM',
    description: 'Gestão completa de relacionamento com clientes e contatos',
    icon: Users,
    color: 'blue',
    modules: [
      {
        menuId: 'comercial-clientes',
        description:
          'Cadastro e gestão completa de clientes, histórico de interações e segmentação avançada.',
        notifications: 3,
        badge: 'Ativo',
        badgeColor: 'green',
      },
      {
        menuId: 'comercial-contatos',
        description: 'Gestão de contatos e relacionamentos dentro das empresas clientes.',
        badge: 'Ativo',
        badgeColor: 'green',
      },
      {
        menuId: 'comercial-leads',
        description: 'Captura, qualificação e conversão de leads em oportunidades de negócio.',
        badge: 'Novo',
        badgeColor: 'blue',
      },
      {
        menuId: 'comercial-pipeline',
        name: 'Pipeline de Vendas',
        description: 'Visualização Kanban do funil de oportunidades com drag-and-drop entre etapas.',
        badge: 'Novo',
        badgeColor: 'blue',
      },
      {
        id: 'interacoes',
        name: 'Interações',
        description: 'Histórico completo de interações, chamadas, e-mails e reuniões.',
        href: '/interacoes',
        icon: MessageSquare,
        status: 'coming_soon',
        badge: 'Em Breve',
        badgeColor: 'yellow',
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
      },
    ],
  },
  vendas: {
    id: 'vendas',
    title: 'Vendas',
    description: 'Gestão completa do pipeline de vendas, propostas e produtos',
    icon: TrendingUp,
    color: 'green',
    modules: [
      {
        menuId: 'comercial-propostas',
        description:
          'Criação e acompanhamento de propostas comerciais com funil de vendas interativo.',
        notifications: 2,
        badge: 'Ativo',
        badgeColor: 'blue',
      },
      {
        menuId: 'comercial-cotacoes',
        description:
          'Sistema completo de cotações com geração de PDF, envio por e-mail e controle de status.',
        badge: 'Novo',
        badgeColor: 'green',
      },
      {
        menuId: 'comercial-pipeline',
        id: 'funil-vendas',
        name: 'Funil de Vendas',
        description:
          'Pipeline visual de oportunidades com Kanban drag-and-drop e gestão completa do ciclo.',
        href: '/funil-vendas',
        badge: 'Novo',
        badgeColor: 'green',
      },
      {
        menuId: 'comercial-produtos',
        description:
          'Catálogo de produtos e serviços com preços dinâmicos e configurações personalizadas.',
      },
      {
        menuId: 'comercial-combos',
        description: 'Criação e gestão de combos e pacotes de produtos com descontos especiais.',
        icon: PackageOpen,
        badge: 'Novo',
        badgeColor: 'green',
      },
      {
        menuId: 'comercial-leads',
        id: 'oportunidades',
        name: 'Oportunidades',
        description: 'Gestão completa de oportunidades com estatísticas e pipeline consolidado.',
        href: '/oportunidades',
        icon: Target,
        badge: 'Ativo',
        badgeColor: 'blue',
      },
      {
        id: 'relatorios-vendas',
        name: 'Relatórios',
        description: 'Análises e relatórios detalhados de performance de vendas.',
        href: '/relatorios/vendas',
        icon: TrendingUp,
        status: 'coming_soon',
        badge: 'Em Breve',
        badgeColor: 'yellow',
      },
    ],
  },
  financeiro: {
    id: 'financeiro',
    title: 'Financeiro',
    description: 'Controle financeiro completo com fluxo de caixa, contas e relatórios',
    icon: TrendingUp,
    color: 'orange',
    modules: [
      {
        menuId: 'financeiro-contas-receber',
        description: 'Gestão de recebimentos, controle de inadimplência e relatórios de cobrança.',
        notifications: 5,
      },
      {
        menuId: 'financeiro-contas-pagar',
        description: 'Controle de despesas, agendamento de pagamentos e análise de gastos.',
        notifications: 2,
      },
      {
        menuId: 'financeiro-fluxo-caixa',
        description: 'Visão completa do fluxo financeiro com projeções e análises detalhadas.',
        icon: PiggyBank,
      },
      {
        menuId: 'financeiro-fornecedores',
        description: 'Gestão completa de fornecedores e parceiros comerciais.',
        icon: Users,
      },
      {
        menuId: 'financeiro-faturamento',
        description: 'Gestão completa de faturas, cobranças e recebimentos.',
        icon: FileText,
        notifications: 3,
      },
      {
        id: 'relatorios-financeiros',
        name: 'Relatórios Financeiros',
        description: 'Relatórios gerenciais, DRE, balanço patrimonial e análises financeiras.',
        href: '/financeiro/relatorios',
        icon: BarChart3,
        badge: 'Q2 2025',
        badgeColor: 'blue',
        status: 'coming_soon',
      },
      {
        id: 'conciliacao',
        name: 'Conciliação Bancária',
        description: 'Conciliação automática de extratos bancários e controle de divergências.',
        href: '/financeiro/conciliacao',
        icon: Building2,
        badge: 'Q2 2025',
        badgeColor: 'blue',
        status: 'coming_soon',
      },
      {
        id: 'centro-custos',
        name: 'Centro de Custos',
        description: 'Organização e controle de custos por departamento, projeto ou categoria.',
        href: '/financeiro/centro-custos',
        icon: Calculator,
        badge: 'Q1 2025',
        badgeColor: 'purple',
        status: 'coming_soon',
      },
      {
        id: 'tesouraria',
        name: 'Tesouraria',
        description: 'Gestão de caixa, movimentações bancárias e controle de liquidez.',
        href: '/financeiro/tesouraria',
        icon: Repeat,
        badge: 'Q3 2025',
        badgeColor: 'red',
        status: 'coming_soon',
      },
    ],
  },
  configuracoes: {
    id: 'configuracoes',
    title: 'Configurações',
    description: 'Central de configurações do sistema, integrações e preferências',
    icon: Settings,
    color: 'purple',
    modules: [
      {
        menuId: 'configuracoes-empresa',
        description: 'Dados cadastrais, CNPJ, endereço e informações fiscais.',
      },
      {
        menuId: 'configuracoes-usuarios',
        description: 'Gestão de usuários, permissões e controle de acesso.',
      },
      {
        menuId: 'configuracoes-metas',
        description: 'Definição de metas de vendas por período, vendedor e região.',
        badge: 'Essencial',
        badgeColor: 'green',
      },
      {
        menuId: 'configuracoes-integracoes',
        description: 'APIs externas, webhooks e conectores com outros sistemas.',
        badge: 'Novo',
        badgeColor: 'green',
      },
      {
        menuId: 'configuracoes-backup',
        description: 'Gestão de backups automáticos e sincronização entre empresas.',
      },
    ],
  },
  administracao: {
    id: 'administracao',
    title: 'Administração',
    description: 'Gestão empresarial e controle administrativo avançado',
    icon: Building2,
    color: 'blue',
    modules: [
      {
        menuId: 'admin-empresas',
        description: 'Administração de empresas, contratos e planos do sistema.',
        notifications: 3,
        badge: 'Crítico',
        badgeColor: 'red',
      },
      {
        menuId: 'admin-usuarios',
        name: 'Usuários & Permissões',
        description: 'Controle de acesso, perfis de usuário e permissões granulares.',
        href: '/gestao/usuarios',
        icon: UserCheck,
        notifications: 1,
      },
      {
        id: 'relatorios-avancados',
        name: 'Relatórios Avançados',
        description: 'Analytics empresarial, dashboards executivos e KPIs estratégicos.',
        href: '/admin/relatorios',
        icon: BarChart3,
        badge: 'Premium',
        badgeColor: 'purple',
      },
      {
        id: 'auditoria-logs',
        name: 'Auditoria & Logs',
        description: 'Rastreamento de ações, logs de sistema e conformidade.',
        href: '/admin/auditoria',
        icon: FileText,
      },
      {
        id: 'monitoramento-sistema',
        name: 'Monitoramento',
        description: 'Status do sistema, performance e alertas de infraestrutura.',
        href: '/admin/monitoramento',
        icon: AlertTriangle,
        notifications: 2,
        badge: 'Ativo',
        badgeColor: 'yellow',
      },
      {
        id: 'dados-analytics',
        name: 'Dados & Analytics',
        description: 'Análise de dados, métricas de uso e inteligência de negócios.',
        href: '/admin/analytics',
        icon: Database,
        badge: 'Beta',
        badgeColor: 'yellow',
        status: 'beta',
      },
      {
        id: 'politicas-conformidade',
        name: 'Políticas & Conformidade',
        description: 'Gestão de políticas internas, LGPD e compliance regulatório.',
        href: '/admin/conformidade',
        icon: ClipboardList,
      },
      {
        id: 'controle-acesso',
        name: 'Controle de Acesso',
        description: 'Configuração de roles, permissões e políticas de segurança avançadas.',
        href: '/admin/acesso',
        icon: Shield,
        badge: 'Seguro',
        badgeColor: 'green',
      },
    ],
  },
  gestao: {
    id: 'gestao',
    title: 'Gestão',
    description: 'Administração empresarial e controle operacional',
    icon: Building2,
    color: 'blue',
    modules: [
      {
        id: 'gestao-empresas',
        name: 'Gestão de Empresas',
        description: 'Gerenciamento completo de empresas, contratos e planos no sistema.',
        href: '/gestao/empresas',
        icon: Building2,
        notifications: 3,
        badge: 'Novo',
        badgeColor: 'green',
      },
      {
        id: 'gestao-usuarios',
        name: 'Gestão de Usuários',
        description: 'Administração de usuários, permissões e perfis de acesso.',
        href: '/gestao/usuarios',
        icon: Users,
        notifications: 1,
        status: 'beta',
      },
      {
        id: 'controle-acesso',
        name: 'Controle de Acesso',
        description: 'Configuração de roles, permissões e políticas de segurança.',
        href: '/gestao/acesso',
        icon: Shield,
        status: 'beta',
      },
      {
        id: 'portal-cliente',
        name: 'Portal do Cliente',
        description: 'Gestão e configuração do portal de acesso dos clientes às propostas.',
        href: '/portal',
        icon: Globe,
        badge: 'Ativo',
        badgeColor: 'green',
      },
      {
        id: 'auditoria',
        name: 'Auditoria e Logs',
        description: 'Monitoramento de atividades, logs de sistema e trilhas de auditoria.',
        href: '/gestao/auditoria',
        icon: FileText,
        status: 'coming_soon',
      },
      {
        id: 'metricas-operacionais',
        name: 'Métricas Operacionais',
        description: 'Dashboard executivo com KPIs e indicadores de performance.',
        href: '/gestao/metricas',
        icon: BarChart3,
        status: 'coming_soon',
      },
      {
        id: 'backup-restore',
        name: 'Backup e Restore',
        description: 'Gestão de backups automáticos e restauração de dados.',
        href: '/gestao/backup',
        icon: Database,
        status: 'coming_soon',
      },
      {
        id: 'compliance',
        name: 'Compliance',
        description: 'Conformidade com LGPD, ISO e outras regulamentações.',
        href: '/gestao/compliance',
        icon: UserCheck,
        badge: 'LGPD',
        badgeColor: 'purple',
        status: 'coming_soon',
      },
      {
        id: 'manutencao',
        name: 'Manutenção',
        description: 'Agendamento de manutenções, atualizações e downtime planejado.',
        href: '/gestao/manutencao',
        icon: Calendar,
        status: 'coming_soon',
      },
      {
        id: 'automacao',
        name: 'Automação',
        description: 'Configuração de workflows automáticos e regras de negócio.',
        href: '/gestao/automacao',
        icon: Zap,
        status: 'coming_soon',
      },
    ],
  },
  sistema: {
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
        href: '/configuracoes/empresa',
        icon: Settings,
        notifications: 1,
      },
    ],
  },
};

export const getNucleusModulesData = (nucleusId: string): NucleusModulesData => {
  const descriptor = nucleusDescriptors[nucleusId];

  if (!descriptor) {
    throw new Error(`Núcleo "${nucleusId}" não configurado.`);
  }

  return {
    ...descriptor,
    modules: descriptor.modules.map(resolveModule),
  };
};

export default nucleusDescriptors;
