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
  ListChecks,
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
    throw new Error(`Menu item "${descriptor.menuId}" n?o encontrado para o m?dulo do n?cleo.`);
  }

  return {
    id: descriptor.id ?? menuItem?.id ?? descriptor.menuId ?? 'module-without-id',
    name: descriptor.name ?? menuItem?.title ?? 'M?dulo',
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
    description: 'Dashboard e vis?o geral do sistema',
    icon: Home,
    color: 'blue',
    modules: [
      {
        menuId: 'dashboard',
        description: 'Vis?o geral com KPIs, gr?ficos e m?tricas principais do neg?cio.',
        notifications: 1,
      },
    ],
  },
  crm: {
    id: 'crm',
    title: 'CRM',
    description: 'Gest?o completa de relacionamento com clientes e contatos',
    icon: Users,
    color: 'blue',
    modules: [
      {
        menuId: 'comercial-clientes',
        description:
          'Cadastro e gest?o completa de clientes, hist?rico de intera??es e segmenta??o avan?ada.',
        notifications: 3,
        badge: 'Ativo',
        badgeColor: 'green',
      },
      {
        menuId: 'comercial-contatos',
        description: 'Gest?o de contatos e relacionamentos dentro das empresas clientes.',
        badge: 'Ativo',
        badgeColor: 'green',
      },
      {
        menuId: 'comercial-leads',
        description: 'Captura, qualifica??o e convers?o de leads em oportunidades de neg?cio.',
        badge: 'Novo',
        badgeColor: 'blue',
      },
      {
        menuId: 'comercial-pipeline',
        name: 'Pipeline de Vendas',
        description: 'Visualiza??o Kanban do funil de oportunidades com drag-and-drop entre etapas.',
        badge: 'Novo',
        badgeColor: 'blue',
      },
      {
        id: 'interacoes',
        name: 'Intera??es',
        description: 'Hist?rico completo de intera??es, chamadas, e-mails e reuni?es.',
        href: '/interacoes',
        icon: MessageSquare,
        status: 'coming_soon',
        badge: 'Em Breve',
        badgeColor: 'yellow',
      },
      {
        id: 'agenda',
        name: 'Agenda',
        description: 'Agendamento de reuni?es, follow-ups e lembretes de contato.',
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
    description: 'Gest?o completa do pipeline de vendas, propostas e produtos',
    icon: TrendingUp,
    color: 'green',
    modules: [
      {
        menuId: 'comercial-propostas',
        description:
          'Cria??o e acompanhamento de propostas comerciais com funil de vendas interativo.',
        notifications: 2,
        badge: 'Ativo',
        badgeColor: 'blue',
      },
      {
        menuId: 'comercial-cotacoes',
        description:
          'Sistema completo de cota??es com gera??o de PDF, envio por e-mail e controle de status.',
        badge: 'Novo',
        badgeColor: 'green',
      },
      {
        menuId: 'comercial-pipeline',
        id: 'funil-vendas',
        name: 'Funil de Vendas',
        description:
          'Pipeline visual de oportunidades com Kanban drag-and-drop e gest?o completa do ciclo.',
        href: '/funil-vendas',
        badge: 'Novo',
        badgeColor: 'green',
      },
      {
        menuId: 'comercial-produtos',
        description:
          'Cat?logo de produtos e servi?os com pre?os din?micos e configura??es personalizadas.',
      },
      {
        menuId: 'comercial-combos',
        description: 'Cria??o e gest?o de combos e pacotes de produtos com descontos especiais.',
        icon: PackageOpen,
        badge: 'Novo',
        badgeColor: 'green',
      },
      {
        menuId: 'comercial-leads',
        id: 'oportunidades',
        name: 'Oportunidades',
        description: 'Gest?o completa de oportunidades com estat?sticas e pipeline consolidado.',
        href: '/oportunidades',
        icon: Target,
        badge: 'Ativo',
        badgeColor: 'blue',
      },
      {
        id: 'relatorios-vendas',
        name: 'Relat?rios',
        description: 'An?lises e relat?rios detalhados de performance de vendas.',
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
    description: 'Controle financeiro completo com fluxo de caixa, contas e relat?rios',
    icon: TrendingUp,
    color: 'orange',
    modules: [
      {
        id: 'financeiro-contas-receber',
        name: 'Contas a Receber',
        description: 'Gest?o de recebimentos, controle de inadimpl?ncia e relat?rios de cobran?a.',
        href: '/financeiro/contas-receber',
        icon: TrendingUp,
        badge: 'Em desenvolvimento',
        badgeColor: 'yellow',
        status: 'coming_soon',
      },
      {
        menuId: 'financeiro-contas-pagar',
        description: 'Controle de despesas, agendamento de pagamentos e an?lise de gastos.',
        notifications: 2,
      },
      {
        id: 'financeiro-fluxo-caixa',
        name: 'Fluxo de Caixa',
        description: 'Vis?o completa do fluxo financeiro com proje??es e an?lises detalhadas.',
        href: '/financeiro/fluxo-caixa',
        icon: PiggyBank,
        badge: 'Em desenvolvimento',
        badgeColor: 'yellow',
        status: 'coming_soon',
      },
      {
        menuId: 'financeiro-fornecedores',
        description: 'Gestão completa de fornecedores e parceiros comerciais.',
        icon: Users,
      },
      {
        menuId: 'financeiro-contas-bancarias',
        description: 'Cadastro e gestao das contas bancarias usadas no fluxo de pagamentos.',
        icon: Building2,
      },
      {
        menuId: 'financeiro-aprovacoes',
        description: 'Fila de pendencias para aprovacao financeira individual e em lote.',
        icon: ListChecks,
      },
      {
        menuId: 'financeiro-faturamento',
        description: 'Gest?o completa de faturas, cobran?as e recebimentos.',
        icon: FileText,
        notifications: 3,
      },
      {
        id: 'relatorios-financeiros',
        name: 'Relat?rios Financeiros',
        description: 'Relat?rios gerenciais, DRE, balan?o patrimonial e an?lises financeiras.',
        href: '/financeiro/relatorios',
        icon: BarChart3,
        badge: 'Q2 2025',
        badgeColor: 'blue',
        status: 'coming_soon',
      },
      {
        menuId: 'financeiro-conciliacao',
        description: 'Importacao de extratos OFX/CSV e preparacao de lancamentos para conciliacao.',
        icon: Building2,
      },
      {
        id: 'centro-custos',
        name: 'Centro de Custos',
        description: 'Organiza??o e controle de custos por departamento, projeto ou categoria.',
        href: '/financeiro/centro-custos',
        icon: Calculator,
        badge: 'Q1 2025',
        badgeColor: 'purple',
        status: 'coming_soon',
      },
      {
        id: 'tesouraria',
        name: 'Tesouraria',
        description: 'Gest?o de caixa, movimenta??es banc?rias e controle de liquidez.',
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
    title: 'Configura??es',
    description: 'Central de configura??es do sistema, integra??es e prefer?ncias',
    icon: Settings,
    color: 'purple',
    modules: [
      {
        menuId: 'configuracoes-empresa',
        description: 'Dados cadastrais, CNPJ, endere?o e informa??es fiscais.',
      },
      {
        menuId: 'configuracoes-usuarios',
        description: 'Gest?o de usu?rios, permiss?es e controle de acesso.',
      },
      {
        menuId: 'configuracoes-metas',
        description: 'Defini??o de metas de vendas por per?odo, vendedor e regi?o.',
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
        description: 'Gest?o de backups autom?ticos e sincroniza??o entre empresas.',
      },
    ],
  },
  administracao: {
    id: 'administracao',
    title: 'Administra??o',
    description: 'Gest?o empresarial e controle administrativo avan?ado',
    icon: Building2,
    color: 'blue',
    modules: [
      {
        menuId: 'admin-empresas',
        description: 'Administra??o de empresas, contratos e planos do sistema.',
        notifications: 3,
        badge: 'Cr?tico',
        badgeColor: 'red',
      },
      {
        menuId: 'admin-usuarios',
        name: 'Usu?rios & Permiss?es',
        description: 'Controle de acesso, perfis de usu?rio e permiss?es granulares.',
        href: '/gestao/usuarios',
        icon: UserCheck,
        notifications: 1,
      },
      {
        id: 'relatorios-avancados',
        name: 'Relat?rios Avan?ados',
        description: 'Analytics empresarial, dashboards executivos e KPIs estrat?gicos.',
        href: '/admin/relatorios',
        icon: BarChart3,
        badge: 'Premium',
        badgeColor: 'purple',
      },
      {
        id: 'auditoria-logs',
        name: 'Auditoria & Logs',
        description: 'Rastreamento de a??es, logs de sistema e conformidade.',
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
        description: 'An?lise de dados, m?tricas de uso e intelig?ncia de neg?cios.',
        href: '/admin/analytics',
        icon: Database,
        badge: 'Beta',
        badgeColor: 'yellow',
        status: 'beta',
      },
      {
        id: 'politicas-conformidade',
        name: 'Pol?ticas & Conformidade',
        description: 'Gest?o de pol?ticas internas, LGPD e compliance regulat?rio.',
        href: '/admin/conformidade',
        icon: ClipboardList,
      },
      {
        id: 'controle-acesso',
        name: 'Controle de Acesso',
        description: 'Configura??o de roles, permiss?es e pol?ticas de seguran?a avan?adas.',
        href: '/admin/acesso',
        icon: Shield,
        badge: 'Seguro',
        badgeColor: 'green',
      },
    ],
  },
  gestao: {
    id: 'gestao',
    title: 'Gest?o',
    description: 'Administra??o empresarial e controle operacional',
    icon: Building2,
    color: 'blue',
    modules: [
      {
        id: 'gestao-empresas',
        name: 'Gest?o de Empresas',
        description: 'Gerenciamento completo de empresas, contratos e planos no sistema.',
        href: '/gestao/empresas',
        icon: Building2,
        notifications: 3,
        badge: 'Novo',
        badgeColor: 'green',
      },
      {
        id: 'gestao-usuarios',
        name: 'Gest?o de Usu?rios',
        description: 'Administra??o de usu?rios, permiss?es e perfis de acesso.',
        href: '/gestao/usuarios',
        icon: Users,
        notifications: 1,
        status: 'beta',
      },
      {
        id: 'controle-acesso',
        name: 'Controle de Acesso',
        description: 'Configura??o de roles, permiss?es e pol?ticas de seguran?a.',
        href: '/gestao/acesso',
        icon: Shield,
        status: 'beta',
      },
      {
        id: 'portal-cliente',
        name: 'Portal do Cliente',
        description: 'Gest?o e configura??o do portal de acesso dos clientes ?s propostas.',
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
        name: 'M?tricas Operacionais',
        description: 'Dashboard executivo com KPIs e indicadores de performance.',
        href: '/gestao/metricas',
        icon: BarChart3,
        status: 'coming_soon',
      },
      {
        id: 'backup-restore',
        name: 'Backup e Restore',
        description: 'Gest?o de backups autom?ticos e restaura??o de dados.',
        href: '/gestao/backup',
        icon: Database,
        status: 'coming_soon',
      },
      {
        id: 'compliance',
        name: 'Compliance',
        description: 'Conformidade com LGPD, ISO e outras regulamenta??es.',
        href: '/gestao/compliance',
        icon: UserCheck,
        badge: 'LGPD',
        badgeColor: 'purple',
        status: 'coming_soon',
      },
      {
        id: 'manutencao',
        name: 'Manuten??o',
        description: 'Agendamento de manuten??es, atualiza??es e downtime planejado.',
        href: '/gestao/manutencao',
        icon: Calendar,
        status: 'coming_soon',
      },
      {
        id: 'automacao',
        name: 'Automa??o',
        description: 'Configura??o de workflows autom?ticos e regras de neg?cio.',
        href: '/gestao/automacao',
        icon: Zap,
        status: 'coming_soon',
      },
    ],
  },
  sistema: {
    id: 'sistema',
    title: 'Sistema',
    description: 'Configura??es e administra??o do sistema',
    icon: Settings,
    color: 'purple',
    modules: [
      {
        id: 'configuracoes',
        name: 'Configura??es',
        description: 'Configura??es gerais do sistema, permiss?es e prefer?ncias.',
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
    throw new Error(`N?cleo "${nucleusId}" n?o configurado.`);
  }

  return {
    ...descriptor,
    modules: descriptor.modules.map(resolveModule),
  };
};

export default nucleusDescriptors;
